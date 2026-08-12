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
 * Deliberately not a feature list. An agency evaluating this already knows what a kanban
 * board is; what they cannot tell from a screenshot is whether the record survives an
 * audit. So each section leads with the mechanism and names the guarantee behind it.
 *
 * Every claim here is checked against the code. Things the product does not do — the
 * client portal, AI screening — are absent rather than softened, and the one honest
 * limitation on the Employer-Pays export is stated on the page rather than buried.
 */

const STEPS = [
  {
    icon: ClipboardList,
    title: "A job order, against a client",
    body: "Vacancies belong to a client company and carry a headcount, so the same role for two clients never blurs into one queue. Internal requisitions use the same object, marked as your own.",
  },
  {
    icon: Layers,
    title: "A pipeline you shape",
    body: "Five stages out of the box — Applied, Screening, Interview, Offer, Hired — which you rename, reorder or extend. Retired stages are archived, never deleted, so last year's history still reads correctly.",
  },
  {
    icon: BadgeCheck,
    title: "An offer two people touch",
    body: "Drafting an offer and approving it are separate permissions, so the person who negotiates terms is not the person who authorises them. One live offer per candidate; a declined offer frees the slot for a fresh one.",
  },
  {
    icon: ShieldCheck,
    title: "A placement that carries forward",
    body: "Accepting an offer creates the placement with the salary and start date already on it. Probation and guarantee are tracked separately — one is the employer's right to end the contract, the other is your exposure to a clawback.",
  },
  {
    icon: Receipt,
    title: "An invoice you cannot raise twice",
    body: "Select unbilled placements and raise an invoice. Fees come from the client's agreed rate — months of salary or a percentage of the first year — and business tax is applied to the whole subtotal, the way the client's own accounts will do it.",
  },
];

const GUARANTEES = [
  {
    title: "The stage history is append-only",
    body: "Moving a card writes a new row rather than overwriting the last one. The board tells you where a candidate is; the history tells you how they got there, and how long each step took. Funnel and time-in-stage are read from that history, not re-derived from the current state.",
  },
  {
    title: "Double-billing is blocked in the database",
    body: "The rule that a placement fee cannot appear on two live invoice lines is a constraint in Postgres, not a check in application code. It holds even if two people click at the same moment, and it keeps holding when someone writes a new script against the same tables.",
  },
  {
    title: "Numbering never gaps silently",
    body: "Invoices run INV-YYYY-NNNN and credit notes CN-YYYY-NNNN on their own sequences, derived from what already exists. Accountants read a gap in an invoice sequence as a missing document, so the system does not create one.",
  },
  {
    title: "Money is whole numbers",
    body: "Amounts are stored as integers and tax as basis points. Nothing rounds twice, and no total drifts by a dollar between the screen, the export and the invoice.",
  },
  {
    title: "A renewal supersedes, it does not overwrite",
    body: "Renewing a work permit keeps the previous record marked superseded. Months later an inspector can still ask whether a worker was covered on a specific date and get a truthful answer.",
  },
  {
    title: "Reading a document is an event",
    body: "Scans are served through the application, never as a public file link, so every view is permission-checked and recorded. The audit log stores which fields changed and who changed them — never the personal data itself.",
  },
];

const ROLE_NOTES = [
  {
    role: "Interviewer",
    body: "Holds no capabilities at all. Reaches a candidate only through an application assigned to them, and never the searchable database. Under PIPA that distinction is the entire point of the role.",
  },
  {
    role: "Recruiter",
    body: "Moves candidates, drafts offers, works the board. Cannot approve the offer they wrote.",
  },
  {
    role: "Hiring manager",
    body: "The client-side decision maker, seated inside your workspace. Approves offers; sees no compliance file and no invoices.",
  },
  {
    role: "Account manager",
    body: "Owns the client relationship, the commercial terms and the billing that follows from them.",
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
              For staffing agencies and the employers they hire for
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-5xl">
              A placement is a paper trail
              <br className="hidden sm:block" /> that happens to involve people
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Most hiring tools stop at the offer. The work that decides whether you get paid
              &mdash; the fee, the invoice, the guarantee period, the permit that expires in
              three weeks &mdash; lives in a spreadsheet nobody wants to be responsible for.
              TECXWORK carries the same record from first application to final invoice.
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
                See who is hiring
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
                This is the part worth understanding, because everything else follows from
                it. A candidate applying to a job creates an interview booking
                <span className="whitespace-nowrap"> &mdash; </span>
                the employer&rsquo;s, finished once the interview happens &mdash; and a
                pipeline card, which is yours and runs for weeks. They are deliberately
                separate systems that meet on the candidate rather than in one shared status
                field.
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
                From vacancy to invoice
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Five objects, each one handing the next what it needs so nothing is retyped
                and nothing is inferred.
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
                What holds when nobody is watching
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Any system behaves on the demo. These are the properties that still hold on a
                Friday afternoon, eighteen months in, when two people click at once and the
                person who set it up has left.
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
                Access is a decision, not a default
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Fifteen capabilities, granted through seven roles inside your workspace. Two
                of them are worth stating plainly, because they are the ones that get waved
                through elsewhere.
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
                The file an inspection asks for
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Nine document types &mdash; passport, visa, ARC, work permit, medical,
                contract, diploma, criminal record, health insurance &mdash; each with an
                expiry the system evaluates as you read it, so a date never goes stale waiting
                for a nightly job. Placements join to that file, which is how you see
                &ldquo;this worker&rsquo;s permit expires soon <em>and</em> we are still
                liable for them&rdquo; as one fact rather than two.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-heading text-lg font-semibold">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                  Employer-Pays fee trail
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  One row per placement, twenty-one columns, reconciling every fee to the
                  client invoice that carried it &mdash; including the fee expressed in months
                  of salary, which is the unit brand audits actually benchmark against.
                </p>
                <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
                  It reports worker-charged fees as <em>recorded</em>: zero. That wording is
                  deliberate. The export proves the system holds no fee charged to a worker
                  &mdash; there is no path in the data model from a fee to a candidate &mdash;
                  which is not the same claim as proving no cash moved outside the system. We
                  would rather hand an auditor the narrower true statement.
                </p>
              </article>

              <article className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-heading text-lg font-semibold">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                  Evaluation evidence summary
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  For the periodic evaluation a licensed agency sits: service records, fee
                  transparency, document management and accountability, as counts across your
                  whole book. Aggregates only &mdash; no names, no per-row amounts &mdash;
                  because the evaluation asks how you operate, not who you placed.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Exports are CSV with a UTF-8 byte-order mark and RFC 4180 line endings, so
                  Chinese and Vietnamese names survive being opened in Excel on Windows
                  instead of arriving as mojibake.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ---- corridor-agnostic ---- */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Roles, not countries
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                The platform describes three parties &mdash; the employer who hires, the
                supply side who sources, and the candidate &mdash; and nothing in the data
                model assumes which country each sits in. A corridor is a deployment
                decision, not an assumption baked into the schema.
              </p>
              <p>
                What <em>is</em> jurisdiction-specific follows from where the operator is
                licensed rather than from an assumed route: business tax, the fee conventions
                that quote in months of salary, the residence and work-permit document types.
                Those are deliberately not genericised, because a compliance feature that
                hedges is a compliance feature that fails an audit.
              </p>
            </div>
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-4xl">
              See it against your own desk
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              The fastest way to judge this is to put one real vacancy through it and see
              what the record looks like at the other end.
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
