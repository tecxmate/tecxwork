import { redirect } from "next/navigation";
import { getAgencyActor } from "@/lib/agency-auth";
import { getClient, isAcceptableRedirect } from "@/lib/oauth";
import { isSupportedScope } from "@/lib/oauth-metadata";
import { capabilitiesFor, type Capability } from "@/lib/permissions";
import { getTenantById } from "@/lib/tenant";
import { ConsentForm } from "./consent-form";

export const dynamic = "force-dynamic";

/**
 * The consent screen — the only place in the whole OAuth flow where a human decides.
 *
 * Registration hands out an identity and grants nothing; this page is what turns that into
 * access. So the checks here are the real ones: the client must be registered, the redirect
 * must be one it registered, and the scopes are intersected with what THIS member actually
 * holds, so nobody can grant an agent more than they have themselves.
 *
 * Errors are rendered rather than redirected when the redirect target cannot be trusted —
 * bouncing an error to an unvalidated URI is how an open redirect ships.
 */
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };

  const clientId = one("client_id");
  const redirectUri = one("redirect_uri");
  const state = one("state");
  const codeChallenge = one("code_challenge");
  const challengeMethod = one("code_challenge_method");
  const requested = (one("scope") ?? "").split(/[\s+]+/).filter(Boolean);

  // Signed in, and an agency member — the consent is granted inside a workspace, so there
  // has to be one. Send them to log in and come back to the same URL.
  const actor = await getAgencyActor();
  if (!actor) {
    const next = encodeURIComponent(
      `/oauth/authorize?${new URLSearchParams(
        Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string")
      )}`
    );
    redirect(`/login?next=${next}`);
  }

  if (!clientId || !redirectUri) {
    return <Problem title="Incomplete authorization request" detail="client_id and redirect_uri are required." />;
  }

  const client = await getClient(clientId);
  if (!client) {
    return <Problem title="Unknown application" detail="This client is not registered." />;
  }
  // Exact match, and only then is the URI safe to send anything to.
  if (!client.redirectUris.includes(redirectUri) || !isAcceptableRedirect(redirectUri)) {
    return (
      <Problem
        title="Redirect address not recognised"
        detail="This application asked to be sent somewhere it has not registered. Nothing has been shared."
      />
    );
  }
  if (challengeMethod !== "S256" || !codeChallenge) {
    return (
      <Problem
        title="This application is using an outdated sign-in"
        detail="PKCE with S256 is required. Nothing has been shared."
      />
    );
  }

  // The ceiling is what this member holds — you cannot delegate what you were never given.
  const held = capabilitiesFor(actor.role);
  const grantable = requested
    .filter(isSupportedScope)
    .filter((s) => held.includes(s as Capability));

  const org = await getTenantById(actor.orgId);

  return (
    <ConsentForm
      clientName={client.name}
      clientId={clientId}
      redirectUri={redirectUri}
      state={state ?? ""}
      codeChallenge={codeChallenge}
      workspaceName={org?.name ?? "your workspace"}
      scopes={grantable}
      unsupported={requested.filter((s) => !grantable.includes(s as never))}
    />
  );
}

function Problem({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-heading text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </main>
  );
}
