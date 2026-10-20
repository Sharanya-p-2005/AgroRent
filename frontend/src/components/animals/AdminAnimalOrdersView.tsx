import React, { useState, useEffect } from 'react';
import { AnimalOrder, AnimalOrderStatus } from '../../types/animal.js';
import { adminApi } from '../../services/api.js';
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
  User,
  DollarSign
} from 'lucide-react';

export const AdminAnimalOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<AnimalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AnimalOrderStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAnimalOrders();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setError('Failed to fetch platform livestock orders');
      }
    } catch (err: any) {
      console.error('[AdminAnimalOrdersView] Error:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.listing_name && o.listing_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.seller_name && o.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.delivery_city && o.delivery_city.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalVolume = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-700" />
            <span>Platform Livestock Orders</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Monitor and audit all animal and bird marketplace transactions, buyer deliveries, and order fulfillment states.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total Orders</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">{orders.length}</span>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 block">GMV Transaction Volume</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-900">
            ₹{totalVolume.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-800 block">Active / Transit</span>
          <span className="text-xl sm:text-2xl font-black text-blue-900">
            {orders.filter((o) => o.order_status === 'PLACED' || o.order_status === 'CONFIRMED' || o.order_status === 'SHIPPED').length}
          </span>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-100/50 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-900 block">Fulfilled</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-950">
            {orders.filter((o) => o.order_status === 'DELIVERED').length}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by order ID, buyer, seller, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'] as const).map((st) => (
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

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs sm:text-sm text-red-800 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-stone-200" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <ShoppingBag className="h-10 w-10 text-stone-400 mb-2" />
          <h3 className="text-base font-bold text-stone-800">No marketplace orders found</h3>
          <p className="text-xs text-stone-500">No orders match the selected search or status criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-3.5">Order ID & Date</th>
                  <th className="px-5 py-3.5">Item & Qty</th>
                  <th className="px-5 py-3.5">Buyer & Delivery</th>
                  <th className="px-5 py-3.5">Seller</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} id={`admin-order-row-${order.id}`} className="hover:bg-stone-50/80">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                        #{order.id.slice(0, 8)}
                      </span>
                      <div className="text-xs text-stone-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-stone-900">{order.listing_name || 'Livestock'}</div>
                      <div className="text-xs text-stone-500">
                        {order.quantity} units × ₹{order.unit_price.toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-stone-900">{order.delivery_name || order.buyer_name}</div>
                      <div className="text-xs text-stone-500">{order.delivery_phone}</div>
                      <div className="text-xs text-stone-400">
                        {order.delivery_city}, {order.delivery_state}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-stone-900">{order.seller_name || 'Owner'}</div>
                      <div className="text-xs text-stone-500">{order.seller_phone}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-extrabold text-stone-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-stone-500">{order.payment_status}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          order.order_status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.order_status === 'SHIPPED'
                            ? 'bg-amber-100 text-amber-800'
                            : order.order_status === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.order_status === 'PLACED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
