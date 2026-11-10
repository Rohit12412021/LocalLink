import { BriefcaseBusiness, MapPin } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { RatingStars } from "@/components/ui/rating-stars";

type ProviderHeaderProps = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  available: boolean;
  location: string;
  experience: string;
  avatarUrl?: string;
};

export default function ProviderHeader({
  id,
  name,
  category,
  rating,
  reviewCount,
  distance,
  available,
  location,
  experience,
  avatarUrl,
}: ProviderHeaderProps) {
  return (
    <section className="card card-hover p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <Avatar name={name} src={avatarUrl} size="xl" />
          {available ? (
            <span
              className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full border-[3px] border-surface bg-success"
              aria-label="Available now"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-brand">{category}</span>
            <span
              className={`badge ${available ? "badge-success" : "badge-muted"}`}
            >
              {available ? "Available now" : "Currently busy"}
            </span>
          </div>

          <h1 className="mt-2 truncate text-2xl font-extrabold tracking-tight text-ink">
            {name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5 text-ink-mute">
              <RatingStars rating={rating} size={15} />
              <span className="font-semibold text-ink">{rating}</span>
              <span className="text-ink-faint">({reviewCount} reviews)</span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-mute">
              <MapPin size={15} className="text-brand" />
              {distance ? `${distance} away` : location}
            </span>
            {experience ? (
              <span className="flex items-center gap-1.5 text-ink-mute">
                <BriefcaseBusiness size={15} className="text-accent" />
                {experience} experience
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-mute">
            <MapPin size={15} className="text-brand" />
            {location}
          </div>
        </div>

        <FavoriteButton providerId={id} size="lg" />
      </div>
    </section>
  );
}