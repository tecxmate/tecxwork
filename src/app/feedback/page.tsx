import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { FeedbackForm } from "./feedback-form";

export const metadata = {
  title: "Send feedback · TECXWORK",
};

export default async function FeedbackPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/feedback");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar
        navRole={session.role}
        currentPath="/feedback"
      />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <header className="mb-6 space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Send feedback
            </h1>
            <p className="text-sm text-muted-foreground">
              Hit a bug or have a suggestion? Tell us what happened. The page
              you came from, your browser, and the last 20 client-side errors
              are attached automatically so we can reproduce.
            </p>
          </header>
          <FeedbackForm
            email={session.email}
            role={session.role}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
