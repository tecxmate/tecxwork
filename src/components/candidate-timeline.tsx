"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Locale = "zh" | "en";

type ActivityItem = {
  id: number;
  type: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};
type Rating = { attribute: string; rating: number };
type ScorecardItem = {
  id: number;
  interviewerName: string | null;
  recommendation: string;
  ratings: Rating[] | null;
  comment: string;
  createdAt: string;
};

const T: Record<Locale, Record<string, string>> = {
  zh: {
    scorecards: "面試評分",
    addScorecard: "新增評分",
    activity: "註記與動態",
    notePlaceholder: "新增註記…",
    add: "新增",
    submit: "送出評分",
    cancel: "取消",
    recommendation: "推薦程度",
    comment: "評語",
    empty: "尚無評分",
    noActivity: "尚無動態",
    stageMoved: "階段變更",
  },
  en: {
    scorecards: "Scorecards",
    addScorecard: "Add scorecard",
    activity: "Notes & activity",
    notePlaceholder: "Add a note…",
    add: "Add",
    submit: "Submit scorecard",
    cancel: "Cancel",
    recommendation: "Recommendation",
    comment: "Comment",
    empty: "No scorecards yet",
    noActivity: "No activity yet",
    stageMoved: "Stage change",
  },
};

const REC_META: Record<string, { bg: string; label: Record<Locale, string> }> = {
  strong_yes: { bg: "#059669", label: { zh: "強力推薦", en: "Strong yes" } },
  yes: { bg: "#16a34a", label: { zh: "推薦", en: "Yes" } },
  no: { bg: "#d97706", label: { zh: "不推薦", en: "No" } },
  strong_no: { bg: "#dc2626", label: { zh: "強力反對", en: "Strong no" } },
};
const REC_ORDER = ["strong_yes", "yes", "no", "strong_no"];
const ATTRS = ["Technical", "Communication", "Chinese"];

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

export function CandidateTimeline({
  applicationId,
  locale,
}: {
  applicationId: number;
  locale: Locale;
}) {
  const t = T[locale];
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [cards, setCards] = useState<ScorecardItem[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rec, setRec] = useState<string>("yes");
  const [ratings, setRatings] = useState<Record<string, number>>({
    Technical: 3,
    Communication: 3,
    Chinese: 3,
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/applications/${applicationId}/timeline`)
      .then((r) => (r.ok ? r.json() : { activity: [], scorecards: [] }))
      .then((d) => {
        if (!alive) return;
        setActivity(d.activity ?? []);
        setCards(d.scorecards ?? []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [applicationId]);

  async function addNote() {
    const body = note.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/applications/${applicationId}/timeline`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (r.ok) {
        const { note: created } = await r.json();
        setActivity((a) => [...a, created]);
        setNote("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitScorecard() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/applications/${applicationId}/scorecard`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recommendation: rec,
          comment,
          ratings: ATTRS.map((a) => ({ attribute: a, rating: ratings[a] })),
        }),
      });
      if (r.ok) {
        const { scorecard } = await r.json();
        setCards((c) => [...c, scorecard]);
        setShowForm(false);
        setComment("");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Scorecards */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.scorecards}
          </p>
          {!showForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              {t.addScorecard}
            </Button>
          ) : null}
        </div>

        {showForm ? (
          <div className="mb-3 space-y-3 rounded-xl border border-border bg-muted/30 p-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{t.recommendation}</p>
              <div className="flex flex-wrap gap-1.5">
                {REC_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setRec(k)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-white transition-opacity"
                    style={{ background: REC_META[k].bg, opacity: rec === k ? 1 : 0.4 }}
                  >
                    {REC_META[k].label[locale]}
                  </button>
                ))}
              </div>
            </div>
            {ATTRS.map((a) => (
              <div key={a} className="flex items-center justify-between">
                <span className="text-xs">{a}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRatings((r) => ({ ...r, [a]: i }))}
                      aria-label={`${a} ${i}`}
                    >
                      <Star
                        className={`h-4 w-4 ${i <= ratings[a] ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.comment}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitScorecard} disabled={busy}>
                {t.submit}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                {t.cancel}
              </Button>
            </div>
          </div>
        ) : null}

        {cards.length ? (
          <div className="space-y-2">
            {cards.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/60 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {c.interviewerName}
                  </span>
                  <Badge className="text-white" style={{ background: REC_META[c.recommendation]?.bg }}>
                    {REC_META[c.recommendation]?.label[locale] ?? c.recommendation}
                  </Badge>
                </div>
                {Array.isArray(c.ratings) ? (
                  <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1">
                    {c.ratings.map((r) => (
                      <span key={r.attribute} className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">{r.attribute}</span>
                        <Stars n={r.rating} />
                      </span>
                    ))}
                  </div>
                ) : null}
                {c.comment ? <p className="text-sm text-foreground">{c.comment}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        )}
      </div>

      {/* Notes & activity */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.activity}
        </p>
        <div className="mb-2 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder={t.notePlaceholder}
            className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm"
          />
          <Button size="sm" onClick={addNote} disabled={busy || !note.trim()}>
            <MessageSquarePlus className="h-4 w-4" />
            {t.add}
          </Button>
        </div>
        {activity.length ? (
          <ul className="space-y-2">
            {activity
              .slice()
              .reverse()
              .map((a) => (
                <li key={a.id} className="flex gap-2 text-sm">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: a.type === "stage_change" ? "#7c3aed" : "#64748b" }}
                  />
                  <div className="min-w-0">
                    <p className="text-foreground">
                      {a.type === "stage_change" ? (
                        <span className="text-primary">{t.stageMoved} {a.body}</span>
                      ) : (
                        a.body
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.authorName} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t.noActivity}</p>
        )}
      </div>
    </div>
  );
}
