"use client";

import { useEffect, useRef } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

const BULLET = "• ";

function hasBulletMarkers(value: string) {
  return /(^|\n)\s*[-*•]\s/.test(value);
}

function normalizeForEditor(value: string) {
  if (!value) return value;
  if (hasBulletMarkers(value)) {
    return value
      .split(/\r?\n/)
      .map((line) => {
        const m = line.match(/^(\s*)[-*]\s+(.*)$/);
        return m ? `${m[1]}${BULLET}${m[2]}` : line;
      })
      .join("\n");
  }
  const lines = value.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length <= 1) return value;
  return lines
    .map((l) => (l.trim().length > 0 ? BULLET + l.trim() : l))
    .join("\n");
}

export function BulletTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  ariaLabel,
  toggleLabel = "Bulleted list",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  ariaLabel?: string;
  toggleLabel?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const normalizedRef = useRef(false);

  useEffect(() => {
    if (normalizedRef.current) return;
    if (!value) return;
    normalizedRef.current = true;
    const normalized = normalizeForEditor(value);
    if (normalized !== value) onChange(normalized);
  }, [value, onChange]);

  const setSelection = (start: number, end = start) => {
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(start, end);
    });
  };

  const getLineBounds = (pos: number) => {
    const start = value.lastIndexOf("\n", pos - 1) + 1;
    const nlAfter = value.indexOf("\n", pos);
    const end = nlAfter === -1 ? value.length : nlAfter;
    return { start, end, text: value.slice(start, end) };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const pos = ta.selectionStart;
      if (pos !== ta.selectionEnd) return;
      const { start, end, text } = getLineBounds(pos);
      if (text.startsWith(BULLET)) {
        const after = text.slice(BULLET.length);
        if (after.trim() === "") {
          e.preventDefault();
          const next = value.slice(0, start) + value.slice(end);
          onChange(next);
          setSelection(start);
          return;
        }
        e.preventDefault();
        const insert = "\n" + BULLET;
        const next = value.slice(0, pos) + insert + value.slice(pos);
        onChange(next);
        setSelection(pos + insert.length);
        return;
      }
    }
    if (e.key === "Backspace" && ta.selectionStart === ta.selectionEnd) {
      const pos = ta.selectionStart;
      const { start, text } = getLineBounds(pos);
      if (text.startsWith(BULLET) && pos - start === BULLET.length) {
        e.preventDefault();
        const next = value.slice(0, start) + value.slice(start + BULLET.length);
        onChange(next);
        setSelection(start);
        return;
      }
    }
  };

  const toggleBullets = () => {
    const ta = ref.current;
    if (!ta) return;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const blockStart = value.lastIndexOf("\n", selStart - 1) + 1;
    const nlAfter = value.indexOf("\n", selEnd);
    const blockEnd = nlAfter === -1 ? value.length : nlAfter;
    const block = value.slice(blockStart, blockEnd);
    const lines = block.split("\n");
    const nonEmpty = lines.filter((l) => l.trim() !== "");
    const allBulleted = nonEmpty.length > 0 && nonEmpty.every((l) => l.startsWith(BULLET));
    const next = lines
      .map((l) => {
        if (l.trim() === "") return l;
        if (allBulleted) return l.startsWith(BULLET) ? l.slice(BULLET.length) : l;
        return l.startsWith(BULLET) ? l : BULLET + l;
      })
      .join("\n");
    const updated = value.slice(0, blockStart) + next + value.slice(blockEnd);
    onChange(updated);
    setSelection(blockStart, blockStart + next.length);
  };

  return (
    <div className={cn("rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring", className)}>
      <div className="flex items-center gap-1 border-b border-input/60 px-2 py-1">
        <button
          type="button"
          onClick={toggleBullets}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <List className="h-3.5 w-3.5" />
          <span>{toggleLabel}</span>
        </button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        aria-label={ariaLabel}
        className="block w-full resize-y rounded-b-lg bg-transparent px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
