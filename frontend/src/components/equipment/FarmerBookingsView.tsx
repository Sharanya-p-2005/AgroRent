import React, { useState, useEffect } from 'react';
import { Booking } from '../../types/equipment.js';
import { farmerApi } from '../../services/api.js';
import { PaymentStatusBadge } from '../payments/PaymentStatusBadge.js';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  Tractor,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { ReviewFormModal, EligibleReviewItem } from '../reviews/ReviewFormModal.js';
import { ReceiptButton } from '../invoices/ReceiptButton.js';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';
import { formatBookingSchedule } from '../../utils/helpers.js';

interface FarmerBookingsViewProps {
  onBrowseEquipment: () => void;
}

export const FarmerBookingsView: React.FC<FarmerBookingsViewProps> = ({
  onBrowseEquipment,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewModalItem, setReviewModalItem] = useState<EligibleReviewItem | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await farmerApi.getBookings();
      if (res.data && res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err: any) {
      console.error('[FarmerBookingsView] Error fetching bookings:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to fetch bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this equipment booking request?')) {
      return;
    }

    setCancellingId(id);
    try {
      const res = await farmerApi.cancelBooking(id);
      if (res.data && res.data.success) {
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Booking accepted by owner
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Waiting for owner confirmation
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-1 text-xs font-bold">
            <Tractor className="h-3.5 w-3.5 text-indigo-600" />
            Equipment rental is in progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-1 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            Rental finished
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-700 px-2.5 py-1 text-xs font-bold">
            <XCircle className="h-3.5 w-3.5 text-stone-500" />
            Booking cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-xs font-bold">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            Booking declined
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-stone-100 text-stone-700 px-2.5 py-1 text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            My Equipment Bookings
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Track rental reservations, owner confirmations, and schedules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBookings}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onBrowseEquipment}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
          >
            <Tractor className="h-3.5 w-3.5" />
            <span>Rent More Equipment</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
        {['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {st === 'ALL'
              ? 'All Bookings'
              : st === 'PENDING'
              ? 'Pending'
              : st === 'CONFIRMED'
              ? 'Confirmed'
              : st === 'ACTIVE'
              ? 'Active'
              : st === 'COMPLETED'
              ? 'Completed'
              : st === 'CANCELLED'
              ? 'Cancelled'
              : 'Declined'}
          </button>
        ))}
      </div>

      {/* Error Message */}
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
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs font-medium">Loading your bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
          <CalendarCheck className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">No bookings found</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            You haven't reserved any machinery with this filter status. Browse verified tractors and harvesters for your farm.
          </p>
          <button
            type="button"
            onClick={onBrowseEquipment}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <Tractor className="h-4 w-4" />
            <span>Browse Equipment Catalog</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs hover:border-emerald-200 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-20 sm:h-20 sm:w-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                    <CategoryPlaceholderImage
                      src={booking.equipment_image_url}
                      alt={booking.equipment_name || 'Equipment'}
                      category={booking.equipment_category}
                      aspectClassName="h-full w-full"
                      size="sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-stone-400">
                        #{booking.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(booking.booking_status || booking.status)}
                      {booking.payment_status && (
                        <PaymentStatusBadge status={booking.payment_status} size="sm" />
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {booking.equipment_name || 'Agricultural Equipment'}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      {booking.equipment_category} • {booking.equipment_brand} {booking.equipment_model}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-start">
                  <div className="text-[11px] text-stone-400 font-medium">Total Amount</div>
                  <div className="text-xl font-black text-emerald-800">
                    ₹{booking.total_amount}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {booking.total_hours ?? booking.duration_hours ?? 0} hrs @ ₹{booking.price_per_hour}/hr
                  </div>
                </div>
              </div>

              {/* Schedule and Owner Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Dates & Hours */}
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-100 space-y-1">
                  <span className="text-stone-400 font-medium block">Rental Schedule</span>
                  <div className="font-semibold text-stone-800">
                    {formatBookingSchedule(booking.booking_date, booking.start_time, booking.end_time)}
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Duration: {booking.total_hours ?? booking.duration_hours ?? 0} operating hours
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-100 space-y-1">
                  <span className="text-stone-400 font-medium block">Delivery / Field Location</span>
                  <div className="flex items-start gap-1 font-semibold text-stone-800">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {booking.delivery_location || booking.equipment_location || 'Owner Location'}
                    </span>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-100 space-y-1">
                  <span className="text-stone-400 font-medium block">Equipment Owner</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-semibold text-stone-800">
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{booking.owner_name || 'Machine Owner'}</span>
                    </div>
                    {booking.owner_phone && (
                      <span className="font-mono text-[11px] text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {booking.owner_phone}
                      </span>
                    )}
                  </div>
                  {booking.owner_village && (
                    <div className="text-[11px] text-stone-500">
                      {booking.owner_village}, {booking.owner_district}
                    </div>
                  )}
                </div>
              </div>

              {booking.notes && (
                <div className="text-xs text-stone-600 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                  <strong className="text-stone-700">Farmer Notes: </strong>
                  {booking.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  {booking.payment_status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Paid in Full
                    </span>
                  ) : (booking.status === 'APPROVED' || (booking.status as string) === 'CONFIRMED' || booking.booking_status === 'CONFIRMED') ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      Invoice generated • Pay via Payments tab
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <ReceiptButton entityType="booking" entityId={booking.id} label="Invoice / Receipt" />

                  {booking.status === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() =>
                        setReviewModalItem({
                          source_type: 'EQUIPMENT_BOOKING',
                          source_id: booking.id,
                          target_type: 'EQUIPMENT',
                          target_id: booking.equipment_id,
                          target_name: booking.equipment_name || 'Machinery Rental',
                          details: `Completed rental with ${booking.owner_name || 'Owner'}`,
                          sourceType: 'EQUIPMENT_BOOKING',
                          sourceId: booking.id,
                          targetType: 'EQUIPMENT',
                          targetId: booking.equipment_id,
                          targetName: booking.equipment_name || 'Machinery Rental',
                          subtitle: `Completed rental with ${booking.owner_name || 'Owner'}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      <span>Rate & Review</span>
                    </button>
                  )}

                  {booking.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-rose-700 hover:bg-rose-50 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span>{cancellingId === booking.id ? 'Cancelling...' : 'Cancel Request'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
