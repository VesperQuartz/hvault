import type { ExportedHandler } from "@cloudflare/workers-types";
import { sValidator } from "@hono/standard-validator";
import { Scalar } from "@scalar/hono-api-reference";
import { drizzle } from "drizzle-orm/d1";
import { Match } from "effect";
import { contextStorage, getContext } from "hono/context-storage";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { describeRoute, openAPIRouteHandler, resolver } from "hono-openapi";
import { pinoLogger } from "hono-pino";
import pino from "pino";
import z from "zod";
import { auth } from "#/src/lib/auth";
import { type CFBindings, type Env, factory } from "./factory";
import recordsRoutes from "./routes/records.routes";
import shareRoutes from "./routes/share.routes";

const app = factory.createApp().basePath("/api");

app.use(poweredBy());
app.use(secureHeaders());
app.use(requestId());
app.use(
	pinoLogger({
		pino: pino({
			level: "info",
			transport: {
				target: "hono-pino/debug-log",
			},
		}),
		contextKey: "logger" as const,
	}),
);

app.use(prettyJSON());
app.use(contextStorage());
app.use(
	cors({
		origin: (origin) => {
			// Allow all origins in development, specific origins in production
			const allowedOrigins = [
				"http://localhost:3000",
				"http://localhost:8787",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:8787",
			];

			// In development, allow all origins
			if (
				origin &&
				(origin.includes("localhost") || origin.includes("127.0.0.1"))
			) {
				return origin;
			}

			// Allow specific origins
			if (allowedOrigins.includes(origin)) {
				return origin;
			}

			// Default to allowing all (change in production)
			return origin || "*";
		},
		credentials: true,
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"Cookie",
			"Set-Cookie",
			"x-api-key",
			"User-Agent",
			"Accept",
			"Origin",
			"X-Requested-With",
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

app.use(async (c, next) => {
	c.set("db", drizzle(c.env.DB));
	c.set("store", c.env.STORE);
	c.set("cache", c.env.CACHE);
	await next();
});

app.on(["GET", "POST"], "/auth/*", (c) => auth(c.env).handler(c.req.raw));

// Session middleware MUST come before routes
app.use("*", async (ctx, next) => {
	// Skip session check for health and auth routes
	if (ctx.req.path.includes("/health") || ctx.req.path.includes("/auth/")) {
		return next();
	}

	const authInstance = auth(ctx.env);
	const headers = ctx.req.raw.headers;

	const session = await authInstance.api.getSession({
		headers,
	});

	if (!session) {
		ctx.set("user", null);
		ctx.set("session", null);
		return next();
	}

	ctx.set("user", session.user);
	ctx.set("session", session.session);
	return next();
});

app.get("/test", (c) => c.json({ message: "API is working", basePath: "/api" }));

// Mount application routes AFTER session middleware
app.route("/records", recordsRoutes);
app.route("/share", shareRoutes);

app.get("/me", (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	return c.json({ success: true, user });
});

app.get(
	"/openapi",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Hono",
				version: "1.0.0",
				description: "API for greeting users",
			},
			servers: [
				{
					url: "http://localhost:8787",
					description: "Local server",
				},
			],
		},
	}),
);

app.get(
	"/docs",
	Scalar({
		theme: "fastify",
		url: "/api/openapi",
	}),
);

const routes = app
	.get(
		"/",
		describeRoute({
			description: "Index route",
			responses: {
				200: {
					description: "Index route",
					content: {
						"application/json": {
							schema: resolver(z.object({})),
						},
					},
				},
			},
		}),
		async (c) => {
			return c.json({});
		},
	)
	.put(
		"/file",
		sValidator(
			"form",
			z.object({
				file: z.file().mime("application/json"),
			}),
		),
		async (c) => {
			const { file } = c.req.valid("form");
			const media = file as File;
			const result = await getContext<Env>().var.store.put(media.name, media);
			return c.json({
				msg: "File uploaded",
				size: result?.size,
				name: media.name,
			});
		},
	)
	.post(
		"/cache",
		sValidator(
			"json",
			z.object({
				message: z.string(),
			}),
		),
		async (c) => {
			const { message } = c.req.valid("json");
			await getContext<Env>().var.cache.put("message", message);
			return c.json({
				msg: "Success",
			});
		},
	);

export default {
	// @ts-expect-error - Cloudflare Workers types are not up to date
	fetch: app.fetch,
	scheduled: async (batch, env) => {
		Match.value(batch.cron).pipe(
			Match.when("* * * * *", () => {
				console.log(batch, env, "Hello from cronx");
			}),
			Match.orElse(() => console.log("Not a cron job")),
		);
	},
} satisfies ExportedHandler<CFBindings>;
