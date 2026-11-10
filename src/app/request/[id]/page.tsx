"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Wrench,
  XCircle,
} from "lucide-react";

import ChatPanel from "@/components/chat-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  fetcher,
  getRequestById,
  rescheduleRequest,
  submitReview,
  updateRequestStatus,
} from "@/lib/api";
import type { ServiceRequest } from "@/types";

type RequestDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function RequestDetailsPage({ params }: RequestDetailsPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // Resolve params (can be a Promise in Next 15 server components adapted to client)
    let alive = true;
    (async () => {
      const { id } = await Promise.resolve(params);
      setRequestId(id);
      if (!authLoading && !user) {
        // Will show auth wall below, no need to fetch
        if (alive) setLoading(false);
        return;
      }
      try {
        const data = await getRequestById(id);
        if (alive) { setRequest(data); }
      } catch (err) {
        if (alive) setError(err instanceof ApiError ? err.message : "Unable to load this booking.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [params, user, authLoading]);

  async function handleStatusChange(status: "Accepted" | "Rejected" | "Cancelled" | "Completed") {
    if (!request) return;
    if (
      status === "Cancelled" &&
      !confirm("Are you sure you want to cancel this request?")
    ) {
      return;
    }
    setBusy(true);
    try {
      await updateRequestStatus(request.id, status);
      const data = await getRequestById(request.id);
      setRequest(data);
      toast.success(
        status === "Accepted"
          ? "Request accepted!"
          : status === "Rejected"
            ? "Request rejected."
            : status === "Completed"
              ? "Request marked as completed."
              : "Request cancelled.",
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update the request.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!request || !newDate || !newTime) return;
    setBusy(true);
    try {
      const data = await rescheduleRequest(request.id, newDate, newTime);
      setRequest(data);
      setShowReschedule(false);
      toast.success("Request rescheduled.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reschedule.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitReview() {
    if (!request || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      // request.requestId is the real UUID; request.id is the display ID (REQ-001)
      const uuid = request.requestId || request.id;
      await submitReview(uuid, reviewRating, reviewComment.trim() || undefined);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment("");
      toast.success("Review submitted. Thank you!");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to submit your review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handlePayment() {
    if (!request) return;
    if (typeof window === "undefined" || !(window as { Razorpay?: unknown }).Razorpay) {
      toast.error("Payment is not available right now.");
      return;
    }
    setBusy(true);
    try {
      const config = (await fetcher("/payments/config")) as { key: string };
      const order = (await fetcher("/payments/orders", {
        method: "POST",
        body: JSON.stringify({ requestId: request.id }),
      })) as { amount: number; currency: string; id: string };

      const options = {
        key: config.key,
        amount: order.amount,
        currency: order.currency,
        name: "LocalLink",
        description: `Payment for ${request.service}`,
        order_id: order.id,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: request.phone || "",
        },
        theme: { color: "#0d9488" },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            await fetcher("/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            toast.success("Payment successful!");
            const data = await getRequestById(request.id);
            setRequest(data);
          } catch {
            toast.error("Payment verification failed.");
          }
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to start payment.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isProvider = user?.role === "Provider";
  const canChat = !!user;

  // Auth wall — do not expose booking data to unauthenticated users
  if (!authLoading && !user) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-ink">Sign in required</h1>
          <p className="mt-2 text-sm text-ink-mute">Please sign in to view booking details.</p>
          <Link href={`/login?returnUrl=/request/${requestId}`} className="btn btn-brand mt-5 w-full">Sign in</Link>
        </div>
      </main>
    );
  }

  if (loading || authLoading) {
    return (      <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-3xl px-4 py-10">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton mt-6 h-24" />
        <div className="skeleton mt-4 h-56" />
        <div className="skeleton mt-4 h-24" />
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-ink">Request not found</h1>
          <p className="mt-2 text-sm text-ink-mute">
            {error || `No request matches "${requestId}".`}
          </p>
          <Link href="/requests" className="btn btn-brand mt-5">
            Back to bookings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-3xl px-4 py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="flex items-center gap-3">
        <Link
          href={isProvider ? "/provider-requests" : "/requests"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition-colors hover:text-brand"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {request.service}
          </h1>
          <p className="mt-0.5 text-sm text-ink-mute">
            Request&nbsp;ID: <span className="font-medium text-ink">{request.id}</span> •{" "}
            {request.category}
          </p>
        </div>
      </div>

      {/* Status */}
      <section className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Current status
          </p>
          <div className="mt-2">
            <StatusBadge status={request.status} />
          </div>
        </div>
        <p className="text-sm text-ink-mute">
          Submitted{" "}
          {request.createdAt
            ? new Date(request.createdAt).toLocaleDateString()
            : "recently"}
        </p>
      </section>

      {/* Who */}
      <section className="card mt-4 flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-extrabold text-brand">
          {request.providerName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {isProvider ? "Customer" : "Service provider"}
          </p>
          <p className="truncate font-bold text-ink">
            {isProvider ? request.userName || "Customer" : request.providerName}
          </p>
          <p className="truncate text-sm text-ink-mute">
            {isProvider ? `${request.phone || ""} • ${request.location}` : request.category}
          </p>
        </div>
        {!isProvider ? (
          <Link
            href={`/provider/${request.providerId}`}
            className="btn btn-outline btn-sm ml-auto"
          >
            View
          </Link>
        ) : null}
      </section>

      {/* Details */}
      <section className="card mt-4 p-6">
        <h2 className="text-lg font-bold text-ink">Service details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Wrench size={18} />
            </span>
            <div>
              <p className="text-xs text-ink-mute">Service</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{request.service}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Calendar size={18} />
            </span>
            <div>
              <p className="text-xs text-ink-mute">Preferred time</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {request.date} • {request.time}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <MapPin size={18} />
            </span>
            <div>
              <p className="text-xs text-ink-mute">Location</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{request.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Phone size={18} />
            </span>
            <div>
              <p className="text-xs text-ink-mute">Contact</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{request.phone || "—"}</p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <MessageSquare size={18} />
              </span>
              <div>
                <p className="text-xs text-ink-mute">Description</p>
                <p className="mt-0.5 text-sm text-ink">{request.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price + actions */}
      <section className="card mt-4 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Estimated price
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{request.price}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(request.status === "Accepted" || request.status === "Completed") &&
          request.phone ? (
            <a href={`tel:${request.phone}`} className="btn btn-outline btn-sm">
              <Phone size={15} />
              Call
            </a>
          ) : null}

          {isProvider ? (
            request.status === "Pending" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleStatusChange("Accepted")}
                  className="btn btn-brand btn-sm"
                >
                  <CheckCircle2 size={15} />
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleStatusChange("Rejected")}
                  className="btn btn-danger btn-sm"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </>
            ) : request.status === "Accepted" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStatusChange("Completed")}
                className="btn btn-accent btn-sm"
              >
                <CheckCircle2 size={15} />
                Mark completed
              </button>
            ) : null
          ) : request.status === "Completed" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handlePayment()}
                className="btn btn-brand btn-sm"
              >
                <CalendarCheck size={15} />
                {busy ? "Processing..." : "Pay now"}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="btn btn-outline btn-sm"
              >
                <Star size={15} />
                Review
              </button>
            </>
          ) : request.status === "Pending" || request.status === "Accepted" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowReschedule((v) => !v)}
                className="btn btn-outline btn-sm"
              >
                <Calendar size={15} />
                Reschedule
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStatusChange("Cancelled")}
                className="btn btn-danger btn-sm"
              >
                <Ban size={15} />
                Cancel
              </button>
            </>
          ) : null}
        </div>
      </section>

      {/* Reschedule */}
      {showReschedule ? (
        <section className="card mt-4 p-6">
          <h3 className="font-bold text-ink">Reschedule request</h3>
          <form onSubmit={(e) => void handleReschedule(e)} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="newDate" className="label">
                New date
              </label>
              <input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="newTime" className="label">
                New time
              </label>
              <input
                id="newTime"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={busy || !newDate || !newTime} className="btn btn-brand btn-sm">
                {busy ? "Updating..." : "Confirm reschedule"}
              </button>
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Review */}
      {showReviewForm ? (
        <section className="card mt-4 p-6">
          <h3 className="font-bold text-ink">How was the service?</h3>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors ${
                  star <= reviewRating
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-line text-ink-faint hover:border-accent"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Tell others about this provider (optional)"
            rows={3}
            className="input mt-4 resize-none"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={submittingReview || reviewRating === 0}
              onClick={() => void handleSubmitReview()}
              className="btn btn-brand btn-sm"
            >
              {submittingReview ? "Submitting..." : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(false);
                setReviewRating(0);
                setReviewComment("");
              }}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {/* Chat */}
      {canChat ? (
        <div className="mt-6">
          <ChatPanel
            requestId={request.id}
            currentUserId={user.userId}
            currentUserRole={user.role}
            providerName={request.providerName}
            userName={request.userName}
          />
        </div>
      ) : authLoading ? (
        <div className="skeleton mt-6 h-96" />
      ) : (
        <div className="card mt-6 p-6 text-center">
          <p className="text-sm text-ink-mute">
            Sign in to message {isProvider ? "this customer" : "this provider"}.
          </p>
          <Link href={`/login?returnUrl=/request/${request.id}`} className="btn btn-brand btn-sm mt-4">
            Sign in to chat
          </Link>
        </div>
      )}
    </main>
  );
}