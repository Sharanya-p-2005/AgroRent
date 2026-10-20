import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'stat' | 'text' | 'detail';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 3,
  className = '',
}) => {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl overflow-hidden p-4 space-y-3 animate-pulse">
            <div className="h-44 bg-stone-200 rounded-xl w-full" />
            <div className="space-y-2">
              <div className="h-4 bg-stone-200 rounded-sm w-3/4" />
              <div className="h-3 bg-stone-100 rounded-sm w-1/2" />
            </div>
            <div className="pt-2 flex justify-between items-center border-t border-stone-100">
              <div className="h-4 bg-stone-200 rounded-sm w-1/3" />
              <div className="h-7 bg-stone-200 rounded-lg w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-3.5 bg-stone-200 rounded-sm w-1/2" />
              <div className="w-8 h-8 rounded-xl bg-stone-200" />
            </div>
            <div className="h-7 bg-stone-200 rounded-sm w-3/4" />
            <div className="h-3 bg-stone-100 rounded-sm w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-white border border-stone-200 rounded-2xl overflow-hidden ${className}`}>
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex gap-4">
          <div className="h-4 bg-stone-200 rounded-sm w-1/4 animate-pulse" />
          <div className="h-4 bg-stone-200 rounded-sm w-1/4 animate-pulse" />
          <div className="h-4 bg-stone-200 rounded-sm w-1/4 animate-pulse" />
          <div className="h-4 bg-stone-200 rounded-sm w-1/4 animate-pulse" />
        </div>
        <div className="divide-y divide-stone-100">
          {items.map((_, i) => (
            <div key={i} className="p-4 flex gap-4 items-center animate-pulse">
              <div className="h-4 bg-stone-100 rounded-sm w-1/4" />
              <div className="h-4 bg-stone-200 rounded-sm w-1/4" />
              <div className="h-4 bg-stone-100 rounded-sm w-1/4" />
              <div className="h-4 bg-stone-200 rounded-sm w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default text rows
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="h-4 bg-stone-200 rounded-sm w-full" style={{ width: `${Math.max(50, 100 - i * 15)}%` }} />
      ))}
    </div>
  );
};
