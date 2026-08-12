/**
 * Which brand this deployment wears.
 *
 * Both work.tecxmate.com and the Yang Luck demo deploy this same repository, so the
 * brand cannot be hardcoded — it was, and that is how a client's name ended up on the
 * public site the moment `main` moved to this codebase.
 *
 * The default is deliberately TECXWORK, our own brand: an unconfigured deployment must
 * never expose a client. Showing a client's brand is opt-in, per deployment, via
 * `NEXT_PUBLIC_BRAND`. Getting that env var wrong shows our brand — never theirs.
 *
 * Public (NEXT_PUBLIC_) because the header, splash and footer are client components.
 */
export type BrandKey = "tecxwork" | "yang-luck";

export type Brand = {
  key: BrandKey;
  /** Logo in /public. */
  logoSrc: string;
  /** Alt text, and the accessible name of the header link. */
  alt: string;
  /** Latin wordmark, set in the italic wordmark face. */
  wordmark: string;
  /** Optional CJK wordmark shown beside it, in the heading face. */
  wordmarkCjk?: string;
  /** Name used in prose: page titles, the footer copyright line. */
  displayName: string;
  /** Rounded-square logo treatment — our icon is already a rounded tile, a client
   *  logo usually is not and needs a white plate to sit on. */
  logoNeedsPlate: boolean;
};

const BRANDS: Record<BrandKey, Brand> = {
  tecxwork: {
    key: "tecxwork",
    logoSrc: "/icon.svg",
    alt: "TECXWORK",
    wordmark: "tecxwork",
    displayName: "TECXWORK",
    logoNeedsPlate: false,
  },
  "yang-luck": {
    key: "yang-luck",
    logoSrc: "/yang-luck-logo.png",
    alt: "Yang Luck 揚運國際",
    wordmark: "Yang Luck",
    wordmarkCjk: "揚運",
    displayName: "Yang Luck 揚運",
    logoNeedsPlate: true,
  },
};

function resolve(): Brand {
  const key = process.env.NEXT_PUBLIC_BRAND;
  // Unknown or unset falls back to ours rather than throwing: a typo in an env var
  // should degrade to our own branding, not break the site or leak a client's.
  return (key && BRANDS[key as BrandKey]) || BRANDS.tecxwork;
}

export const BRAND: Brand = resolve();
