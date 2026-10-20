import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory } from '../../types/equipment.js';
import { equipmentApi, locationsApi } from '../../services/api.js';
import { requestCurrentLocation, calculateDistanceKm } from '../../utils/geolocation.js';
import { EquipmentCard } from './EquipmentCard.js';
import { EquipmentDetailsModal } from './EquipmentDetailsModal.js';
import {
  Search,
  Filter,
  Tractor,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  MapPin,
  Navigation,
  Loader2,
  X
} from 'lucide-react';

const CATEGORIES: Array<'All' | EquipmentCategory> = [
  'All',
  'Tractor',
  'Harvester',
  'Rotavator',
  'Cultivator',
  'Water Pump',
  'JCB',
  'Power Tiller',
  'Seeder',
  'Sprayer',
  'Other',
];

interface EquipmentMarketplaceProps {
  onGoToBookings?: () => void;
}

export const EquipmentMarketplace: React.FC<EquipmentMarketplaceProps> = ({ onGoToBookings }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EquipmentCategory>('All');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest' | 'nearest'>('newest');

  // Location / Near Me State
  const [nearMeActive, setNearMeActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [locationName, setLocationName] = useState<string>('');

  // Modal State
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Try auto-fetching default saved location
  useEffect(() => {
    locationsApi.getAll().then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        const defaultLoc = res.data.data.find((l: any) => l.is_default) || res.data.data[0];
        if (defaultLoc && defaultLoc.latitude && defaultLoc.longitude) {
          setUserCoords({ latitude: defaultLoc.latitude, longitude: defaultLoc.longitude });
          setLocationName(defaultLoc.city || defaultLoc.label);
        }
      }
    }).catch(() => {});
  }, []);

  const handleToggleNearMe = async () => {
    if (nearMeActive) {
      setNearMeActive(false);
      if (sortBy === 'nearest') setSortBy('newest');
      return;
    }

    try {
      setIsLocating(true);
      setErrorMessage(null);
      let coords = userCoords;
      if (!coords) {
        const gps = await requestCurrentLocation();
        coords = { latitude: gps.latitude, longitude: gps.longitude };
        setUserCoords(coords);
        setLocationName('Current GPS');
      }
      setNearMeActive(true);
      setSortBy('nearest');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to access your location. Please enter a location manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const fetchEquipment = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (typeof maxPrice === 'number' && maxPrice > 0) params.maxPrice = maxPrice;
      if (locationFilter.trim()) params.location = locationFilter.trim();
      if (sortBy) params.sort = sortBy;

      if (nearMeActive && userCoords) {
        params.latitude = userCoords.latitude;
        params.longitude = userCoords.longitude;
        params.radius = radiusKm;
      }

      const res = await equipmentApi.getAll(params);
      if (res.data && res.data.success) {
        let list = res.data.data || [];

        // Client-side distance calculation fallback if items have lat/lon
        if (userCoords) {
          list = list.map((item: Equipment) => {
            if (item.distance_km == null && item.latitude && item.longitude) {
              const d = calculateDistanceKm(
                userCoords.latitude,
                userCoords.longitude,
                item.latitude,
                item.longitude
              );
              return { ...item, distance_km: d };
            }
            return item;
          });

          if (sortBy === 'nearest') {
            list.sort((a: Equipment, b: Equipment) => {
              if (a.distance_km == null) return 1;
              if (b.distance_km == null) return -1;
              return a.distance_km - b.distance_km;
            });
          }
        }

        setEquipmentList(list);
      }
    } catch (err: any) {
      console.error('[EquipmentMarketplace] fetch error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load equipment catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEquipment();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, maxPrice, locationFilter, sortBy, nearMeActive, radiusKm]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setMaxPrice('');
    setLocationFilter('');
    setSortBy('newest');
    setNearMeActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700/60 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-xs mb-2">
            <Tractor className="h-3.5 w-3.5" />
            <span>Farm Machinery Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Rent Agricultural Equipment
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Browse tractors, harvesters, tillers, and implements available for rent near your village from verified local owners.
          </p>
        </div>
      </div>

      {/* Success Booking Alert Banner */}
      {successBookingId && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2 text-white shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Booking Request Sent Successfully!
              </h4>
              <p className="text-xs text-emerald-700">
                The equipment owner has been notified. You can track confirmation status in your bookings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onGoToBookings && (
              <button
                type="button"
                onClick={onGoToBookings}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>View My Bookings</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessBookingId(null)}
              className="p-2 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Main Keyword Search */}
          <div className="sm:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tractors, harvesters, brands..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Location Search */}
          <div className="sm:col-span-3 relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter village / district..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Near Me GPS Toggle Button */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleToggleNearMe}
              disabled={isLocating}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                nearMeActive
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className={`w-3.5 h-3.5 ${nearMeActive ? 'text-white' : 'text-emerald-600'}`} />
              )}
              <span>{nearMeActive ? 'Near Me ON' : 'Near Me'}</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs sm:text-sm text-stone-800 font-medium focus:outline-emerald-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="newest">Sort: Newly Listed</option>
              <option value="nearest">Sort: Nearest to Me</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Near Me Active Radius Controls */}
        {nearMeActive && (
          <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Showing machinery within <strong>{radiusKm} km</strong> of your farm ({locationName || 'GPS Location'})
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[15, 30, 50, 100].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                    radiusKm === r
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Horizontal Scroll Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active Filter Badges and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-stone-800">{equipmentList.length}</strong> available machines</span>
          </div>

          {(searchQuery || selectedCategory !== 'All' || locationFilter || maxPrice) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchEquipment}
            className="ml-auto font-bold underline hover:text-rose-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Equipment Results Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-xs sm:text-sm font-medium">Finding available equipment in your area...</p>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
          <Tractor className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">No equipment matches your search</h3>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            Try adjusting your search keywords, location filters, or category selection to see more machinery.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-semibold hover:bg-stone-900 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {equipmentList.map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              userDistanceKm={equipment.distance_km}
              onSelect={(eq) => setSelectedEquipment(eq)}
              onBookNow={(eq) => setSelectedEquipment(eq)}
            />
          ))}
        </div>
      )}

      {/* Details & Booking Modal */}
      {selectedEquipment && (
        <EquipmentDetailsModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onBookingSuccess={(bookingId) => {
            setSelectedEquipment(null);
            setSuccessBookingId(bookingId);
            fetchEquipment();
          }}
        />
      )}
    </div>
  );
};
