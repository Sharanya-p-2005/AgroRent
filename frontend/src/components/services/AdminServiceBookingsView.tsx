import React, { useState, useEffect } from 'react';
import { ServiceBooking } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import {
  CalendarCheck,
  Truck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  DollarSign,
  MapPin,
  User,
} from 'lucide-react';

export const AdminServiceBookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceBookingsApi.getAllAdminBookings();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBookings(res.data.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookings for admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (typeFilter !== 'ALL' && b.service_type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && b.booking_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchProfile = b.profile_name?.toLowerCase().includes(q);
      const matchFarmer = b.farmer_name?.toLowerCase().includes(q);
      const matchLocation = b.work_location?.toLowerCase().includes(q);
      return matchProfile || matchFarmer || matchLocation;
    }
    return true;
  });

  const totalGMV = bookings.reduce((sum, b) => sum + (parseFloat(String(b.total_amount)) || 0), 0);
  const completedCount = bookings.filter((b) => b.booking_status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Total Service Bookings
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{bookings.length}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Platform lifetime transactions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Completed Services
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Fulfilled by drivers & workers</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Gross Service Value (GMV)
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">
            ₹{Math.round(totalGMV).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Cumulative booking transactions</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by personnel, farmer, or field location..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800"
          >
            <option value="ALL">All Categories</option>
            <option value="DRIVER">Drivers</option>
            <option value="FARM_WORKER">Farm Workers</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Declined</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={fetchBookings}
            className="p-2 w-full rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading audit records...</p>
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
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 text-xs sm:text-sm">
          No service bookings found matching current parameters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 text-stone-600 uppercase text-[11px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service Personnel</th>
                  <th className="py-3.5 px-4 font-semibold">Farmer Client</th>
                  <th className="py-3.5 px-4 font-semibold">Booking Schedule</th>
                  <th className="py-3.5 px-4 font-semibold">Location</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBookings.map((b) => {
                  const isDriver = b.service_type === 'DRIVER';
                  return (
                    <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              isDriver ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isDriver ? <Truck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <div className="font-bold text-stone-900">{b.profile_name}</div>
                            <div className="text-[11px] text-stone-500">
                              {isDriver ? 'Driver' : 'Farm Worker'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">{b.farmer_name || 'Farmer Client'}</div>
                        <div className="text-[11px] text-stone-500">{b.farmer_phone || 'No phone'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        <div>{b.booking_date}</div>
                        <div className="text-[11px] text-stone-500">
                          {b.start_time} - {b.end_time} ({b.duration_hours} hrs)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        <div className="truncate max-w-[180px]">{b.work_location}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                          {b.booking_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                        ₹{Number(b.total_amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
