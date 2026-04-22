/**
 * Standalone migration script — run with: bun run src/db/migrate.ts
 * Applies schema.sql to the database. Safe to run repeatedly
 * thanks to IF NOT EXISTS / ON CONFLICT DO NOTHING guards.
 */
import postgres from "postgres";
import { resolveSchemaPath } from "./schema-path";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });

const schemaPath = resolveSchemaPath();
await sql.unsafe(await Bun.file(schemaPath).text());
console.log(`✅ Schema applied from ${schemaPath}`);
await sql.end();
