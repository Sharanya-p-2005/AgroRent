import React, { useState, useEffect } from 'react';
import { AnimalOrder, AnimalOrderStatus } from '../../types/animal.js';
import { farmerApi } from '../../services/api.js';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
  Search,
  Package,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { ReviewFormModal, EligibleReviewItem } from '../reviews/ReviewFormModal.js';
import { ReceiptButton } from '../invoices/ReceiptButton.js';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface FarmerAnimalOrdersViewProps {
  onBrowseMarketplace?: () => void;
}

export const FarmerAnimalOrdersView: React.FC<FarmerAnimalOrdersViewProps> = ({
  onBrowseMarketplace,
}) => {
  const [orders, setOrders] = useState<AnimalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AnimalOrderStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancellation state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<AnimalOrder | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reviewModalItem, setReviewModalItem] = useState<EligibleReviewItem | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await farmerApi.getAnimalOrders();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setError('Unable to load orders');
      }
    } catch (err: any) {
      console.error('[FarmerAnimalOrdersView] Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Error loading orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancellingOrderId(orderToCancel.id);
    setCancelError(null);
    try {
      const res = await farmerApi.cancelAnimalOrder(orderToCancel.id);
      if (res.data?.success) {
        setOrderToCancel(null);
        await fetchOrders();
      } else {
        setCancelError(res.data?.message || 'Could not cancel order');
      }
    } catch (err: any) {
      setCancelError(err.response?.data?.message || err.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.listing_name && o.listing_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.delivery_city && o.delivery_city.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: AnimalOrderStatus) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <Clock className="h-3.5 w-3.5" />
            Order Placed
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirmed
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Truck className="h-3.5 w-3.5" />
            Out for Delivery
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600 border border-stone-200">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled by You
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            Declined by Seller
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-700" />
            <span>My Livestock Orders</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Track your cattle, poultry, and animal purchase orders, delivery status, and seller contacts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          {onBrowseMarketplace && (
            <button
              type="button"
              id="btn-farmer-browse-marketplace"
              onClick={onBrowseMarketplace}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by order ID, item name, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs sm:text-sm text-red-800 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs animate-pulse space-y-3"
            >
              <div className="h-5 w-1/3 bg-stone-200 rounded-md" />
              <div className="h-16 w-full bg-stone-100 rounded-xl" />
              <div className="h-8 w-1/4 bg-stone-200 rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">No livestock orders found</h3>
          <p className="max-w-md text-sm text-stone-500 mb-6">
            {orders.length === 0
              ? 'You have not placed any livestock or bird orders yet. Visit the Animal Marketplace to browse available cattle, goats, and poultry.'
              : 'No orders match your selected filter criteria.'}
          </p>
          {onBrowseMarketplace && orders.length === 0 && (
            <button
              type="button"
              onClick={onBrowseMarketplace}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const canCancel = order.order_status === 'PLACED' || order.order_status === 'CONFIRMED';
            return (
              <div
                key={order.id}
                id={`farmer-order-${order.id}`}
                className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-stone-400">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>{getStatusBadge(order.order_status)}</div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                  {/* Item Details */}
                  <div className="flex items-center gap-4 md:col-span-1">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden border border-stone-200 shrink-0">
                      <CategoryPlaceholderImage
                        src={order.listing_image_url}
                        alt={order.listing_name || 'Animal listing'}
                        category={order.listing_category}
                        listingType={order.listing_type}
                        aspectClassName="h-full w-full"
                        size="sm"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                        {order.listing_category || 'Livestock'}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 line-clamp-1">
                        {order.listing_name || 'Listing Item'}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {order.listing_breed ? `Breed: ${order.listing_breed}` : ''}
                      </p>
                      <div className="mt-1 text-xs font-medium text-stone-700">
                        Qty: <span className="font-bold">{order.quantity} units</span> × ₹
                        {order.unit_price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50/70 rounded-2xl p-3.5 border border-stone-100">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <Truck className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Delivery Contact</span>
                    </div>
                    <div className="font-medium text-stone-900">{order.delivery_name}</div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-stone-400" />
                      <span>{order.delivery_phone}</span>
                    </div>
                    <div className="flex items-start gap-1 text-stone-500 line-clamp-2">
                      <MapPin className="h-3 w-3 text-stone-400 shrink-0 mt-0.5" />
                      <span>
                        {order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="flex flex-col justify-between sm:items-end">
                    <div className="sm:text-right">
                      <span className="text-xs text-stone-500 block">Total Order Payable</span>
                      <div className="text-2xl font-black text-stone-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block mt-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {order.payment_status === 'PAID' ? 'Paid' : 'Cash on Delivery'}
                      </span>
                    </div>

                    {order.order_status === 'DELIVERED' && (
                      <div className="mt-4 sm:mt-0">
                        <button
                          type="button"
                          onClick={() =>
                            setReviewModalItem({
                              source_type: 'ANIMAL_ORDER',
                              source_id: order.id,
                              target_type: 'ANIMAL',
                              target_id: order.listing_id,
                              target_name: order.listing_name || 'Livestock Purchase',
                              details: `Delivered order • ₹${order.total_amount.toLocaleString('en-IN')}`,
                              sourceType: 'ANIMAL_ORDER',
                              sourceId: order.id,
                              targetType: 'ANIMAL',
                              targetId: order.listing_id,
                              targetName: order.listing_name || 'Livestock Purchase',
                              subtitle: `Delivered order • ₹${order.total_amount.toLocaleString('en-IN')}`,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>Rate Livestock</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <ReceiptButton entityType="order" entityId={order.id} label="Invoice / Receipt" />

                      {canCancel && (
                        <button
                          type="button"
                          id={`btn-cancel-order-${order.id}`}
                          onClick={() => setOrderToCancel(order)}
                          className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Steps Timeline */}
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <div className="flex items-center justify-between text-xs font-medium text-stone-400">
                    <div className={`flex items-center gap-1 ${order.order_status !== 'CANCELLED' && order.order_status !== 'REJECTED' ? 'text-emerald-700 font-bold' : ''}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>1. Placed</span>
                    </div>
                    <div className="h-0.5 flex-1 mx-2 bg-stone-200" />
                    <div className={`flex items-center gap-1 ${order.order_status === 'CONFIRMED' || order.order_status === 'SHIPPED' || order.order_status === 'DELIVERED' ? 'text-emerald-700 font-bold' : ''}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>2. Confirmed</span>
                    </div>
                    <div className="h-0.5 flex-1 mx-2 bg-stone-200" />
                    <div className={`flex items-center gap-1 ${order.order_status === 'SHIPPED' || order.order_status === 'DELIVERED' ? 'text-emerald-700 font-bold' : ''}`}>
                      <Truck className="h-3.5 w-3.5" />
                      <span>3. In Transit</span>
                    </div>
                    <div className="h-0.5 flex-1 mx-2 bg-stone-200" />
                    <div className={`flex items-center gap-1 ${order.order_status === 'DELIVERED' ? 'text-emerald-700 font-bold' : ''}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>4. Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Cancel Livestock Order</h3>
                <p className="text-xs text-stone-500">Order #{orderToCancel.id.slice(0, 8)}</p>
              </div>
            </div>

            <p className="text-sm text-stone-600">
              Are you sure you want to cancel your order for{' '}
              <span className="font-bold text-stone-900">
                {orderToCancel.quantity} {orderToCancel.listing_name || 'units'}
              </span>
              ? The reserved livestock will be returned to the seller's active marketplace inventory.
            </p>

            {cancelError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelError(null);
                }}
                disabled={cancellingOrderId !== null}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-order"
                onClick={handleConfirmCancel}
                disabled={cancellingOrderId !== null}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {cancellingOrderId ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalItem && (
        <ReviewFormModal
          isOpen={Boolean(reviewModalItem)}
          onClose={() => setReviewModalItem(null)}
          onSuccess={() => {
            setReviewModalItem(null);
            fetchOrders();
          }}
          item={reviewModalItem}
        />
      )}
    </div>
  );
};
