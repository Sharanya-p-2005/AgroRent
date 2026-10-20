import React, { useState } from 'react';
import { ServiceProfile } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import { Calendar, Clock, MapPin, FileText, AlertCircle, CheckCircle, X, ShieldAlert, DollarSign } from 'lucide-react';

interface ServiceBookingModalProps {
  service: ServiceProfile;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  if (!isOpen) return null;

  const isDriver = service.service_type === 'DRIVER';
  const todayStr = new Date().toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingMode, setBookingMode] = useState<'hourly' | 'daily'>('hourly');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [workLocation, setWorkLocation] = useState('');
  const [workDescription, setWorkDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate duration in hours
  const calculateDuration = () => {
    if (bookingMode === 'daily') {
      return numberOfDays * 8;
    }
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff <= 0) return 0;
    return Math.round((diff / 60) * 10) / 10;
  };

  const durationHours = calculateDuration();

  // Calculate estimated total price
  const calculateTotal = () => {
    if (bookingMode === 'daily') {
      return numberOfDays * service.price_per_day;
    }
    return Math.round(durationHours * service.price_per_hour);
  };

  const estimatedTotal = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!bookingDate) {
      setError('Please select a booking date');
      return;
    }

    if (bookingDate < todayStr) {
      setError('Cannot book for a past date');
      return;
    }

    if (bookingMode === 'hourly') {
      if (durationHours <= 0) {
        setError('End time must be after start time');
        return;
      }
    }

    if (!workLocation.trim()) {
      setError('Please enter the farm or work location');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        service_profile_id: service.id,
        booking_date: bookingDate,
        start_time: bookingMode === 'daily' ? '08:00' : startTime,
        end_time: bookingMode === 'daily' ? '17:00' : endTime,
        duration_hours: durationHours,
        is_daily_booking: bookingMode === 'daily',
        number_of_days: bookingMode === 'daily' ? numberOfDays : 1,
        work_location: workLocation.trim(),
        work_description: workDescription.trim() || undefined,
      };

      const res = await serviceBookingsApi.createBooking(payload);
      if (res.data?.success) {
        setSuccessMsg('Booking requested successfully! The provider will confirm shortly.');
        setTimeout(() => {
          onBookingSuccess();
          onClose();
        }, 1500);
      } else {
        setError(res.data?.message || 'Failed to place booking request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="service-booking-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150"
      >
        {/* Header */}
        <div
          className={`p-5 flex items-center justify-between text-white ${
            isDriver ? 'bg-blue-700' : 'bg-emerald-700'
          }`}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-80">
              {isDriver ? 'Driver Booking' : 'Farm Worker Booking'}
            </div>
            <h2 className="text-xl font-bold">{service.name}</h2>
            <div className="text-xs opacity-90 mt-0.5">{service.location}</div>
          </div>
          <button
            id="btn-close-booking-modal"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Booking Mode Selector (Hourly vs Full Day) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Booking Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-mode-hourly"
                onClick={() => setBookingMode('hourly')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border text-center transition-all ${
                  bookingMode === 'hourly'
                    ? isDriver
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm ring-1 ring-blue-600'
                      : 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm ring-1 ring-emerald-600'
                    : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Hourly Work
                <div className="text-[11px] font-normal text-stone-500 mt-0.5">
                  ₹{service.price_per_hour}/hr
                </div>
              </button>

              <button
                type="button"
                id="btn-mode-daily"
                onClick={() => setBookingMode('daily')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border text-center transition-all ${
                  bookingMode === 'daily'
                    ? isDriver
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm ring-1 ring-blue-600'
                      : 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm ring-1 ring-emerald-600'
                    : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Full Day Package
                <div className="text-[11px] font-normal text-stone-500 mt-0.5">
                  ₹{service.price_per_day}/day (8 hrs)
                </div>
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Service Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="input-booking-date"
                type="date"
                min={todayStr}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Time or Days Selection */}
          {bookingMode === 'hourly' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="input-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="input-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Number of Days
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="input-number-days"
                  type="number"
                  min="1"
                  max="30"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-32 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <span className="text-xs text-stone-500">
                  Standard shifts (approx. 8 hours per day)
                </span>
              </div>
            </div>
          )}

          {/* Work Location */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Farm / Work Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="input-work-location"
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Survey #42, Maddur Green Valley Farms"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Work Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Work Description & Requirements
            </label>
            <textarea
              id="input-work-description"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={2}
              placeholder={
                isDriver
                  ? 'e.g. Tractor ploughing 4 acres of wetland paddy field with disc plough'
                  : 'e.g. Manual weeding in 2 acres chili crop and setting up drip nozzles'
              }
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Calculation Summary Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Duration / Days:</span>
              <span className="font-semibold text-stone-900">
                {bookingMode === 'hourly' ? `${durationHours} Hours` : `${numberOfDays} Day(s)`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span>Unit Rate:</span>
              <span className="font-semibold text-stone-900">
                ₹{bookingMode === 'hourly' ? service.price_per_hour : service.price_per_day}
              </span>
            </div>
            <div className="h-px bg-stone-200 pt-1" />
            <div className="flex justify-between text-sm font-bold text-stone-900">
              <span>Estimated Total:</span>
              <span className={isDriver ? 'text-blue-700' : 'text-emerald-700'}>
                ₹{estimatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-cancel-booking"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-service-booking"
              disabled={loading || durationHours <= 0}
              className={`px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-sm ${
                isDriver
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'
              }`}
            >
              {loading ? 'Submitting...' : 'Confirm & Request Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
