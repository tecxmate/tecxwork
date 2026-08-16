import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { clients, memberships, recruiters } from "@/lib/db/schema";
import { createApiKey } from "@/lib/api-keys";
import { createOrg } from "@/lib/provisioning";
import { MCP_TOOLS, findTool, inputShapeFor, toolsForScopes } from "@/lib/mcp-tools";
import type { Capability } from "@/lib/permissions";
import { seedRecruiter } from "./helpers";
import { POST, GET } from "@/app/api/mcp/route";
import { NextRequest } from "next/server";

let seq = 0;

async function newOrg() {
  const result = await createOrg({
    name: `MCP Org ${seq}`,
    slug: `mcp-org-${seq++}-${Date.now()}`,
    plan: "scale", // the only plan carrying api_access
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function keyFor(orgId: number, scopes: Capability[]) {
  const rec = await seedRecruiter({ email: `mcp-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId, userId: rec.userId, role: "admin" });

  const key = await createApiKey({
    orgId,
    ownerUserId: rec.userId,
    ownerRole: "admin",
    name: "MCP test",
    scopes,
  });
  if (!key.ok) throw new Error(key.error);
  return key.data.token;
}

/** A JSON-RPC POST shaped the way an MCP client sends one. */
function rpc(token: string | null, body: unknown): NextRequest {
  const headers = new Headers({
    "content-type": "application/json",
    // Streamable HTTP requires the client to accept both.
    accept: "application/json, text/event-stream",
  });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const INIT = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" },
  },
};

/** The transport may answer as JSON or as a single SSE frame; accept either. */
async function readRpc(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (text.startsWith("event:") || text.includes("\ndata:") || text.startsWith("data:")) {
    const line = text.split("\n").find((l) => l.startsWith("data:"));
    return JSON.parse(line!.slice(5).trim());
  }
  return JSON.parse(text);
}

describe("mcp — authentication", () => {
  it("refuses a request with no bearer token", async () => {
    const res = await POST(rpc(null, INIT));
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toBe("Bearer");
  });

  it("refuses an unknown token", async () => {
    const res = await POST(rpc("tw_nonsense", INIT));
    expect(res.status).toBe(401);
  });

  it("does not offer a server-initiated stream", async () => {
    const res = GET();
    expect(res.status).toBe(405);
  });
});

describe("mcp — protocol", () => {
  it("initializes and reports the server", async () => {
    const org = await newOrg();
    const token = await keyFor(org.id, ["client:read"]);

    const res = await POST(rpc(token, INIT));
    expect(res.status).toBe(200);

    const body = await readRpc(res);
    const result = body.result as Record<string, unknown>;
    expect((result.serverInfo as { name: string }).name).toBe("tecxwork");
    expect(result.capabilities).toHaveProperty("tools");
  });

  it("advertises only the tools the key's scopes allow", async () => {
    const org = await newOrg();
    // client:read alone — enough for two tools, not for the audit or the team.
    const token = await keyFor(org.id, ["client:read"]);

    await POST(rpc(token, INIT));
    const res = await POST(
      rpc(token, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })
    );
    const body = await readRpc(res);
    const names = ((body.result as { tools: { name: string }[] }).tools ?? []).map(
      (t) => t.name
    );

    expect(names).toContain("list_clients");
    expect(names).toContain("get_workspace_overview");
    expect(names).not.toContain("read_audit_trail");
    expect(names).not.toContain("list_team");
  });

  it("calls a tool and returns this workspace's data", async () => {
    const org = await newOrg();
    const token = await keyFor(org.id, ["client:read"]);
    await db.insert(clients).values({ orgId: org.id, name: "Giant Manufacturing" });

    await POST(rpc(token, INIT));
    const res = await POST(
      rpc(token, {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "list_clients", arguments: {} },
      })
    );

    const body = await readRpc(res);
    const content = (body.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("Giant Manufacturing");
  });

  it("refuses a tool the key's scopes exclude, even if called directly", async () => {
    // The advertised list is filtered, but an agent can still name a tool it never saw.
    const org = await newOrg();
    const token = await keyFor(org.id, ["client:read"]);

    await POST(rpc(token, INIT));
    const res = await POST(
      rpc(token, {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "read_audit_trail", arguments: {} },
      })
    );

    const body = await readRpc(res);
    // Either the tool is unknown to this server instance, or the gate refuses it. Both are
    // correct; what matters is that no audit data comes back.
    expect(JSON.stringify(body)).not.toContain("entityTypes");
  });
});

describe("mcp — the rules that keep it safe", () => {
  it("no tool accepts an orgId argument", async () => {
    // The tenant comes from the credential. A tool taking a tenant id is one injected
    // prompt away from reading another customer's data.
    for (const tool of MCP_TOOLS) {
      const keys = Object.keys(inputShapeFor(tool));
      expect(keys, `${tool.name}`).not.toContain("orgId");
      expect(keys, `${tool.name}`).not.toContain("org_id");
      expect(keys, `${tool.name}`).not.toContain("tenantId");
    }
  });

  it("every tool is a read — nothing destructive or financial in v1", async () => {
    const forbidden = /create|update|delete|remove|move|issue|void|approve|send|erase/i;
    for (const tool of MCP_TOOLS) {
      expect(forbidden.test(tool.name), `${tool.name} looks like a mutation`).toBe(false);
    }
  });

  it("no tool is gated on candidate:read, so none can return candidate PII", async () => {
    // The PIPA basis for streaming candidate data to a model provider is unresolved and is
    // the customer's decision, so v1 does not make it for them.
    for (const tool of MCP_TOOLS) {
      expect(tool.capability, `${tool.name}`).not.toBe("candidate:read");
    }
    expect(findTool("search_candidates")).toBeUndefined();
  });

  it("the compliance tool returns counts, not the people behind them", async () => {
    const org = await newOrg();
    const tool = findTool("get_compliance_summary");
    expect(tool).toBeDefined();

    const result = (await tool!.run(
      { orgId: org.id, recruiterId: 0, userId: 0, role: "admin", plan: "scale" },
      {}
    )) as Record<string, unknown> | null;

    // Totals only — `attention`, which carries candidate names, must not be here.
    expect(result).not.toBeNull();
    expect(Object.keys(result!).sort()).toEqual(["expired", "expiringSoon", "total"]);
  });

  it("scope filtering is a subset, never an expansion", async () => {
    expect(toolsForScopes([])).toHaveLength(0);
    const all = toolsForScopes(MCP_TOOLS.map((t) => t.capability));
    expect(all).toHaveLength(MCP_TOOLS.length);
  });
});
