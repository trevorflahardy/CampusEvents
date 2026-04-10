/**
 * Standalone migration script — run with: bun run src/db/migrate.ts
 * Applies schema.sql to the database. Safe to run repeatedly
 * thanks to IF NOT EXISTS / ON CONFLICT DO NOTHING guards.
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });

await sql.unsafe(await Bun.file("./schema.sql").text());
console.log("✅ Schema applied");
await sql.end();
