import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t px-4 pt-2 pb-[calc(5rem+env(safe-area-inset-bottom)+0.25rem)] text-center text-[11px] leading-tight text-muted-foreground md:pb-3 md:pt-3 md:text-xs">
      <div className="mx-auto max-w-xl md:max-w-none">
        <div className="space-y-0.5 md:flex md:flex-wrap md:items-center md:justify-center md:gap-x-2 md:gap-y-1 md:space-y-0">
          <p className="leading-tight">
            &copy; 2026 TECXWORK by{" "}
            <a
              href="https://tecxmate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TECXMATE.COM
            </a>
          </p>
          <span className="hidden opacity-40 md:inline">&middot;</span>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 leading-tight">
            <Link href="/terms-of-service" className="underline hover:text-primary">
              Terms
            </Link>
            <span className="opacity-40">&middot;</span>
            <Link href="/privacy-policy" className="underline hover:text-primary">
              Privacy
            </Link>
            <span className="opacity-40">&middot;</span>
            <Link href="/tutorial" className="underline hover:text-primary">
              Tutorial
            </Link>
            <span className="opacity-40">&middot;</span>
            <Link href="/about" className="underline hover:text-primary">
              About TECXWORK
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
