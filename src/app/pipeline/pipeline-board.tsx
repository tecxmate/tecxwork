"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CandidateTimeline } from "@/components/candidate-timeline";
import { cn } from "@/lib/utils";
import {
  type PipelineBoard as Board,
  type PipelineCard,
  type PipelineStageDef,
  type StageKind,
} from "@/lib/pipeline-types";

// Recruiter dashboard is bilingual (繁中 / English) — the board follows it.
type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: { title: "招募看板", subtitle: "ATS 人才招募流程", client: "客戶企業", group: "集團", position: "應徵職位", cv: "查看履歷", skills: "技能", cand: "位候選人", drag: "拖曳卡片以變更階段", close: "關閉", profile: "候選人資料", company: "媒合企業", school: "學校", major: "科系", nat: "國籍", ai: "AI 評分" },
  en: { title: "Talent Pipeline", subtitle: "ATS hiring board", client: "Client", group: "Group", position: "Applied for", cv: "View CV", skills: "Skills", cand: "candidates", drag: "Drag a card to change stage", close: "Close", profile: "Candidate profile", company: "Placement", school: "School", major: "Major", nat: "Nationality", ai: "AI score" },
};

// Bilingual labels + colours keyed by the stable stage_kind, so configurable
// per-org stage names still render bilingually and consistently coloured.
const STAGE_KIND_LABEL: Record<StageKind, Record<Locale, string>> = {
  sourced: { zh: "收到履歷", en: "Applied" },
  screened: { zh: "初步篩選", en: "Screening" },
  internal_submit: { zh: "內部推薦", en: "Internal submit" },
  client_submit: { zh: "推薦客戶", en: "Submitted to client" },
  interview: { zh: "安排面試", en: "Interview" },
  offer: { zh: "發送錄取", en: "Offer" },
  placed: { zh: "到職", en: "Hired" },
  onboarding: { zh: "報到準備", en: "Onboarding" },
  started: { zh: "已上工", en: "Started" },
  rejected: { zh: "未錄取", en: "Rejected" },
};

const STAGE_KIND_ACCENT: Record<StageKind, string> = {
  sourced: "#64748b",
  screened: "#2563eb",
  internal_submit: "#0ea5e9",
  client_submit: "#6366f1",
  interview: "#d97706",
  offer: "#7c3aed",
  placed: "#059669",
  onboarding: "#0d9488",
  started: "#16a34a",
  rejected: "#dc2626",
};

function flag(nat: string): string {
  if (nat.includes("越南") || nat.toLowerCase().includes("viet")) return "🇻🇳";
  if (nat.includes("印尼") || nat.toLowerCase().includes("indo")) return "🇮🇩";
  if (nat.includes("菲") || nat.toLowerCase().includes("phil")) return "🇵🇭";
  return "🌏";
}

function aiColor(score: number): string {
  if (score >= 85) return "#059669";
  if (score >= 75) return "#d97706";
  return "#94a3b8";
}

function CandidateCard({
  card,
  onOpen,
  dragging,
  enabled = true,
  position,
}: {
  card: PipelineCard;
  onOpen: (c: PipelineCard) => void;
  dragging?: boolean;
  enabled?: boolean;
  position?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const a = card.applicant;
  const dragProps = enabled ? { ...listeners, ...attributes } : {};
  return (
    <Card
      size="sm"
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onClick={() => onOpen(card)}
      className={cn(
        "cursor-grab touch-none gap-2 p-3 shadow-sm hover:border-primary/50 active:cursor-grabbing",
        (isDragging || dragging) && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {a.schoolName} · {a.major}
          </p>
          {position ? (
            <p className="mt-0.5 truncate text-[11px] text-primary/80">→ {position}</p>
          ) : null}
        </div>
        {card.aiScore != null ? (
          <Badge
            className="shrink-0 text-white"
            style={{ background: aiColor(card.aiScore) }}
            title="AI CV screening (demo)"
          >
            AI {card.aiScore}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{flag(a.nationality)}</span>
        <span className="truncate">{a.studyLevel}</span>
      </div>
      {a.skills.length ? (
        <div className="flex flex-wrap gap-1">
          {a.skills.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="h-4 px-1.5 text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function Column({
  stage,
  locale,
  cards,
  onOpen,
  activeId,
  enabled,
  positionById,
}: {
  stage: PipelineStageDef;
  locale: Locale;
  cards: PipelineCard[];
  onOpen: (c: PipelineCard) => void;
  activeId: number | null;
  enabled: boolean;
  positionById: Map<number, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const accent = STAGE_KIND_ACCENT[stage.stageKind];
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-muted/40">
      <div
        className="flex items-center justify-between rounded-t-2xl px-3 py-2.5"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <span className="text-sm font-bold" style={{ color: accent }}>
          {STAGE_KIND_LABEL[stage.stageKind][locale]}
        </span>
        <Badge variant="secondary" className="bg-card shadow-sm">
          {cards.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-b-2xl p-2 transition-colors",
          isOver && "bg-primary/10 ring-2 ring-inset ring-primary/40"
        )}
      >
        {cards.map((c) => (
          <CandidateCard
            key={c.id}
            card={c}
            onOpen={onOpen}
            dragging={activeId === c.id}
            enabled={enabled}
            position={positionById.get(c.jobOpeningId)}
          />
        ))}
      </div>
    </div>
  );
}

function PipelineBoardBody({ board, locale }: { board: Board; locale: Locale }) {
  const [cards, setCards] = useState<PipelineCard[]>(board.cards);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selected, setSelected] = useState<PipelineCard | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const t = T[locale];

  const jobById = useMemo(() => new Map(board.jobs.map((j) => [j.id, j])), [board.jobs]);
  const positionById = useMemo(
    () => new Map(board.jobs.map((j) => [j.id, j.title])),
    [board.jobs]
  );

  const companies = useMemo(() => {
    const m = new Map<string, { name: string; kind: string; jobIds: number[] }>();
    for (const j of board.jobs) {
      const key = j.clientCompany || j.title;
      if (!m.has(key)) m.set(key, { name: key, kind: j.clientKind, jobIds: [] });
      m.get(key)!.jobIds.push(j.id);
    }
    return [...m.values()]
      .map((c) => ({ ...c, count: cards.filter((x) => c.jobIds.includes(x.jobOpeningId)).length }))
      .sort((a, b) => b.count - a.count);
  }, [board.jobs, cards]);

  const [companyName, setCompanyName] = useState<string>(() => {
    const counts = new Map<string, number>();
    for (const c of board.cards) {
      const j = board.jobs.find((x) => x.id === c.jobOpeningId);
      const k = j?.clientCompany || j?.title || "—";
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    let best = board.jobs[0]?.clientCompany || board.jobs[0]?.title || "—";
    let bestN = -1;
    for (const [k, v] of counts) if (v > bestN) { best = k; bestN = v; }
    return best;
  });

  const selectedCompany = companies.find((c) => c.name === companyName) ?? companies[0];
  const jobCards = useMemo(
    () => (selectedCompany ? cards.filter((c) => selectedCompany.jobIds.includes(c.jobOpeningId)) : []),
    [cards, selectedCompany]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeCard = activeId ? cards.find((c) => c.id === activeId) ?? null : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const cardId = Number(active.id);
    const newStageId = Number(over.id);
    const current = cards.find((c) => c.id === cardId);
    if (!current || current.stageId === newStageId) return;
    const prevStageId = current.stageId;
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, stageId: newStageId } : c)));
    fetch(`/api/applications/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: newStageId }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("persist failed");
      })
      .catch(() => {
        setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, stageId: prevStageId } : c)));
      });
  }

  const selectedStage = selected
    ? board.stages.find((s) => s.id === selected.stageId)
    : null;
  const selectedStageLabel = selectedStage
    ? STAGE_KIND_LABEL[selectedStage.stageKind][locale]
    : "";

  return (
    <div>
      {/* Client-company selector */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.client}
        </span>
        <span className="text-xs text-muted-foreground/60">{companies.length}</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {companies.map((c) => {
          const active = c.name === selectedCompany?.name;
          const zh = c.name.split(" ")[0];
          return (
            <Button
              key={c.name}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setCompanyName(c.name)}
              className="rounded-full"
            >
              {c.kind === "subsidiary" ? (
                <Badge
                  variant={active ? "secondary" : "outline"}
                  className={cn("h-4 px-1 text-[9px]", active ? "" : "text-primary")}
                >
                  {t.group}
                </Badge>
              ) : null}
              {zh}
              <span className={active ? "text-primary-foreground/70" : "text-muted-foreground/60"}>
                {c.count}
              </span>
            </Button>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {selectedCompany?.name} · {jobCards.length} {t.cand} · {t.drag}
      </p>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {board.stages.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              locale={locale}
              cards={jobCards.filter((c) => c.stageId === stage.id)}
              onOpen={setSelected}
              activeId={activeId}
              enabled={mounted}
              positionById={positionById}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <CandidateCard card={activeCard} onOpen={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {selected ? (
        <CandidateDrawer
          card={selected}
          locale={locale}
          stageLabel={selectedStageLabel}
          companyLabel={jobById.get(selected.jobOpeningId)?.clientCompany ?? ""}
          positionLabel={positionById.get(selected.jobOpeningId) ?? ""}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

/**
 * The pipeline surface, shared by the recruiter dashboard tab and the /pipeline
 * page. Follows the recruiter dashboard's language (繁中 / English) via the app
 * i18n — the language switcher and top bar come from the surrounding shell.
 */
export function DashboardPipeline({ board }: { board: Board }) {
  const { locale } = useRecruiterI18n();
  const boardLocale: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[boardLocale];
  return (
    <section aria-label={t.title}>
      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>
      <PipelineBoardBody board={board} locale={boardLocale} />
    </section>
  );
}

function CandidateDrawer({
  card,
  locale,
  stageLabel,
  companyLabel,
  positionLabel,
  onClose,
}: {
  card: PipelineCard;
  locale: Locale;
  stageLabel: string;
  companyLabel: string;
  positionLabel: string;
  onClose: () => void;
}) {
  const t = T[locale];
  const a = card.applicant;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between bg-primary px-5 py-4 text-primary-foreground">
          <div>
            <p className="text-[11px] uppercase tracking-wide opacity-70">{t.profile}</p>
            <h2 className="font-heading text-lg font-bold">{a.name}</h2>
            <p className="text-sm opacity-90">
              {flag(a.nationality)} {a.nationality} · {stageLabel}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="bg-white/15 text-primary-foreground hover:bg-white/25"
          >
            {t.close}
          </Button>
        </div>
        <div className="flex-1 space-y-4 px-5 py-5">
          {companyLabel ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                {t.company}
              </p>
              <p className="text-sm font-semibold text-foreground">{companyLabel}</p>
              {positionLabel ? (
                <p className="text-xs text-muted-foreground">
                  {t.position}: {positionLabel}
                </p>
              ) : null}
            </div>
          ) : null}
          {card.aiScore != null ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
              <Badge className="text-white" style={{ background: aiColor(card.aiScore) }}>
                AI {card.aiScore}
              </Badge>
              <span className="text-xs text-muted-foreground">{t.ai} (demo)</span>
            </div>
          ) : null}
          <Row label={t.school} value={`${a.schoolName}${a.schoolNameEn ? ` (${a.schoolNameEn})` : ""}`} />
          <Row label={t.major} value={`${a.major} · ${a.studyLevel}`} />
          <Row label={t.nat} value={a.nationality} />
          {a.description ? <Row label="" value={a.description} /> : null}
          {a.skills.length ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.skills}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {a.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          <Button render={<a href={a.cvLink} target="_blank" rel="noopener noreferrer" />}>
            {t.cv} →
          </Button>
          <div className="border-t border-border/60 pt-4">
            <CandidateTimeline applicationId={card.id} locale={locale} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      ) : null}
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
