import Link from "next/link";
import { MapPin, Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { Provider } from "@/types";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <div className="card card-hover group flex flex-col overflow-hidden">
      <Link
        href={`/provider/${provider.id}`}
        className="flex flex-1 flex-col p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="badge badge-brand">{provider.category}</span>
          <span
            className={`badge ${
              provider.available ? "badge-success" : "badge-muted"
            }`}
          >
            {provider.available ? "Available now" : "Currently busy"}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar name={provider.name} src={provider.avatarUrl} size="md" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-ink transition-colors group-hover:text-brand">
              {provider.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              {provider.rating > 0 ? (
                <>
                  <Star size={13} className="fill-accent text-accent" />
                  <span className="text-sm font-semibold text-ink">
                    {provider.rating}
                  </span>
                  <span className="text-xs text-ink-faint">
                    ({provider.reviewCount} reviews)
                  </span>
                </>
              ) : (
                <span className="text-xs text-ink-faint">No reviews yet</span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-mute">
          <MapPin size={14} className="shrink-0 text-brand" />
          <span className="truncate">
            {provider.distance
              ? `${provider.distance} away`
              : provider.location || "Near you"}
          </span>
        </p>
      </Link>

      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <div>
          <p className="text-xs text-ink-faint">Starts at</p>
          <p className="text-base font-extrabold text-brand">{provider.price}</p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton providerId={provider.id} size="sm" />
          <Link
            href={`/provider/${provider.id}`}
            className="btn btn-brand btn-sm"
          >
            View profile
          </Link>
        </div>
      </div>
    </div>
  );
}