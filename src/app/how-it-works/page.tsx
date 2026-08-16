import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileSpreadsheet,
  Layers,
  Lock,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";
import { LifecycleDiagram } from "./lifecycle-diagram";

export const metadata: Metadata = {
  title: "How it works | TECXWORK",
  description:
    "How TECXWORK runs a placement end to end — pipeline, offers, placements, invoices and the compliance file — for staffing agencies and the employers they hire for.",
};

/**
 * The employer- and agency-facing explainer.
 *
 * Written plainly on purpose: short sentences, second person, headings that name the
 * thing rather than making a point about it. An earlier draft was more literary
 * ("What holds when nobody is watching") and read as advertising; the audience here is
 * an agency owner deciding whether this survives an audit, and they want to be told.
 *
 * Every claim is checked against the code. What the product does not do — the client
 * portal, AI screening — is absent rather than softened, and the one real limitation on
 * the Employer-Pays export is stated on the page rather than buried.
 */

const STEPS = [
  {
    icon: ClipboardList,
    title: "Open a job order",
    body: "Every vacancy belongs to a client and has a headcount. The same role for two clients stays in two queues, not one. Your own internal roles work the same way.",
  },
  {
    icon: Layers,
    title: "Work the pipeline",
    body: "Five stages to start: Applied, Screening, Interview, Offer, Hired. Rename them, reorder them, add your own. Old stages are archived rather than deleted, so last year's reports still read correctly.",
  },
  {
    icon: BadgeCheck,
    title: "Send an offer",
    body: "One person writes the offer, another approves it. A candidate can only have one live offer at a time. If they decline, you can write a new one.",
  },
  {
    icon: ShieldCheck,
    title: "Record the placement",
    body: "When the candidate accepts, the placement is created with the salary and start date already filled in. Probation and guarantee are tracked separately — one is the employer's right to end the contract, the other is your exposure if the fee is clawed back.",
  },
  {
    icon: Receipt,
    title: "Bill the client",
    body: "Pick the placements you haven’t billed yet and raise an invoice. The fee comes from the rate you agreed with that client — months of salary, or a percentage of the first year. Tax is added to the total.",
  },
];

const GUARANTEES = [
  {
    title: "Stage history is never overwritten",
    body: "Moving a card adds a row. The board shows you where a candidate is. The history shows how they got there and how long each step took. Your funnel and time-in-stage numbers are read from that history.",
  },
  {
    title: "You can’t bill the same placement twice",
    body: "That rule lives in the database, not in the app. It holds even if two people click at the same second, and it keeps holding if someone later writes a new script against the same tables.",
  },
  {
    title: "Invoice numbers never skip",
    body: "Invoices run INV-YYYY-NNNN and credit notes CN-YYYY-NNNN. An accountant reads a missing number as a missing document, so the system doesn’t create one.",
  },
  {
    title: "Money is stored as whole numbers",
    body: "Nothing rounds twice. The total on screen matches the export and matches the invoice.",
  },
  {
    title: "Renewing a permit keeps the old one",
    body: "The previous record is marked superseded, not replaced. Months later you can still answer “was this worker covered in August?” and be sure the answer is right.",
  },
  {
    title: "Every document view is recorded",
    body: "Scans open through the app, never a public link, so each view is permission-checked and logged. The audit log stores what changed and who changed it — not the personal data itself.",
  },
];

const ROLE_NOTES = [
  {
    role: "Interviewer",
    body: "Gets no permissions at all. They see the candidates assigned to them and never the candidate database. Under PIPA, that is the point of the role.",
  },
  {
    role: "Recruiter",
    body: "Moves candidates, writes offers, works the board. Can’t approve their own offer.",
  },
  {
    role: "Hiring manager",
    body: "Your client's decision maker, working inside your account. Approves offers. Sees no documents and no invoices.",
  },
  {
    role: "Account manager",
    body: "Owns the client, the agreed rates and the billing that follows.",
  },
];

export default async function HowItWorksPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar navRole={session?.role ?? "guest"} currentPath="/how-it-works" />

      <main className="flex-1">
        {/* ---- hero ---- */}
        <section className="border-b px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              For recruitment agencies and employers
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-5xl">
              From job order to invoice,
              <br className="hidden sm:block" /> in one place
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Post a job, move candidates through your pipeline, send the offer, record the
              placement, bill the client. It&rsquo;s the same record all the way through, so
              nothing has to be rebuilt in a spreadsheet at the end.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/get-started"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                Get started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 text-base font-medium transition-colors hover:bg-secondary sm:w-auto"
              >
                Browse companies
              </Link>
            </div>
          </div>
        </section>

        {/* ---- the mechanism ---- */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                One application, two records
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                A candidate applies once. That creates two things: an interview booking for
                the employer, and a pipeline card for you. The booking is done after the
                interview. The pipeline card runs for weeks, and it is what your fee, invoice
                and guarantee all hang from.
              </p>
            </div>
            <div className="mt-10">
              <LifecycleDiagram />
            </div>
          </div>
        </section>

        {/* ---- the loop ---- */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                The five steps
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Each step hands the next one what it needs, so you never retype the same
                detail twice.
              </p>
            </div>

            <ol className="mt-10 space-y-px overflow-hidden rounded-xl border border-border/60">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex gap-4 bg-card p-5 sm:gap-6 sm:p-6 [&+li]:border-t [&+li]:border-border/60"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                      {/* Capped rather than filling the row: past roughly 75 characters the
                          eye loses the start of the next line. */}
                      <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ---- guarantees ---- */}
        <section className="border-b bg-secondary/40 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Your records stay correct
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Any system looks fine in a demo. These are the things that still hold a year
                later, when two people click at once and whoever set it up has left.
              </p>
            </div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border/60 sm:grid-cols-2">
              {GUARANTEES.map((g) => (
                <div key={g.title} className="bg-card p-5 sm:p-6">
                  <h3 className="flex items-start gap-2.5 font-heading text-lg font-semibold">
                    <Lock className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>{g.title}</span>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {g.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- permissions ---- */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Control who sees what
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Fifteen permissions, given out through seven roles in your account. Four are
                worth spelling out.
              </p>
            </div>

            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              {ROLE_NOTES.map((r) => (
                <div key={r.role} className="border-l-2 border-primary/30 pl-4">
                  <dt className="font-heading text-lg font-semibold">{r.role}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {r.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---- compliance ---- */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Ready for an inspection
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Nine document types: passport, visa, ARC, work permit, medical, contract,
                diploma, criminal record and health insurance. Expiry dates are worked out
                when you look at them, so nothing sits stale waiting for an overnight job.
                Placements link to those documents, so you see &ldquo;this worker&rsquo;s
                permit runs out soon <em>and</em>{" "}we are still on the hook&rdquo; as one
                fact instead of two.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-heading text-lg font-semibold">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                  Employer-Pays fee trail
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  One row per placement, 21 columns. Every fee is matched to the client
                  invoice that carried it, including the fee written as months of salary
                  &mdash; the number brand audits actually check.
                </p>
                <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
                  It reports worker-charged fees as <em>recorded</em>: zero. That word matters.
                  It shows the system holds no fee charged to a worker, because there is no way
                  in the data to charge one. It doesn&rsquo;t prove that no cash changed hands
                  outside the system. We would rather give an auditor the smaller claim that is
                  true.
                </p>
              </article>

              <article className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-heading text-lg font-semibold">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                  Evaluation evidence summary
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  For the periodic evaluation a licensed agency goes through: service records,
                  fee transparency, document management and accountability, counted across
                  your whole book. Counts only &mdash; no names, no amounts per row &mdash;
                  because the evaluation asks how you work, not who you placed.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Both files are CSV that opens correctly in Excel on Windows, so Chinese and
                  Vietnamese names don&rsquo;t turn into garbled text.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ---- corridor-agnostic ---- */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Works in any hiring corridor
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                There are three parties: the employer who hires, the partner who sources, and
                the candidate. Nothing assumes which country each one is in, so the same
                system works whichever way people move.
              </p>
              <p>
                What&rsquo;s country-specific comes from where you&rsquo;re licensed, not from a route
                we guessed: business tax, fees quoted in months of salary, residence and work
                permit types. We kept those specific on purpose. A compliance feature that
                hedges is one that fails an audit.
              </p>
            </div>
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-4xl">
              Try it with one real job
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              The quickest way to judge this is to run one vacancy through and see what the
              record looks like at the end.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/get-started"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                Get started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/tutorial"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 text-base font-medium transition-colors hover:bg-secondary sm:w-auto"
              >
                Read the full guide
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
