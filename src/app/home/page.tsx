"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";

import SearchBar from "@/components/home/search-bar";
import CategoryCard from "@/components/home/category-card";
import { ServiceCard, ServiceCardSkeleton } from "@/components/provider/service-card";
import { EmptyState } from "@/components/ui/empty-state";

import { categories } from "@/data/categories";
import { ApiError, getServices } from "@/lib/api";
import type { ServiceListing } from "@/lib/api";

export default function HomePage() {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationLabel] = useState("Near you");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getServices();
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
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      {/* Header */}
      <section className="flex animate-fade-in-down flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
            <Sparkles size={15} /> {greeting}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Find the <span className="text-brand">service</span> you need
          </h1>
        </div>
        <p className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-mute">
          <MapPin size={14} className="text-brand" /> {locationLabel}
        </p>
      </section>

      {/* Search */}
      <section className="mt-6 animate-fade-in-up [animation-delay:80ms]">
        <SearchBar />
      </section>

      {/* Categories */}
      <section className="mt-10 animate-fade-in-up [animation-delay:140ms]">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Browse by Category</h2>
          <Link href="/search" className="group flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-strong">
            View All <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <CategoryCard key={category.id} name={category.name} description={category.description} icon={category.icon} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mt-12 pb-16 animate-fade-in-up [animation-delay:200ms]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="section-title">Available Services</h2>
            <p className="mt-1 text-sm text-ink-mute">
              {loading ? "Loading services..." : `${services.length} service${services.length === 1 ? "" : "s"} available`}
            </p>
          </div>
          <Link href="/search" className="group flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-strong">
            View All <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
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
        ) : services.length === 0 ? (
          <div className="mt-6">
            <EmptyState variant="empty" title="No services yet" description="Providers haven't listed services yet. Check back soon." action={undefined} />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => <ServiceCard key={svc.serviceId} service={svc} />)}
          </div>
        )}
      </section>
    </main>
  );
}
