import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

// Raw postgres.js client — all queries use tagged template syntax:
//   sql`SELECT * FROM users WHERE id = ${id}`
// The transform option converts snake_case columns to camelCase in results,
// preserving the API response shape the frontend expects.
const sql = postgres(connectionString, {
  transform: postgres.camel,
});

export default sql;
