import { describe, expect, it } from "vitest";
import { csvResponse, datedFilename, toCsv } from "@/lib/csv";

describe("csv — the things that make a file open correctly", () => {
  it("uses CRLF endings, as RFC 4180 and older Excel builds expect", () => {
    const csv = toCsv(["A", "B"], [["1", "2"]]);
    expect(csv).toBe('"A","B"\r\n"1","2"\r\n');
  });

  it("prepends a UTF-8 BOM so Excel does not mangle CJK and Vietnamese names", async () => {
    // Without the BOM, Excel on Windows guesses the local codepage when opening a
    // downloaded file and every name in this product arrives as mojibake.
    const res = csvResponse("x.csv", toCsv(["Name"], [["阮文測試"]]));
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);

    const text = new TextDecoder("utf-8").decode(bytes);
    expect(text).toContain("阮文測試");
  });

  it("round-trips Vietnamese and Chinese without replacement characters", async () => {
    const names = ["Nguyễn Thị Mai（阮氏梅）", "Lê Văn Đức（黎文德）"];
    const res = csvResponse("x.csv", toCsv(["Name"], names.map((n) => [n])));
    const text = await res.text();
    for (const n of names) expect(text).toContain(n);
    expect(text).not.toContain("�");
  });
});

describe("csv — escaping", () => {
  it("escapes embedded quotes by doubling them", () => {
    expect(toCsv(["A"], [['He said "hi"']])).toContain('"He said ""hi"""');
  });

  it("keeps commas and newlines inside a single quoted field", () => {
    const csv = toCsv(["A", "B"], [["Taipei, Taiwan", "line1\nline2"]]);
    expect(csv).toContain('"Taipei, Taiwan"');
    expect(csv).toContain('"line1\nline2"');
    // header + one record: only the record separator is a CRLF
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });

  it("renders null and undefined as empty fields, not the words", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toContain('"",""');
  });

  it("writes dates as ISO timestamps", () => {
    const csv = toCsv(["When"], [[new Date("2026-06-06T02:00:00Z")]]);
    expect(csv).toContain('"2026-06-06T02:00:00.000Z"');
  });
});

describe("csv — formula injection", () => {
  it("defuses every character a spreadsheet treats as a formula start", () => {
    for (const dangerous of ["=cmd|'/c calc'!A1", "+1+1", "-1+1", "@SUM(A1)", "\tx", "\rx"]) {
      const csv = toCsv(["A"], [[dangerous]]);
      // the value survives, but no longer as an expression
      expect(csv).toContain(`"'${dangerous.replace(/"/g, '""')}"`);
    }
  });

  it("does NOT prefix numbers, so a negative fee stays a number", () => {
    // Neutralising -500 into '-500 would turn it into text and break every sum.
    const csv = toCsv(["Fee"], [[-500]]);
    expect(csv).toContain("-500");
    expect(csv).not.toContain("'-500");
  });

  it("leaves ordinary text untouched", () => {
    expect(toCsv(["A"], [["Site Engineer"]])).toContain('"Site Engineer"');
  });
});

describe("csv — response shape", () => {
  it("is served as a download with a dated filename", () => {
    const res = csvResponse(datedFilename("placements"), toCsv(["A"], []));
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(
      /attachment; filename="placements-\d{4}-\d{2}-\d{2}\.csv"/
    );
    // an export is a point-in-time snapshot; a cached copy would silently be stale
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("emits a header-only file rather than nothing when there are no rows", () => {
    expect(toCsv(["Name", "Email"], [])).toBe('"Name","Email"\r\n');
  });
});
