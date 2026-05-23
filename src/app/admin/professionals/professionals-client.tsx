"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, ShieldCheck, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type AdminProfessional = {
  id: number;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  industry: string;
  linkedinUrl: string | null;
  bio: string;
  graduatedFrom: string | null;
  graduationYear: number | null;
  isVerified: boolean;
  referralCount: number;
  createdAt: string;
};

export function AdminProfessionalsClient({
  initialProfessionals,
}: {
  initialProfessionals: AdminProfessional[];
}) {
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const verified = professionals.filter((professional) => professional.isVerified).length;
    return {
      total: professionals.length,
      pending: professionals.length - verified,
      verified,
    };
  }, [professionals]);

  const sortedProfessionals = useMemo(
    () =>
      [...professionals].sort((a, b) => {
        if (a.isVerified !== b.isVerified) return a.isVerified ? 1 : -1;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }),
    [professionals]
  );

  async function setVerified(professional: AdminProfessional, isVerified: boolean) {
    setError("");
    setSavingId(professional.id);
    setProfessionals((current) =>
      current.map((item) =>
        item.id === professional.id ? { ...item, isVerified } : item
      )
    );

    const response = await fetch("/api/admin/professionals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: professional.id, isVerified }),
    });

    if (!response.ok) {
      setProfessionals((current) =>
        current.map((item) =>
          item.id === professional.id
            ? { ...item, isVerified: professional.isVerified }
            : item
        )
      );
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not update professional verification.");
      setSavingId(null);
      return;
    }

    const body = await response.json();
    setProfessionals((current) =>
      current.map((item) =>
        item.id === professional.id
          ? {
              ...body.professional,
              createdAt: new Date(body.professional.createdAt).toISOString(),
            }
          : item
      )
    );
    setSavingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Professionals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify alumni and senior professionals before students can request referrals.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border bg-card px-3 py-2">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2">
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2">
            <p className="text-lg font-bold">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3">
        {sortedProfessionals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No professional profiles yet.
            </CardContent>
          </Card>
        ) : (
          sortedProfessionals.map((professional) => (
            <Card key={professional.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-heading text-lg font-semibold">
                        {professional.name}
                      </h2>
                      {professional.isVerified ? (
                        <Badge className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        {professional.referralCount}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Email</p>
                        <p className="truncate">{professional.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Role</p>
                        <p className="truncate">{professional.jobTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Company</p>
                        <p className="truncate">{professional.company}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Industry</p>
                        <p className="truncate">{professional.industry}</p>
                      </div>
                    </div>

                    {(professional.graduatedFrom || professional.bio) && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {professional.graduatedFrom ? (
                          <p>
                            {professional.graduatedFrom}
                            {professional.graduationYear
                              ? `, ${professional.graduationYear}`
                              : ""}
                          </p>
                        ) : null}
                        {professional.bio ? (
                          <p className="line-clamp-2">{professional.bio}</p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 lg:flex-col lg:items-end">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Verified</span>
                      <Switch
                        checked={professional.isVerified}
                        disabled={savingId === professional.id}
                        onCheckedChange={(checked) => setVerified(professional, checked)}
                      />
                    </label>
                    {professional.linkedinUrl ? (
                      <a
                        href={professional.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        LinkedIn
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
