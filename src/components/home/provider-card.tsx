import Link from "next/link";
import { MapPin, Star } from "lucide-react";

type ProviderCardProps = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  price: string;
  available: boolean;
  location: string;
};

export default function ProviderCard({
  id, name, category, rating, reviewCount,
  distance, price, available, location,
}: ProviderCardProps) {
  return (
    <Link href={`/provider/${id}`} className="card card-hover block p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="badge badge-brand">{category}</p>
          <h3 className="mt-2 text-base font-bold text-ink">{name}</h3>
        </div>
        <span className={`badge ${available ? "badge-success" : "badge-muted"}`}>
          {available ? "Available" : "Busy"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="font-semibold text-ink">{rating}</span>
        <span className="text-ink-mute">({reviewCount} reviews)</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-ink-mute">
        <MapPin className="h-4 w-4 text-brand" />
        {distance} &bull; {location}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <p className="font-bold text-brand">{price}</p>
        <span className="btn btn-brand btn-sm">View</span>
      </div>
    </Link>
  );
}
