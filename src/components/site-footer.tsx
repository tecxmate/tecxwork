import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
      <p>
        Designed by Nikolas Doan. Developed by{" "}
        <a
          href="https://tecxmate.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
        >
          TECXMATE.COM
        </a>
      </p>
      <div className="flex items-center justify-center gap-3 mt-2">
        <Link href="/terms-of-service" className="hover:text-primary hover:underline transition-colors">
          Terms of Service
        </Link>
        <span className="opacity-50">&middot;</span>
        <Link href="/privacy-policy" className="hover:text-primary hover:underline transition-colors">
          Privacy Policy
        </Link>
      </div>
      <p className="mt-2">&copy; 2026 V-GEN TRIDENT &middot; PIPA compliant</p>
    </footer>
  );
}
