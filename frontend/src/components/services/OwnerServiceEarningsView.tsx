import React, { useState, useEffect } from 'react';
import { ServiceEarningsSummary } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Truck,
  Users,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
} from 'lucide-react';

export const OwnerServiceEarningsView: React.FC = () => {
  const [earnings, setEarnings] = useState<ServiceEarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceBookingsApi.getOwnerEarnings();
      if (res.data?.success && res.data.data) {
        setEarnings(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Service Revenue & Financials</h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time breakdown of completed driver shifts and farm worker crew earnings.
          </p>
        </div>
        <button
          onClick={fetchEarnings}
          className="self-start sm:self-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Calculating your service earnings...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchEarnings}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : earnings ? (
        <div className="space-y-6">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-stone-900">
                ₹{Number(earnings.total_earnings || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                From {earnings.completed_bookings} fulfilled bookings
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Completed Jobs</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-stone-900">
                {earnings.completed_bookings}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Out of {earnings.total_bookings} total requests
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Driver Bookings</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-blue-800">
                {earnings.driver_bookings}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Machinery & tractor shifts</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Farm Worker Bookings</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-800">
                {earnings.worker_bookings}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Manual crop & field operations</div>
            </div>
          </div>

          {/* Completed Bookings Ledger Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-base">Completed Service Transactions</h3>
              <span className="text-xs text-stone-500">
                {earnings.completed_bookings_list?.length || 0} Records
              </span>
            </div>

            {(!earnings.completed_bookings_list || earnings.completed_bookings_list.length === 0) ? (
              <div className="p-12 text-center text-stone-500 text-xs sm:text-sm">
                No completed service bookings logged yet. Once work is marked complete, earnings will display here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 text-stone-600 uppercase text-[11px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Service Profile</th>
                      <th className="py-3.5 px-4 font-semibold">Client (Farmer)</th>
                      <th className="py-3.5 px-4 font-semibold">Date & Duration</th>
                      <th className="py-3.5 px-4 font-semibold">Location</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Amount Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {earnings.completed_bookings_list.map((booking) => {
                      const isDriver = booking.service_type === 'DRIVER';
                      return (
                        <tr key={booking.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`p-1.5 rounded-lg text-xs font-semibold ${
                                  isDriver ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isDriver ? <Truck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                              </span>
                              <div>
                                <div className="font-semibold text-stone-900">{booking.profile_name}</div>
                                <div className="text-[11px] text-stone-500">
                                  {isDriver ? 'Agricultural Driver' : 'Farm Worker'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-stone-800">{booking.farmer_name || 'Farmer Client'}</div>
                            <div className="text-[11px] text-stone-500">{booking.farmer_phone || 'Contact on file'}</div>
                          </td>

                          <td className="py-3.5 px-4 text-stone-600">
                            <div>{booking.booking_date}</div>
                            <div className="text-[11px] text-stone-500">
                              {booking.start_time} - {booking.end_time} ({booking.duration_hours} hrs)
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-stone-600">
                            <div className="truncate max-w-xs">{booking.work_location}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-emerald-700 text-base">
                              ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              PAID
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
