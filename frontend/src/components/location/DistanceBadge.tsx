import React from 'react';
import { MapPin } from 'lucide-react';

interface DistanceBadgeProps {
  distanceKm?: number | null;
  className?: string;
  prefix?: string;
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({
  distanceKm,
  className = '',
  prefix = '📍',
}) => {
  if (distanceKm == null || isNaN(distanceKm)) {
    return null;
  }

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (distanceKm > 25) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}
      title={`Calculated distance: ${distanceKm} km`}
    >
      <span>{prefix}</span>
      <span>{distanceKm} km away</span>
    </span>
  );
};
