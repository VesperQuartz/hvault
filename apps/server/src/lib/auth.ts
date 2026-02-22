import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, haveIBeenPwned, openAPI } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import type { CFBindings } from "#/src/factory";
import { ac, adminRole, customRole, userRole } from "#/src/lib/permission";
import * as schema from "../repo/schema/index"; // Ensure the schema is imported

export const auth = (env: CFBindings): ReturnType<typeof betterAuth> => {
	const db = drizzle(env.DB);
	return betterAuth({
		database: drizzleAdapter(db, { provider: "sqlite", schema }),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: {
			enabled: true,
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
			haveIBeenPwned({
				customPasswordCompromisedMessage:
					"Please choose a more secure password.",
			}),
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
				},
			},
		},
		rateLimit: {
			window: 10,
			max: 100,
		},
	});
};
