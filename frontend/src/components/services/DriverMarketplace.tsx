import React, { useState, useEffect } from 'react';
import { ServiceProfile } from '../../types/service.js';
import { servicesApi, locationsApi } from '../../services/api.js';
import { requestCurrentLocation, calculateDistanceKm } from '../../utils/geolocation.js';
import { ServiceCard } from './ServiceCard.js';
import { ServiceFilterBar } from './ServiceFilterBar.js';
import { ServiceDetailModal } from './ServiceDetailModal.js';
import { ServiceBookingModal } from './ServiceBookingModal.js';
import { Truck, AlertCircle, RefreshCw, CalendarCheck, Navigation, Loader2 } from 'lucide-react';

interface DriverMarketplaceProps {
  onGoToBookings?: () => void;
}

export const DriverMarketplace: React.FC<DriverMarketplaceProps> = ({ onGoToBookings }) => {
  const [drivers, setDrivers] = useState<ServiceProfile[]>([]);
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
  const [selectedDriver, setSelectedDriver] = useState<ServiceProfile | null>(null);
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

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await servicesApi.getAll({
        service_type: 'DRIVER',
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
        setDrivers(list);
      } else {
        setDrivers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load driver profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrivers();
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

  const handleOpenDetail = (driver: ServiceProfile) => {
    setSelectedDriver(driver);
    setIsDetailOpen(true);
  };

  const handleOpenBooking = (driver: ServiceProfile) => {
    setSelectedDriver(driver);
    setIsBookingOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-700/60 text-blue-200 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5" />
            Agricultural Machinery Drivers
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hire Certified Farm Drivers</h1>
          <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
            Book verified operators for tractors, rotavators, combine harvesters, power tillers, and JCB excavators on flexible hourly or daily terms.
          </p>
        </div>

        {onGoToBookings && (
          <button
            id="btn-view-my-driver-bookings"
            onClick={onGoToBookings}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <CalendarCheck className="w-4 h-4 text-blue-700" />
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
        serviceType="DRIVER"
        nearMeActive={nearMeActive}
        onToggleNearMe={handleToggleNearMe}
        isLocating={isLocating}
      />

      {/* Driver Listings Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading verified tractor and machinery drivers...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchDrivers}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">No Drivers Match Your Criteria</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try adjusting your search terms, location, or maximum rate filters to find available agricultural machinery drivers.
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
          {drivers.map((driver) => (
            <ServiceCard
              key={driver.id}
              service={driver}
              userDistanceKm={driver.distance_km}
              onViewDetails={handleOpenDetail}
              onBookNow={handleOpenBooking}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ServiceDetailModal
        service={selectedDriver}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBookNow={handleOpenBooking}
      />

      {selectedDriver && (
        <ServiceBookingModal
          service={selectedDriver}
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
