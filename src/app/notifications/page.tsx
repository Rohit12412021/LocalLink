"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellOff, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notifications, unread, refresh, markRead, markAllRead } =
    useNotifications();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?returnUrl=/notifications");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-ink-mute">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">Notifications</h1>
          <p className="mt-1 text-sm text-ink-mute">
            Updates about your bookings and messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Refresh notifications"
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="btn btn-ghost btn-sm"
            >
              Mark all read
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {notifications.length === 0 ? (
          <EmptyState
            variant="empty"
            title="All quiet here"
            description="You'll see updates here when providers respond to your requests."
          />
        ) : (
          notifications.map((n) => {
            const item = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                  n.read
                    ? "border-line bg-surface"
                    : "border-brand/40 bg-brand-soft/40",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    n.read ? "bg-ink-faint" : "bg-accent",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 text-sm text-ink-mute">{n.body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-ink-faint">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    if (!n.read) void markRead(n.id);
                  }}
                >
                  {item}
                </Link>
              );
            }

            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.read) void markRead(n.id);
                }}
                className="block w-full text-left"
              >
                {item}
              </button>
            );
          })
        )}
      </div>

      {notifications.length > 0 ? (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
          <BellOff size={13} />
          Older notifications are trimmed automatically.
        </p>
      ) : null}
    </main>
  );
}