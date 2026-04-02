import type { Context, Next } from "hono";
import { sign, verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "campusevents-dev-secret";

export type AuthEnv = {
  Variables: {
    userId: number;
    userRole: string;
  };
};

/**
 * Middleware that verifies a JWT from the Authorization header
 * and sets userId / userRole on the context.
 */
export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = header.slice(7);

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    c.set("userId", payload.sub as number);
    c.set("userRole", payload.role as string);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  await next();
}

/**
 * Middleware factory that restricts access to the given roles.
 * Must be used after authMiddleware.
 */
export function requireRole(...roles: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const userRole = c.get("userRole");
    if (!roles.includes(userRole)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}

export { JWT_SECRET };
