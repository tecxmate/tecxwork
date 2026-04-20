import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-4 sm:py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 sm:gap-3">
      <p>
        TECXWORK. Designed by Nikolas Doan 段皇方. Developed by{" "}
        <a
          href="https://tecxmate.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
        >
          TECXMATE.COM
        </a>
      </p>
      <div className="flex items-center justify-center gap-3 mt-1 sm:mt-2">
        <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-primary transition-colors">
          Terms of Service
        </Link>
        <span className="opacity-50">&middot;</span>
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-primary transition-colors">
          Privacy Policy
        </Link>
        <span className="opacity-50">&middot;</span>
        <Link href="/tutorial" className="underline underline-offset-2 hover:text-primary transition-colors">
          Tutorial
        </Link>
      </div>
      <p className="mt-1 sm:mt-2">&copy; 2026 TECXWORK &middot; PIPA compliant</p>
    </footer>
  );
}
