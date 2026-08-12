import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The logo + wordmark lockup.
 *
 * One component so the header, the splash screens and the loading skeletons cannot
 * drift apart — they had each hardcoded their own copy of the markup, which is why
 * changing the brand previously meant editing five files and missing two.
 */
export function BrandMark({
  size = "sm",
  className,
  hideWordmark = false,
}: {
  size?: "sm" | "lg";
  className?: string;
  /** Logo only. For a collapsed rail, where the wordmark has no room. */
  hideWordmark?: boolean;
}) {
  const lg = size === "lg";
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src={BRAND.logoSrc}
        alt={BRAND.alt}
        className={cn(
          lg ? "h-12 w-12" : "h-8 w-8",
          "rounded-md object-contain",
          BRAND.logoNeedsPlate && "bg-white p-1 ring-1 ring-black/5"
        )}
      />
      {hideWordmark ? null : (
        <span className="flex items-baseline gap-1.5 text-primary">
          <span className={cn("font-wordmark italic", lg ? "text-3xl" : "text-xl")}>
            {BRAND.wordmark}
          </span>
          {BRAND.wordmarkCjk ? (
            <span className={cn("font-heading font-semibold", lg ? "text-3xl" : "text-xl")}>
              {BRAND.wordmarkCjk}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
