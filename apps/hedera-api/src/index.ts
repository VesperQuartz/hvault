import { serve } from "@hono/node-server";
import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { z } from "zod";
import "dotenv/config";
import { createHederaService } from "./services/hedera.js";

const app = new Hono().basePath("/api");

export const STATE = [
	"UPLOAD",
	"ACCESS",
	"SHARE",
	"DELETE",
	"VERIFY",
	"TAMPER_DETECTED",
	"EXPIRED_ACCESS",
	"LINK_EXPIRED",
	"SAVE",
	"READ",
	"UPDATE",
	"READ_ALL",
] as const;

type StateItem = (typeof STATE)[number];

/**
 * Helper to create hedera service with full environment context
 */
const getHederaService = () =>
	createHederaService({
		HEDERA_ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID,
		HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,
		AWS_KMS_KEY_ID: process.env.AWS_KMS_KEY_ID ?? "",
		AWS_ACCESS_KEY: process.env.AWS_KMS_ACCESS_KEY,
		AWS_SECRET_KEY: process.env.AWS_KMS_ACCESS_SECRET || process.env.AWS_KMS_SECRET_KEY,
		AWS_REGION: process.env.AWS_REGION,
	});

// Add error handler
app.onError((err, c) => {
	console.error(`[Hedera API Error] ${err.message}`, err.stack);
	return c.json(
		{
			error: "Internal Server Error",
			message: err.message,
		},
		500,
	);
});

// Health check endpoint
app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post(
	"/hedera/topic",
	sValidator(
		"json",
		z.object({
			userId: z.string(),
		}),
	),
	async (c) => {
		const { userId } = c.req.valid("json");
		console.log(`[Hedera API] Creating topic for user: ${userId}`);
		const hederaService = getHederaService();
		const result = await hederaService.createUserTopic(userId);
		return c.json(result);
	},
);

app.post(
	"/hedera/fingerprint",
	sValidator(
		"json",
		z.object({
			topicId: z.string(),
			fileSize: z.number().optional(),
			recordId: z.string().optional(),
			userId: z.string(),
			fileHash: z.string(),
			fileName: z.string(),
			timestamp: z.string(),
		}),
	),
	async (c) => {
		const {
			topicId,
			fileSize,
			fileName,
			timestamp,
			recordId,
			userId,
			fileHash,
		} = c.req.valid("json");
		console.log(`[Hedera API] Submitting fingerprint for file: ${fileName}`);
		const hederaService = getHederaService();
		const result = await hederaService.submitFileFingerprint(topicId, {
			fileSize: fileSize ?? 0,
			recordId: recordId ?? "",
			userId,
			fileHash,
			fileName,
			timestamp,
		});
		return c.json(result);
	},
);

app.post(
	"/hedera/audit",
	sValidator(
		"json",
		z.object({
			topicId: z.string(),
			action: z.enum(STATE),
			userId: z.string(),
			recordId: z.string().optional(),
			metadata: z.record(z.string(), z.any()).optional(),
		}),
	),
	async (c) => {
		const { topicId, recordId, action, userId, metadata } = c.req.valid("json");
		console.log(`[Hedera API] Submitting audit for action: ${action}`);
		const hederaService = getHederaService();
		const result = await hederaService.submitRecordAudit(
			topicId,
			action as StateItem,
			userId,
			recordId,
			metadata,
		);
		return c.json(result);
	},
);

// Only start the server via `serve` if NOT on Vercel
if (!process.env.VERCEL) {
	const port = Number(process.env.PORT) || 8000;
	console.log(`[Hedera API] Local server starting on port ${port}...`);
	serve({
		fetch: app.fetch,
		port,
	});
}

// Export for Vercel/Cloudflare/Bun
export default app;
