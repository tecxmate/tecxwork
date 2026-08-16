import { NextRequest, NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authorizeApiKey, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { inputShapeFor, toolsForScopes } from "@/lib/mcp-tools";
import { resolveApiKeyActor } from "@/lib/api-keys";
import { resolveOAuthActor } from "@/lib/oauth";

/**
 * The MCP endpoint.
 *
 * Stateless by construction: `sessionIdGenerator: undefined`, a fresh server and transport
 * per request. Serverless functions do not share memory between invocations, so a stateful
 * transport would keep a session map that the next request lands in a different instance
 * from and cannot see — an intermittent failure that only shows up under load.
 *
 * **Authentication is bearer-only here.** The browser session is deliberately not accepted:
 * a cookie is sent automatically by the browser, so honouring one on this endpoint would
 * make it reachable by any page a signed-in user happens to visit. A key has to be pasted
 * on purpose.
 */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Resolve the credential once here, so the tool list can be filtered to its scopes before
  // anything is advertised — an agent should not see a tool it cannot call.
  const auth = req.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;

  if (!token) {
    return NextResponse.json(
      { error: "Authorization: Bearer <api key> required" },
      {
        status: 401,
        headers: {
          // Points the client at discovery, so a 401 becomes a sign-in rather than a
          // dead end (RFC 9728).
          "WWW-Authenticate": `Bearer resource_metadata="${new URL("/.well-known/oauth-protected-resource", req.url).toString()}"`,
        },
      }
    );
  }

  // Either credential resolves to the same actor shape, so everything below is identical.
  const oauth = token.startsWith("two_") ? await resolveOAuthActor(token) : null;
  const keyActor = oauth
    ? {
        keyId: oauth.tokenId,
        orgId: oauth.orgId,
        userId: oauth.userId,
        recruiterId: oauth.recruiterId,
        role: oauth.role,
        plan: oauth.plan,
        scopes: oauth.scopes,
      }
    : await resolveApiKeyActor(token);

  if (!keyActor) {
    return NextResponse.json(
      { error: "Invalid API key" },
      {
        status: 401,
        headers: {
          // Points the client at discovery, so a 401 becomes a sign-in rather than a
          // dead end (RFC 9728).
          "WWW-Authenticate": `Bearer resource_metadata="${new URL("/.well-known/oauth-protected-resource", req.url).toString()}"`,
        },
      }
    );
  }

  const tools = toolsForScopes(keyActor.scopes);

  const server = new McpServer(
    { name: "tecxwork", version: "1.0.0" },
    {
      instructions:
        "Recruitment workspace for a placement agency. Every tool acts inside the single " +
        "workspace this API key belongs to; there is no way to address another. Tools read " +
        "only — nothing here changes data — and none returns candidate personal details.",
    }
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: inputShapeFor(tool),
      },
      async (args: Record<string, unknown>) => {
        // Authorised per call from the actor this request already resolved — not re-read
        // from ambient state. The scope list above decided what to advertise; this decides
        // what may actually run, and applies the rate limit, the tenant's commercial state
        // and the plan.
        const gate = await authorizeApiKey(keyActor, tool.capability);
        if (!gate.ok) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: gate.error }],
          };
        }

        const parsed = tool.schema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: parsed.error.issues[0]?.message ?? "Invalid arguments",
              },
            ],
          };
        }

        const result = await tool.run(gate.actor, parsed.data as Record<string, unknown>);

        // Every call is recorded with a non-human actor type, which is the column the audit
        // log has carried since the ATS shipped and nothing had yet used.
        await logAudit({
          orgId: gate.actor.orgId,
          actorUserId: gate.actor.userId,
          actorType: "api_key",
          action: "mcp_call",
          entityType: "tool",
          metadata: { tool: tool.name },
          ip: clientIp(req),
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);

  return transport.handleRequest(req);
}

/**
 * Streamable HTTP allows GET for a server-initiated event stream. Nothing here pushes, and
 * a long-lived stream in a serverless function is billed for its whole life, so it is
 * refused rather than left half-implemented.
 */
export function GET() {
  return NextResponse.json(
    { error: "This MCP server does not offer a server-initiated stream. Use POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
