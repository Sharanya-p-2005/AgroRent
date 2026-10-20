import React, { useState, useEffect } from 'react';
import { Booking } from '../../types/equipment.js';
import { ownerApi } from '../../services/api.js';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  User,
  MapPin,
  RefreshCw,
  AlertCircle,
  Check,
  Ban,
  Tractor,
  Play
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';
import { formatBookingSchedule } from '../../utils/helpers.js';

export const OwnerBookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ownerApi.getBookings();
      if (res.data && res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err: any) {
      console.error('[OwnerBookingsView] fetch error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load booking requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: 'CONFIRMED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'APPROVED'
  ) => {
    setUpdatingId(bookingId);
    try {
      const res = await ownerApi.updateBookingStatus(bookingId, newStatus as any);
      if (res.data && res.data.success) {
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const normalizeStatus = (status?: string): string => {
    if (!status) return 'PENDING';
    if (status === 'APPROVED') return 'CONFIRMED';
    return status;
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    const current = normalizeStatus(b.booking_status || b.status);
    return current === filterStatus;
  });

  const getStatusBadge = (rawStatus: string) => {
    const status = normalizeStatus(rawStatus);
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Booking accepted by owner
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold">
            <Clock className="h-3 w-3 text-amber-600" />
            Waiting for owner confirmation
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-xs font-bold">
            <Tractor className="h-3 w-3 text-indigo-600" />
            Equipment rental is in progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-bold">
            <CheckCircle2 className="h-3 w-3 text-blue-600" />
            Rental finished
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-xs font-bold">
            <XCircle className="h-3 w-3 text-rose-600" />
            Booking declined
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-700 px-2.5 py-0.5 text-xs font-bold">
            Booking cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Equipment Booking Requests
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Review farmer rental orders, approve availability, and record completions
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBookings}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
        {['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-amber-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {st === 'ALL'
              ? 'All Requests'
              : st === 'PENDING'
              ? 'Pending'
              : st === 'CONFIRMED'
              ? 'Confirmed'
              : st === 'ACTIVE'
              ? 'Active'
              : st === 'COMPLETED'
              ? 'Completed'
              : st === 'REJECTED'
              ? 'Declined'
              : 'Cancelled'}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchBookings}
            className="ml-auto font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mb-2" />
          <p className="text-xs font-medium">Loading booking requests...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
          <CalendarCheck className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">No requests found</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            There are currently no customer booking requests with this status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-14 w-16 sm:h-16 sm:w-20 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                    <CategoryPlaceholderImage
                      src={booking.equipment_image_url}
                      alt={booking.equipment_name || 'Machinery'}
                      category={booking.equipment_category}
                      aspectClassName="h-full w-full"
                      size="sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-stone-400">
                        #{booking.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(booking.booking_status || booking.status)}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {booking.equipment_name || 'Machinery'}
                    </h3>
                    <div className="text-xs text-stone-500 font-medium">
                      {booking.equipment_category}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-stone-400 font-medium">Earnings / Fee</div>
                  <div className="text-xl font-black text-amber-800">
                    ₹{booking.total_amount}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {booking.total_hours ?? booking.duration_hours ?? 0} hrs @ ₹{booking.price_per_hour}/hr
                  </div>
                </div>
              </div>

              {/* Farmer and Schedule Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Farmer Info */}
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-100 space-y-1">
                  <span className="text-stone-400 font-medium block">Renting Farmer</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-semibold text-stone-800">
                      <User className="h-3.5 w-3.5 text-amber-600" />
                      <span>{booking.farmer_name || 'Farmer'}</span>
                    </div>
                    {booking.farmer_phone && (
                      <span className="font-mono text-[11px] text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {booking.farmer_phone}
                      </span>
                    )}
                  </div>
                  {booking.farmer_village && (
                    <div className="text-[11px] text-stone-500">
                      {booking.farmer_village}, {booking.farmer_district}
                    </div>
                  )}
                </div>

                {/* Rental Schedule */}
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-100 space-y-1">
                  <span className="text-stone-400 font-medium block">Rental Slot</span>
                  <div className="font-semibold text-stone-800">
                    {formatBookingSchedule(booking.booking_date, booking.start_time, booking.end_time)}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Duration: {booking.total_hours ?? booking.duration_hours ?? 0} operating hours
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-100 space-y-1">
                  <span className="text-stone-400 font-medium block">Work Location</span>
                  <div className="flex items-start gap-1 font-semibold text-stone-800">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {booking.delivery_location || 'Customer Farm'}
                    </span>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <strong className="text-stone-700">Special Instructions: </strong>
                  {booking.notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-100">
                {normalizeStatus(booking.booking_status || booking.status) === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                      disabled={updatingId === booking.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Decline Booking</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                      disabled={updatingId === booking.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept Booking</span>
                    </button>
                  </>
                )}

                {normalizeStatus(booking.booking_status || booking.status) === 'CONFIRMED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(booking.id, 'ACTIVE')}
                      disabled={updatingId === booking.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Rental</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                      disabled={updatingId === booking.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  </>
                )}

                {normalizeStatus(booking.booking_status || booking.status) === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                    disabled={updatingId === booking.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Finish Rental</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
