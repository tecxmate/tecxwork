"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  ExternalLink,
  GraduationCap,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CandidateSearchResult } from "@/lib/candidate-search";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    title: "人才搜尋",
    subtitle: "依技能、學校、國籍與證件狀態搜尋候選人",
    placeholder: "搜尋姓名、學校、科系或技能…",
    search: "搜尋",
    clear: "清除",
    results: "位候選人",
    none: "沒有符合條件的候選人。",
    noneHint: "試著放寬條件，或改用單一關鍵字。",
    nationality: "國籍",
    level: "年級",
    skills: "技能",
    docs: "證件狀態",
    docsAny: "不限",
    docsValid: "全部有效",
    docsAttention: "需要處理",
    appliedTo: "已應徵",
    cv: "履歷",
    prev: "上一頁",
    next: "下一頁",
    docValid: "證件有效",
    docExpiring: "即將到期",
    docExpired: "已過期",
    docNone: "無證件紀錄",
  },
  en: {
    title: "Candidate search",
    subtitle: "Search the pool by skill, school, nationality and document status",
    placeholder: "Search name, school, major or skill…",
    search: "Search",
    clear: "Clear",
    results: "candidates",
    none: "No candidates match those filters.",
    noneHint: "Try loosening a filter, or searching for a single keyword.",
    nationality: "Nationality",
    level: "Study level",
    skills: "Skills",
    docs: "Documents",
    docsAny: "Any",
    docsValid: "All valid",
    docsAttention: "Needs attention",
    appliedTo: "Applied to",
    cv: "CV",
    prev: "Previous",
    next: "Next",
    docValid: "Documents valid",
    docExpiring: "Expiring soon",
    docExpired: "Document expired",
    docNone: "No documents on file",
  },
};

const DOC_STYLE: Record<string, { bg: string; key: string }> = {
  valid: { bg: "#059669", key: "docValid" },
  expiring: { bg: "#d97706", key: "docExpiring" },
  expired: { bg: "#dc2626", key: "docExpired" },
};

export function CandidateSearchView({ result }: { result: CandidateSearchResult }) {
  const { locale } = useRecruiterI18n();
  const loc: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[loc];

  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  /**
   * Filters live in the URL, not component state: a search a recruiter wants to keep or send
   * to a colleague ("all BIM candidates with valid documents") is then just a link, and the
   * back button behaves the way people expect.
   */
  const apply = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page"); // any filter change returns to page 1
      startTransition(() => router.push(`/dashboard/candidates?${next.toString()}`));
    },
    [params, router]
  );

  const selectedSkills = (params.get("skills") ?? "").split(",").filter(Boolean);
  const toggleSkill = (s: string) => {
    const next = selectedSkills.includes(s)
      ? selectedSkills.filter((x) => x !== s)
      : [...selectedSkills, s];
    apply({ skills: next.join(",") });
  };

  const activeCount =
    selectedSkills.length +
    (params.get("nationality") ? 1 : 0) +
    (params.get("studyLevel") ? 1 : 0) +
    (params.get("docs") && params.get("docs") !== "any" ? 1 : 0) +
    (params.get("q") ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <section aria-label={t.title}>
      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.search}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t.search}
        </Button>
        {activeCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQ("");
              startTransition(() => router.push("/dashboard/candidates"));
            }}
          >
            <X className="mr-1.5 h-4 w-4" />
            {t.clear}
          </Button>
        ) : null}
      </form>

      <div className="mb-5 space-y-3">
        <FacetRow
          label={t.nationality}
          values={result.facets.nationalities}
          selected={params.get("nationality")}
          onPick={(v) => apply({ nationality: v })}
        />
        <FacetRow
          label={t.level}
          values={result.facets.studyLevels}
          selected={params.get("studyLevel")}
          onPick={(v) => apply({ studyLevel: v })}
        />
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.docs}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(["any", "valid", "attention"] as const).map((v) => {
              const on = (params.get("docs") ?? "any") === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => apply({ docs: v === "any" ? null : v })}
                  className={chipClass(on)}
                >
                  {v === "any" ? t.docsAny : v === "valid" ? t.docsValid : t.docsAttention}
                </button>
              );
            })}
          </div>
        </div>
        <FacetRow
          label={t.skills}
          values={result.facets.skills}
          selected={null}
          multi={selectedSkills}
          onPick={(v) => toggleSkill(v ?? "")}
        />
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{result.total}</span>{" "}
        {t.results}
      </p>

      {result.hits.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-medium text-foreground">{t.none}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.noneHint}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.hits.map((c) => {
            const doc = DOC_STYLE[c.docStatus];
            return (
              <Card key={c.id} className="flex flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.nationality}
                      {c.studyLevel ? ` · ${c.studyLevel}` : ""}
                    </p>
                  </div>
                  {doc ? (
                    <Badge
                      className="shrink-0 gap-1 text-white"
                      style={{ background: doc.bg }}
                      title={t[doc.key]}
                    >
                      {c.docStatus === "valid" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <ShieldAlert className="h-3 w-3" />
                      )}
                      {t[doc.key]}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-xs font-normal">
                      {t.docNone}
                    </Badge>
                  )}
                </div>

                {c.schoolName || c.major ? (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">
                      {c.schoolName}
                      {c.major ? ` · ${c.major}` : ""}
                      {c.expectedGraduation ? ` · ${c.expectedGraduation}` : ""}
                    </span>
                  </p>
                ) : null}

                {c.skills.length ? (
                  <div className="flex flex-wrap gap-1">
                    {c.skills.slice(0, 6).map((s) => (
                      <Badge
                        key={s}
                        variant={selectedSkills.includes(s) ? "default" : "secondary"}
                        className="text-[11px] font-normal"
                      >
                        {s}
                      </Badge>
                    ))}
                    {c.skills.length > 6 ? (
                      <Badge variant="outline" className="text-[11px] font-normal">
                        +{c.skills.length - 6}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}

                {c.appliedTo.length ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t.appliedTo}:</span>{" "}
                    {c.appliedTo.slice(0, 2).join(" · ")}
                    {c.appliedTo.length > 2 ? ` +${c.appliedTo.length - 2}` : ""}
                  </p>
                ) : null}

                <div className="mt-auto pt-1">
                  <a
                    href={c.cvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t.cv}
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
            onClick={() => apply({ page: String(result.page - 1) })}
          >
            {t.prev}
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {result.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={result.page >= totalPages}
            onClick={() => apply({ page: String(result.page + 1) })}
          >
            {t.next}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function chipClass(active: boolean) {
  return [
    "rounded-full border px-2.5 py-1 text-xs transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground font-medium"
      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
  ].join(" ");
}

function FacetRow({
  label,
  values,
  selected,
  multi,
  onPick,
}: {
  label: string;
  values: { value: string; count: number }[];
  selected: string | null;
  multi?: string[];
  onPick: (value: string | null) => void;
}) {
  if (!values.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const on = multi ? multi.includes(v.value) : selected === v.value;
          return (
            <button
              key={v.value}
              type="button"
              // clicking the active single-select chip clears it, which is what people expect
              onClick={() => onPick(on && !multi ? null : v.value)}
              className={chipClass(on)}
              aria-pressed={on}
            >
              {v.value}
              <span className="ml-1 opacity-60 tabular-nums">{v.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
