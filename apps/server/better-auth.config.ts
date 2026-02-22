import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, haveIBeenPwned, openAPI } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { betterAuthOptions } from "#/src/lib/options";
import { ac, adminRole, customRole, userRole } from "#/src/lib/permission";
import * as schema from "#/src/repo/schema";

const { BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env;

//@ts-expect-error - Cloudflare Workers types are not up to date
const db = drizzle(process.env.DB);

export const auth: ReturnType<typeof betterAuth> = betterAuth({
	...betterAuthOptions,
	database: drizzleAdapter(db, { provider: "sqlite", schema }), // schema is required in order for bettter-auth to recognize
	baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,
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
			customPasswordCompromisedMessage: "Please choose a more secure password.",
		}),
	],
});
