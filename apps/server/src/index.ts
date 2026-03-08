import type { ExportedHandler } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "#/src/lib/auth";
import { createHederaService } from "#/src/lib/hedera";
import { auditLogs, shareLinks, userKeys } from "./repo/schema";
import { lt, and, eq } from "drizzle-orm";
import { type CFBindings, factory } from "./factory";
import recordsRoutes from "./routes/records.routes";
import shareRoutes from "./routes/share.routes";

const app = factory.createApp().basePath("/api");

// Essential Middleware (Optimized for Workers)
app.use(poweredBy());
app.use(secureHeaders());
app.use(requestId());
app.use(logger());
app.use(prettyJSON());
app.use(contextStorage());

app.use(
	cors({
		origin: (origin) => {
			if (!origin) return "*";
			const allowedOrigins = [
				"http://localhost:3000",
				"http://localhost:8787",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:8787",
				"https://hvault.lilbrown3000.workers.dev",
			];

			if (
				allowedOrigins.includes(origin) ||
				origin.endsWith(".vercel.app") ||
				origin.endsWith(".workers.dev")
			) {
				return origin;
			}
			return origin;
		},
		credentials: true,
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"Cookie",
			"Set-Cookie",
			"User-Agent",
			"Accept",
		],
		allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
		exposeHeaders: [
			"Set-Cookie",
			"X-File-Verified",
			"X-Hedera-Transaction",
			"X-File-Hash",
		],
		maxAge: 600,
	}),
);

// Database & Store Setup
app.use(async (c, next) => {
	c.set("db", drizzle(c.env.DB));
	c.set("store", c.env.STORE);
	c.set("cache", c.env.CACHE);
	await next();
});

app.get("/", (c) => c.json({ message: "API is working", basePath: "/api" }));

// BetterAuth Handler
app.on(["GET", "POST"], "/auth/*", (c) => auth(c.env, c.executionCtx).handler(c.req.raw));

// Session middleware
app.use("*", async (ctx, next) => {
	const path = ctx.req.path;
	if (path.includes("/health") || path.includes("/auth/")) {
		return next();
	}

	const authInstance = auth(ctx.env, ctx.executionCtx);
	const session = await authInstance.api.getSession({
		headers: ctx.req.raw.headers,
	});

	if (!session) {
		ctx.set("user", null);
		ctx.set("session", null);
		return next();
	}

	ctx.set("user", session.user);
	ctx.set("session", session.session);
	await next();
});

// App Routes
app.route("/records", recordsRoutes);
app.route("/share", shareRoutes);

app.get("/me", (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	return c.json({ success: true, user });
});

export default {
	fetch: app.fetch,
	scheduled: async (batch, env: CFBindings) => {
		const db = drizzle(env.DB);
		const now = new Date();
		console.log(`[Cron] Checking expiry at ${now.toISOString()}`);

		try {
			const expiredLinks = await db
				.select()
				.from(shareLinks)
				.where(and(lt(shareLinks.expiresAt, now), eq(shareLinks.isExpired, false)))
				.all();

			if (expiredLinks.length === 0) return;

			const hService = createHederaService(env);
			for (const link of expiredLinks) {
				try {
					const userKey = await db.select().from(userKeys).where(eq(userKeys.userId, link.userId)).get();
					if (userKey) {
						const hResult = await hService.submitRecordAudit(userKey.hederaTopicId, "LINK_EXPIRED", link.userId, link.recordId, { shareLinkId: link.id });
						await db.insert(auditLogs).values({
							id: crypto.randomUUID(),
							userId: link.userId,
							recordId: link.recordId,
							action: "LINK_EXPIRED",
							hederaTopicId: userKey.hederaTopicId,
							hederaTransactionId: hResult.transactionId,
							hederaSequenceNumber: hResult.sequenceNumber,
							metadata: JSON.stringify({ shareLinkId: link.id, auto: true }),
							ipAddress: "127.0.0.1",
							userAgent: "Cloudflare Cron Task",
						});
					}
					await db.update(shareLinks).set({ isExpired: true }).where(eq(shareLinks.id, link.id));
				} catch (err) {
					console.error(`[Cron] Error on link ${link.id}:`, err);
				}
			}
			hService.close();
		} catch (error) {
			console.error("[Cron] Error:", error);
		}
	},
} satisfies ExportedHandler<CFBindings>;
