import React, { useState, useEffect } from 'react';
import { AnimalOrder, AnimalOrderStatus } from '../../types/animal.js';
import { ownerApi } from '../../services/api.js';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
  Search,
  Clock,
  User,
  DollarSign,
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

export const OwnerAnimalOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<AnimalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AnimalOrderStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Processing action state
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ownerApi.getAnimalOrders();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setError('Failed to fetch received animal orders');
      }
    } catch (err: any) {
      console.error('[OwnerAnimalOrdersView] Error:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (orderId: string, action: 'confirm' | 'reject' | 'ship' | 'deliver') => {
    setActionInProgress(orderId);
    setActionError(null);
    try {
      if (action === 'confirm') await ownerApi.confirmAnimalOrder(orderId);
      if (action === 'reject') await ownerApi.rejectAnimalOrder(orderId);
      if (action === 'ship') await ownerApi.shipAnimalOrder(orderId);
      if (action === 'deliver') await ownerApi.deliverAnimalOrder(orderId);

      await fetchOrders();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || `Failed to ${action} order`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.listing_name && o.listing_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.delivery_city && o.delivery_city.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-700" />
            <span>Buyer Livestock Orders</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Review and fulfill purchase orders placed by farmers for your cattle, birds, and livestock.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by order ID, buyer, item, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const).map((st) => (
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

      {actionError && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs sm:text-sm text-red-800 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

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
            <div key={n} className="h-40 rounded-3xl bg-stone-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">No orders received</h3>
          <p className="max-w-md text-sm text-stone-500">
            {orders.length === 0
              ? 'You have not received any orders yet. Ensure your livestock listings are approved and priced competitively.'
              : 'No orders match your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isActing = actionInProgress === order.id;

            return (
              <div
                key={order.id}
                id={`owner-order-${order.id}`}
                className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-stone-400">
                      Ordered on{' '}
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Status Tag */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        order.order_status === 'PLACED'
                          ? 'bg-blue-100 text-blue-800'
                          : order.order_status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.order_status === 'SHIPPED'
                          ? 'bg-amber-100 text-amber-800'
                          : order.order_status === 'DELIVERED'
                          ? 'bg-emerald-200 text-emerald-950 font-extrabold'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {order.order_status}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                  {/* Item info */}
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden border border-stone-200 shrink-0">
                      <CategoryPlaceholderImage
                        src={order.listing_image_url}
                        alt={order.listing_name || 'Livestock'}
                        category={order.listing_category}
                        listingType={order.listing_type}
                        aspectClassName="h-full w-full"
                        size="sm"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-700 uppercase">
                        {order.listing_category || 'Livestock'}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 line-clamp-1">
                        {order.listing_name || 'Listing Item'}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {order.listing_breed ? `Breed: ${order.listing_breed}` : ''}
                      </p>
                      <p className="text-xs font-semibold text-stone-700 mt-1">
                        Quantity: <span className="font-bold text-stone-900">{order.quantity} units</span>
                      </p>
                    </div>
                  </div>

                  {/* Buyer & Delivery Info */}
                  <div className="space-y-1 text-xs text-stone-700 bg-stone-50/80 rounded-2xl p-3.5 border border-stone-100">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <User className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Buyer: {order.delivery_name || order.buyer_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Phone className="h-3 w-3 text-stone-400" />
                      <a href={`tel:${order.delivery_phone}`} className="hover:underline font-medium">
                        {order.delivery_phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-1 text-stone-500">
                      <MapPin className="h-3 w-3 text-stone-400 shrink-0 mt-0.5" />
                      <span>
                        {order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Fulfillment Actions */}
                  <div className="flex flex-col justify-between sm:items-end">
                    <div className="sm:text-right">
                      <span className="text-xs text-stone-500 block">Total Payout</span>
                      <div className="text-2xl font-black text-emerald-800">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        {order.payment_status === 'PAID' ? 'Payment Received' : 'Cash on Delivery'}
                      </span>
                    </div>

                    {/* Order Workflow Action Buttons */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      {order.order_status === 'PLACED' && (
                        <>
                          <button
                            type="button"
                            id={`btn-confirm-order-${order.id}`}
                            onClick={() => handleAction(order.id, 'confirm')}
                            disabled={isActing}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirm Order</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-reject-order-${order.id}`}
                            onClick={() => handleAction(order.id, 'reject')}
                            disabled={isActing}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {order.order_status === 'CONFIRMED' && (
                        <button
                          type="button"
                          id={`btn-ship-order-${order.id}`}
                          onClick={() => handleAction(order.id, 'ship')}
                          disabled={isActing}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Dispatch / Mark as Shipped</span>
                        </button>
                      )}

                      {order.order_status === 'SHIPPED' && (
                        <button
                          type="button"
                          id={`btn-deliver-order-${order.id}`}
                          onClick={() => handleAction(order.id, 'deliver')}
                          disabled={isActing}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark as Delivered & Completed</span>
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
