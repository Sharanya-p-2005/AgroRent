import React from 'react';
import { Search, MapPin, Filter, RotateCcw, SlidersHorizontal, Navigation, Loader2 } from 'lucide-react';

interface ServiceFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  minExperience: string;
  setMinExperience: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  onReset: () => void;
  serviceType: 'DRIVER' | 'FARM_WORKER';
  nearMeActive?: boolean;
  onToggleNearMe?: () => void;
  isLocating?: boolean;
}

export const ServiceFilterBar: React.FC<ServiceFilterBarProps> = ({
  search,
  setSearch,
  location,
  setLocation,
  minExperience,
  setMinExperience,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  onReset,
  serviceType,
  nearMeActive,
  onToggleNearMe,
  isLocating,
}) => {
  const isDriver = serviceType === 'DRIVER';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="filter-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isDriver
                ? 'Search drivers by name, machine (Tractor, JCB, Harvester)...'
                : 'Search farm workers by name, task (Harvesting, Weeding, Sowing)...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        {/* Location filter */}
        <div className="sm:col-span-4 relative">
          <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="filter-location-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Filter by village, taluk, or district..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        {/* Near Me Button */}
        {onToggleNearMe && (
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={onToggleNearMe}
              disabled={isLocating}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                nearMeActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className={`w-3.5 h-3.5 ${nearMeActive ? 'text-white' : 'text-blue-600'}`} />
              )}
              <span>{nearMeActive ? 'Near Me ON' : 'Near Me'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-stone-100">
        {/* Min Experience */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
            Experience
          </label>
          <select
            id="filter-experience-select"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Any Experience</option>
            <option value="2">2+ Years</option>
            <option value="5">5+ Years</option>
            <option value="8">8+ Years</option>
          </select>
        </div>

        {/* Max Hourly Rate */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
            Max Hourly Rate
          </label>
          <select
            id="filter-price-select"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Any Price</option>
            <option value="200">Up to ₹200/hr</option>
            <option value="350">Up to ₹350/hr</option>
            <option value="500">Up to ₹500/hr</option>
            <option value="750">Up to ₹750/hr</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
            Sort By
          </label>
          <select
            id="filter-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="newest">Recently Listed</option>
            <option value="nearest">Nearest to Me</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="experience">Experience: High to Low</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-end">
          <button
            type="button"
            id="btn-reset-filters"
            onClick={onReset}
            className="w-full py-2 px-3 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
