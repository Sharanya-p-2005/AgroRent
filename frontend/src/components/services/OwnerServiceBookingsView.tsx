import React, { useState, useEffect } from 'react';
import { ServiceBooking } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import {
  CalendarCheck,
  Truck,
  Users,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';

export const OwnerServiceBookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'ALL' | 'DRIVER' | 'FARM_WORKER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceBookingsApi.getOwnerBookings();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBookings(res.data.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id: string, action: 'confirm' | 'reject' | 'active' | 'complete') => {
    setActionLoadingId(id);
    try {
      let res;
      if (action === 'confirm') res = await serviceBookingsApi.confirmBooking(id);
      else if (action === 'reject') res = await serviceBookingsApi.rejectBooking(id);
      else if (action === 'active') res = await serviceBookingsApi.markActive(id);
      else if (action === 'complete') res = await serviceBookingsApi.markComplete(id);

      if (res?.data?.success) {
        await fetchBookings();
      } else {
        alert(res?.data?.message || 'Operation failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not update booking status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeType !== 'ALL' && b.service_type !== activeType) return false;
    if (statusFilter !== 'ALL' && b.booking_status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Awaiting Confirmation
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5" />
            Work In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled by Farmer
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Service Booking Requests</h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage incoming field appointments, dispatch drivers, and complete work logs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Service Type Tab */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setActiveType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeType === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveType('DRIVER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                activeType === 'DRIVER' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Drivers
            </button>
            <button
              onClick={() => setActiveType('FARM_WORKER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                activeType === 'FARM_WORKER' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Workers
            </button>
          </div>

          {/* Status Dropdown */}
          <select
            id="owner-booking-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Declined</option>
          </select>

          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading service booking requests...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">No Booking Requests</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            You currently have no incoming service booking requests matching this criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isDriver = booking.service_type === 'DRIVER';
            const isActing = actionLoadingId === booking.id;

            return (
              <div
                key={booking.id}
                id={`owner-booking-${booking.id}`}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Service Profile and Status */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isDriver ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isDriver ? 'Driver' : 'Farm Worker'}
                      </span>
                      <h3 className="font-bold text-stone-900 text-base">{booking.profile_name}</h3>
                      {getStatusBadge(booking.booking_status)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-stone-800">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {booking.booking_date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {booking.start_time} - {booking.end_time} ({booking.duration_hours} hrs)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {booking.work_location}
                      </span>
                    </div>

                    {/* Farmer Contact Info */}
                    <div className="flex items-center gap-3 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100 mt-2">
                      <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-semibold">{booking.farmer_name || 'Farmer Client'}</span>
                      {booking.farmer_phone && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <Phone className="w-3.5 h-3.5" />
                            {booking.farmer_phone}
                          </span>
                        </>
                      )}
                    </div>

                    {booking.work_description && (
                      <p className="text-xs text-stone-600 italic mt-1">
                        "{booking.work_description}"
                      </p>
                    )}
                  </div>

                  {/* Financial & Status Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                        Booking Value
                      </div>
                      <div className="text-xl font-extrabold text-stone-900">
                        ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Payment Status:{' '}
                        <span className="font-semibold text-emerald-700">{booking.payment_status}</span>
                      </div>
                    </div>

                    {/* Action Flow according to status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {booking.booking_status === 'PENDING' && (
                        <>
                          <button
                            id={`btn-confirm-${booking.id}`}
                            onClick={() => handleAction(booking.id, 'confirm')}
                            disabled={isActing}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept & Confirm
                          </button>
                          <button
                            id={`btn-reject-${booking.id}`}
                            onClick={() => handleAction(booking.id, 'reject')}
                            disabled={isActing}
                            className="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {booking.booking_status === 'CONFIRMED' && (
                        <button
                          id={`btn-active-${booking.id}`}
                          onClick={() => handleAction(booking.id, 'active')}
                          disabled={isActing}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Work (Mark Active)
                        </button>
                      )}

                      {booking.booking_status === 'ACTIVE' && (
                        <button
                          id={`btn-complete-${booking.id}`}
                          onClick={() => handleAction(booking.id, 'complete')}
                          disabled={isActing}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete Work
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
