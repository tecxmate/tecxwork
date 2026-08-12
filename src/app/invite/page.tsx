import { getSession } from "@/lib/auth";
import { getTenant } from "@/lib/tenant";
import { InviteAccept } from "./invite-accept";

/**
 * Invitation landing page.
 *
 * Deliberately says nothing about the invitation itself before it is accepted — not the
 * invited address, not the role, not whether the token is even real. The token arrives in a
 * URL, which ends up in browser history and referrer headers, so a page that confirmed
 * "yes, this is a valid invitation for finance@client.com" would leak whether an address
 * belongs to a workspace to anyone holding a stale link. The workspace name comes from the
 * host, which the visitor already knows by virtue of being there.
 */
export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.trim() ?? "";
  const session = await getSession();
  const tenant = await getTenant();

  if (!token) {
    return (
      <main className="px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This invitation link is incomplete</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the link from your invitation email again, or ask for a new one.
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 pb-16">
      <InviteAccept
        token={token}
        signedInAs={session?.email ?? null}
        orgName={tenant?.name ?? null}
      />
    </main>
  );
}
