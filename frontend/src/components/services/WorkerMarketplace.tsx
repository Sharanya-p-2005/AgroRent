import React, { useState, useEffect } from 'react';
import { ServiceProfile } from '../../types/service.js';
import { servicesApi, locationsApi } from '../../services/api.js';
import { requestCurrentLocation, calculateDistanceKm } from '../../utils/geolocation.js';
import { ServiceCard } from './ServiceCard.js';
import { ServiceFilterBar } from './ServiceFilterBar.js';
import { ServiceDetailModal } from './ServiceDetailModal.js';
import { ServiceBookingModal } from './ServiceBookingModal.js';
import { Users, AlertCircle, RefreshCw, CalendarCheck, Navigation, Loader2 } from 'lucide-react';

interface WorkerMarketplaceProps {
  onGoToBookings?: () => void;
}

export const WorkerMarketplace: React.FC<WorkerMarketplaceProps> = ({ onGoToBookings }) => {
  const [workers, setWorkers] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Location / Near Me state
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Modals state
  const [selectedWorker, setSelectedWorker] = useState<ServiceProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Fetch default saved location on mount
  useEffect(() => {
    locationsApi.getAll().then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        const defaultLoc = res.data.data.find((l: any) => l.is_default) || res.data.data[0];
        if (defaultLoc && defaultLoc.latitude && defaultLoc.longitude) {
          setUserCoords({ latitude: defaultLoc.latitude, longitude: defaultLoc.longitude });
        }
      }
    }).catch(() => {});
  }, []);

  const handleToggleNearMe = async () => {
    if (nearMeActive) {
      setNearMeActive(false);
      return;
    }
    try {
      setIsLocating(true);
      let coords = userCoords;
      if (!coords) {
        const gps = await requestCurrentLocation();
        coords = { latitude: gps.latitude, longitude: gps.longitude };
        setUserCoords(coords);
      }
      setNearMeActive(true);
      setSortBy('nearest');
    } catch (err: any) {
      setError(err.message || 'Could not acquire GPS coordinates.');
    } finally {
      setIsLocating(false);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await servicesApi.getAll({
        service_type: 'FARM_WORKER',
        search: search.trim() || undefined,
        location: location.trim() || undefined,
        minExperience: minExperience ? parseInt(minExperience, 10) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        let list = res.data.data;
        if (userCoords) {
          list = list.map((item: ServiceProfile) => {
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
            list.sort((a: ServiceProfile, b: ServiceProfile) => {
              if (a.distance_km == null) return 1;
              if (b.distance_km == null) return -1;
              return a.distance_km - b.distance_km;
            });
          }
        }
        setWorkers(list);
      } else {
        setWorkers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load farm worker profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, location, minExperience, maxPrice, sortBy, nearMeActive]);

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setMinExperience('');
    setMaxPrice('');
    setSortBy('newest');
    setNearMeActive(false);
  };

  const handleOpenDetail = (worker: ServiceProfile) => {
    setSelectedWorker(worker);
    setIsDetailOpen(true);
  };

  const handleOpenBooking = (worker: ServiceProfile) => {
    setSelectedWorker(worker);
    setIsBookingOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            Farm Workers & Field Specialists
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hire Experienced Farm Workers</h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Find skilled manual labor teams and farm specialists for crop harvesting, sowing, weeding, drip irrigation maintenance, and pesticide spraying near your land.
          </p>
        </div>

        {onGoToBookings && (
          <button
            id="btn-view-my-worker-bookings"
            onClick={onGoToBookings}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-700" />
            My Service Bookings
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <ServiceFilterBar
        search={search}
        setSearch={setSearch}
        location={location}
        setLocation={setLocation}
        minExperience={minExperience}
        setMinExperience={setMinExperience}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={handleResetFilters}
        serviceType="FARM_WORKER"
        nearMeActive={nearMeActive}
        onToggleNearMe={handleToggleNearMe}
        isLocating={isLocating}
      />

      {/* Worker Listings Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading verified agricultural workers...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchWorkers}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">No Farm Workers Match Your Search</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try adjusting your search query, location filter, or hourly budget to locate available farm helpers.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <ServiceCard
              key={worker.id}
              service={worker}
              userDistanceKm={worker.distance_km}
              onViewDetails={handleOpenDetail}
              onBookNow={handleOpenBooking}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ServiceDetailModal
        service={selectedWorker}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBookNow={handleOpenBooking}
      />

      {selectedWorker && (
        <ServiceBookingModal
          service={selectedWorker}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onBookingSuccess={() => {
            if (onGoToBookings) onGoToBookings();
          }}
        />
      )}
    </div>
  );
};
