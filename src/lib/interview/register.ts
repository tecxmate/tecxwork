/**
 * Writing-register drift.
 *
 * The cheapest tell in a text interview is that the prose changes. Answer two
 * is a candidate's own English — short clauses, a preposition out of place, the
 * vocabulary of someone who learned the language at work. Answer nine has
 * "Furthermore", a three-item parallel structure and a summarising clause.
 * Nothing about answer nine is wrong. It is just not the same writer.
 *
 * So: fingerprint the early answers, compare the later ones, and flag distance.
 *
 * The honest limits, which the caller must carry through to the report:
 *  - people warm up, and a nervous first answer is genuinely terser than a
 *    relaxed eighth one;
 *  - a question about a familiar subject pulls better language out of anyone;
 *  - a candidate who drafts in their own language and translates will trip this
 *    on every answer, which is a habit, not a lie.
 * Hence one signal, medium at most, and only on a sustained jump rather than a
 * single answer.
 */

export interface RegisterProfile {
  /** Mean words per sentence. */
  sentenceLen: number;
  /** Share of words with 8+ characters — a proxy for latinate register. */
  longWordRatio: number;
  /** Discourse markers per 100 words. Models reach for these; second-language speakers rarely do. */
  connectorRate: number;
  /** Share of lines that open as a bullet or a numbered item. */
  listiness: number;
  /** Words counted, so a caller can weight a profile by how much text it rests on. */
  words: number;
}

/**
 * Markers a language model produces at a rate that ordinary speech does not.
 * Kept to unambiguous discourse connectives — "also" and "so" are excluded
 * because everyone uses them.
 */
const CONNECTORS = [
  "furthermore",
  "moreover",
  "additionally",
  "consequently",
  "nevertheless",
  "nonetheless",
  "in addition",
  "in conclusion",
  "overall",
  "firstly",
  "secondly",
  "thirdly",
  "importantly",
  "notably",
  "that said",
  "on the other hand",
  "as a result",
  "to summarise",
  "to summarize",
  "in summary",
  "key takeaway",
];

export function profile(text: string): RegisterProfile {
  const clean = text.trim();
  if (!clean) return { sentenceLen: 0, longWordRatio: 0, connectorRate: 0, listiness: 0, words: 0 };

  const words = clean.split(/\s+/).filter(Boolean);
  const sentences = clean.split(/[.!?。！？]+/).map((s) => s.trim()).filter(Boolean);
  const lines = clean.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const lower = ` ${clean.toLowerCase()} `;

  const connectorHits = CONNECTORS.reduce((n, c) => {
    const re = new RegExp(`[^a-z]${c.replace(/ /g, "\\s+")}[^a-z]`, "g");
    return n + (lower.match(re)?.length ?? 0);
  }, 0);

  return {
    sentenceLen: sentences.length ? words.length / sentences.length : words.length,
    longWordRatio: words.length ? words.filter((w) => w.replace(/\W/g, "").length >= 8).length / words.length : 0,
    connectorRate: words.length ? (connectorHits / words.length) * 100 : 0,
    listiness: lines.length ? lines.filter((l) => /^([-*•]|\d+[.)])\s/.test(l)).length / lines.length : 0,
    words: words.length,
  };
}

/** Build one profile from several samples, weighting by length. */
export function baseline(samples: string[]): RegisterProfile {
  const parts = samples.map(profile).filter((p) => p.words > 0);
  const total = parts.reduce((n, p) => n + p.words, 0);
  if (!total) return { sentenceLen: 0, longWordRatio: 0, connectorRate: 0, listiness: 0, words: 0 };
  const w = (pick: (p: RegisterProfile) => number) =>
    parts.reduce((n, p) => n + pick(p) * p.words, 0) / total;
  return {
    sentenceLen: w((p) => p.sentenceLen),
    longWordRatio: w((p) => p.longWordRatio),
    connectorRate: w((p) => p.connectorRate),
    listiness: w((p) => p.listiness),
    words: total,
  };
}

/**
 * 0 = same writer, 1 = as different as this measure goes. Each axis is scaled by
 * the spread that separates plain second-language prose from model prose, then
 * averaged — no axis alone is allowed to carry a verdict.
 */
export function distance(a: RegisterProfile, b: RegisterProfile): number {
  if (a.words < 20 || b.words < 20) return 0; // too little text to say anything
  const axis = (x: number, y: number, scale: number) => Math.min(1, Math.abs(x - y) / scale);
  const parts = [
    axis(a.sentenceLen, b.sentenceLen, 14),
    axis(a.longWordRatio, b.longWordRatio, 0.18),
    axis(a.connectorRate, b.connectorRate, 3.5),
    axis(a.listiness, b.listiness, 0.6),
  ];
  return parts.reduce((n, p) => n + p, 0) / parts.length;
}

/** Distance above which a sustained shift is worth a line in the report. */
export const DRIFT_THRESHOLD = 0.45;
