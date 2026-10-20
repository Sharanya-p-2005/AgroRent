import React, { useState } from 'react';
import { X, Star, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { StarRating } from '../StarRating.js';
import { reviewsApi } from '../../services/api.js';

export interface EligibleReviewItem {
  target_type?: 'EQUIPMENT' | 'OWNER' | 'DRIVER' | 'FARM_WORKER' | 'ANIMAL_SELLER' | 'ANIMAL';
  target_id?: string;
  target_name?: string;
  source_type?: 'EQUIPMENT_BOOKING' | 'ANIMAL_ORDER' | 'DRIVER_BOOKING' | 'WORKER_BOOKING' | 'SERVICE_BOOKING';
  source_id?: string;
  completed_at?: string;
  details?: string;
  // Aliases for compatibility
  targetType?: 'EQUIPMENT' | 'OWNER' | 'DRIVER' | 'FARM_WORKER' | 'ANIMAL_SELLER' | 'ANIMAL';
  targetId?: string;
  targetName?: string;
  sourceType?: 'EQUIPMENT_BOOKING' | 'ANIMAL_ORDER' | 'DRIVER_BOOKING' | 'WORKER_BOOKING' | 'SERVICE_BOOKING';
  sourceId?: string;
  subtitle?: string;
}

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EligibleReviewItem;
  onSuccess?: () => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setLoading(true);
    setError('');

    const finalTargetType = (item.target_type || item.targetType || 'EQUIPMENT') as any;
    const finalTargetId = item.target_id || item.targetId || '';
    const finalSourceType = (item.source_type || item.sourceType || 'EQUIPMENT_BOOKING') as any;
    const finalSourceId = item.source_id || item.sourceId || '';

    try {
      await reviewsApi.create({
        target_type: finalTargetType,
        target_id: finalTargetId,
        source_type: finalSourceType,
        source_id: finalSourceId,
        rating,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to submit review. You may have already reviewed this completed transaction.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTargetTitle = (type: string) => {
    switch (type) {
      case 'EQUIPMENT':
        return 'Rate Farm Equipment';
      case 'OWNER':
        return 'Rate Equipment Owner';
      case 'DRIVER':
        return 'Rate Tractor Driver';
      case 'FARM_WORKER':
        return 'Rate Farm Worker';
      case 'ANIMAL_SELLER':
        return 'Rate Animal Seller';
      case 'ANIMAL':
        return 'Rate Animal Listing';
      default:
        return 'Write a Review';
    }
  };

  const displayTargetType = item.target_type || item.targetType || 'EQUIPMENT';
  const displayTargetName = item.target_name || item.targetName || 'Listing';
  const displayDetails = item.details || item.subtitle || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Thank you for your feedback!</h3>
            <p className="text-sm text-stone-600">
              Your rating & review has been published to help fellow farmers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Verified Completed Transaction
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5">{getTargetTitle(displayTargetType)}</h3>
              <p className="text-sm text-stone-600 font-medium mt-1">
                {displayTargetName}
                {displayDetails && <span className="text-stone-400 ml-1.5 font-normal">({displayDetails})</span>}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Rating Stars Selector */}
            <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-4 text-center">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Overall Experience Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex justify-center">
                <StarRating
                  rating={rating}
                  size="lg"
                  interactive={true}
                  onChange={(val) => setRating(val)}
                  showTotal={false}
                />
              </div>
              <p className="text-xs text-stone-500 mt-2 font-medium">
                {rating === 5 && 'Outstanding - Highly recommended!'}
                {rating === 4 && 'Good - Satisfied with service'}
                {rating === 3 && 'Average - Met expectations'}
                {rating === 2 && 'Below Expectations'}
                {rating === 1 && 'Unsatisfactory'}
              </p>
            </div>

            {/* Comment Field */}
            <div>
              <label htmlFor="review-comment" className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                <span>Your Review / Feedback</span>
                <span className="text-stone-400 font-normal">Optional</span>
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="Share details of your rental or hiring experience, timeliness, equipment condition, etc..."
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[11px] text-stone-400 block text-right mt-1">
                {comment.length}/500 characters
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-review-btn"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{loading ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
