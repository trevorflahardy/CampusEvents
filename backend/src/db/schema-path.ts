import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

/**
 * Locate the authoritative schema.sql regardless of where the process was
 * started from. Resolution order:
 *   1. SCHEMA_SQL_PATH env var (for containers that mount it elsewhere)
 *   2. /app/schema.sql inside the Docker image
 *   3. ../../schema.sql relative to this module (repo root in local dev)
 */
export function resolveSchemaPath(): string {
  const fromEnv = process.env.SCHEMA_SQL_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const dockerPath = "/app/schema.sql";
  if (existsSync(dockerPath)) return dockerPath;

  return fileURLToPath(new URL("../../../schema.sql", import.meta.url));
}
