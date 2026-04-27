"use client";

import { Children, type ReactNode, useState } from "react";
import { Menu } from "lucide-react";

export function AppTopBarActions({
  desktopChildren,
  mobileChildren,
  mobileOverflow,
}: {
  desktopChildren: ReactNode;
  mobileChildren: ReactNode;
  mobileOverflow: boolean;
}) {
  const [open, setOpen] = useState(false);
  const mobileItems = Children.toArray(mobileChildren);

  if (!mobileOverflow) {
    return (
      <>
        <div className="hidden items-center gap-2 whitespace-nowrap sm:gap-3 md:flex">
          {desktopChildren}
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap sm:gap-3 md:hidden">
          {mobileChildren}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden items-center gap-2 whitespace-nowrap sm:gap-3 md:flex">
        {desktopChildren}
      </div>
      <div className="relative md:hidden">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-premium hover:bg-muted hover:text-foreground"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="absolute right-0 top-10 z-50 flex min-w-44 flex-col items-stretch gap-1 rounded-xl border border-border bg-background p-1.5 text-sm shadow-xl"
            >
              {mobileItems.map((item, index) => (
                <div key={index} className="flex w-full flex-col items-stretch gap-1">
                  {item}
                  {index < mobileItems.length - 1 && (
                    <div className="my-0.5 h-px w-full bg-border" />
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
