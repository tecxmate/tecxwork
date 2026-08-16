"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * What the person is actually agreeing to.
 *
 * Written to be readable by someone who has never heard the word "scope": each permission
 * is a sentence about what the application will be able to see, not a capability string.
 * A consent screen nobody understands is a consent screen that produces no consent.
 */

const SCOPE_COPY: Record<string, string> = {
  "client:read": "See your client companies and how many placements each has",
  "compliance:read": "See how many work permits and ARCs are expiring — counts only, not who",
  "audit:read": "See your workspace's activity log — who changed what, and when",
  "member:invite": "See who is in your workspace and how many seats are used",
};

export function ConsentForm({
  clientName,
  clientId,
  redirectUri,
  state,
  codeChallenge,
  workspaceName,
  scopes,
  unsupported,
}: {
  clientName: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  workspaceName: string;
  scopes: string[];
  unsupported: string[];
}) {
  const [busy, setBusy] = useState(false);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card className="p-6">
        <h1 className="font-heading text-xl font-bold">
          Connect {clientName} to {workspaceName}?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It will be able to read the following on your behalf. It cannot change anything,
          and it cannot see candidates&apos; personal details.
        </p>

        {scopes.length === 0 ? (
          <p className="mt-5 rounded-lg bg-muted p-3 text-sm">
            This application asked for nothing your role can grant. There is nothing to
            approve.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {scopes.map((scope) => (
              <li key={scope} className="flex items-start gap-2 text-sm">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{SCOPE_COPY[scope] ?? scope}</span>
              </li>
            ))}
          </ul>
        )}

        {unsupported.length > 0 ? (
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            It also asked for permissions your role cannot grant. Those have been dropped,
            and approving will not include them.
          </p>
        ) : null}

        <form method="POST" action="/api/oauth/authorize" className="mt-6 flex gap-2">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          <input type="hidden" name="scope" value={scopes.join(" ")} />
          <Button type="submit" disabled={busy || scopes.length === 0} onClick={() => setBusy(true)}>
            {busy ? "Connecting…" : "Approve"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              // Denial travels back to the client as an OAuth error, per the spec, so it
              // can say something useful rather than hang waiting.
              const url = new URL(redirectUri);
              url.searchParams.set("error", "access_denied");
              if (state) url.searchParams.set("state", state);
              window.location.href = url.toString();
            }}
          >
            Cancel
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          You can revoke this at any time from your workspace settings. Approving grants no
          more than your own role already allows.
        </p>
      </Card>
    </main>
  );
}
