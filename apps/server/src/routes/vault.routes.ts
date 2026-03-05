import { sValidator } from "@hono/standard-validator";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { factory } from "../factory";
import { createHederaHttpService } from "../lib/hedera-http";

const vaultRoutes = factory.createApp();

// Health check (no auth required)
vaultRoutes.get("/health", (c) => {
	return c.json({ status: "ok", service: "vault" });
});

// Middleware: Require authentication for all vault routes
vaultRoutes.use("*", async (c, next) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});
