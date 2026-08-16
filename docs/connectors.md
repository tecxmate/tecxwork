# Connecting an AI agent to a tecxwork workspace

tecxwork exposes a **remote MCP server** at `/api/mcp`. An agent that speaks Model Context
Protocol — Claude Desktop, Claude Code, or anything built on the MCP SDK — can read a
workspace's clients, compliance clock, team and audit trail, acting on behalf of a person
and never beyond what that person's role allows.

There are two ways to authenticate. **OAuth is the one to offer a customer**; API keys exist
for scripts and for clients that cannot open a browser.

---

## Before anything works

Three conditions, all enforced server-side. A connection that "silently does nothing" is
almost always one of these:

| Requirement | Where it lives |
|---|---|
| The workspace is on a plan carrying `api_access` | today, `scale` only — `src/lib/plans.ts` |
| The workspace status is `active` | not `suspended` or `cancelled`, and not a lapsed trial |
| The connecting person is a member with a role that holds the scope | `src/lib/permissions.ts` |

The third is the one that surprises people: **a connection can never do more than the person
who made it.** An interviewer holds no capabilities at all, so an interviewer who approves a
connection grants nothing. This is checked again on every single request, not frozen at
approval time — demote someone and their connection narrows within the same second.

---

## Option A — OAuth (the Connect button)

Point the client at the workspace's own origin. Everything else is discovery.

```
https://<workspace-slug>.tecxwork.com
```

The client fetches `/.well-known/oauth-protected-resource`, follows it to
`/.well-known/oauth-authorization-server`, registers itself, and opens the consent screen.
Nobody has to paste anything.

**Use the workspace's own subdomain, not the apex.** The discovery documents describe the
host they were fetched from, and a client checks that the issuer matches where it looked.

What the person sees: a screen naming the application, the workspace, and each permission as
a sentence — *"See your client companies and how many placements each has"* — not a scope
string. If the application asked for more than their role can delegate, the extra is dropped
before the screen renders and a note says so.

### What it is doing underneath

| Step | Endpoint |
|---|---|
| Discovery (RFC 9728 → RFC 8414) | `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server` |
| Register (RFC 7591) | `POST /api/oauth/register` |
| Consent | `GET /oauth/authorize` → `POST /api/oauth/authorize` |
| Token, refresh | `POST /api/oauth/token` |

PKCE with `S256` is **required** — `plain` is refused, and so is a request with no challenge
at all. Registration is open, which is correct rather than lax: registering hands out an
identity and grants nothing until a signed-in member approves a scope.

### Disconnecting

**Team → Connected applications.** Anyone can disconnect what they themselves approved;
administrators can disconnect anything in the workspace. It takes effect on the
application's next call, not at the end of an hour.

---

## Option B — API key

For a script, a cron job, or a client with no browser.

Mint it on **Team → API keys**. Requires `member:invite` — letting something that is not a
person act inside the workspace is an administrative decision of the same weight as adding a
colleague. Pick the scopes; the form offers only what your own role could delegate.

The token is shown **once**, because only a SHA-256 of it is stored. Lose it and the fix is
to revoke and mint another, not to look it up.

```
Authorization: Bearer tw_...
```

Same rules as OAuth: the key borrows its owner's authority, scopes are intersected with
their current role on every request, and the key stops working the moment they lose their
membership.

Rate limit: **300 requests per minute, per credential** — this applies to OAuth access
tokens too. Per credential rather than per IP, because agents share egress addresses: an IP
bucket would either throttle unrelated customers together or be set so high it limited
nothing. Over the limit you get `429` with a reset time.

---

## The tools

Five, all read-only.

| Tool | Scope | Returns |
|---|---|---|
| `get_workspace_overview` | `client:read` | headline counts for the workspace |
| `list_clients` | `client:read` | client companies and their placement counts |
| `get_compliance_summary` | `compliance:read` | permit/ARC expiry **counts** |
| `list_team` | `member:invite` | members, roles, seat usage |
| `read_audit_trail` | `audit:read` | recent activity — who changed what, and when |

Only the tools a credential's scopes allow are advertised, and each is authorised again when
called — an agent can name a tool it never saw in the list, and naming it does not get it.

### Three rules that decide whether this is safe

1. **No tool accepts an `orgId`, or any other tenant identifier.** The tenant comes from the
   credential. A tool that took one would be one injected prompt away from reading another
   customer's data.
2. **Nothing destructive or financial.** No stage moves, no offer approvals, no invoice
   issue or void, no candidate erasure. v1 reads.
3. **No candidate PII.** There is no candidate search tool, and the compliance tool returns
   totals rather than the rows behind them, because those rows carry names. The lawful basis
   under PIPA for streaming candidate data to a model provider is the customer's decision to
   make, and v1 does not make it for them by default.

---

## When it does not work

| Symptom | Cause |
|---|---|
| `401` with a `WWW-Authenticate` header | No credential, or one that no longer resolves. The header points at discovery, so a client that understands OAuth turns this into a sign-in. |
| Connected, but **no tools appear** | The credential's scopes are empty. Usually the granting member's role holds none of them — check their role, not the client. |
| `429` | Over 300/min on one credential. The response carries the reset time. |
| Consent screen says the application "asked for nothing your role can grant" | Correct behaviour, not a bug. Connect as someone whose role holds the scopes. |
| Everything 403s after a plan change | `api_access` is a plan feature. Off-plan, every credential stops resolving. |

---

## Operating notes

- Access tokens last **1 hour**; refresh tokens **30 days** and **rotate** — using one
  invalidates its predecessor.
- **A reused authorization code revokes the whole grant**, including tokens already issued
  from it. A code presented twice is treated as evidence that someone else has a copy.
- Every action a connector takes is written to the audit trail with the granting user's
  identity, so "who did this" still names a human.
- Deployment needs `PLATFORM_ROOT_DOMAIN` set for subdomain routing and per-tenant
  discovery. Without it, every workspace is served from the apex — which works, but no
  workspace gets its own connector URL.
