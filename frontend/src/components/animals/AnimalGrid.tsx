import React from 'react';
import { AnimalListing } from '../../types/animal.js';
import { AnimalCard } from './AnimalCard.js';
import { Beef, Bird, SearchX, RefreshCw } from 'lucide-react';

interface AnimalGridProps {
  animals: AnimalListing[];
  isLoading: boolean;
  onSelect: (animal: AnimalListing) => void;
  onBuyNow: (animal: AnimalListing) => void;
  onResetFilters?: () => void;
}

export const AnimalGrid: React.FC<AnimalGridProps> = ({
  animals,
  isLoading,
  onSelect,
  onBuyNow,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-xs animate-pulse space-y-4"
          >
            <div className="aspect-16/10 w-full rounded-xl bg-stone-200" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded-md bg-stone-200" />
              <div className="h-4 w-1/2 rounded-md bg-stone-100" />
              <div className="h-4 w-full rounded-md bg-stone-100" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <div className="h-6 w-20 rounded-md bg-stone-200" />
              <div className="h-8 w-24 rounded-xl bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (animals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-1">
          No livestock or birds found
        </h3>
        <p className="max-w-md text-sm text-stone-500 mb-6">
          We couldn't find any listings matching your search or active filters. Try loosening your criteria or resetting filters.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {animals.map((animal) => (
        <AnimalCard
          key={animal.id}
          animal={animal}
          onSelect={onSelect}
          onBuyNow={onBuyNow}
        />
      ))}
    </div>
  );
};
