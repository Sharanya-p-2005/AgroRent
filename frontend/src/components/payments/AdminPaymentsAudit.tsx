import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  QrCode,
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { PaymentRecord, AdminPaymentStats } from '../../types/payment';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export const AdminPaymentsAudit: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<AdminPaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter, methodFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPayments({
        payment_status: statusFilter || undefined,
        payment_type: typeFilter || undefined,
        payment_method: methodFilter || undefined,
        search: search || undefined,
      });

      setPayments(res.data.payments || []);
      setStats(res.data.stats || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load platform payment audit');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Level Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Platform GMV</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              ₹{Number(stats.total_platform_revenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {stats.total_paid_count} verified settled payments
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Online (Razorpay / UPI)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              ₹
              {Number(
                (stats.volume_by_method?.RAZORPAY || 0) + (stats.volume_by_method?.UPI || 0)
              ).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Digital gateway transactions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Cash Pending</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {stats.total_cash_pending_count || 0}
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">Hand payments pending fulfillment</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Failed / Retried</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {stats.total_failed_count || 0}
            </div>
            <p className="text-xs text-rose-600 font-medium mt-1">Declined or aborted attempts</p>
          </div>
        </div>
      )}

      {/* Search and Multi-Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment Reference (e.g. AGRO-PAY-...), Payer name, Razorpay Order/Payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CASH_PENDING">Cash Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="">All Categories</option>
            <option value="EQUIPMENT">Equipment Rental</option>
            <option value="ANIMAL_ORDER">Livestock Order</option>
            <option value="DRIVER">Tractor / JCB Driver</option>
            <option value="FARM_WORKER">Farm Worker Labor</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="">All Methods</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="UPI">UPI QR</option>
            <option value="CASH">Pay by Hand (Cash)</option>
          </select>

          {(statusFilter || typeFilter || methodFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setMethodFilter('');
                setSearch('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Global Payments Table */}
      {loading ? (
        <div className="p-12 flex items-center justify-center bg-white rounded-2xl border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
        </div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500">
          <CreditCard className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
          <p className="font-semibold text-sm text-neutral-700">No payment transactions found</p>
          <p className="text-xs text-neutral-400 mt-1">Try relaxing your search or filter parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Item / Service</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Transaction / Order ID</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900 whitespace-nowrap">
                      {p.payment_reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{p.payer_name || 'User'}</div>
                      <div className="text-[11px] text-neutral-500">{p.payer_phone || p.payer_email}</div>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {p.payment_type.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="py-3 px-4 max-w-[180px] truncate">
                      {p.target_title || 'Service'}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900 whitespace-nowrap">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-medium text-neutral-600">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PaymentStatusBadge status={p.payment_status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 max-w-[140px] truncate">
                      {p.razorpay_payment_id || p.razorpay_order_id || p.upi_transaction_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/payment/${p.payment_reference}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
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
