import React, { useState, useEffect } from 'react';
import { Equipment } from '../../types/equipment.js';
import { useAuth } from '../../hooks/useAuth.js';
import { farmerApi, locationsApi } from '../../services/api.js';
import { requestCurrentLocation } from '../../utils/geolocation.js';
import { ReviewsList } from '../reviews/ReviewsList.js';
import { FavoriteButton } from '../FavoriteButton.js';
import {
  X,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Tractor,
  Layers,
  Navigation,
  Loader2
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface EquipmentDetailsModalProps {
  equipment: Equipment;
  onClose: () => void;
  onBookingSuccess: (bookingId: string) => void;
}

export const EquipmentDetailsModal: React.FC<EquipmentDetailsModalProps> = ({
  equipment,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const profile = user?.profile;

  // Default dates: tomorrow 08:00 to tomorrow 16:00 (8 hours)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  const defaultStartTime = `${tomorrowDateStr}T08:00`;
  const defaultEndTime = `${tomorrowDateStr}T16:00`;

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [deliveryLocation, setDeliveryLocation] = useState(
    profile
      ? `${profile.address ? profile.address + ', ' : ''}${profile.village || ''}, ${profile.district || ''}`
      : ''
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved Locations and GPS support
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [destCoords, setDestCoords] = useState<{ latitude?: number; longitude?: number }>({});

  useEffect(() => {
    locationsApi.getAll().then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSavedLocations(res.data.data);
        const def = res.data.data.find((l: any) => l.is_default);
        if (def && !deliveryLocation) {
          setSelectedLocationId(def.id);
          setDeliveryLocation(`${def.address_line1}, ${def.city || def.state}`);
          setDestCoords({ latitude: def.latitude, longitude: def.longitude });
        }
      }
    }).catch(() => {});
  }, []);

  const handleSelectSavedLocation = (id: string) => {
    setSelectedLocationId(id);
    const found = savedLocations.find((l) => l.id === id);
    if (found) {
      setDeliveryLocation(`${found.address_line1}${found.city ? ', ' + found.city : ''}${found.state ? ', ' + found.state : ''}`);
      setDestCoords({ latitude: found.latitude, longitude: found.longitude });
    }
  };

  const handleUseCurrentGPS = async () => {
    try {
      setIsGpsLocating(true);
      const coords = await requestCurrentLocation();
      setDestCoords({ latitude: coords.latitude, longitude: coords.longitude });
      setDeliveryLocation(`GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (Current Location)`);
      setSelectedLocationId('GPS');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to access GPS location.');
    } finally {
      setIsGpsLocating(false);
    }
  };

  // Compute duration in hours and total price
  const calculateDurationHours = (): number => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
    const hours = diffMs / (1000 * 60 * 60);
    if (!Number.isFinite(hours) || hours <= 0) return 0;
    return Math.round(hours * 10) / 10;
  };

  const durationHours = calculateDurationHours();
  const rate = Number(equipment.price_per_hour);
  const safeRate = Number.isFinite(rate) ? rate : 0;
  const rawCost = durationHours * safeRate;
  const totalCost = Number.isFinite(rawCost) ? Math.round(rawCost) : 0;
  const isValidDuration = durationHours > 0;

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!startTime || !endTime) {
      setErrorMessage('Please specify both start and end rental dates/times.');
      return;
    }

    if (durationHours <= 0) {
      setErrorMessage('Rental end time must be after start time.');
      return;
    }

    const startObj = new Date(startTime);
    if (startObj.getTime() < Date.now()) {
      setErrorMessage('Rental start time cannot be in the past.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingDate = startTime.split('T')[0];
      const startHourMinute = startTime.includes('T') ? startTime.split('T')[1].slice(0, 5) : startTime;
      const endHourMinute = endTime.includes('T') ? endTime.split('T')[1].slice(0, 5) : endTime;

      const res = await farmerApi.createBooking({
        equipment_id: equipment.id,
        booking_date: bookingDate,
        start_time: startHourMinute,
        end_time: endHourMinute,
        delivery_location: deliveryLocation.trim() || undefined,
        destination_latitude: destCoords.latitude,
        destination_longitude: destCoords.longitude,
        notes: notes.trim() || undefined,
      } as any);

      if (res.data && res.data.success) {
        onBookingSuccess(res.data.data.id);
      } else {
        setErrorMessage(res.data?.message || 'Failed to confirm booking.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to book equipment. Please try a different time slot.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold">
              <Tractor className="h-3.5 w-3.5" />
              {equipment.category}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              {equipment.brand} • {equipment.model}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Main Equipment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="aspect-4/3 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                <CategoryPlaceholderImage
                  src={equipment.image_url}
                  alt={equipment.name}
                  category={equipment.category}
                  aspectClassName="aspect-4/3"
                />
              </div>

              {/* Owner Contact Box */}
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Equipment Owner Information
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-stone-800">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span>{equipment.owner_name || 'Verified Owner'}</span>
                  </div>
                  {equipment.owner_phone && (
                    <div className="flex items-center gap-1 font-mono text-stone-700 bg-white px-2 py-1 rounded-lg border border-stone-200">
                      <Phone className="h-3 w-3 text-stone-400" />
                      <span>{equipment.owner_phone}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-stone-600">
                  <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span>{equipment.location}</span>
                </div>
              </div>
            </div>

            {/* Details & Specifications */}
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
                  {equipment.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                    ₹{equipment.price_per_hour}
                  </span>
                  <span className="text-sm font-medium text-stone-500">per hour</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Machinery Description
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {equipment.description}
                </p>
              </div>

              {/* Quick Spec Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-stone-400 block text-[11px]">Brand</span>
                  <span className="font-semibold text-stone-800">{equipment.brand}</span>
                </div>
                <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-stone-400 block text-[11px]">Model</span>
                  <span className="font-semibold text-stone-800">{equipment.model}</span>
                </div>
                <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-stone-400 block text-[11px]">Availability</span>
                  <span
                    className={`font-semibold ${
                      equipment.availability_status === 'AVAILABLE'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {equipment.availability_status}
                  </span>
                </div>
                <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-stone-400 block text-[11px]">Verification</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {equipment.approval_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Booking Section */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-700" />
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Book this Machinery
              </h3>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm text-stone-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm text-stone-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Farm / Field Delivery Location
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentGPS}
                    disabled={isGpsLocating}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
                  >
                    {isGpsLocating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Navigation className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>Use Current GPS</span>
                  </button>
                </div>

                {savedLocations.length > 0 && (
                  <div className="mb-2">
                    <select
                      value={selectedLocationId}
                      onChange={(e) => handleSelectSavedLocation(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 font-medium focus:outline-emerald-600"
                    >
                      <option value="">-- Choose from your Saved Farm Locations --</option>
                      {savedLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.label} ({loc.address_line1}, {loc.city || loc.state}) {loc.is_default ? '⭐ Default' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Enter village, survey number, or landmark where machine is required"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm text-stone-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Specific Requirements or Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. 5 acres deep tilling required, please bring disc harrow attachment"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm text-stone-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Price Calculation Card */}
              <div className="rounded-xl bg-white border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-stone-500 font-medium">
                    Calculated Duration:
                  </div>
                  <div className="flex items-center gap-1 text-stone-800 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>{durationHours > 0 ? `${durationHours} hours` : 'Invalid dates'}</span>
                    <span className="text-stone-400 font-normal">
                      (@ ₹{equipment.price_per_hour}/hr)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-stone-500 font-medium">Total Rental Amount</div>
                  <div className="text-2xl font-black text-emerald-800">
                    ₹{isValidDuration ? totalCost : 0}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValidDuration || equipment.availability_status !== 'AVAILABLE'}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending Booking Request...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Verified Customer Reviews */}
          <div className="pt-2">
            <ReviewsList targetType="EQUIPMENT" targetId={equipment.id} title="Verified Farmer Reviews" />
          </div>
        </div>
      </div>
    </div>
  );
};
