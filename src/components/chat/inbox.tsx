"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, MessageSquare, Search } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  getMyRequests,
  getProviderInbox,
  getUnreadCountForRequest,
} from "@/lib/api";
import type { ServiceRequest } from "@/types";

type Conversation = {
  id: string;
  displayName: string;
  service: string;
  status: ServiceRequest["status"];
  unread: number;
  date: string;
  time: string;
  location: string;
  createdAt?: string;
};

export function ChatInbox({ variant }: { variant: "user" | "provider" }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const returnUrl = variant === "provider" ? "/provider-requests" : "/chat";
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (variant === "provider" && user.role !== "Provider") {
      router.replace("/home");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const list =
          variant === "provider" ? await getProviderInbox() : await getMyRequests();
        const active = list.filter(
          (r) => r.status !== "Rejected" && r.status !== "Cancelled",
        );
        const items = await Promise.all(
          active.map(async (req) => {
            try {
              const unread = await getUnreadCountForRequest(req.id);
              return {
                id: req.id,
                displayName:
                  variant === "provider"
                    ? req.userName || "Customer"
                    : req.providerName,
                service: req.service,
                status: req.status,
                unread: unread?.count ?? 0,
                date: req.date,
                time: req.time,
                location: req.location,
                createdAt: req.createdAt,
              } satisfies Conversation;
            } catch {
              return {
                id: req.id,
                displayName:
                  variant === "provider"
                    ? req.userName || "Customer"
                    : req.providerName,
                service: req.service,
                status: req.status,
                unread: 0,
                date: req.date,
                time: req.time,
                location: req.location,
                createdAt: req.createdAt,
              } satisfies Conversation;
            }
          }),
        );
        if (alive) {
          setConversations(
            items.sort(
              (a, b) =>
                new Date(b.createdAt ?? 0).getTime() -
                new Date(a.createdAt ?? 0).getTime(),
            ),
          );
        }
      } catch (err) {
        if (alive)
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load conversations.",
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, authLoading, router, variant]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.service.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  if (authLoading || !user) {
    return (
      <main className="mx-auto min-h-[60vh] w-full max-w-3xl px-4 py-10">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton mt-4 h-12" />
        <div className="skeleton mt-4 h-24" />
        <div className="skeleton mt-3 h-24" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        {variant === "provider" ? "Service requests" : "Messages"}
      </h1>
      <p className="mt-1 text-sm text-ink-mute">
        {variant === "provider"
          ? "Chat with customers and track their requests."
          : "Chat with the providers you've booked."}
      </p>

      <div className="relative mt-6">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="input pl-10"
        />
      </div>

      <section className="mt-5 space-y-3">
        {loading ? (
          <>
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </>
        ) : error ? (
          <EmptyState
            variant="offline"
            title="Could not load conversations"
            description={error}
            action={
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-brand btn-sm"
              >
                Try again
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="empty"
            title={query ? "No matches" : "Nothing here yet"}
            description={
              query
                ? "No conversations match your search."
                : variant === "provider"
                  ? "Customers will appear here when they book your services."
                  : "Book a service to start chatting with a provider."
            }
          />
        ) : (
          filtered.map((conv) => (
            <Link
              key={conv.id}
              href={`/request/${conv.id}`}
              className="card card-hover block p-5"
            >
              <div className="flex items-start gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-extrabold text-brand">
                  {conv.displayName.charAt(0).toUpperCase()}
                  {conv.unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-strong">
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-ink">{conv.displayName}</h2>
                    <StatusBadge status={conv.status} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink-mute">
                    <MessageSquare size={14} className="shrink-0 text-ink-faint" />
                    {conv.service}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {conv.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {conv.time}
                    </span>
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <MapPin size={13} />
                      {conv.location}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}