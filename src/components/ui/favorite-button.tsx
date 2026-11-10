"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { addFavorite, getFavoriteStatus, removeFavorite } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export function FavoriteButton({
  providerId,
  size = "md",
  className,
}: {
  providerId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const sizeClass =
    size === "lg"
      ? "h-11 w-11"
      : size === "sm"
        ? "h-8 w-8"
        : "h-9 w-9";

  const iconSize = size === "lg" ? 22 : size === "sm" ? 15 : 18;

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const res = await getFavoriteStatus(providerId);
        if (alive) setIsFavorite(res.isFavorite);
      } catch {
        // ignore
      }
      if (alive) setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [user, providerId]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast.info("Sign in to save providers");
      return;
    }
    setLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(providerId);
        setIsFavorite(false);
        toast.success("Removed from saved");
      } else {
        await addFavorite(providerId);
        setIsFavorite(true);
        toast.success("Saved to your list");
      }
    } catch {
      toast.error("Could not update saved list, please try again");
    } finally {
      setLoading(false);
    }
  }, [user, isFavorite, providerId]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || (!!user && checking)}
      aria-label={isFavorite ? "Remove from saved" : "Save provider"}
      aria-pressed={isFavorite}
      className={cn(
        "flex items-center justify-center rounded-full border transition-all disabled:opacity-40",
        sizeClass,
        isFavorite
          ? "border-transparent bg-accent-soft text-accent-strong shadow-[0_4px_12px_-4px_var(--accent)]"
          : "border-line bg-surface text-ink-mute hover:border-accent hover:text-accent",
        className,
      )}
    >
      <Heart size={iconSize} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}