import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Tractor,
  Bird,
  Truck,
  Users,
  Search,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ownerApi } from '../../services/api';
import { PaymentRecord, OwnerPaymentSummary } from '../../types/payment';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export const OwnerPaymentsSummary: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<OwnerPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    loadOwnerPayments();
  }, []);

  const loadOwnerPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ownerApi.getPayments();
      setPayments(res.data.payments || []);
      setSummary(res.data.summary || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load revenue and payment summary');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.payment_reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.target_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.payer_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || p.payment_type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Received</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              ₹{Number(summary.total_paid_revenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">Verified settled payments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Cash Pending</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              ₹{Number(summary.pending_cash_revenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">To collect in hand upon job</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Equipment Rent</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Tractor className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              ₹{Number(summary.by_type?.EQUIPMENT || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-neutral-500 mt-1">From tractor & implement rentals</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Services & Livestock</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              ₹
              {Number(
                (summary.by_type?.ANIMAL_ORDER || 0) +
                  (summary.by_type?.DRIVER || 0) +
                  (summary.by_type?.FARM_WORKER || 0)
              ).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Drivers, workers & marketplace sales</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, reference, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-white border border-neutral-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="ALL">All Categories</option>
            <option value="EQUIPMENT">Equipment Rentals</option>
            <option value="ANIMAL_ORDER">Livestock Sales</option>
            <option value="DRIVER">Driver Shifting</option>
            <option value="FARM_WORKER">Farm Worker Labor</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500">
          <DollarSign className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
          <p className="font-semibold text-sm text-neutral-700">No payment records found</p>
          <p className="text-xs text-neutral-400 mt-1">
            Completed bookings or orders for your machinery and services will show revenue here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Item / Service</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {p.payment_reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{p.payer_name || 'Farmer'}</div>
                      {p.payer_phone && <div className="text-[11px] text-neutral-500">{p.payer_phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{p.target_title || 'Service'}</div>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {p.payment_type.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-medium text-neutral-600">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-4">
                      <PaymentStatusBadge status={p.payment_status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/payment/${p.payment_reference}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                      >
                        <span>View</span>
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
