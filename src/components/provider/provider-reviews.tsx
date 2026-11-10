"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { RatingStars } from "@/components/ui/rating-stars";
import { Avatar } from "@/components/ui/avatar";
import { getProviderReviews } from "@/lib/api";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
  };
};

export default function ProviderReviews({
  providerId,
}: {
  providerId: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getProviderReviews(providerId);
        if (alive) setReviews(data);
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [providerId]);

  if (loading) {
    return (
      <section className="card p-6">
        <h2 className="section-title">Reviews</h2>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="card p-6">
        <h2 className="section-title">Reviews</h2>
        <div className="mt-4">
          <EmptyState
            variant="empty"
            title="No reviews yet"
            description="Be the first to review this provider after a completed service."
            action={undefined}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="section-title">Reviews</h2>
      <div className="mt-4 space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl bg-surface-soft p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar name={review.user.name} size="sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {review.user.name}
                    </span>
                    <RatingStars rating={review.rating} size={13} />
                  </div>
                  {review.comment ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="shrink-0 text-xs text-ink-faint">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}