"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import SearchHeader from "@/components/search/search-header";
import SearchFilters from "@/components/search/search-filters";
import { ProviderCard } from "@/components/provider/provider-card";
import { ProviderCardSkeleton } from "@/components/provider/provider-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError, getProviders } from "@/lib/api";
import { detectUserLocation } from "@/lib/location";
import type { Provider } from "@/types";

function SearchPageContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const category = searchParams.get("category")?.toLowerCase().trim() || "";
  const filter = searchParams.get("filter") || "all";

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationLabel, setLocationLabel] = useState("Detecting location...");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const loc = await detectUserLocation();
        const sort =
          filter === "nearest"
            ? "distance"
            : filter === "top-rated"
              ? "rating"
              : filter === "low-price"
                ? "price"
                : "smart";
        const data = await getProviders({
          lat: loc.lat,
          lng: loc.lng,
          q: query || undefined,
          category: category || undefined,
          sort,
        });
        if (!alive) return;
        setLocationLabel(loc.label);
        setProviders(data);
      } catch (err) {
        if (!alive) return;
        setError(
          err instanceof ApiError ? err.message : "Unable to load providers.",
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query, category, filter]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const matchesQuery =
        !query ||
        provider.name.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query) ||
        provider.location.toLowerCase().includes(query) ||
        provider.services.some((service) =>
          service.name.toLowerCase().includes(query),
        );

      const normalize = (s: string) => s.toLowerCase().replace(/[\s-_]+/g, '');
      const matchesCategory =
        !category || normalize(provider.category) === normalize(category);

      let matchesFilter = true;

      if (filter === "available") {
        matchesFilter = provider.available === true;
      }

      if (filter === "top-rated") {
        matchesFilter = provider.rating >= 4.5;
      }

      if (filter === "nearest") {
        const distance = parseFloat(provider.distance);
        matchesFilter = !Number.isNaN(distance) && distance <= 5;
      }

      if (filter === "low-price") {
        matchesFilter = provider.services.some((service) => {
          const price = parseFloat(service.price.replace(/[^\d.]/g, ""));
          return !Number.isNaN(price) && price <= 500;
        });
      }

      return matchesQuery && matchesCategory && matchesFilter;
    });
  }, [providers, query, category, filter]);

  const searchText = query || category;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          aria-label="Back to home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowLeft size={19} />
        </Link>
        <SearchHeader />
      </div>

      <div className="mt-5 flex animate-fade-in-up items-center gap-2 text-sm text-ink-mute [animation-delay:80ms]">
        <MapPin size={15} className="text-brand" />
        Searching near <span className="font-semibold text-ink">{locationLabel}</span>
      </div>

      <section className="mt-4 animate-fade-in-up [animation-delay:140ms]">
        <SearchFilters />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              {searchText
                ? `Results for "${searchText}"`
                : "All services near you"}
            </h1>
            <p className="mt-1 text-sm text-ink-mute">
              {loading
                ? "Loading providers..."
                : `${filteredProviders.length} provider${
                    filteredProviders.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>
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
              title="Could not load providers"
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
        ) : filteredProviders.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              variant="search"
              title="No providers found"
              description="Try a different search term, category, or one of the filters above."
              action={
                <Link href="/search" className="btn btn-outline btn-sm">
                  View all services
                </Link>
              }
            />
          </div>
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-ink-mute">Loading search...</p>
        </main>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}