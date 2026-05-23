import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { POST as verifyCodePost } from "@/app/api/auth/verify-code/route";
import { db, passwordResetCodes, users } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { jsonRequest } from "./helpers";

async function seedUserWithPassword(
  email: string,
  password: string
): Promise<number> {
  const passwordHash = await hashPassword(password);
  const [u] = await db
    .insert(users)
    .values({ email, name: "Reset Tester", passwordHash, role: "applicant" })
    .returning({ id: users.id });
  return u.id;
}

async function seedResetCode(opts: {
  email: string;
  code: string;
  expiresAt: Date;
  used: boolean;
}): Promise<number> {
  const [row] = await db
    .insert(passwordResetCodes)
    .values({
      email: opts.email,
      code: opts.code,
      expiresAt: opts.expiresAt,
      used: opts.used,
    })
    .returning({ id: passwordResetCodes.id });
  return row.id;
}

const futureExpiry = () => new Date(Date.now() + 10 * 60_000);
const pastExpiry = () => new Date(Date.now() - 60_000);

describe("POST /api/auth/reset-password — token validation", () => {
  it("rejects a code that hasn't been verified by /verify-code", async () => {
    const email = "unverified@test.dev";
    await seedUserWithPassword(email, "old-password-12345");
    const id = await seedResetCode({
      email,
      code: "123456",
      expiresAt: futureExpiry(),
      used: false, // not verified
    });

    const res = await resetPasswordPost(
      jsonRequest("http://test/api/auth/reset-password", {
        method: "POST",
        body: {
          email,
          resetToken: `${id}_123456`,
          password: "new-password-12345",
        },
      })
    );
    expect(res.status).toBe(400);

    const [u] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email));
    expect(await verifyPassword("old-password-12345", u.passwordHash)).toBe(true);
  });

  it("rejects an expired code even after verification", async () => {
    const email = "expired@test.dev";
    await seedUserWithPassword(email, "old-password-12345");
    const id = await seedResetCode({
      email,
      code: "123456",
      expiresAt: pastExpiry(),
      used: true,
    });

    const res = await resetPasswordPost(
      jsonRequest("http://test/api/auth/reset-password", {
        method: "POST",
        body: {
          email,
          resetToken: `${id}_123456`,
          password: "new-password-12345",
        },
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a wrong code on a valid token id", async () => {
    const email = "wrong-code@test.dev";
    await seedUserWithPassword(email, "old-password-12345");
    const id = await seedResetCode({
      email,
      code: "123456",
      expiresAt: futureExpiry(),
      used: true,
    });

    const res = await resetPasswordPost(
      jsonRequest("http://test/api/auth/reset-password", {
        method: "POST",
        body: {
          email,
          resetToken: `${id}_999999`,
          password: "new-password-12345",
        },
      })
    );
    expect(res.status).toBe(400);
  });

  it("happy path resets the password, then rejects replay", async () => {
    const email = "happy@test.dev";
    await seedUserWithPassword(email, "old-password-12345");
    const id = await seedResetCode({
      email,
      code: "654321",
      expiresAt: futureExpiry(),
      used: true,
    });

    const ok = await resetPasswordPost(
      jsonRequest("http://test/api/auth/reset-password", {
        method: "POST",
        body: {
          email,
          resetToken: `${id}_654321`,
          password: "new-password-12345",
        },
      })
    );
    expect(ok.status).toBe(200);

    const [u] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email));
    expect(await verifyPassword("new-password-12345", u.passwordHash)).toBe(true);

    // Replay attempt — token has been deleted by the success path.
    const replay = await resetPasswordPost(
      jsonRequest("http://test/api/auth/reset-password", {
        method: "POST",
        body: {
          email,
          resetToken: `${id}_654321`,
          password: "second-password-12345",
        },
      })
    );
    expect(replay.status).toBe(400);
  });

  it("verify-code marks the row used; subsequent verify-code attempts fail", async () => {
    const email = "verify-once@test.dev";
    const id = await seedResetCode({
      email,
      code: "111111",
      expiresAt: futureExpiry(),
      used: false,
    });

    const first = await verifyCodePost(
      jsonRequest("http://test/api/auth/verify-code", {
        method: "POST",
        body: { email, code: "111111" },
      })
    );
    expect(first.status).toBe(200);

    // Same code can no longer be re-verified — it's marked used.
    const second = await verifyCodePost(
      jsonRequest("http://test/api/auth/verify-code", {
        method: "POST",
        body: { email, code: "111111" },
      })
    );
    expect(second.status).toBe(400);

    void id;
  });
});
