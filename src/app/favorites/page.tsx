"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProviderCard } from "@/components/provider/provider-card";
import { ProviderCardSkeleton } from "@/components/provider/provider-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/auth-context";
import { getFavorites } from "@/lib/api";
import type { FavoriteItem } from "@/types";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?returnUrl=/favorites");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const data = await getFavorites();
        if (alive) setItems(data);
      } catch {
        if (alive) setError("Could not load your saved providers.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-10">
        <div className="skeleton h-8 w-48" />
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="section-title">Saved providers</h1>
          <p className="mt-1 text-sm text-ink-mute">
            Providers you&apos;ve saved for later — tap to book.
          </p>
        </div>
        <Link href="/search" className="btn btn-outline btn-sm">
          Explore more
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6">
          <EmptyState
            variant="offline"
            title="Could not load saved providers"
            description={error}
            action={
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-brand btn-sm"
              >
                Try again
              </button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            variant="empty"
            title="Nothing saved yet"
            description="Tap the heart on any provider profile to keep it here for quick access."
            action={
              <Link href="/search" className="btn btn-brand btn-sm">
                Find providers
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ProviderCard key={item.id} provider={item.provider} />
          ))}
        </div>
      )}
    </main>
  );
}