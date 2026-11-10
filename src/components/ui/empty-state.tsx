import { Boxes, CloudOff, Loader2, SearchX } from "lucide-react";

type EmptyStateProps = {
  variant?: "empty" | "search" | "offline" | "loading";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  variant = "empty",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon =
    variant === "search"
      ? SearchX
      : variant === "offline"
        ? CloudOff
        : variant === "loading"
          ? Loader2
          : Boxes;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center ${className ?? ""}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icon
          size={26}
          className={variant === "loading" ? "animate-spin" : undefined}
        />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-ink-mute">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}