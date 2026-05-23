const FLAGGED_TERMS = [
  "vietnamese only",
  "no indonesian",
  "no filipino",
  "male only",
  "female only",
] as const;

export function findFlaggedJobLanguage(parts: Array<string | null | undefined>) {
  const normalized = parts
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return FLAGGED_TERMS.find((term) => normalized.includes(term)) ?? null;
}
