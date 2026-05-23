"use client";

import { Children, type ReactNode, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.body.setAttribute("data-topbar-menu-open", "true");
    } else {
      document.body.removeAttribute("data-topbar-menu-open");
    }
    return () => {
      document.body.removeAttribute("data-topbar-menu-open");
    };
  }, [open]);

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
    <div className="relative">
      <button
        type="button"
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-premium ${
          open
            ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <X className="h-4 w-4 animate-fade-in-scale" />
        ) : (
          <Menu className="h-4 w-4 animate-fade-in-scale" />
        )}
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
            className="absolute right-0 top-11 z-50 flex w-[280px] flex-col items-stretch gap-1 rounded-xl border border-border bg-background/80 p-1.5 text-sm shadow-2xl backdrop-blur-xl animate-fade-in-scale stagger-fade-in sm:w-80"
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
  );
}
