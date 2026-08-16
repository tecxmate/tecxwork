/**
 * How far ahead a document counts as "expiring soon" — one definition, one place.
 *
 * This existed four times as a bare `30` and once, in the compliance export, as a `60`
 * under a comment reading "Matches the dashboard's definition of 'needs attention'". It
 * did not. The dashboard flagged a permit at 30 days and the spreadsheet handed to an
 * inspector flagged it at 60, so the same document was "fine" on one surface and
 * "expiring" on the other, and nothing in either file said which was right.
 *
 * A number that three surfaces must agree on cannot be a literal in three files.
 *
 * Deliberately **not** used by the 評鑑 evidence pack: that reports a count under a row
 * labelled "Expiring within 90 days", which is a stated reporting horizon for an
 * evaluation rather than an operational alert. It carries its own constant, and its label
 * is built from it so the two cannot drift.
 */
export const EXPIRING_SOON_DAYS = 30;

/**
 * Midnight UTC today, and the cutoff `EXPIRING_SOON_DAYS` later.
 *
 * Both are returned together because every caller needs both — `< today` is expired,
 * `<= cutoff` is expiring — and computing them apart is how they drift. Dates are
 * normalised to midnight UTC because `expiry_date` is a bare date: comparing it against a
 * wall-clock `now` makes a document expire at a different moment depending on the hour the
 * page was loaded.
 */
export function complianceWindow(days: number = EXPIRING_SOON_DAYS): {
  today: Date;
  cutoff: Date;
} {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() + days);
  return { today, cutoff };
}
