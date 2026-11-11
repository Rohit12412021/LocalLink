"use client";

import Link from "next/link";
import { MapPin, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { ServiceListing } from "@/lib/api";

export function ServiceCard({ service }: { service: ServiceListing }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubItems = (service.subItems?.length ?? 0) > 0;

  return (
    <div className="card card-hover flex flex-col overflow-hidden">
      <Link href={`/provider/${service.provider.id}`} className="flex flex-1 flex-col p-5">
        {/* Top row: category + availability */}
        <div className="flex items-center justify-between gap-2">
          <span className="badge badge-brand">{service.category}</span>
          <span className={`badge ${service.provider.available ? "badge-success" : "badge-muted"}`}>
            {service.provider.available ? "Available now" : "Busy"}
          </span>
        </div>

        {/* Service name + price */}
        <div className="mt-3">
          <h3 className="text-lg font-bold text-ink leading-tight">{service.name}</h3>
          <p className="mt-0.5 text-base font-extrabold text-brand">{service.price}</p>
          {service.description && (
            <p className="mt-1 text-sm text-ink-mute line-clamp-2">{service.description}</p>
          )}
        </div>

        {/* Provider info */}
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={service.provider.name} src={service.provider.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{service.provider.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-ink">{service.provider.rating}</span>
              <span className="text-xs text-ink-faint">({service.provider.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-mute">
          <MapPin size={13} className="shrink-0 text-brand" />
          <span className="truncate">
            {service.provider.distance !== "Nearby"
              ? `${service.provider.distance} away`
              : service.provider.location}
          </span>
        </p>
      </Link>

      {/* Sub-items toggle */}
      {hasSubItems && (
        <div className="border-t border-line">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex w-full items-center justify-between px-5 py-2.5 text-xs font-semibold text-brand hover:bg-brand-soft/30 transition"
          >
            <span>{service.subItems!.length} options available</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <div className="border-t border-line bg-surface-soft px-5 pb-3 pt-2 space-y-1.5">
              {service.subItems!.map(sub => (
                <div key={sub.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink">{sub.name}</span>
                  <span className="text-sm font-bold text-brand shrink-0">{sub.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: Book button */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <span className="text-xs text-ink-faint">
          {service.provider.experience || "Professional service"}
        </span>
        <Link
          href={`/request-service?provider=${service.provider.id}`}
          className="btn btn-brand btn-sm"
          onClick={e => e.stopPropagation()}
        >
          Book now
        </Link>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-5 w-24" />
      </div>
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-4 w-full" />
      <div className="flex items-center gap-3 mt-2">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="skeleton h-4 w-32" />
      </div>
    </div>
  );
}
