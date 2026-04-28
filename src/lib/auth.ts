import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db, applicantProfiles, recruiters, users } from "@/lib/db";
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

export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_REQUIREMENT_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

export function isPasswordValid(value: unknown): value is string {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}

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
 * Non-throwing variant of requireAdmin for route handlers — returns the
 * session on success or null on missing/invalid auth so the caller can
 * just `return NextResponse.json(...)` instead of try/catching.
 */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

/**
 * Resolve the current applicant from session. Returns null when there is no
 * session, the role isn't applicant, or no applicant profile exists.
 *
 * Prefer this over keying authorization on session.email — emails can change,
 * but applicantId is stable.
 */
export async function getApplicantFromSession(): Promise<
  { session: SessionPayload; applicantId: number } | null
> {
  const session = await getSession();
  if (!session || session.role !== "applicant") return null;

  const [profile] = await db
    .select({ id: applicantProfiles.id })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, session.userId));

  if (!profile) return null;
  return { session, applicantId: profile.id };
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
