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
import { usersTable } from "#/src/repo/schema/user";
import { type CFBindings, type Env, factory } from "./factory";

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
		origin: ["*"],
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
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

app.use("*", async (ctx, next) => {
	const session = await auth(ctx.env).api.getSession({
		headers: ctx.req.raw.headers,
	});

	console.log("session", session);

	if (!session) {
		ctx.set("user", null);
		ctx.set("session", null);
		return next();
	}

	ctx.set("user", session.user);
	ctx.set("session", session.session);
	return next();
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
			const result = await getContext<Env>()
				.var.db.select()
				.from(usersTable)
				.all();
			return c.json(result);
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
	fetch: routes.fetch,
	scheduled: async (batch, env) => {
		Match.value(batch.cron).pipe(
			Match.when("* * * * *", () => {
				console.log(batch, env, "Hello from cronx");
			}),
			Match.orElse(() => console.log("Not a cron job")),
		);
	},
} satisfies ExportedHandler<CFBindings>;
