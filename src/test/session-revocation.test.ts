import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db, sessions, users } from "@/lib/db";
import {
  COOKIE_NAME,
  createSession,
  createToken,
  getSession,
  hashPassword,
  login,
  revokeAllSessions,
  revokeSession,
} from "@/lib/auth";
import { __testCookieStore } from "./setup";
import { POST as logout } from "@/app/api/auth/logout/route";

let seq = 0;

async function seedUser(password = "correct horse") {
  const [user] = await db
    .insert(users)
    .values({
      email: `u-${seq++}-${Date.now()}@test.dev`,
      name: "Test User",
      passwordHash: await hashPassword(password),
      role: "recruiter",
    })
    .returning({ id: users.id, email: users.email });
  return user;
}

/** Put a token in the mocked cookie jar, the way a browser would. */
function asCookie(token: string) {
  __testCookieStore.set(COOKIE_NAME, { name: COOKIE_NAME, value: token });
}

describe("sessions — a token is only good while its row lives", () => {
  it("accepts a freshly issued session", async () => {
    const user = await seedUser();
    asCookie(await createSession({ userId: user.id, email: user.email, role: "recruiter" }));

    const session = await getSession();
    expect(session?.userId).toBe(user.id);
    expect(session?.jti).toBeTruthy();
  });

  it("refuses the same token once its session is revoked", async () => {
    const user = await seedUser();
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });
    asCookie(token);

    const before = await getSession();
    expect(before).not.toBeNull();

    await revokeSession(before!.jti!);

    // The cookie is untouched and the signature still verifies — the revocation is what
    // stops it, which is the entire point.
    expect(await getSession()).toBeNull();
  });

  it("refuses a token whose session has expired, even before the JWT would", async () => {
    const user = await seedUser();
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });
    asCookie(token);
    const jti = (await getSession())!.jti!;

    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.id, jti));

    expect(await getSession()).toBeNull();
  });

  it("refuses a validly signed token that has no session row at all", async () => {
    // Exactly the shape of every token issued before sessions existed: correct signature,
    // unrevocable. Refusing it is the safe reading.
    const user = await seedUser();
    asCookie(createToken({ userId: user.id, email: user.email, role: "recruiter" }));
    expect(await getSession()).toBeNull();
  });

  it("refuses a token naming a session id that never existed", async () => {
    const user = await seedUser();
    asCookie(
      createToken({
        userId: user.id,
        email: user.email,
        role: "recruiter",
        jti: "made-up-session-id",
      })
    );
    expect(await getSession()).toBeNull();
  });
});

describe("sessions — signing out", () => {
  it("ends this device's session and leaves other devices signed in", async () => {
    const user = await seedUser();
    const phone = await createSession({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });
    const laptop = await createSession({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });

    asCookie(phone);
    const res = await logout();
    expect(res.status).toBe(200);

    // the phone's token is dead
    asCookie(phone);
    expect(await getSession()).toBeNull();

    // the laptop is untouched — signing out of one device is not signing out of all
    asCookie(laptop);
    expect(await getSession()).not.toBeNull();
  });
});

describe("sessions — password reset evicts everyone", () => {
  it("kills every live session for the user", async () => {
    const user = await seedUser();
    const phone = await createSession({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });
    const attacker = await createSession({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });

    // What a reset must accomplish: the person who took the account loses it back.
    await revokeAllSessions(user.id);

    for (const token of [phone, attacker]) {
      asCookie(token);
      expect(await getSession()).toBeNull();
    }
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(0);
  });

  it("does not touch a different user's sessions", async () => {
    const victim = await seedUser();
    const bystander = await seedUser();
    const theirs = await createSession({
      userId: bystander.id,
      email: bystander.email,
      role: "recruiter",
    });

    await revokeAllSessions(victim.id);

    asCookie(theirs);
    expect(await getSession()).not.toBeNull();
  });
});

describe("sessions — issuance", () => {
  it("logging in twice yields two independent sessions", async () => {
    const user = await seedUser("correct horse");
    const first = await login(user.email, "correct horse");
    const second = await login(user.email, "correct horse");
    expect(first.ok && second.ok).toBe(true);

    const rows = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    expect(rows).toHaveLength(2);

    // Revoking one leaves the other working.
    await revokeSession(rows[0].id);
    asCookie((second as { token: string }).token);
    const stillValid = await getSession();
    expect(stillValid).not.toBeNull();
  });

  it("sweeps this user's expired rows when they sign in again", async () => {
    const user = await seedUser();
    await db.insert(sessions).values({
      id: `stale-${Date.now()}`,
      userId: user.id,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await createSession({ userId: user.id, email: user.email, role: "recruiter" });

    const rows = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    // only the fresh one survives
    expect(rows).toHaveLength(1);
    expect(rows[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
