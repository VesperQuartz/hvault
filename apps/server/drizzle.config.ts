import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/repo/schema",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: String(process.env.CLOUDFLARE_ACCOUNT_ID),
		databaseId: String(process.env.CLOUDFLARE_DATABASE_ID),
		token: String(process.env.CLOUDFLARE_D1_TOKEN),
	},
});
