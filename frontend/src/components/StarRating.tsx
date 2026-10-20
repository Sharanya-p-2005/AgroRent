import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  showTotal?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalReviews,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = true,
  showTotal = true,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const sizeClasses = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = displayRating >= starValue;
          const isPartiallyFilled = !isFilled && displayRating > index && displayRating < starValue;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0.5 transition-transform ${
                interactive
                  ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded'
                  : 'cursor-default'
              }`}
              aria-label={`${starValue} Star`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-500'
                    : isPartiallyFilled
                    ? 'fill-amber-200 text-amber-400'
                    : 'text-stone-300 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && displayRating > 0 && (
        <span className={`text-stone-800 tabular-nums ${textSizeClasses[size]}`}>
          {Number(displayRating).toFixed(1)}
        </span>
      )}

      {showTotal && totalReviews !== undefined && (
        <span className="text-xs text-stone-500">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};
