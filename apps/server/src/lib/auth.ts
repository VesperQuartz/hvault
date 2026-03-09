import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin, bearer, openAPI } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import type { CFBindings } from "#/src/factory";
import { createHederaService } from "#/src/lib/hedera";
import { createKMSService } from "#/src/lib/kms";
import { ac, adminRole, customRole, userRole } from "#/src/lib/permission";
import * as schema from "../repo/schema/index";

export const auth = (
	env: CFBindings,
	ctx?: ExecutionContext,
): ReturnType<typeof betterAuth> => {
	const db = drizzle(env.DB, { schema });

	const rawBaseUrl = env.BETTER_AUTH_URL || "http://localhost:8787";
	const authBaseUrl = rawBaseUrl.endsWith("/api/auth")
		? rawBaseUrl
		: rawBaseUrl.endsWith("/api")
			? `${rawBaseUrl}/auth`
			: `${rawBaseUrl}/api/auth`;

	return betterAuth({
		database: drizzleAdapter(db, { provider: "sqlite", schema }),
		baseURL: authBaseUrl,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [
			"http://localhost:3000",
			"http://localhost:8787",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:8787",
			"https://*.workers.dev",
			"https://*.vercel.app",
		],
		advanced: {
			// Defer background tasks to avoid hitting CPU limits
			...(ctx
				? {
						backgroundTasks: {
							//@ts-expect-error - Cloudflare Workers types are not up to date
							enabled: true,
							handler: (promise) => ctx.waitUntil(promise),
						},
					}
				: {}),
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
			requireEmailVerification: false,
		},
		plugins: [
			bearer(),
			openAPI(),
			admin({
				ac,
				roles: {
					admin: adminRole,
					user: userRole,
					custom: customRole,
					superadmin: adminRole,
				},
				defaultRole: "user",
				adminRoles: ["admin", "superadmin"],
			}),
		],
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						console.log(`[USER SETUP] Initializing keys for user ${user.id}`);
						try {
							const kmsService = createKMSService(env);
							const kmsKeyId = await kmsService.createUserKey(user.id);
							const hService = createHederaService(env);
							const topicId = await hService.createUserTopic(user.id);

							if (!topicId) throw new Error("Hedera topic creation failed");

							await db.insert(schema.userKeys).values({
								id: crypto.randomUUID(),
								userId: user.id,
								kmsKeyId,
								hederaTopicId: topicId,
							});
							hService.close();
						} catch (error) {
							console.error(`[USER SETUP] Failed:`, error);
							throw error;
						}
					},
				},
			},
		},
	});
};
