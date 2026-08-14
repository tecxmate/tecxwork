"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  token: string;
  signedInAs: string | null;
  orgName: string | null;
};

/**
 * The landing page for an invitation link.
 *
 * Acceptance needs a session, so the two states this has to handle well are "signed in as
 * the right person" and "signed in as somebody else" — the second is common, because
 * invitations get opened in whatever browser the mail client hands them to.
 */
export function InviteAccept({ token, signedInAs, orgName }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const workspace = orgName ?? "this workspace";

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That invitation could not be accepted.");
        return;
      }
      setDone(true);
      router.refresh();
      setTimeout(() => router.push("/dashboard/interviews"), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">You&apos;re in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to {workspace}. Taking you to your dashboard…
        </p>
      </Card>
    );
  }

  if (!signedInAs) {
    // Deliberately carries the token through the sign-in round trip, so the invitee does
    // not have to go back to the email a second time.
    const next = encodeURIComponent(`/invite?token=${encodeURIComponent(token)}`);
    return (
      <Card className="mx-auto mt-16 max-w-md p-8">
        <h1 className="text-xl font-semibold">Join {workspace}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the email address this invitation was sent to, and we&apos;ll add you
          to the workspace.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.push(`/login?next=${next}`)}>Sign in</Button>
          <Button variant="outline" onClick={() => router.push(`/register?next=${next}`)}>
            Create an account
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-16 max-w-md p-8">
      <h1 className="text-xl font-semibold">Join {workspace}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You are signed in as <strong>{signedInAs}</strong>. An invitation only works for the
        address it was sent to — if that isn&apos;t this one, sign out and sign back in as
        the invited address.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Button onClick={accept} disabled={busy}>
          {busy ? "Joining…" : "Accept invitation"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/")} disabled={busy}>
          Not now
        </Button>
      </div>
    </Card>
  );
}
