import postgres from "postgres";
import { createApp } from "./app";
import { resolveSchemaPath } from "./db/schema-path";

// Run schema.sql on startup so all tables are always present.
// The SQL uses IF NOT EXISTS / ON CONFLICT DO NOTHING guards for idempotency.
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
await migrationClient.unsafe(await Bun.file(resolveSchemaPath()).text());
await migrationClient.end();
console.log("✅ Schema applied");

const app = createApp();

const PORT = Number(process.env.PORT) || 3000;
console.log(`🚀 Server running on http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
