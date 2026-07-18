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
import {
  PIPELINE_STAGES,
  type PipelineBoard as Board,
  type PipelineCard,
  type PipelineStage,
} from "@/lib/pipeline-types";

type Locale = "zh" | "en" | "vi";

const T: Record<Locale, Record<string, string>> = {
  zh: { title: "招募看板", subtitle: "ATS 人才招募流程", job: "職缺", client: "客戶企業", group: "集團", position: "應徵職位", cv: "查看履歷", skills: "技能", cand: "位候選人", drag: "拖曳卡片以變更階段", close: "關閉", profile: "候選人資料", company: "媒合企業", school: "學校", major: "科系", nat: "國籍", ai: "AI 評分" },
  en: { title: "Talent Pipeline", subtitle: "ATS hiring board", job: "Job", client: "Client", group: "Group", position: "Applied for", cv: "View CV", skills: "Skills", cand: "candidates", drag: "Drag a card to change stage", close: "Close", profile: "Candidate profile", company: "Placement", school: "School", major: "Major", nat: "Nationality", ai: "AI score" },
  vi: { title: "Quy trình tuyển dụng", subtitle: "Bảng tuyển dụng ATS", job: "Vị trí", client: "Khách hàng", group: "Tập đoàn", position: "Ứng tuyển", cv: "Xem hồ sơ", skills: "Kỹ năng", cand: "ứng viên", drag: "Kéo thẻ để đổi giai đoạn", close: "Đóng", profile: "Hồ sơ ứng viên", company: "Doanh nghiệp", school: "Trường", major: "Ngành", nat: "Quốc tịch", ai: "Điểm AI" },
};

const STAGE_LABEL: Record<PipelineStage, Record<Locale, string>> = {
  applied: { zh: "收到履歷", en: "Applied", vi: "Đã nộp" },
  screening: { zh: "初步篩選", en: "Screening", vi: "Sàng lọc" },
  interview: { zh: "安排面試", en: "Interview", vi: "Phỏng vấn" },
  offer: { zh: "發送錄取", en: "Offer", vi: "Mời nhận việc" },
  hired: { zh: "到職", en: "Hired", vi: "Đã nhận việc" },
};

// Semantic stage colours (kept distinct from the app accent on purpose).
const STAGE_ACCENT: Record<PipelineStage, string> = {
  applied: "#64748b",
  screening: "#2563eb",
  interview: "#d97706",
  offer: "#7c3aed",
  hired: "#059669",
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
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onClick={() => onOpen(card)}
      className={`group cursor-grab touch-none rounded-xl border border-border bg-card p-3 shadow-sm transition active:cursor-grabbing hover:border-primary/50 hover:shadow-md ${
        isDragging || dragging ? "opacity-40" : ""
      }`}
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
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ background: aiColor(card.aiScore) }}
            title="AI CV screening (demo)"
          >
            AI {card.aiScore}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{flag(a.nationality)}</span>
        <span className="truncate">{a.studyLevel}</span>
      </div>
      {a.skills.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {a.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      ) : null}
    </div>
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
  stage: PipelineStage;
  locale: Locale;
  cards: PipelineCard[];
  onOpen: (c: PipelineCard) => void;
  activeId: number | null;
  enabled: boolean;
  positionById: Map<number, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const accent = STAGE_ACCENT[stage];
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-muted/40">
      <div
        className="flex items-center justify-between rounded-t-2xl px-3 py-2.5"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <span className="text-sm font-bold" style={{ color: accent }}>
          {STAGE_LABEL[stage][locale]}
        </span>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow-sm">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-b-2xl p-2 transition-colors ${
          isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/40" : ""
        }`}
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

/**
 * Core board: job selector + 5 kanban columns + drag-drop + candidate drawer.
 * Presentational — takes the resolved `locale`; wrappers supply it (dashboard
 * follows the recruiter language, standalone uses its own toggle).
 */
function PipelineBoardBody({
  board,
  locale,
}: {
  board: Board;
  locale: Locale;
}) {
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

  // Group jobs by the client company Yang Luck places for; live candidate count.
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

  // Default to the company with the most candidates (stable across drags).
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
    const newStage = over.id as PipelineStage;
    const current = cards.find((c) => c.id === cardId);
    if (!current || current.stage === newStage) return;
    const prevStage = current.stage;
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, stage: newStage } : c)));
    fetch(`/api/applications/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("persist failed");
      })
      .catch(() => {
        setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, stage: prevStage } : c)));
      });
  }

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
            <button
              key={c.name}
              type="button"
              onClick={() => setCompanyName(c.name)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {c.kind === "subsidiary" ? (
                <span className={`rounded px-1 text-[9px] font-bold ${active ? "bg-white/25" : "bg-primary/15 text-primary"}`}>
                  {t.group}
                </span>
              ) : null}
              {zh}
              <span className={active ? "text-primary-foreground/70" : "text-muted-foreground/60"}>
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {selectedCompany?.name} · {jobCards.length} {t.cand} · {t.drag}
      </p>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              locale={locale}
              cards={jobCards.filter((c) => c.stage === stage)}
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
          companyLabel={jobById.get(selected.jobOpeningId)?.clientCompany ?? ""}
          positionLabel={positionById.get(selected.jobOpeningId) ?? ""}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

/**
 * In-app tab: seamless with the recruiter dashboard. Follows the recruiter's
 * language (en / 繁中) via the app i18n — no separate header or toggle.
 */
export function DashboardPipeline({ board }: { board: Board }) {
  const { locale } = useRecruiterI18n();
  const boardLocale: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[boardLocale];
  return (
    <section aria-label={t.title}>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>
      <PipelineBoardBody board={board} locale={boardLocale} />
    </section>
  );
}

/**
 * Standalone demo surface (`/pipeline`) — has its own trilingual toggle so the
 * pitch link is clickable without logging in.
 */
export function PipelineBoard({ board }: { board: Board }) {
  const [locale, setLocale] = useState<Locale>("zh");
  const t = T[locale];
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl">{t.title}</h1>
            <p className="text-xs text-muted-foreground">
              {board.recruiter.company} · {t.subtitle}
            </p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["zh", "en", "vi"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`px-2.5 py-1 text-xs font-semibold transition ${
                  locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l === "zh" ? "繁中" : l === "en" ? "EN" : "VI"}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
        <PipelineBoardBody board={board} locale={locale} />
      </div>
    </div>
  );
}

function CandidateDrawer({
  card,
  locale,
  companyLabel,
  positionLabel,
  onClose,
}: {
  card: PipelineCard;
  locale: Locale;
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
            <h2 className="text-lg font-bold">{a.name}</h2>
            <p className="text-sm opacity-90">
              {flag(a.nationality)} {a.nationality} · {STAGE_LABEL[card.stage][locale]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/15 px-2.5 py-1 text-sm hover:bg-white/25"
          >
            {t.close}
          </button>
        </div>
        <div className="flex-1 space-y-4 px-5 py-5">
          {companyLabel ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                {t.company}
              </p>
              <p className="text-sm font-semibold text-foreground">{companyLabel}</p>
              {positionLabel ? (
                <p className="text-xs text-muted-foreground">{t.position}: {positionLabel}</p>
              ) : null}
            </div>
          ) : null}
          {card.aiScore != null ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
              <span
                className="rounded-lg px-2 py-1 text-sm font-bold text-white"
                style={{ background: aiColor(card.aiScore) }}
              >
                AI {card.aiScore}
              </span>
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
                  <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <a
            href={a.cvLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t.cv} →
          </a>
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
