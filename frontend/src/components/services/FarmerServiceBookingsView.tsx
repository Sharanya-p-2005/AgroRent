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
  XCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { ReviewFormModal, EligibleReviewItem } from '../reviews/ReviewFormModal.js';

interface FarmerServiceBookingsViewProps {
  onBrowseDrivers?: () => void;
  onBrowseWorkers?: () => void;
}

export const FarmerServiceBookingsView: React.FC<FarmerServiceBookingsViewProps> = ({
  onBrowseDrivers,
  onBrowseWorkers,
}) => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'ALL' | 'DRIVER' | 'FARM_WORKER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState<ServiceBooking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reviewModalItem, setReviewModalItem] = useState<EligibleReviewItem | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceBookingsApi.getFarmerBookings();
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

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await serviceBookingsApi.cancelBooking(cancellingBooking.id);
      if (res.data?.success) {
        setCancellingBooking(null);
        fetchBookings();
      } else {
        setCancelError(res.data?.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      setCancelError(err.response?.data?.message || err.message || 'Could not cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  // Filter bookings
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
            Pending Approval
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
            In Progress
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
            Cancelled
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
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">My Driver & Worker Bookings</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track appointment statuses, verify work schedules, and contact assigned agricultural professionals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onBrowseDrivers && (
            <button
              id="btn-browse-drivers-from-bookings"
              onClick={onBrowseDrivers}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-4 h-4" />
              Find Drivers
            </button>
          )}
          {onBrowseWorkers && (
            <button
              id="btn-browse-workers-from-bookings"
              onClick={onBrowseWorkers}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-4 h-4" />
              Find Workers
            </button>
          )}
          <button
            id="btn-refresh-bookings"
            onClick={fetchBookings}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            title="Refresh bookings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            id="tab-all-services"
            onClick={() => setActiveType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeType === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Services
          </button>
          <button
            id="tab-driver-services"
            onClick={() => setActiveType('DRIVER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeType === 'DRIVER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Drivers
          </button>
          <button
            id="tab-worker-services"
            onClick={() => setActiveType('FARM_WORKER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeType === 'FARM_WORKER'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Farm Workers
          </button>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Status:</span>
          <select
            id="select-booking-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Declined</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading your service bookings...</p>
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
          <h3 className="text-base font-semibold text-stone-900">No Service Bookings Found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            You have not booked any agricultural drivers or farm workers under this filter yet.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {onBrowseDrivers && (
              <button
                onClick={onBrowseDrivers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Hire a Driver
              </button>
            )}
            {onBrowseWorkers && (
              <button
                onClick={onBrowseWorkers}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Hire a Worker
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isDriver = booking.service_type === 'DRIVER';
            const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.booking_status);

            return (
              <div
                key={booking.id}
                id={`booking-card-${booking.id}`}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-150"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section: Service Profile Info */}
                  <div className="flex items-start gap-3.5">
                    {booking.profile_image_url ? (
                      <img
                        src={booking.profile_image_url}
                        alt={booking.profile_name || 'Service'}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border border-stone-200 shadow-inner shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                          isDriver ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isDriver ? <Truck className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-stone-900 text-base">
                          {booking.profile_name || 'Service Provider'}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDriver
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isDriver ? 'Driver' : 'Farm Worker'}
                        </span>
                        {getStatusBadge(booking.booking_status)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
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

                      {/* Work Description */}
                      {booking.work_description && (
                        <p className="text-xs text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/60 mt-2">
                          <span className="font-medium text-stone-700">Requirement: </span>
                          {booking.work_description}
                        </p>
                      )}

                      {/* Provider Contact */}
                      <div className="flex items-center gap-3 text-xs text-stone-600 pt-1">
                        <span className="flex items-center gap-1 text-emerald-800 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          Contact: {booking.provider_phone || booking.profile_phone || 'Available upon confirmation'}
                        </span>
                        {booking.provider_name && (
                          <span className="text-stone-400">
                            (Provider: {booking.provider_name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Amount & Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100 gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                        Total Amount
                      </div>
                      <div className="text-lg font-bold text-stone-900">
                        ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Payment: <span className="font-semibold text-stone-700">{booking.payment_status}</span>
                      </div>
                    </div>

                    {booking.booking_status === 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewModalItem({
                            sourceType: 'SERVICE_BOOKING',
                            sourceId: booking.id,
                            targetType: isDriver ? 'DRIVER' : 'FARM_WORKER',
                            targetId: booking.service_profile_id,
                            targetName: booking.profile_name || (isDriver ? 'Driver' : 'Farm Worker'),
                            subtitle: `Completed service booking on ${booking.booking_date}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Rate Service</span>
                      </button>
                    )}

                    {canCancel && (
                      <button
                        id={`btn-cancel-booking-${booking.id}`}
                        onClick={() => setCancellingBooking(booking)}
                        className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Cancel Booking?</h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to cancel your appointment with{' '}
              <span className="font-semibold text-stone-900">{cancellingBooking.profile_name}</span> scheduled for{' '}
              <span className="font-semibold text-stone-900">{cancellingBooking.booking_date}</span>?
            </p>

            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-booking"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate & Review Modal */}
      {reviewModalItem && (
        <ReviewFormModal
          isOpen={Boolean(reviewModalItem)}
          onClose={() => setReviewModalItem(null)}
          onSuccess={() => {
            setReviewModalItem(null);
            fetchBookings();
          }}
          item={reviewModalItem}
        />
      )}
    </div>
  );
};
