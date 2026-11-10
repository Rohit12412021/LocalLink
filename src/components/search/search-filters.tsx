"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Top Rated", value: "top-rated" },
  { label: "Nearest", value: "nearest" },
  { label: "Low Price", value: "low-price" },
] as const;

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  function handleFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => handleFilter(filter.value)}
          className={`chip whitespace-nowrap ${
            activeFilter === filter.value ? "chip-active" : ""
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}