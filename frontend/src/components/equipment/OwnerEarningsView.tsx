import React, { useState, useEffect } from 'react';
import { OwnerEarnings } from '../../types/equipment.js';
import { ownerApi } from '../../services/api.js';
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Tractor,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const OwnerEarningsView: React.FC = () => {
  const [earningsData, setEarningsData] = useState<OwnerEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEarnings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ownerApi.getEarnings();
      if (res.data && res.data.success) {
        setEarningsData(res.data.data);
      }
    } catch (err: any) {
      console.error('[OwnerEarningsView] error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load earnings summary.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Rental Earnings & Financials
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time tracking of machine revenue and completed contracts
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEarnings}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Financials</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchEarnings}
            className="ml-auto font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-5 text-white shadow-xs">
          <div className="flex items-center justify-between text-emerald-200 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black">
            ₹{Number.isFinite(Number(earningsData?.total_earnings ?? earningsData?.totalEarnings)) ? Number(earningsData?.total_earnings ?? earningsData?.totalEarnings) : 0}
          </div>
          <div className="text-[11px] text-emerald-200 mt-1">
            Settled from completed rentals
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Rentals</span>
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-stone-900">
            {Number.isFinite(Number(earningsData?.completed_bookings_count ?? earningsData?.completedBookings)) ? Number(earningsData?.completed_bookings_count ?? earningsData?.completedBookings) : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Fulfilled machinery bookings
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Rentals</span>
            <CalendarCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-stone-900">
            {Number.isFinite(Number(earningsData?.active_bookings_count ?? earningsData?.confirmedBookings)) ? Number(earningsData?.active_bookings_count ?? earningsData?.confirmedBookings) : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Approved & ongoing in fields
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Orders</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700">
            {Number.isFinite(Number(earningsData?.pending_bookings_count ?? earningsData?.pendingBookings)) ? Number(earningsData?.pending_bookings_count ?? earningsData?.pendingBookings) : 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Awaiting owner approval
          </div>
        </div>
      </div>

      {/* Equipment Breakdown Table */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">Earnings by Machinery</h3>
            <p className="text-xs text-stone-500">Revenue performance per equipment item</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-stone-400">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-600 mb-2" />
            <span className="text-xs">Calculating financials...</span>
          </div>
        ) : !earningsData?.equipment_breakdown?.length ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No equipment bookings recorded yet. Once farmers rent and complete orders, revenue per machine will display here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Equipment</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-center">Completed Rentals</th>
                  <th className="px-5 py-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {earningsData.equipment_breakdown.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-stone-900 flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>{item.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-600 font-medium">
                      {item.category}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-stone-700">
                      {item.bookings_count || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-emerald-800 text-sm">
                      ₹{item.total_earned || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
