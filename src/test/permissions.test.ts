import { describe, expect, it } from "vitest";
import { can, capabilitiesFor, type Capability } from "@/lib/permissions";
import type { MemberRole } from "@/lib/ats-auth";

const ROLES: MemberRole[] = [
  "admin",
  "account_manager",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "coordinator",
  "viewer",
];

/**
 * These read as the policy itself rather than as tests of an implementation: if someone
 * widens a role, one of these fails and names exactly what was widened.
 */
describe("permissions — who may touch the client book", () => {
  it("only admins and account managers can create or rename a client", () => {
    const allowed = ROLES.filter((r) => can(r, "client:write"));
    expect(allowed).toEqual(["admin", "account_manager"]);
  });

  it("a recruiter reads clients but does not own them", () => {
    expect(can("recruiter", "client:read")).toBe(true);
    expect(can("recruiter", "client:write")).toBe(false);
  });
});

describe("permissions — candidate PII", () => {
  it("interviewers and viewers cannot search the candidate database", () => {
    // An interviewer reaches candidates through the applications assigned to them; a
    // viewer has no operational need at all. Neither gets the searchable pool.
    expect(can("interviewer", "candidate:read")).toBe(false);
    expect(can("viewer", "candidate:read")).toBe(false);
  });

  it("the roles that actually work with candidates can search", () => {
    const allowed = ROLES.filter((r) => can(r, "candidate:read"));
    expect(allowed).toEqual([
      "admin",
      "account_manager",
      "recruiter",
      "hiring_manager",
      "coordinator",
    ]);
  });
});

describe("permissions — money", () => {
  it("only admin, account manager and recruiter can record or end a placement", () => {
    // Ending a placement inside its guarantee is what triggers a fee clawback, so this
    // set stays deliberately narrow.
    expect(ROLES.filter((r) => can(r, "placement:write"))).toEqual([
      "admin",
      "account_manager",
      "recruiter",
    ]);
  });

  it("a hiring manager may see placements but never write one", () => {
    expect(can("hiring_manager", "placement:read")).toBe(true);
    expect(can("hiring_manager", "placement:write")).toBe(false);
  });
});

describe("permissions — compliance", () => {
  it("a coordinator can file paperwork, matching what the job actually involves", () => {
    expect(can("coordinator", "compliance:write")).toBe(true);
  });

  it("a viewer can see document status but cannot change it", () => {
    expect(can("viewer", "compliance:read")).toBe(true);
    expect(can("viewer", "compliance:write")).toBe(false);
  });
});

describe("permissions — invariants that must hold for every role", () => {
  it("an interviewer holds no org-wide capability at all", () => {
    expect(capabilitiesFor("interviewer")).toEqual([]);
  });

  it("a viewer can write nothing", () => {
    const writes = capabilitiesFor("viewer").filter((c) => c.endsWith(":write"));
    expect(writes).toEqual([]);
  });

  it("admin holds every capability that exists", () => {
    const everyCapability = new Set<Capability>(
      ROLES.flatMap((r) => capabilitiesFor(r))
    );
    for (const capability of everyCapability) {
      expect(can("admin", capability)).toBe(true);
    }
  });

  it("write access to an area always implies read access to it", () => {
    // A role that can edit something it cannot see would be a UI that lies to its user.
    for (const role of ROLES) {
      for (const capability of capabilitiesFor(role)) {
        if (!capability.endsWith(":write")) continue;
        const read = capability.replace(":write", ":read") as Capability;
        // job_order has no read capability of its own; it is covered by client:read.
        const paired = capability === "job_order:write" ? "client:read" : read;
        expect(
          can(role, paired as Capability),
          `${role} may ${capability} but not ${paired}`
        ).toBe(true);
      }
    }
  });

  it("an unknown role is denied rather than defaulting open", () => {
    expect(can("nonsense" as MemberRole, "client:read")).toBe(false);
    expect(capabilitiesFor("nonsense" as MemberRole)).toEqual([]);
  });
});
