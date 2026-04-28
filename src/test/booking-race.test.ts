import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { PUT as reviewPut } from "@/app/api/bookings/review/route";
import { bookings, db, slots } from "@/lib/db";
import {
  jsonRequest,
  seedApplicant,
  seedPendingBooking,
  seedRecruiter,
  seedSlot,
  withSession,
} from "./helpers";

describe("POST /api/bookings/review — accept races", () => {
  it("only one of N concurrent accepts wins for a single slot", async () => {
    const recruiter = await seedRecruiter();
    const slotTime = new Date("2030-06-01T03:00:00Z");
    const slotId = await seedSlot({
      recruiterId: recruiter.recruiterId,
      startTime: slotTime,
    });

    // 5 applicants all with pending bookings at the same time → only one
    // recruiter slot is available, so only one accept must succeed.
    const N = 5;
    const bookingIds: number[] = [];
    for (let i = 0; i < N; i++) {
      const applicant = await seedApplicant();
      const id = await seedPendingBooking({
        recruiterId: recruiter.recruiterId,
        applicantId: applicant.applicantId,
        applicantEmail: applicant.email,
        applicantName: applicant.name,
        requestedTime: slotTime,
      });
      bookingIds.push(id);
    }

    withSession({
      userId: recruiter.userId,
      email: recruiter.email,
      role: "recruiter",
    });

    const calls = bookingIds.map((bookingId) =>
      reviewPut(
        jsonRequest("http://test/api/bookings/review", {
          method: "PUT",
          body: { bookingId, action: "accept" },
        })
      )
    );

    const results = await Promise.all(calls);
    const statuses = await Promise.all(results.map((r) => r.status));

    // Exactly one 200, the rest 409.
    const ok = statuses.filter((s) => s === 200);
    const conflicts = statuses.filter((s) => s === 409);
    expect(ok.length).toBe(1);
    expect(conflicts.length).toBe(N - 1);

    // Slot is booked, exactly one booking is accepted in the DB.
    const [slotRow] = await db
      .select({ status: slots.status })
      .from(slots)
      .where(eq(slots.id, slotId));
    expect(slotRow.status).toBe("booked");

    const accepted = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.status, "accepted"));
    expect(accepted.length).toBe(1);
  });

  it("a non-owner recruiter cannot accept another recruiter's booking", async () => {
    const owner = await seedRecruiter();
    const intruder = await seedRecruiter({ email: "intruder@test.dev" });
    const applicant = await seedApplicant();

    const slotTime = new Date("2030-06-02T03:00:00Z");
    await seedSlot({ recruiterId: owner.recruiterId, startTime: slotTime });
    const bookingId = await seedPendingBooking({
      recruiterId: owner.recruiterId,
      applicantId: applicant.applicantId,
      applicantEmail: applicant.email,
      applicantName: applicant.name,
      requestedTime: slotTime,
    });

    withSession({
      userId: intruder.userId,
      email: intruder.email,
      role: "recruiter",
    });

    const res = await reviewPut(
      jsonRequest("http://test/api/bookings/review", {
        method: "PUT",
        body: { bookingId, action: "accept" },
      })
    );
    expect(res.status).toBe(403);
  });
});
