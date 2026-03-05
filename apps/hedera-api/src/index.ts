import { serve } from "@hono/node-server";
import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { z } from "zod";
import "dotenv/config";
import { createHederaService } from "./src/services/hedera.js";

const app = new Hono().basePath("/api");
console.log(process.env, "ENV");
export const STATE = [
	"UPLOAD",
	"ACCESS",
	"SHARE",
	"DELETE",
	"VERIFY",
	"TAMPER_DETECTED",
	"SAVE",
	"READ",
	"UPDATE",
	"READ_ALL",
] as const;

type StateItem = (typeof STATE)[number];

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
		const hederaService = createHederaService({
			HEDERA_ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID,
			HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,
		});
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
		const hederaService = createHederaService({
			HEDERA_ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID,
			HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,
		});
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
		const hederaService = createHederaService({
			HEDERA_ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID,
			HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,
		});
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
serve(
	{
		fetch: app.fetch,
		port: Number(process.env.PORT) || 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
