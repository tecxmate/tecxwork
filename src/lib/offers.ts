import type { Capability } from "@/lib/permissions";

/**
 * The offer lifecycle.
 *
 * Kept as data rather than as `if` statements scattered through the routes, because the
 * rules here are the feature. "Offer" used to be a column on a board; what makes this an
 * offer is that the terms are fixed at approval, that someone is named as having
 * authorised them, and that the answer is recorded against those exact terms.
 */

export const OFFER_STATUSES = [
  "draft",
  "approved",
  "sent",
  "accepted",
  "declined",
  "withdrawn",
  "expired",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** Statuses where the offer is still in play — the ones the one-live-offer rule counts. */
export const LIVE_STATUSES: readonly OfferStatus[] = ["draft", "approved", "sent"];

type Transition = {
  to: OfferStatus;
  capability: Capability;
  /** Human reason used in the 409 when the transition is not allowed from here. */
  from: readonly OfferStatus[];
};

/**
 * Who may move an offer where.
 *
 * Note the split: drafting and approving are different capabilities, so a recruiter can
 * prepare terms but cannot authorise them. That separation is the whole point of having an
 * approval step — one person promising money unilaterally is what it exists to prevent.
 */
const TRANSITIONS: Record<string, Transition> = {
  approve: { to: "approved", capability: "offer:approve", from: ["draft"] },
  send: { to: "sent", capability: "offer:write", from: ["approved"] },
  accept: { to: "accepted", capability: "offer:write", from: ["approved", "sent"] },
  decline: { to: "declined", capability: "offer:write", from: ["approved", "sent"] },
  // Withdrawing needs the same authority that approved it: pulling authorised terms is a
  // decision of the same weight as granting them.
  withdraw: {
    to: "withdrawn",
    capability: "offer:approve",
    from: ["draft", "approved", "sent"],
  },
};

export type OfferAction = keyof typeof TRANSITIONS;

export function isOfferAction(value: string): value is OfferAction {
  return Object.hasOwn(TRANSITIONS, value);
}

export function transitionFor(action: OfferAction): Transition {
  return TRANSITIONS[action];
}

/** Terms may only change while the offer is a draft — see the note above. */
export function isEditable(status: OfferStatus): boolean {
  return status === "draft";
}

/**
 * An offer past its expiry cannot be accepted, whatever the stored status says.
 *
 * Evaluated at read time rather than by a scheduled job: a nightly sweep would leave a
 * window where a lapsed offer is still acceptable, and the whole point of an expiry is
 * that it holds at the moment someone tries to use it.
 */
export function hasLapsed(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return false;
  const date = new Date(`${expiresAt}T23:59:59Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}

/** The status to show, folding in an expiry the stored row has not caught up with yet. */
export function effectiveStatus(
  status: OfferStatus,
  expiresAt: string | null,
  now: Date
): OfferStatus {
  if (LIVE_STATUSES.includes(status) && hasLapsed(expiresAt, now)) return "expired";
  return status;
}
