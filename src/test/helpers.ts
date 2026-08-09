import { NextRequest } from "next/server";
import {
  COOKIE_NAME,
  type SessionPayload,
  createSession,
  hashPassword,
} from "@/lib/auth";
import {
  applicantProfiles,
  bookings,
  db,
  recruiters,
  slots,
  users,
} from "@/lib/db";
import { __testCookieStore } from "./setup";

/**
 * Authenticate the implicit "current request" as the given user. Subsequent
 * route-handler calls inside the same test will see this session via the
 * mocked next/headers cookies().
 */
export async function withSession(payload: SessionPayload): Promise<void> {
  // A real session row, because getSession now refuses a token without one. Signing a
  // token by hand here would test a state the app can no longer produce.
  const token = await createSession(payload);
  __testCookieStore.set(COOKIE_NAME, { name: COOKIE_NAME, value: token });
}

export function clearSession(): void {
  __testCookieStore.delete(COOKIE_NAME);
}

/** Build a NextRequest with a JSON body. */
export function jsonRequest(
  url: string,
  init: { method: string; body?: unknown }
): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  return new NextRequest(url, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

export async function seedRecruiter(opts: {
  email?: string;
  company?: string;
} = {}): Promise<{ userId: number; recruiterId: number; email: string }> {
  const email = opts.email ?? `recruiter-${Date.now()}-${Math.random()}@test.dev`;
  const passwordHash = await hashPassword("not-used-in-tests-12345");
  const [user] = await db
    .insert(users)
    .values({ email, name: "Test Recruiter", passwordHash, role: "recruiter" })
    .returning();
  const [rec] = await db
    .insert(recruiters)
    .values({
      userId: user.id,
      company: opts.company ?? "Test Co",
      industry: "Technology",
      description: "",
      contactEmail: email,
    })
    .returning();
  return { userId: user.id, recruiterId: rec.id, email };
}

export async function seedApplicant(
  opts: { email?: string; name?: string } = {}
): Promise<{ userId: number; applicantId: number; email: string; name: string }> {
  const email = opts.email ?? `applicant-${Date.now()}-${Math.random()}@test.dev`;
  const name = opts.name ?? "Test Applicant";
  const passwordHash = await hashPassword("not-used-in-tests-12345");
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash, role: "applicant" })
    .returning();
  const [profile] = await db
    .insert(applicantProfiles)
    .values({
      userId: user.id,
      name,
      email,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
      schoolName: "Test University",
    })
    .returning();
  return { userId: user.id, applicantId: profile.id, email, name };
}

export async function seedSlot(opts: {
  recruiterId: number;
  startTime: Date;
  endTime?: Date;
  interviewerNumber?: number;
}): Promise<number> {
  const [s] = await db
    .insert(slots)
    .values({
      recruiterId: opts.recruiterId,
      startTime: opts.startTime,
      endTime: opts.endTime ?? new Date(opts.startTime.getTime() + 15 * 60_000),
      status: "available",
      interviewerNumber: opts.interviewerNumber ?? 1,
    })
    .returning({ id: slots.id });
  return s.id;
}

export async function seedPendingBooking(opts: {
  recruiterId: number;
  applicantId: number;
  applicantEmail: string;
  applicantName: string;
  requestedTime: Date;
  position?: string;
}): Promise<number> {
  const [b] = await db
    .insert(bookings)
    .values({
      direction: "applicant_books_recruiter",
      recruiterId: opts.recruiterId,
      applicantId: opts.applicantId,
      requestedTime: opts.requestedTime,
      applicantName: opts.applicantName,
      applicantEmail: opts.applicantEmail,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
      status: "pending",
      position: opts.position ?? "Engineer",
    })
    .returning({ id: bookings.id });
  return b.id;
}
