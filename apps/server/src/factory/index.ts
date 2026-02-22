import type { Session, User } from "better-auth";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createFactory } from "hono/factory";
import type { Env as HonoPinoEnv, PinoLogger } from "hono-pino";

export type CFBindings = {
	MY_VAR: string;
	DB: D1Database;
	STORE: R2Bucket;
	CACHE: KVNamespace;
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
};

export type Env = {
	Variables: {
		user: User | null;
		session: Session | null;
		db: DrizzleD1Database<Record<string, never>> & { $client: D1Database };
		store: R2Bucket;
		cache: KVNamespace;
	} & { logger: PinoLogger };
	Bindings: {} & HonoPinoEnv & CFBindings;
};

export const factory = createFactory<Env>();
