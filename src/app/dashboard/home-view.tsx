"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * The workspace landing page.
 *
 * A newly provisioned tenant previously opened onto an empty interviews table with no
 * indication of what to do — the product was reachable but not enterable. This shows the
 * setup path while it matters and gets out of the way once it doesn't.
 */

export type HomeData = {
  workspaceName: string;
  steps: {
    id: string;
    title: string;
    detail: string;
    href: string;
    done: boolean;
  }[];
  applicable: number;
  completed: number;
  complete: boolean;
  seats: { limit: number; used: number };
  planName: string;
  trial: { daysLeft: number; expired: boolean } | null;
  complianceAttention: number;
};

export function HomeView({ data }: { data: HomeData }) {
  const pct = data.applicable === 0 ? 100 : Math.round((data.completed / data.applicable) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{data.workspaceName}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{data.planName} plan</span>
          <span aria-hidden>·</span>
          <span>
            {data.seats.used} of {data.seats.limit} seats
          </span>
          {data.trial ? (
            <>
              <span aria-hidden>·</span>
              <span className={data.trial.expired ? "font-medium text-destructive" : ""}>
                {data.trial.expired
                  ? "Trial ended"
                  : `Trial ends in ${data.trial.daysLeft} day${data.trial.daysLeft === 1 ? "" : "s"}`}
              </span>
            </>
          ) : null}
        </p>
      </div>

      {data.trial?.expired ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm">
            <strong>This trial has ended.</strong> Your data is untouched and one upgrade
            restores access — nothing has been deleted. Contact your account manager to
            continue.
          </p>
        </Card>
      ) : null}

      {/* The checklist retires itself: once every applicable step is done it stops being
          the first thing an established workspace sees every morning. */}
      {!data.complete ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Finish setting up</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.completed} of {data.applicable} done
              </p>
            </div>
            <Badge>{pct}%</Badge>
          </div>

          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="mt-4 space-y-1">
            {data.steps.map((step) => (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      step.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {step.done ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-medium ${
                        step.done ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{step.detail}</span>
                  </span>
                  {!step.done ? (
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {data.complianceAttention > 0 ? (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium">
                  {data.complianceAttention} document
                  {data.complianceAttention === 1 ? "" : "s"} need attention
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Expired or inside the next 60 days.
                </p>
                <Link
                  href="/dashboard/compliance"
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                >
                  Open compliance
                </Link>
              </div>
            </div>
          </Card>
        ) : null}

        {data.seats.used >= data.seats.limit ? (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Every seat is taken</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Remove a member or a pending invitation to free one, or ask your account
                  manager to raise the limit.
                </p>
                <Link
                  href="/dashboard/team"
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                >
                  Manage team
                </Link>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
