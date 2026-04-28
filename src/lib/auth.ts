import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db, recruiters, users } from "@/lib/db";
import { eq } from "drizzle-orm";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable must be set. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return secret;
}
const COOKIE_NAME = "vgen_session";

export type UserRole = "admin" | "recruiter" | "applicant";

export type SessionPayload = {
  userId: number;
  email: string;
  role: UserRole;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "24h" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("Forbidden");
  return session;
}

/**
 * Resolve the current recruiter from session. Returns null when there is no
 * session, the role isn't recruiter, or no recruiter row exists for the user.
 * Routes can check the result and return their own 401/404 — no exceptions.
 */
export async function getRecruiterFromSession(): Promise<
  { session: SessionPayload; recruiterId: number } | null
> {
  const session = await getSession();
  if (!session || session.role !== "recruiter") return null;

  const [rec] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!rec) return null;
  return { session, recruiterId: rec.id };
}

export type LoginResult =
  | { ok: true; token: string; user: SessionPayload }
  | { ok: false; code: "USER_NOT_FOUND" | "INVALID_PASSWORD" };

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!user) return { ok: false, code: "USER_NOT_FOUND" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, code: "INVALID_PASSWORD" };

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return { ok: true, token: createToken(payload), user: payload };
}

export { COOKIE_NAME };
