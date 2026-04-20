import type { CrawlerConfig, DEFAULT_CONFIG } from "./types";

export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function politeDelay(config: typeof DEFAULT_CONFIG): Promise<void> {
  const delay = randomDelay(config.minDelay, config.maxDelay);
  await sleep(delay);
}

export function isTaiwanOffPeakHours(): boolean {
  const now = new Date();
  const taiwanHour = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Taipei" })
  ).getHours();
  return taiwanHour >= 0 && taiwanHour < 6;
}

export function extractJobId(url: string, source: "104" | "1111"): string | null {
  if (source === "1111") {
    const match = url.match(/\/job\/(\d+)/);
    return match?.[1] ?? null;
  }
  if (source === "104") {
    const match = url.match(/\/job\/([a-zA-Z0-9]+)/);
    return match?.[1] ?? null;
  }
  return null;
}

export function normalizeJobType(
  raw: string | undefined
): "full_time" | "part_time" | "internship" | "contract" | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("全職") || lower.includes("full")) return "full_time";
  if (lower.includes("兼職") || lower.includes("part")) return "part_time";
  if (lower.includes("實習") || lower.includes("intern")) return "internship";
  if (lower.includes("約聘") || lower.includes("contract")) return "contract";
  return undefined;
}

export function isVietnameseRelatedJob(text: string): boolean {
  const vietnameseKeywords = [
    "越南",
    "vietnam",
    "vietnamese",
    "東南亞",
    "southeast asia",
    "外籍",
    "foreign",
    "移工",
    "外勞",
    "外國人",
  ];
  const lowerText = text.toLowerCase();
  return vietnameseKeywords.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

export function sanitizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
