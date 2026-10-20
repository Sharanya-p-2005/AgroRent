import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Tractor,
  Beef,
  Truck,
  Users,
  FileText,
  MapPin,
  Tag,
  Star,
  ArrowRight,
  X,
  Filter,
} from 'lucide-react';
import { aiApi } from '../../services/api.js';

interface AINaturalSearchProps {
  onNavigate?: (tab: string, itemData?: any) => void;
}

export const AINaturalSearch: React.FC<AINaturalSearchProps> = ({ onNavigate }) => {
  const [queryText, setQueryText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleQueries = [
    'Find a tractor under ₹1200 per hour',
    'Dairy cows in Bangalore',
    'Experienced drivers near Mandya',
    'Solar agriculture pump subsidies',
  ];

  const handleSearch = async (text?: string) => {
    const q = (text || queryText).trim();
    if (!q) return;

    if (text) setQueryText(text);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await aiApi.search(q);
      if (res.data?.success && res.data?.data) {
        setSearchResult(res.data.data);
      } else {
        setSearchResult(null);
      }
    } catch {
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQueryText('');
    setSearchResult(null);
    setHasSearched(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-gray-800">
          AI Natural Language Search
        </h3>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
          Smart Query
        </span>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex items-center space-x-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Type in everyday language (e.g. 'Tractors under ₹1000/hr in Mandya' or 'Dairy cows')..."
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {queryText && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSearching || !queryText.trim()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center space-x-1.5 transition cursor-pointer shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </form>

      {/* Suggestion Chips */}
      {!hasSearched && (
        <div className="mt-2.5 flex items-center space-x-1.5 flex-wrap gap-y-1 text-xs">
          <span className="text-gray-400 text-[11px] mr-1">Examples:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSearch(sq)}
              className="bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 px-2.5 py-0.5 rounded-full transition cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Results Section */}
      {isSearching && (
        <div className="mt-4 p-4 text-center text-sm text-gray-500 flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Understanding query & searching agricultural database...</span>
        </div>
      )}

      {!isSearching && hasSearched && searchResult && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Parsed Filters Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-600 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Interpreted Filters:
            </span>
            {searchResult.target_type && (
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                Type: {searchResult.target_type}
              </span>
            )}
            {searchResult.filters?.category && (
              <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                Category: {searchResult.filters.category}
              </span>
            )}
            {searchResult.filters?.max_price && (
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                Max Price: ₹{searchResult.filters.max_price}
              </span>
            )}
            {searchResult.filters?.location_query && (
              <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-medium">
                Location: {searchResult.filters.location_query}
              </span>
            )}
          </div>

          <p className="text-xs text-emerald-800 font-medium mb-3">
            ✓ {searchResult.explanation}
          </p>

          {/* Results cards */}
          {searchResult.results?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResult.results.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold text-sm text-gray-900 line-clamp-1">
                        {r.name || r.title || r.worker_name || r.driver_name}
                      </h5>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.category || r.service_type || 'Agricultural listing'}
                      </p>
                    </div>
                    {(r.price_per_hour || r.price) && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {r.price_per_hour ? `₹${r.price_per_hour}/hr` : `₹${Number(r.price).toLocaleString('en-IN')}`}
                      </span>
                    )}
                  </div>

                  {r.location && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                      <span className="truncate">{r.location}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) {
                        if (searchResult.target_type === 'EQUIPMENT') onNavigate('rent-equipment', r);
                        else if (searchResult.target_type === 'ANIMAL') onNavigate('animals-birds', r);
                        else if (searchResult.target_type === 'DRIVER') onNavigate('drivers', r);
                        else if (searchResult.target_type === 'WORKER') onNavigate('farm-workers', r);
                        else if (searchResult.target_type === 'SCHEME') onNavigate('government-schemes', r);
                      }
                    }}
                    className="mt-2.5 w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white border border-gray-200 hover:border-emerald-300 py-1.5 rounded transition cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-2">
              No direct matches found. Try broadening price limits or location filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
