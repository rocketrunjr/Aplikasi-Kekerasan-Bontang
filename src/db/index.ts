import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import "dotenv/config"; // Ensure .env is loaded (helpful for local execution like cron/seeds)

const databaseUrl = process.env.DATABASE_URL || "file:./data/sisaka.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Create the LibSQL client (supports both remote Turso and local file database)
const client = createClient({
    url: databaseUrl,
    authToken: authToken,
});

export const db = drizzle(client, { schema });
export const sqlite = client; // Re-export client if needed manually, though Drizzle handles most workloads
