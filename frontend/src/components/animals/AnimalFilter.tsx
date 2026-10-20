import React from 'react';
import { AnimalFilterState } from '../../types/animal.js';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface AnimalFilterProps {
  filters: AnimalFilterState;
  onChange: (filters: AnimalFilterState) => void;
  onReset: () => void;
  categories: string[];
}

export const AnimalFilter: React.FC<AnimalFilterProps> = ({
  filters,
  onChange,
  onReset,
  categories,
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.listing_type !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.gender !== 'ALL' ||
    filters.location !== '' ||
    (filters.maxPrice !== undefined && filters.maxPrice > 0) ||
    filters.sortBy !== 'newest';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm sm:text-base">
          <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
          <span>Filter & Sort Livestock</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            id="btn-reset-animal-filters"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Type Toggle: All / Animal / Bird */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Type</label>
          <select
            id="filter-listing-type"
            value={filters.listing_type}
            onChange={(e) => onChange({ ...filters, listing_type: e.target.value as any })}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ALL">All Livestock & Birds</option>
            <option value="ANIMAL">Animals Only</option>
            <option value="BIRD">Birds / Poultry Only</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Category</label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Gender</label>
          <select
            id="filter-gender"
            value={filters.gender}
            onChange={(e) => onChange({ ...filters, gender: e.target.value as any })}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ALL">Any Gender</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="OTHER">Other / Mixed</option>
          </select>
        </div>

        {/* Location search */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Location</label>
          <input
            id="filter-location"
            type="text"
            placeholder="Village, District, State..."
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Max Budget {filters.maxPrice ? `(₹${filters.maxPrice.toLocaleString('en-IN')})` : ''}
          </label>
          <input
            id="filter-max-price"
            type="number"
            min="0"
            placeholder="e.g. 50000"
            value={filters.maxPrice ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Sort Order</label>
          <select
            id="filter-sort"
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="newest">Newest Listings</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="oldest">Oldest Listings</option>
          </select>
        </div>
      </div>
    </div>
  );
};
