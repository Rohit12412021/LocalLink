"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import SearchHeader from "@/components/search/search-header";
import SearchFilters from "@/components/search/search-filters";
import { ServiceCard, ServiceCardSkeleton } from "@/components/provider/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError, getServices } from "@/lib/api";
import type { ServiceListing } from "@/lib/api";

function SearchPageContent() {
  const searchParams = useSearchParams();

  // Keep exact case — backend normalizes both sides
  const query = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const filter = searchParams.get("filter") || "all";

  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        // Pass both q and category to the backend
        const data = await getServices({
          category: category || undefined,
          q: query || undefined,
        });
        if (!alive) return;
        setServices(data);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof ApiError ? err.message : "Unable to load services.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [query, category]);

  // Client-side filter for available/top-rated/low-price
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      if (filter === "available") return svc.provider.available;
      if (filter === "top-rated") return svc.provider.rating >= 4.5;
      if (filter === "low-price") {
        const price = parseFloat(svc.price.replace(/[^\d.]/g, ""));
        return !isNaN(price) && price <= 500;
      }
      if (filter === "nearest") {
        const dist = parseFloat(svc.provider.distance);
        return !isNaN(dist) && dist <= 5;
      }
      return true;
    });
  }, [services, filter]);

  const searchText = query || category;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/home" aria-label="Back to home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-colors hover:border-brand hover:text-brand">
          <ArrowLeft size={19} />
        </Link>
        <SearchHeader />
      </div>

      <div className="mt-5 flex animate-fade-in-up items-center gap-2 text-sm text-ink-mute [animation-delay:80ms]">
        <MapPin size={15} className="text-brand" />
        {category ? (
          <span>Showing all <span className="font-semibold text-ink">{category}</span> services</span>
        ) : (
          <span>Searching <span className="font-semibold text-ink">all services</span></span>
        )}
      </div>

      <section className="mt-4 animate-fade-in-up [animation-delay:140ms]">
        <SearchFilters />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              {searchText ? `Results for "${searchText}"` : "All services"}
            </h1>
            <p className="mt-1 text-sm text-ink-mute">
              {loading ? "Loading..." : `${filteredServices.length} service${filteredServices.length === 1 ? "" : "s"} found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="mt-6">
            <EmptyState variant="offline" title="Could not load services" description={error}
              action={<button type="button" onClick={() => window.location.reload()} className="btn btn-brand btn-sm">Try again</button>} />
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((svc) => <ServiceCard key={svc.serviceId} service={svc} />)}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState variant="search" title="No services found"
              description="Try a different search term, category, or filter."
              action={<Link href="/search" className="btn btn-outline btn-sm">View all services</Link>} />
          </div>
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><p className="text-ink-mute">Loading search...</p></main>}>
      <SearchPageContent />
    </Suspense>
  );
}
