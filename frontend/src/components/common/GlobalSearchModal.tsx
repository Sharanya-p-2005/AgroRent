import React, { useState, useEffect } from 'react';
import { Search, X, Tractor, Bird, UserCheck, Award, BookOpen, MapPin, ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react';
import { api } from '../../services/api';

interface SearchResultGroup {
  equipment: any[];
  animals: any[];
  services: any[];
  schemes: any[];
  resources: any[];
  totalCount: number;
}

export const GlobalSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}> = ({ isOpen, onClose, onNavigateTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultGroup | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedType, location, minPrice, maxPrice, isOpen]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (location) params.append('location', location);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await api.get(`/search?${params.toString()}`);
      if (res.data?.success) {
        setResults(res.data.data);
      }
    } catch (err: any) {
      console.warn('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in duration-150 mt-4 sm:mt-10">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tractors, cows, drivers, government subsidies, farming guides..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden"
            />
            {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />}
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                showFilters ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'equipment', label: 'Equipment & Machinery' },
              { id: 'animals', label: 'Livestock & Birds' },
              { id: 'services', label: 'Drivers & Workers' },
              { id: 'schemes', label: 'Govt Schemes' },
              { id: 'resources', label: 'Farming Resources' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedType === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Collapsible Advanced Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 text-xs animate-in fade-in">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Filter by District / Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mandya, Mysore"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Min Rate (₹)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min price"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Max Rate (₹)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max price"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Search Results Area */}
        <div className="p-4 overflow-y-auto space-y-6 max-h-[60vh]">
          {results ? (
            results.totalCount === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Search className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No items matched your search criteria</p>
                <p className="text-xs text-gray-400 mt-1">Try searching with broader terms or clear location filters</p>
              </div>
            ) : (
              <>
                {/* Equipment Section */}
                {results.equipment.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Tractor className="w-4 h-4 text-emerald-600" />
                        <span>Agricultural Equipment ({results.equipment.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateTab('rent-equipment');
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {results.equipment.map((eq) => (
                        <div
                          key={eq.id}
                          onClick={() => {
                            onClose();
                            onNavigateTab('rent-equipment');
                          }}
                          className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-900">{eq.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{eq.district || eq.location}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-emerald-700">₹{eq.rent_price}</span>
                            <span className="text-[10px] text-gray-400 block">/{eq.price_unit === 'PER_DAY' ? 'day' : 'hr'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Animals Section */}
                {results.animals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Bird className="w-4 h-4 text-emerald-600" />
                        <span>Livestock & Birds ({results.animals.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateTab('animals-birds');
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {results.animals.map((an) => (
                        <div
                          key={an.id}
                          onClick={() => {
                            onClose();
                            onNavigateTab('animals-birds');
                          }}
                          className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-900">{an.name}</p>
                            <p className="text-xs text-gray-500">{an.breed || an.category} • {an.district}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-emerald-700">₹{an.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Section */}
                {results.services.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Skilled Drivers & Labor ({results.services.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateTab('book-services');
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {results.services.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => {
                            onClose();
                            onNavigateTab('book-services');
                          }}
                          className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-900">{srv.provider_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{srv.service_type.replace('_', ' ')} • {srv.district}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-emerald-700">₹{srv.daily_rate || srv.hourly_rate}</span>
                            <span className="text-[10px] text-gray-400 block">{srv.daily_rate ? '/day' : '/hr'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schemes Section */}
                {results.schemes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Government Subsidies & Schemes ({results.schemes.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateTab('schemes');
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {results.schemes.map((sch) => (
                        <div
                          key={sch.id}
                          onClick={() => {
                            onClose();
                            onNavigateTab('schemes');
                          }}
                          className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-900">{sch.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{sch.department} • {sch.category}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg shrink-0">
                            {sch.subsidy_percentage ? `${sch.subsidy_percentage}% Subsidy` : 'Verified Scheme'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              Type keywords above to search all agricultural machinery, animals, driver services, and subsidies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
