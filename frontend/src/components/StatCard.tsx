import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorScheme?: 'emerald' | 'amber' | 'purple' | 'blue' | 'teal';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  label,
  value,
  icon: Icon,
  colorScheme = 'emerald',
  subtitle,
}) => {
  const safeValue =
    typeof value === 'number'
      ? Number.isNaN(value) || !Number.isFinite(value)
        ? 0
        : value
      : value === undefined || value === null
      ? '0'
      : value;

  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'text-emerald-700 bg-emerald-50',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'text-amber-700 bg-amber-50',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      badge: 'text-purple-700 bg-purple-50',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      badge: 'text-blue-700 bg-blue-50',
    },
    teal: {
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      badge: 'text-teal-700 bg-teal-50',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.emerald;

  return (
    <div
      id={id}
      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-300 transition-colors"
    >
      <div>
        <p className="text-xs sm:text-sm font-medium text-stone-500">{label}</p>
        <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          {safeValue}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-stone-400">{subtitle}</p>
        )}
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${scheme.bg}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};
