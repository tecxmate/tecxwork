import { NextResponse } from "next/server";

/**
 * CSV generation for exports.
 *
 * Three things have to be right or the file is worse than useless, and the previous
 * one-off export got two of them wrong:
 *
 *  1. A UTF-8 BOM. Excel on Windows ignores the charset in the HTTP header when opening a
 *     downloaded file and guesses the local codepage — so "阮文測試" arrives as mojibake.
 *     Every candidate name in this product is Vietnamese or Chinese, so this is the
 *     difference between a usable export and an unusable one.
 *  2. Formula neutralisation. A value beginning = + - @ is executed by Excel and Sheets.
 *     Candidate-supplied text ends up in these files, so this is an injection sink.
 *  3. CRLF endings, per RFC 4180 — what older Excel builds expect.
 */

export type CsvValue = string | number | Date | null | undefined;

/**
 * Quote a field, and defuse it if a spreadsheet would treat it as a formula.
 *
 * Only strings are neutralised: prefixing numbers would turn a -500 fee adjustment into
 * the text '-500 and break every sum in the sheet.
 */
function cell(value: CsvValue): string {
  if (value == null) return '""';
  if (value instanceof Date) return `"${value.toISOString()}"`;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : '""';

  const neutralised = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${neutralised.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [
    headers.map((h) => cell(h)).join(","),
    ...rows.map((row) => row.map((v) => cell(v)).join(",")),
  ];
  return lines.join("\r\n") + "\r\n";
}

/**
 * A downloadable CSV response.
 *
 * The BOM is prepended here rather than in toCsv so the string stays clean for tests and
 * for any caller that wants to embed it elsewhere.
 */
export function csvResponse(filename: string, csv: string): NextResponse {
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Exports reflect data as of right now; a cached copy would quietly be stale.
      "Cache-Control": "no-store",
    },
  });
}

/** `interviews-2026-08-09.csv` — sorts chronologically in a downloads folder. */
export function datedFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
