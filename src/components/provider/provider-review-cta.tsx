"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getMyRequests } from "@/lib/api";
import type { ServiceRequest } from "@/types";

export default function ProviderReviewCta({ providerId }: { providerId: string }) {
  const { user, loading } = useAuth();
  const [completedRequest, setCompletedRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const requests = await getMyRequests();
        const match = requests.find(
          (r) => r.providerId === providerId && r.status === "Completed",
        );
        if (alive) setCompletedRequest(match ?? null);
      } catch {
        // silent
      }
    })();
    return () => { alive = false; };
  }, [user, providerId]);

  if (loading || !user || !completedRequest) return null;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-ink">Had a service with this provider?</p>
          <p className="mt-0.5 text-sm text-ink-mute">
            Share your experience to help others decide.
          </p>
        </div>
        <Link
          href={`/request/${completedRequest.id}`}
          className="btn btn-brand btn-sm flex items-center gap-2 shrink-0"
        >
          <Star size={15} />
          Leave a Review
        </Link>
      </div>
    </section>
  );
}
