import type { ComponentType } from "react";

/**
 * What a table says when it has no rows yet.
 *
 * A bare table with headers and nothing under them reads as broken — the customer cannot
 * tell "you have no clients yet" from "this failed to load", and a workspace on its first
 * day sees that on every screen at once. Naming the state and pointing at the action that
 * ends it is the difference.
 *
 * Deliberately takes strings rather than i18n keys: these views each carry their own `T`
 * record (zh/en), so the copy stays beside the rest of that screen's copy instead of in a
 * second place that can drift out of sync with it.
 */
export function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  /** One line on what this screen holds, and what putting something in it gets you. */
  detail?: string;
  /** The control that resolves the state — usually the same button as the toolbar's. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {detail ? (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
