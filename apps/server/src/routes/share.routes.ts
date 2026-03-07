import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { factory } from "../factory";
import {
	decryptWithDataKey,
	unpackEncryptedData,
	verifyFileHash,
} from "../lib/hash";
import { createHederaService } from "../lib/hedera";
import { createKMSService } from "../lib/kms";
import { auditLogs, records, shareLinks, userKeys } from "../repo/schema";

const shareRoutes = factory.createApp();

/**
 * Generate a share link for a record
 * POST /share/generate
 * Requires authentication
 */
shareRoutes.post(
	"/generate",
	zValidator(
		"json",
		z.object({
			recordId: z.string(),
			expiresInHours: z.number().min(0.005).max(168).default(24), // Max 7 days
		}),
	),
	async (c) => {
		const user = c.get("user");
		const db = c.get("db");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		try {
			const { recordId, expiresInHours } = c.req.valid("json");

			// Verify record belongs to user
			const record = await db
				.select()
				.from(records)
				.where(and(eq(records.id, recordId), eq(records.userId, user.id)))
				.get();

			if (!record) {
				return c.json({ error: "Record not found" }, 404);
			}

			// Generate share token
			const token = crypto.randomUUID();
			const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

			// Create share link
			const shareLinkId = crypto.randomUUID();
			await db.insert(shareLinks).values({
				id: shareLinkId,
				recordId,
				userId: user.id,
				token,
				expiresAt,
			});

			// Get user's Hedera topic
			const userKey = await db
				.select()
				.from(userKeys)
				.where(eq(userKeys.userId, user.id))
				.get();

			if (userKey) {
				// Log share action to Hedera via proxy service
				const hederaService = createHederaService(c.env);
				const auditResult = await hederaService.submitRecordAudit(
					userKey.hederaTopicId,
					"SHARE",
					user.id,
					recordId,
					{
						shareLinkId,
						expiresAt: expiresAt.toISOString(),
						expiresInHours,
					},
				);

				// Save audit log locally
				await db.insert(auditLogs).values({
					id: crypto.randomUUID(),
					userId: user.id,
					recordId,
					action: "SHARE",
					hederaTopicId: userKey.hederaTopicId,
					hederaTransactionId: auditResult.transactionId,
					hederaSequenceNumber: auditResult.sequenceNumber,
					metadata: JSON.stringify({
						shareLinkId,
						expiresInHours,
					}),
					ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || c.req.header("x-forwarded-for") || "127.0.0.1",
					userAgent: c.req.header("user-agent") || c.req.header("User-Agent") || "Unknown",
				});
			}

			// Return share URL pointing to the frontend
			const frontendUrl = c.env.FRONTEND_URL || "http://localhost:3000";
			const shareUrl = `${frontendUrl}/view/${token}`;

			return c.json({
				success: true,
				shareLink: {
					id: shareLinkId,
					token,
					url: shareUrl,
					expiresAt: expiresAt.toISOString(),
					recordId,
					fileName: record.fileName,
				},
			});
		} catch (error) {
			console.error("Generate share link error:", error);
			return c.json(
				{
					error: "Failed to generate share link",
					details: error instanceof Error ? error.message : "Unknown error",
				},
				500,
			);
		}
	},
);

/**
 * Get share link metadata (for preview)
 * GET /share/:token/info
 * No authentication required
 * NOTE: Defined BEFORE /:token to avoid conflict
 */
shareRoutes.get("/:token/info", async (c) => {
	const db = c.get("db");
	const token = c.req.param("token");

	try {
		// Find share link
		const shareLink = await db
			.select()
			.from(shareLinks)
			.where(eq(shareLinks.token, token))
			.get();

		if (!shareLink) {
			return c.json({ error: "Share link not found" }, 404);
		}

		// Check expiry
		const now = new Date();
		if (shareLink.expiresAt < now) {
			// Log expired access attempt
			const userKey = await db
				.select()
				.from(userKeys)
				.where(eq(userKeys.userId, shareLink.userId))
				.get();

			if (userKey) {
				const hederaService = createHederaService(c.env);
				try {
					const auditResult = await hederaService.submitRecordAudit(
						userKey.hederaTopicId,
						"EXPIRED_ACCESS",
						shareLink.userId,
						shareLink.recordId,
						{
							shareLinkId: shareLink.id,
							expiredAt: shareLink.expiresAt.toISOString(),
							attemptedAt: now.toISOString(),
						},
					);

					await db.insert(auditLogs).values({
						id: crypto.randomUUID(),
						userId: shareLink.userId,
						recordId: shareLink.recordId,
						action: "EXPIRED_ACCESS",
						hederaTopicId: userKey.hederaTopicId,
						hederaTransactionId: auditResult.transactionId,
						hederaSequenceNumber: auditResult.sequenceNumber,
						metadata: JSON.stringify({
							shareLinkId: shareLink.id,
							expiredAt: shareLink.expiresAt,
						}),
						ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || c.req.header("x-forwarded-for") || "127.0.0.1",
						userAgent: c.req.header("user-agent") || c.req.header("User-Agent") || "Unknown",
					});
				} catch (e) {
					console.error("Failed to log expired access to Hedera:", e);
				} finally {
					hederaService.close();
				}
			}

			return c.json({ error: "Share link has expired" }, 410);
		}

		// Get record metadata
		const record = await db
			.select({
				fileName: records.fileName,
				fileSize: records.fileSize,
				mimeType: records.mimeType,
				uploadedAt: records.uploadedAt,
				hederaTransactionId: records.hederaTransactionId,
			})
			.from(records)
			.where(eq(records.id, shareLink.recordId))
			.get();

		if (!record) {
			return c.json({ error: "Record not found" }, 404);
		}

		return c.json({
			success: true,
			shareLink: {
				expiresAt: shareLink.expiresAt,
				accessCount: shareLink.accessCount,
			},
			record: {
				fileName: record.fileName,
				fileSize: record.fileSize,
				mimeType: record.mimeType,
				uploadedAt: record.uploadedAt,
				hederaTransactionId: record.hederaTransactionId,
			},
		});
	} catch (error) {
		console.error("Share info error:", error);
		return c.json({ error: "Failed to fetch share info" }, 500);
	}
});

/**
 * Access a shared record (doctor view)
 * GET /share/:token
 * No authentication required - public access with token
 */
shareRoutes.get("/:token", async (c) => {
	const db = c.get("db");
	const store = c.get("store");
	const token = c.req.param("token");

	try {
		// Find share link
		const shareLink = await db
			.select()
			.from(shareLinks)
			.where(eq(shareLinks.token, token))
			.get();

		if (!shareLink) {
			return c.json({ error: "Share link not found or expired" }, 404);
		}

		// Check expiry
		const now = new Date();
		if (shareLink.expiresAt < now) {
			// Log expired access attempt
			const userKey = await db
				.select()
				.from(userKeys)
				.where(eq(userKeys.userId, shareLink.userId))
				.get();

			if (userKey) {
				const hederaService = createHederaService(c.env);
				try {
					const auditResult = await hederaService.submitRecordAudit(
						userKey.hederaTopicId,
						"EXPIRED_ACCESS",
						shareLink.userId,
						shareLink.recordId,
						{
							shareLinkId: shareLink.id,
							expiredAt: shareLink.expiresAt.toISOString(),
							attemptedAt: now.toISOString(),
						},
					);

					await db.insert(auditLogs).values({
						id: crypto.randomUUID(),
						userId: shareLink.userId,
						recordId: shareLink.recordId,
						action: "EXPIRED_ACCESS",
						hederaTopicId: userKey.hederaTopicId,
						hederaTransactionId: auditResult.transactionId,
						hederaSequenceNumber: auditResult.sequenceNumber,
						metadata: JSON.stringify({
							shareLinkId: shareLink.id,
							expiredAt: shareLink.expiresAt,
						}),
						ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || c.req.header("x-forwarded-for") || "127.0.0.1",
						userAgent: c.req.header("user-agent") || c.req.header("User-Agent") || "Unknown",
					});
				} catch (e) {
					console.error("Failed to log expired access to Hedera:", e);
				} finally {
					hederaService.close();
				}
			}

			return c.json({ error: "Share link has expired" }, 410);
		}

		// Get record metadata
		const record = await db
			.select()
			.from(records)
			.where(eq(records.id, shareLink.recordId))
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

		// Decrypt file
		const decryptedFile = decryptWithDataKey(
			encrypted,
			plaintextKey,
			iv,
			authTag,
		);

		// CRITICAL: Verify file hash against Hedera fingerprint
		const isValid = verifyFileHash(decryptedFile, record.fileHash);

		if (!isValid) {
			// TAMPER DETECTED!
			console.error("TAMPER DETECTED:", {
				recordId: record.id,
				fileName: record.fileName,
				expectedHash: record.fileHash,
			});

			// Get user's Hedera topic
			const userKey = await db
				.select()
				.from(userKeys)
				.where(eq(userKeys.userId, record.userId))
				.get();

			if (userKey) {
				// Log tamper detection to Hedera
				const hederaService = createHederaService(c.env);
				const auditResult = await hederaService.submitRecordAudit(
					userKey.hederaTopicId,
					"TAMPER_DETECTED",
					record.userId,
					record.id,
					{
						shareLinkId: shareLink.id,
						fileName: record.fileName,
						expectedHash: record.fileHash,
					},
				);

				// Save audit log locally
				await db.insert(auditLogs).values({
					id: crypto.randomUUID(),
					userId: record.userId,
					recordId: record.id,
					action: "TAMPER_DETECTED",
					hederaTopicId: userKey.hederaTopicId,
					hederaTransactionId: auditResult.transactionId,
					hederaSequenceNumber: auditResult.sequenceNumber,
					metadata: JSON.stringify({
						shareLinkId: shareLink.id,
						fileName: record.fileName,
					}),
					ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || c.req.header("x-forwarded-for") || "127.0.0.1",
					userAgent: c.req.header("user-agent") || c.req.header("User-Agent") || "Unknown",
				});

				hederaService.close();
			}

			return c.json(
				{
					error: "File integrity verification failed",
					message:
						"This file has been tampered with and cannot be accessed. The patient has been alerted.",
					verified: false,
				},
				403,
			);
		}

		// File is verified - log successful access
		const userKey = await db
			.select()
			.from(userKeys)
			.where(eq(userKeys.userId, record.userId))
			.get();

		if (userKey) {
			const hederaService = createHederaService(c.env);
			const auditResult = await hederaService.submitRecordAudit(
				userKey.hederaTopicId,
				"VERIFY",
				record.userId,
				record.id,
				{
					verified: true,
					shareLinkId: shareLink.id,
					fileName: record.fileName,
				},
			);

			// Save audit log locally
			await db.insert(auditLogs).values({
				id: crypto.randomUUID(),
				userId: record.userId,
				recordId: record.id,
				action: "VERIFY",
				hederaTopicId: userKey.hederaTopicId,
				hederaTransactionId: auditResult.transactionId,
				hederaSequenceNumber: auditResult.sequenceNumber,
				metadata: JSON.stringify({
					verified: true,
					shareLinkId: shareLink.id,
				}),
				ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || c.req.header("x-forwarded-for") || "127.0.0.1",
				userAgent: c.req.header("user-agent") || c.req.header("User-Agent") || "Unknown",
			});

			hederaService.close();
		}

		// Update access tracking
		await db
			.update(shareLinks)
			.set({
				accessedAt: new Date(),
				accessCount: (shareLink.accessCount || 0) + 1,
			})
			.where(eq(shareLinks.id, shareLink.id));

		//@ts-ignore
		// Return file with verification metadata
		return c.body(decryptedFile, 200, {
			"Content-Type": record.mimeType,
			"Content-Disposition": `inline; filename="${record.fileName}"`,
			"Content-Length": decryptedFile.length.toString(),
			"X-File-Verified": "true",
			"X-Hedera-Transaction": record.hederaTransactionId || "",
			"X-File-Hash": record.fileHash,
		});
	} catch (error) {
		console.error("Share access error:", error);
		return c.json(
			{
				error: "Failed to access shared file",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

/**
 * List all share links for a record
 * GET /share/record/:recordId
 * Requires authentication
 */
shareRoutes.get("/record/:recordId", async (c) => {
	const user = c.get("user");
	const db = c.get("db");
	const recordId = c.req.param("recordId");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		// Verify record belongs to user
		const record = await db
			.select()
			.from(records)
			.where(and(eq(records.id, recordId), eq(records.userId, user.id)))
			.get();

		if (!record) {
			return c.json({ error: "Record not found" }, 404);
		}

		// Get all share links for this record
		const links = await db
			.select()
			.from(shareLinks)
			.where(eq(shareLinks.recordId, recordId));

		const now = new Date();
		const frontendUrl = c.env.FRONTEND_URL || "http://localhost:3000";
		const formattedLinks = links.map((link) => ({
			id: link.id,
			token: link.token,
			url: `${frontendUrl}/view/${link.token}`,
			expiresAt: link.expiresAt,
			isExpired: link.expiresAt < now,
			accessCount: link.accessCount,
			accessedAt: link.accessedAt,
			createdAt: link.createdAt,
		}));

		return c.json({
			success: true,
			shareLinks: formattedLinks,
		});
	} catch (error) {
		console.error("List share links error:", error);
		return c.json({ error: "Failed to fetch share links" }, 500);
	}
});

/**
 * Revoke a share link
 * DELETE /share/:id
 * Requires authentication
 */
shareRoutes.delete("/:id", async (c) => {
	const user = c.get("user");
	const db = c.get("db");
	const id = c.req.param("id");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		// Verify share link belongs to user
		const shareLink = await db
			.select()
			.from(shareLinks)
			.where(and(eq(shareLinks.id, id), eq(shareLinks.userId, user.id)))
			.get();

		if (!shareLink) {
			return c.json({ error: "Share link not found" }, 404);
		}

		// Delete the share link
		await db.delete(shareLinks).where(eq(shareLinks.id, id));

		return c.json({
			success: true,
			message: "Share link revoked successfully",
		});
	} catch (error) {
		console.error("Revoke share link error:", error);
		return c.json({ error: "Failed to revoke share link" }, 500);
	}
});

export default shareRoutes;
