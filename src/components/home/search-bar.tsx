"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="card flex items-center gap-2 p-2 sm:p-2.5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Search size={18} />
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search mechanic, plumber, electrician..."
        aria-label="Search services"
        className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-ink outline-none placeholder:text-ink-faint"
      />
      <button type="submit" className="btn btn-brand btn-sm hidden sm:flex">
        Search
      </button>
    </form>
  );
}