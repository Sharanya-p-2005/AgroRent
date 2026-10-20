import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, CheckCircle2, ThumbsUp } from 'lucide-react';
import { StarRating } from '../StarRating.js';
import { reviewsApi } from '../../services/api.js';

interface ReviewItem {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  source_type: string;
}

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsListProps {
  targetType: 'EQUIPMENT' | 'OWNER' | 'DRIVER' | 'FARM_WORKER' | 'ANIMAL_SELLER' | 'ANIMAL';
  targetId: string;
  title?: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  targetType,
  targetId,
  title = 'Ratings & Farmer Reviews',
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    if (targetId) {
      setLoading(true);
      reviewsApi
        .getForTarget(targetType, targetId)
        .then((res) => {
          if (mounted && res.data) {
            setReviews(res.data.data || []);
            setSummary(
              res.data.summary || {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              }
            );
          }
        })
        .catch((err) => {
          console.error('Failed to load reviews:', err);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [targetType, targetId]);

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-stone-500">
        Loading ratings and verified reviews...
      </div>
    );
  }

  const { averageRating, totalReviews, ratingDistribution } = summary;

  return (
    <div className="space-y-6">
      {/* Header & Rating Breakdown */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
        <h4 className="text-base font-bold text-stone-900 mb-4">{title}</h4>

        {totalReviews === 0 ? (
          <div className="py-4 text-center">
            <MessageSquare className="h-8 w-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No reviews yet</p>
            <p className="text-xs text-stone-500 mt-0.5">
              Be the first farmer to complete a booking and leave feedback!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score box */}
            <div className="md:col-span-4 text-center border-b md:border-b-0 md:border-r border-stone-200 pb-4 md:pb-0 md:pr-4">
              <div className="text-4xl font-black text-stone-900 tracking-tight">
                {averageRating.toFixed(1)}
              </div>
              <div className="my-1.5 flex justify-center">
                <StarRating rating={averageRating} size="md" showValue={false} showTotal={false} />
              </div>
              <p className="text-xs font-medium text-stone-500">
                Based on {totalReviews} {totalReviews === 1 ? 'verified review' : 'verified reviews'}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="md:col-span-8 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-6 font-semibold text-stone-700 flex items-center gap-0.5">
                      {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-stone-500 tabular-nums font-medium">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-3.5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900">{r.reviewer_name}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <div className="mt-1">
                    <StarRating rating={r.rating} size="sm" showValue={false} showTotal={false} />
                  </div>
                </div>

                <span className="text-[11px] text-stone-400">
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {r.comment && (
                <p className="mt-2.5 text-xs text-stone-700 leading-relaxed">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
