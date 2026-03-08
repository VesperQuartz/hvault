import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin, bearer, openAPI } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import type { CFBindings } from "#/src/factory";
import { createHederaService } from "#/src/lib/hedera";
import { createKMSService } from "#/src/lib/kms";
import { ac, adminRole, customRole, userRole } from "#/src/lib/permission";
import * as schema from "../repo/schema/index"; // Ensure the schema is imported

export const auth = (env: CFBindings): ReturnType<typeof betterAuth> => {
	const db = drizzle(env.DB, {
		schema,
	});
	const rawBaseUrl = env.BETTER_AUTH_URL || "http://localhost:8787";
	const authBaseUrl = rawBaseUrl.endsWith("/api/auth")
		? rawBaseUrl
		: rawBaseUrl.endsWith("/api")
			? `${rawBaseUrl}/auth`
			: `${rawBaseUrl}/api/auth`;

	//@ts-expect-error - Cloudflare Workers types are not up to date
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
			"https://hvault.lilbrown3000.workers.dev",
		],
		advanced: {
			useIsomorphicCrypto: true, // Recommended for Cloudflare Workers
		},
		cookie: {
			crossSite: true, // Allow cookies to be sent across different domains (Vercel -> Workers)
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
			requireEmailVerification: false,
		},
		plugins: [
			bearer(), // Required for token-based auth from extension
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
			// haveIBeenPwned({
			// 	customPasswordCompromisedMessage:
			// 		"Please choose a more secure password.",
			// }),
		],
		databaseHooks: {
			user: {
				create: {
					before: async (user, ctx) => {
						console.log(ctx?.body);
						if (ctx?.body.role) {
							return {
								data: {
									...user,
									role: ctx?.body.role,
								},
							};
						}
						return {
							data: {
								...user,
							},
						};
					},
					after: async (user) => {
						// Initialize KMS key and Hedera topic for new user
						// Run asynchronously to avoid blocking user signup
						console.log(`[USER SETUP] Initializing keys for user ${user.id}`);

						try {
							const kmsService = createKMSService(env);
							const kmsKeyId = await kmsService.createUserKey(user.id);
							console.log(`[USER SETUP] KMS key created: ${kmsKeyId}`);

							const hService = createHederaService(env);
							const topicId = await hService.createUserTopic(user.id);

							if (!topicId)
								throw new Error(
									"[USER SETUP] Hedera returned an empty topic ID",
								);
							console.log(`[USER SETUP] Hedera topic created: ${topicId}`);

							// Step 3: Save to database
							const [userKey] = await db
								.insert(schema.userKeys)
								.values({
									id: crypto.randomUUID(),
									userId: user.id,
									kmsKeyId,
									hederaTopicId: topicId,
								})
								.returning();

							console.log(
								`[USER SETUP] Successfully initialized keys for user ${user.id}`,
								userKey,
							);
						} catch (error) {
							console.error(
								`[USER SETUP] Failed to initialize keys for user ${user.id}:`,
								error,
							);
							throw error;
						}
					},
				},
			},
		},
	});
};
