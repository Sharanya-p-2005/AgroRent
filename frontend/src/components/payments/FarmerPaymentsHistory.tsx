import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { farmerApi } from '../../services/api';
import { PaymentRecord } from '../../types/payment';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export const FarmerPaymentsHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await farmerApi.getPayments();
      setPayments(res.data.payments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.payment_reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.target_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.payment_type || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payments by reference or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-neutral-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CASH_PENDING">Cash Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments List / Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500">
          <CreditCard className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
          <p className="font-semibold text-sm text-neutral-700">No payment records found</p>
          <p className="text-xs text-neutral-400 mt-1">
            When you book equipment, animals, drivers, or workers, your invoices will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Item / Service</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {payment.payment_reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">
                        {payment.target_title || 'AgroRent Service'}
                      </div>
                      {payment.target_subtitle && (
                        <div className="text-[11px] text-neutral-500">{payment.target_subtitle}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {payment.payment_type.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      ₹{Number(payment.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-medium text-neutral-600">
                      {payment.payment_method}
                    </td>
                    <td className="py-3 px-4">
                      <PaymentStatusBadge status={payment.payment_status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {payment.payment_status === 'PAID' ? (
                        <Link
                          to={`/payment/${payment.payment_reference}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                        >
                          <span>Receipt</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          to={`/payment/${payment.payment_reference}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                        >
                          <span>Pay Now</span>
                        </Link>
                      )}
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
