import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface DashboardCardProps {
  id?: string;
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  onAction?: () => void;
  badge?: string;
  colorScheme?: 'emerald' | 'amber' | 'purple' | 'blue' | 'teal';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  title,
  description,
  buttonText,
  icon: Icon,
  onAction,
  badge,
  colorScheme = 'emerald',
}) => {
  const colorStyles = {
    emerald: {
      iconBox: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      btn: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    amber: {
      iconBox: 'bg-amber-50 text-amber-800 border-amber-200',
      btn: 'bg-amber-700 hover:bg-amber-800 text-white',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    purple: {
      iconBox: 'bg-purple-50 text-purple-800 border-purple-200',
      btn: 'bg-purple-700 hover:bg-purple-800 text-white',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    blue: {
      iconBox: 'bg-blue-50 text-blue-800 border-blue-200',
      btn: 'bg-blue-700 hover:bg-blue-800 text-white',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    teal: {
      iconBox: 'bg-teal-50 text-teal-800 border-teal-200',
      btn: 'bg-teal-700 hover:bg-teal-800 text-white',
      badge: 'bg-teal-100 text-teal-800 border-teal-200',
    },
  };

  const scheme = colorStyles[colorScheme] || colorStyles.emerald;

  return (
    <div
      id={id}
      className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-stone-300 transition-all"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${scheme.iconBox}`}>
            <Icon className="h-6 w-6" />
          </div>
          {badge && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scheme.badge}`}>
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-stone-900 group-hover:text-stone-950">
          {title}
        </h3>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onAction}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all cursor-pointer shadow-xs ${scheme.btn}`}
        >
          <span>{buttonText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
