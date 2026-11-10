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
  id,
  name,
  category,
  rating,
  reviewCount,
  distance,
  price,
  available,
  location,
}: ProviderCardProps) {
  return (
    <Link
      href={`/provider/${id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">{category}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{name}</h3>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            available
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {available ? "Available" : "Busy"}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium text-slate-900">{rating}</span>
        <span className="text-slate-600">({reviewCount} reviews)</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="h-4 w-4 text-slate-500" />
        {distance} • {location}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="font-medium text-blue-700">{price}</p>
        <span className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">
          View
        </span>
      </div>
    </Link>
  );
}
