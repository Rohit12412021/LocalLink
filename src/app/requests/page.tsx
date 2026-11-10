"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, Clock, MapPin, LogIn, ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/context/auth-context";
import { ApiError, getMyRequests } from "@/lib/api";
import type { ServiceRequest } from "@/types";

export default function RequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?returnUrl=/requests");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const data = await getMyRequests();
        if (alive) setRequests(data);
      } catch (err) {
        if (alive)
          setError(
            err instanceof ApiError ? err.message : "Unable to load bookings.",
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <main className="mx-auto min-h-[60vh] w-full max-w-4xl px-4 py-10">
        {!authLoading && !user ? (
          <div className="card mx-auto max-w-md p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <LogIn size={22} />
            </span>
            <h1 className="mt-4 text-lg font-extrabold text-ink">
              Sign in to view bookings
            </h1>
            <p className="mt-1 text-sm text-ink-mute">
              Your service requests are linked to your account.
            </p>
            <Link href="/login?returnUrl=/requests" className="btn btn-brand mt-5">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-4xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Link href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-all hover:border-brand hover:text-brand">
          <ArrowLeft size={17} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">My bookings</h1>
          <p className="mt-0.5 text-sm text-ink-mute">Track your service requests.</p>
        </div>
      </div>

      <section className="mt-6 space-y-4">
        {loading ? (
          <>
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </>
        ) : error ? (
          <EmptyState
            variant="offline"
            title="Could not load bookings"
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
        ) : requests.length === 0 ? (
          <EmptyState
            variant="empty"
            title="No bookings yet"
            description="You haven't submitted any service requests."
            action={
              <Link href="/search" className="btn btn-brand btn-sm">
                Find a service
              </Link>
            }
          />
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/request/${request.id}`}
              className="card card-hover block p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {request.category}
                  </p>
                  <h2 className="mt-1 truncate font-bold text-ink">
                    {request.providerName}
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-mute">{request.service}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-mute">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-ink-faint" />
                  {request.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-ink-faint" />
                  {request.time}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <MapPin size={15} className="shrink-0 text-ink-faint" />
                  {request.location}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <p className="text-xs text-ink-faint">Request ID</p>
                  <p className="text-sm font-semibold text-ink">{request.id}</p>
                </div>
                <ChevronRight size={18} className="text-ink-faint" />
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}