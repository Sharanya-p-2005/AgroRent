import React from 'react';
import { LucideIcon, ArrowLeft, Clock, Sparkles } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onBackToDashboard: () => void;
  colorScheme?: 'emerald' | 'amber' | 'purple' | 'blue' | 'teal';
  upcomingFeatures?: string[];
  phase?: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  description,
  icon: Icon,
  onBackToDashboard,
  colorScheme = 'emerald',
  upcomingFeatures,
}) => {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  const scheme = colorStyles[colorScheme] || colorStyles.emerald;

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 border border-stone-200">
          <Clock className="h-3.5 w-3.5" />
          Module in Progress
        </span>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-xs text-center max-w-2xl mx-auto">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${scheme} mb-5`}>
          <Icon className="h-8 w-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          {title}
        </h2>
        <p className="mt-2 text-base text-stone-600 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>

        <div className="my-8 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-emerald-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Key Capabilities in Roadmap:
            </h4>
          </div>
          <ul className="space-y-2 text-sm text-stone-600">
            {(upcomingFeatures || [
              'Dedicated relational schemas and real-time database queries',
              'Fast search filters by taluk, district, availability, and pricing',
              'Verified mobile OTP booking confirmations & digital receipts',
              'Integration with AgroRent role authorization engine'
            ]).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-2" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard Home</span>
        </button>
      </div>
    </div>
  );
};
