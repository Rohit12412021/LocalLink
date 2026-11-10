import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <Star
            key={i}
            size={size}
            className={
              filled
                ? "fill-accent text-accent"
                : "fill-surface-sunk text-surface-sunk"
            }
          />
        );
      })}
    </span>
  );
}