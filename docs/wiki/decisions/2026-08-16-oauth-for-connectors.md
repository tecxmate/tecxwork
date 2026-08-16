---
title: OAuth 2.1 for connectors — a "Connect" button instead of a pasted key
type: decision
slug: 2026-08-16-oauth-for-connectors
date: 2026-08-16
updated: 2026-08-16
attributed_to: [claude-code]
belongs_to: [tecxwork, agent-connectors]
source: chat
status: accepted
tags: [oauth, pkce, mcp, connectors, security, rfc7591, rfc8414, rfc9728]
related: [agent-connectors, 2026-08-12-saas-tenancy-and-commercial-model, data-privacy]
---

## The decision

Phase 3 of the connector path ships: OAuth 2.1 with PKCE and dynamic client
registration, so an MCP client can offer **Connect** rather than asking a customer to
paste an API key into a config file. Scopes are the existing `Capability` strings — no
second permission vocabulary was invented.

niko was travelling and had authorised the sequence ("key-minting UI, and atomic per-key
rate limiting, then api/mcp… u can keep on working"); OAuth was the recorded next phase.

## Why OAuth at all, when API keys already work

Keys work and stay. But a key is a *bearer secret a human copies*, which means it gets
pasted into chat windows, committed to dotfiles, and never rotated. OAuth moves the secret
off the human's clipboard: the client gets a short-lived access token and a rotating
refresh token, both revocable per grant, and the customer sees a screen naming what they
are agreeing to. That screen is also the only place a PIPA-relevant disclosure can honestly
live. Apollo and Buffer both ship this; a customer evaluating a connector expects it.

## The security properties, and why each was chosen

- **PKCE (S256) is required, not optional.** These are public clients — a desktop MCP
  client cannot keep a secret — so an intercepted authorization code would otherwise be
  enough on its own. `plain` is not accepted.
- **A replayed code revokes the entire grant**, not just that code. The safe reading of a
  code presented twice is that someone else has a copy; the tokens it already produced stop
  working too. This is RFC 6749 §10.5's recommendation taken literally, and it is tested.
- **Refresh tokens rotate.** Each refresh invalidates its predecessor, so a stolen refresh
  token has a bounded life and its use is detectable.
- **Redirect URIs match exactly.** `https` anywhere; `http` only on loopback, because a
  desktop client redirects to a port on the user's own machine where there is no https to
  have. No wildcards, no prefix matching, no fragments.
- **Registration is unauthenticated on purpose** (RFC 7591). It grants nothing: a
  registered client can only *ask*, and asking produces a consent screen. Gating
  registration would break the discovery flow that makes a Connect button possible, in
  exchange for no security.
- **Scopes are intersected twice** — once when the consent screen is rendered (so it can
  never display a permission the signing-in person could not delegate) and again at every
  token resolution against the granting member's *current* role. A member demoted after
  granting loses the capability immediately; the token does not carry a frozen copy.
- **The token is not the tenant.** `orgId` comes from the grant, never from the request, so
  the MCP rule "no tool accepts an `orgId`" survives the new credential type.
- **A grant dies with its context.** Revocation, expiry, workspace suspension, and plan
  downgrade off `api_access` each independently make a live access token stop resolving.

## What was deliberately not built

- **No client secrets for public clients.** Storing one would imply a confidentiality this
  deployment model cannot provide; PKCE is the substitute, which is what OAuth 2.1 says.
- **No `token_endpoint_auth_method` beyond `none`/`client_secret_post`.** Nothing needs
  mTLS or JWT client auth yet.
- **No scope expansion beyond what MCP exposes.** The four scopes on the consent screen are
  the four read capabilities the connector's tools already use. In particular
  `candidate:read` is still absent — the PIPA basis for streaming candidate data to a model
  provider remains niko's open question, and a consent checkbox is not an answer to it.
## Addendum — connected applications (same day)

The consent copy promised revocation from workspace settings, and that screen did not exist
— a false promise on a consent screen, which is worse than no promise. `/api/org/connections`
and a panel on the Team page now close it.

Two decisions inside it worth recording:

- **The gate takes no capability.** Revoking access is never a privileged action, and gating
  it would strand exactly the people who most need it. The rule is applied inside instead:
  your own grants always, every grant in the workspace if you hold `member:invite`. A
  recruiter can grant, so a recruiter must be able to withdraw without asking an
  administrator — otherwise the consent sentence stays false for everyone below admin.
  Administrators see colleagues' connections because an application reading the workspace's
  data is the workspace's business, not only the granter's.
- **A grant is not a row.** It is the tuple (org, user, client) implied by its live tokens,
  and a refresh mints more of them. `listGrants()` folds them into one line per application,
  in TypeScript rather than SQL, because the honest aggregate over `scopes` is a set union
  and Postgres has no plain `max()` for arrays.

Cross-tenant revocation returns the same success shape and does nothing, so the response
cannot confirm that a grant exists in another workspace.

## Shape

| Piece | Path |
|---|---|
| Authorization-server metadata (RFC 8414) | `/.well-known/oauth-authorization-server` |
| Protected-resource metadata (RFC 9728) | `/.well-known/oauth-protected-resource` |
| Dynamic client registration (RFC 7591) | `POST /api/oauth/register` |
| Consent screen | `/oauth/authorize` |
| Code issue (form POST from consent) | `POST /api/oauth/authorize` |
| Token + refresh | `POST /api/oauth/token` |
| Core logic | `src/lib/oauth.ts` |
| Tables | `oauth_clients`, `oauth_auth_codes`, `oauth_tokens` |

The `/api/mcp` 401 now carries `WWW-Authenticate: Bearer resource_metadata="…"`, which is
what turns a rejected request into a sign-in instead of a dead end.

Migration: `npm run db:update:oauth` (additive, idempotent).
