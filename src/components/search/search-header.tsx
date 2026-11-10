"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialValue =
    searchParams.get("q") || searchParams.get("category") || "";

  const [search, setSearch] = useState(initialValue);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const value = search.trim();

    if (!value) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function clearSearch() {
    setSearch("");
    router.push("/search");
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-1 items-center gap-3">
      <div className="card flex flex-1 items-center gap-3 px-4 py-1.5">
        <Search className="h-5 w-5 shrink-0 text-ink-faint" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mechanic, plumber, electrician..."
          aria-label="Search providers"
          className="h-11 w-full bg-transparent text-ink outline-none placeholder:text-ink-faint"
        />
        {search ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </form>
  );
}