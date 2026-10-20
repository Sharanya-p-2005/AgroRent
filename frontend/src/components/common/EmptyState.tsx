import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-sm font-bold text-stone-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-stone-500 max-w-sm mb-5 leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
