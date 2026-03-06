import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { factory } from "../factory";
import {
	decryptWithDataKey,
	encryptWithDataKey,
	hashFile,
	packEncryptedData,
	unpackEncryptedData,
} from "../lib/hash";
import { createHederaService } from "../lib/hedera";
import { createKMSService } from "../lib/kms";
import { auditLogs, records, userKeys } from "../repo/schema";

const recordsRoutes = factory.createApp();

// Middleware: Require authentication
recordsRoutes.use("*", async (c, next) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});

/**
 * Upload a medical record
 * POST /records/upload
 */
recordsRoutes.post(
	"/upload",
	zValidator(
		"form",
		z.object({
			file: z.instanceof(File),
			title: z.string().optional(),
			documentType: z
				.enum([
					"lab_result",
					"prescription",
					"imaging",
					"vaccination",
					"report",
					"other",
				])
				.optional(),
			recordDate: z.string().optional(),
			doctorName: z.string().optional(),
			hospitalName: z.string().optional(),
			notes: z.string().optional(),
		}),
	),
	async (c) => {
		const user = c.get("user");
		const db = c.get("db");
		const store = c.get("store");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		try {
			const {
				file,
				title,
				documentType,
				recordDate,
				doctorName,
				hospitalName,
				notes,
			} = c.req.valid("form");

			// Validate file type
			const allowedTypes = [
				"application/pdf",
				"image/jpeg",
				"image/jpg",
				"image/png",
			];
			if (!allowedTypes.includes(file.type)) {
				return c.json(
					{
						error:
							"Invalid file type. Only PDF and images (JPG, PNG) are allowed",
					},
					400,
				);
			}

			// Validate file size (max 10MB)
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				return c.json({ error: "File size exceeds 10MB limit" }, 400);
			}

			// Get user's KMS key and Hedera topic
			const userKey = await db
				.select()
				.from(userKeys)
				.where(eq(userKeys.userId, user.id))
				.get();

			if (!userKey) {
				return c.json(
					{ error: "User keys not initialized. Please contact support." },
					500,
				);
			}

			// Read file as buffer
			const fileBuffer = Buffer.from(await file.arrayBuffer());

			// Step 1: Hash the original file for Hedera fingerprinting
			const fileHash = hashFile(fileBuffer);

			// Step 2: Generate data key from KMS (envelope encryption)
			const kmsService = createKMSService(c.env);
			const { plaintextKey, encryptedKey } = await kmsService.generateDataKey(
				userKey.kmsKeyId,
			);

			// Step 3: Encrypt file with data key
			const { encrypted, iv, authTag } = encryptWithDataKey(
				fileBuffer,
				plaintextKey,
			);

			// Step 4: Pack encrypted data for storage
			const packedData = packEncryptedData(encrypted, iv, authTag);

			// Step 5: Upload to R2
			const recordId = crypto.randomUUID();
			const r2Key = `records/${user.id}/${recordId}`;
			await store.put(r2Key, packedData);

			// Step 6: Submit file fingerprint to Hedera via proxy service
			const hederaService = createHederaService(c.env);
			const hederaResult = await hederaService.submitFileFingerprint(
				userKey.hederaTopicId,
				{
					recordId,
					fileName: file.name,
					fileHash,
					fileSize: file.size,
					userId: user.id,
					timestamp: new Date().toISOString(),
				},
			);

			await db.insert(records).values({
				id: recordId,
				userId: user.id,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				title: title || file.name,
				documentType: documentType || "other",
				recordDate: recordDate || null,
				doctorName: doctorName || null,
				hospitalName: hospitalName || null,
				notes: notes || null,
				encryptedDataKey: encryptedKey,
				r2Key,
				fileHash,
				hederaTopicId: userKey.hederaTopicId,
				hederaTransactionId: hederaResult.transactionId,
				hederaSequenceNumber: hederaResult.sequenceNumber,
			});

			// Step 8: Log upload action to Hedera
			const auditResult = await hederaService.submitRecordAudit(
				userKey.hederaTopicId,
				"UPLOAD",
				user.id,
				recordId,
				{
					fileName: file.name,
					fileSize: file.size,
				},
			);

			console.log("AUDIT", auditResult);

			// Step 9: Save audit log locally
			await db.insert(auditLogs).values({
				id: crypto.randomUUID(),
				userId: user.id,
				recordId,
				action: "UPLOAD",
				hederaTopicId: userKey.hederaTopicId,
				hederaTransactionId: auditResult.transactionId,
				hederaSequenceNumber: auditResult.sequenceNumber,
				metadata: JSON.stringify({ fileName: file.name, fileSize: file.size }),
				ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || null,
				userAgent: c.req.header("user-agent") || null,
			});

			hederaService.close();

			return c.json({
				success: true,
				record: {
					id: recordId,
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type,
					uploadedAt: new Date().toISOString(),
					hederaTransactionId: hederaResult.transactionId,
				},
			});
		} catch (error) {
			console.error("Upload error:", error);
			return c.json(
				{
					error: "Failed to upload file",
					details: error instanceof Error ? error.message : "Unknown error",
				},
				500,
			);
		}
	},
);

/**
 * List all records for the authenticated user
 * GET /records
 */
recordsRoutes.get("/", async (c) => {
	const user = c.get("user");
	const db = c.get("db");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const userRecords = await db
			.select({
				id: records.id,
				fileName: records.fileName,
				fileSize: records.fileSize,
				mimeType: records.mimeType,
				fileHash: records.fileHash,
				uploadedAt: records.uploadedAt,
				hederaTransactionId: records.hederaTransactionId,
			})
			.from(records)
			.where(eq(records.userId, user.id))
			.orderBy(desc(records.uploadedAt));

		return c.json({
			success: true,
			records: userRecords,
		});
	} catch (error) {
		console.error("List records error:", error);
		return c.json({ error: "Failed to fetch records" }, 500);
	}
});

/**
 * Get audit history for the authenticated user
 * GET /records/audit
 */
recordsRoutes.get("/audit", async (c) => {
	const user = c.get("user");
	const db = c.get("db");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const logs = await db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.userId, user.id))
			.orderBy(desc(auditLogs.timestamp));

		return c.json({
			success: true,
			logs,
		});
	} catch (error) {
		console.error("[Backend] Audit history fetch failed:", error);
		return c.json({ 
			error: "Failed to fetch audit history",
			details: error instanceof Error ? error.message : "Unknown database error"
		}, 500);
	}
});

/**
 * Get a specific record's metadata
 * GET /records/:id
 */
recordsRoutes.get("/:id", async (c) => {
	const user = c.get("user");
	const db = c.get("db");
	const recordId = c.req.param("id");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const record = await db
			.select()
			.from(records)
			.where(and(eq(records.id, recordId), eq(records.userId, user.id)))
			.get();

		if (!record) {
			return c.json({ error: "Record not found" }, 404);
		}

		return c.json({
			success: true,
			record: {
				id: record.id,
				fileName: record.fileName,
				fileSize: record.fileSize,
				mimeType: record.mimeType,
				fileHash: record.fileHash,
				uploadedAt: record.uploadedAt,
				hederaTransactionId: record.hederaTransactionId,
			},
		});
	} catch (error) {
		console.error("Get record error:", error);
		return c.json({ error: "Failed to fetch record" }, 500);
	}
});

/**
 * Download and decrypt a medical record
 * GET /records/:id/download
 */

recordsRoutes.get("/:id/download", async (c) => {
	const user = c.get("user");
	const db = c.get("db");
	const store = c.get("store");
	const recordId = c.req.param("id");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		// Get record metadata
		const record = await db
			.select()
			.from(records)
			.where(and(eq(records.id, recordId), eq(records.userId, user.id)))
			.get();

		if (!record) {
			return c.json({ error: "Record not found" }, 404);
		}

		// Fetch encrypted file from R2
		const r2Object = await store.get(record.r2Key);
		if (!r2Object) {
			return c.json({ error: "File not found in storage" }, 404);
		}

		const encryptedBuffer = Buffer.from(await r2Object.arrayBuffer());

		// Unpack encrypted data
		const { encrypted, iv, authTag } = unpackEncryptedData(encryptedBuffer);

		// Decrypt data key with KMS
		const kmsService = createKMSService(c.env);
		const plaintextKey = await kmsService.decryptDataKey(
			record.encryptedDataKey,
		);

		// Decrypt file with data key
		const decryptedFile = decryptWithDataKey(
			encrypted,
			plaintextKey,
			iv,
			authTag,
		);

		// Get user's Hedera topic for audit logging
		const userKey = await db
			.select()
			.from(userKeys)
			.where(eq(userKeys.userId, user.id))
			.get();

		if (userKey) {
			// Log download action to Hedera
			const hederaService = createHederaService(c.env);
			const auditResult = await hederaService.submitRecordAudit(
				userKey.hederaTopicId,
				"ACCESS",
				user.id,
				recordId,
				{ action: "download", fileName: record.fileName },
			);

			// Save audit log locally
			await db.insert(auditLogs).values({
				id: crypto.randomUUID(),
				userId: user.id,
				recordId,
				action: "ACCESS",
				hederaTopicId: userKey.hederaTopicId,
				hederaTransactionId: auditResult.transactionId,
				hederaSequenceNumber: auditResult.sequenceNumber,
				metadata: JSON.stringify({ action: "download" }),
				ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || null,
				userAgent: c.req.header("user-agent") || null,
			});

			hederaService.close();
		}

		// Return file
		// @ts-ignore
		return c.body(decryptedFile, 200, {
			"Content-Type": record.mimeType,
			"Content-Disposition": `attachment; filename="${record.fileName}"`,
			"Content-Length": decryptedFile.length.toString(),
		});
	} catch (error) {
		console.error("Download error:", error);
		return c.json(
			{
				error: "Failed to download file",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

/**
 * Delete a medical record
 * DELETE /records/:id
 */
recordsRoutes.delete("/:id", async (c) => {
	const user = c.get("user");
	const db = c.get("db");
	const store = c.get("store");
	const recordId = c.req.param("id");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		// Get record metadata
		const record = await db
			.select()
			.from(records)
			.where(and(eq(records.id, recordId), eq(records.userId, user.id)))
			.get();

		if (!record) {
			return c.json({ error: "Record not found" }, 404);
		}

		// Delete from R2
		await store.delete(record.r2Key);

		// Get user's Hedera topic
		const userKey = await db
			.select()
			.from(userKeys)
			.where(eq(userKeys.userId, user.id))
			.get();

		if (userKey) {
			// Log deletion to Hedera (permanent record that file was deleted)
			const hederaService = createHederaService(c.env);
			const auditResult = await hederaService.submitRecordAudit(
				userKey.hederaTopicId,
				"DELETE",
				user.id,
				recordId,
				{ fileName: record.fileName },
			);

			// Save audit log locally
			await db.insert(auditLogs).values({
				id: crypto.randomUUID(),
				userId: user.id,
				recordId,
				action: "DELETE",
				hederaTopicId: userKey.hederaTopicId,
				hederaTransactionId: auditResult.transactionId,
				hederaSequenceNumber: auditResult.sequenceNumber,
				metadata: JSON.stringify({ fileName: record.fileName }),
				ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || null,
				userAgent: c.req.header("user-agent") || null,
			});

			hederaService.close();
		}

		// Delete from database
		await db.delete(records).where(eq(records.id, recordId));

		return c.json({
			success: true,
			message: "Record deleted successfully",
		});
	} catch (error) {
		console.error("Delete error:", error);
		return c.json({ error: "Failed to delete record" }, 500);
	}
});

export default recordsRoutes;
