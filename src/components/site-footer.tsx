import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>&copy; 2026 TECXWORK</span>
        <span className="opacity-40">&middot;</span>
        <span>
          Designed and developed by Nikolas Doan 段皇方,{" "}
          <a
            href="https://tecxmate.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            TECXMATE.COM
          </a>
        </span>
        <span className="opacity-40">&middot;</span>
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
        <span>PIPA compliant</span>
      </div>
    </footer>
  );
}
