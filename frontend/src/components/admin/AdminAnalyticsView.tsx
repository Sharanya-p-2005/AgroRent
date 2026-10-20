import React, { useState, useEffect } from 'react';
import {
  adminAnalyticsApi,
} from '../../services/api.js';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Download,
  Users,
  Tractor,
  Beef,
  Truck,
  CreditCard,
  Sparkles,
  Star,
  DollarSign,
  ShoppingBag,
  Activity,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type AnalyticsTab =
  | 'overview'
  | 'equipment'
  | 'animals'
  | 'services'
  | 'payments'
  | 'deliveries'
  | 'ai'
  | 'reviews';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last_7_days', label: 'Last 7 Days' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'this_year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export const AdminAnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [period, setPeriod] = useState<string>('last_30_days');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [tabData, setTabData] = useState<any>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParams = {
        period,
        from: period === 'custom' ? customFrom : undefined,
        to: period === 'custom' ? customTo : undefined,
      };

      // Always fetch overview cards
      const ovRes = await adminAnalyticsApi.getOverview(filterParams);
      if (ovRes.data?.success) {
        setOverviewData(ovRes.data.data);
      }

      // Fetch active tab deep-dive
      let deepRes: any = null;
      switch (activeTab) {
        case 'overview':
          deepRes = ovRes;
          break;
        case 'equipment':
          deepRes = await adminAnalyticsApi.getEquipment(filterParams);
          break;
        case 'animals':
          deepRes = await adminAnalyticsApi.getAnimals(filterParams);
          break;
        case 'services':
          deepRes = await adminAnalyticsApi.getServices(filterParams);
          break;
        case 'payments':
          deepRes = await adminAnalyticsApi.getPayments(filterParams);
          break;
        case 'deliveries':
          deepRes = await adminAnalyticsApi.getDeliveries(filterParams);
          break;
        case 'ai':
          deepRes = await adminAnalyticsApi.getAi(filterParams);
          break;
        case 'reviews':
          deepRes = await adminAnalyticsApi.getReviews(filterParams);
          break;
      }

      if (deepRes?.data?.success) {
        setTabData(deepRes.data.data);
      }
    } catch (err: any) {
      console.error('[AdminAnalyticsView] Error loading analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeTab, period]);

  const handleApplyCustomDate = () => {
    if (customFrom && customTo) {
      fetchAnalytics();
    }
  };

  const renderDeltaPill = (delta: number | null) => {
    if (delta === null || delta === undefined) {
      return (
        <span className="inline-flex items-center text-[11px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
          No comparison data
        </span>
      );
    }

    if (delta > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3" />+{delta}%
        </span>
      );
    }

    if (delta < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
          <TrendingDown className="w-3 h-3" />{delta}%
        </span>
      );
    }

    return (
      <span className="inline-flex items-center text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
        0% change
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Platform Analytics & Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Real-time aggregation across users, equipment, marketplace orders, deliveries, AI queries, and revenue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    period === p.key
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Custom Date Range Row */}
        {period === 'custom' && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-stone-600">Select Date Span:</span>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-xs text-stone-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleApplyCustomDate}
              disabled={!customFrom || !customTo}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metric Cards with Comparative Deltas */}
      {overviewData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Users */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                New Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900">
                {overviewData.cards?.users?.value?.toLocaleString() || '0'}
              </span>
              {renderDeltaPill(overviewData.cards?.users?.delta)}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              Total Platform Accounts: {overviewData.cards?.users?.allTime?.toLocaleString() || '0'}
            </p>
          </div>

          {/* 2. Bookings */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Equipment Bookings
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Tractor className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900">
                {overviewData.cards?.bookings?.value?.toLocaleString() || '0'}
              </span>
              {renderDeltaPill(overviewData.cards?.bookings?.delta)}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              Machinery rental reservations in selected period
            </p>
          </div>

          {/* 3. Marketplace Orders */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Marketplace Orders
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Beef className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900">
                {overviewData.cards?.orders?.value?.toLocaleString() || '0'}
              </span>
              {renderDeltaPill(overviewData.cards?.orders?.delta)}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              Cattle, poultry & livestock trade volume
            </p>
          </div>

          {/* 4. Gross Transaction Value */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Gross Volume (GTV)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900">
                ₹{overviewData.cards?.revenue?.value?.toLocaleString() || '0'}
              </span>
              {renderDeltaPill(overviewData.cards?.revenue?.delta)}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              All-Time Platform GTV: ₹{overviewData.cards?.revenue?.allTime?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200">
        {[
          { id: 'overview', label: 'Platform Overview', icon: Activity },
          { id: 'equipment', label: 'Equipment & Rentals', icon: Tractor },
          { id: 'animals', label: 'Livestock Marketplace', icon: Beef },
          { id: 'services', label: 'Drivers & Labor', icon: Truck },
          { id: 'payments', label: 'Payments & Gateway', icon: CreditCard },
          { id: 'deliveries', label: 'Deliveries & Logistics', icon: ShoppingBag },
          { id: 'ai', label: 'AI Telemetry', icon: Sparkles },
          { id: 'reviews', label: 'Reviews & Satisfaction', icon: Star },
        ].map(tab => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AnalyticsTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                isCurrent
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* DEEP DIVE SECTION */}
      {isLoading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-600">Aggregating live analytics records...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && overviewData && (
            <div className="space-y-6">
              {/* Revenue vs Commission Banner */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                      Gross Transaction Value (GTV)
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-400">
                      ₹{overviewData.cards?.revenue?.value?.toLocaleString() || '0'}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1">
                      100% routed directly to equipment owners, sellers, drivers, and workers.
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                      Direct Platform Take-Rate
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-purple-300">
                      ₹0.00 (0% Commission)
                    </h3>
                    <p className="text-xs text-stone-300 mt-1">
                      AgroRent operates with 0% platform fee to foster direct farmer empowerment.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-stone-700 md:pl-6">
                    <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                      Operational Highlights
                    </span>
                    <div className="mt-2 space-y-1.5 text-xs text-stone-200">
                      <div className="flex justify-between">
                        <span>Total Farmers:</span>
                        <span className="font-bold text-white">{overviewData.counts?.totalFarmers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Equipment Owners:</span>
                        <span className="font-bold text-white">{overviewData.counts?.totalOwners || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Deliveries:</span>
                        <span className="font-bold text-amber-400">{overviewData.counts?.activeDeliveries || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Assistant Inquiries:</span>
                        <span className="font-bold text-purple-300">{overviewData.counts?.aiRequests || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Area Chart */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 mb-1">Revenue Trend (GTV)</h3>
                  <p className="text-xs text-stone-500 mb-4">Daily completed payments in selected date range</p>

                  <div className="h-64">
                    {overviewData.revenueTrend?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overviewData.revenueTrend}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                          <Tooltip
                            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'GTV']}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#revGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400">
                        No transaction activity during this period.
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Status Distribution */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 mb-1">Booking Status Breakdown</h3>
                  <p className="text-xs text-stone-500 mb-4">Equipment rental contracts distribution</p>

                  <div className="h-64">
                    {overviewData.bookingStatusDistribution?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overviewData.bookingStatusDistribution}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {overviewData.bookingStatusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400">
                        No booking records found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EQUIPMENT */}
          {activeTab === 'equipment' && tabData && (
            <div className="space-y-6">
              {/* Equipment Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-500">Total Machinery</span>
                  <div className="text-xl font-bold text-stone-900 mt-1">{tabData.totalEquipment}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-emerald-600">Approved</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{tabData.approvedEquipment}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-amber-600">Pending Review</span>
                  <div className="text-xl font-bold text-amber-700 mt-1">{tabData.pendingEquipment}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-blue-600">Currently Available</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">{tabData.availableEquipment}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-purple-600">Avg Hourly Rate</span>
                  <div className="text-xl font-bold text-purple-700 mt-1">₹{tabData.averageRentalPrice}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-600">Total Hours Rented</span>
                  <div className="text-xl font-bold text-stone-900 mt-1">{tabData.totalRentalHours} hrs</div>
                </div>
              </div>

              {/* Category Breakdown & Top Booked */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 mb-3">Machinery by Category</h3>
                  <div className="space-y-3">
                    {tabData.categoryBreakdown?.map((cat: any) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-stone-700">{cat.category}</span>
                          <span className="text-stone-500">{cat.count} units ({cat.percentage}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 mb-3">Most Rented Equipment</h3>
                  <div className="divide-y divide-stone-100">
                    {tabData.mostBooked?.map((item: any) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-stone-900">{item.name}</div>
                          <div className="text-[11px] text-stone-500">{item.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-700">₹{item.totalRevenue.toLocaleString()}</div>
                          <div className="text-[11px] text-stone-400">{item.bookingCount} bookings</div>
                        </div>
                      </div>
                    ))}
                    {(!tabData.mostBooked || tabData.mostBooked.length === 0) && (
                      <p className="text-xs text-stone-400 py-6 text-center">No bookings in selected period.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANIMALS */}
          {activeTab === 'animals' && tabData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-500">Total Listings</span>
                  <div className="text-xl font-bold text-stone-900 mt-1">{tabData.totalListings}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-emerald-600">Active Listings</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{tabData.approvedListings}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-blue-600">Sold Count</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">{tabData.soldListings}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-purple-600">Total Orders</span>
                  <div className="text-xl font-bold text-purple-700 mt-1">{tabData.totalOrders}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-emerald-600">Total Turnover</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">₹{tabData.totalSalesTurnover.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 mb-3">Popular Categories (Listings)</h3>
                  <div className="space-y-2.5">
                    {tabData.popularCategories?.map((c: any) => (
                      <div key={c.category} className="flex justify-between items-center text-xs py-1 border-b border-stone-50">
                        <span className="font-medium text-stone-800">{c.category}</span>
                        <span className="font-bold text-stone-600">{c.count} items</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 mb-3">Top Purchased Categories</h3>
                  <div className="divide-y divide-stone-100">
                    {tabData.mostPurchasedCategories?.map((c: any) => (
                      <div key={c.category} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-stone-900">{c.category}</div>
                          <div className="text-[11px] text-stone-400">{c.orderCount} orders confirmed</div>
                        </div>
                        <div className="text-xs font-bold text-emerald-700">₹{c.sales.toLocaleString()}</div>
                      </div>
                    ))}
                    {(!tabData.mostPurchasedCategories || tabData.mostPurchasedCategories.length === 0) && (
                      <p className="text-xs text-stone-400 py-6 text-center">No orders confirmed in this period.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES */}
          {activeTab === 'services' && tabData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drivers Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Agricultural Drivers</h3>
                    <p className="text-xs text-stone-500">Tractor, harvester & transport operators</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Registered Drivers</span>
                    <div className="text-lg font-bold text-stone-900">{tabData.drivers?.total}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Active / Approved</span>
                    <div className="text-lg font-bold text-teal-700">{tabData.drivers?.approved}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Total Bookings</span>
                    <div className="text-lg font-bold text-stone-900">{tabData.drivers?.bookings}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Completed Jobs</span>
                    <div className="text-lg font-bold text-emerald-700">{tabData.drivers?.completedBookings}</div>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 flex justify-between items-center text-xs">
                  <span className="text-stone-500">Average Driver Rating:</span>
                  <span className="font-bold text-stone-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {tabData.drivers?.averageRating || '0.0'} / 5.0
                  </span>
                </div>
              </div>

              {/* Farm Workers Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Farm Workers & Labor</h3>
                    <p className="text-xs text-stone-500">Harvesting, weeding & field teams</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Registered Workers</span>
                    <div className="text-lg font-bold text-stone-900">{tabData.farmWorkers?.total}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Active / Approved</span>
                    <div className="text-lg font-bold text-purple-700">{tabData.farmWorkers?.approved}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Total Bookings</span>
                    <div className="text-lg font-bold text-stone-900">{tabData.farmWorkers?.bookings}</div>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <span className="text-[11px] text-stone-500">Completed Jobs</span>
                    <div className="text-lg font-bold text-emerald-700">{tabData.farmWorkers?.completedBookings}</div>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 flex justify-between items-center text-xs">
                  <span className="text-stone-500">Average Worker Rating:</span>
                  <span className="font-bold text-stone-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {tabData.farmWorkers?.averageRating || '0.0'} / 5.0
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && tabData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-500">Total Collections</span>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">₹{tabData.totalAmount.toLocaleString()}</div>
                  <p className="text-[11px] text-stone-400 mt-1">{tabData.totalTransactions} transactions recorded</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-purple-600">Success Rate</span>
                  <div className="text-2xl font-bold text-purple-700 mt-1">{tabData.successRate}%</div>
                  <p className="text-[11px] text-stone-400 mt-1">{tabData.successful?.count} successful payments</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-amber-600">Pending / Processing</span>
                  <div className="text-2xl font-bold text-amber-700 mt-1">₹{tabData.pending?.amount?.toLocaleString() || 0}</div>
                  <p className="text-[11px] text-stone-400 mt-1">{tabData.pending?.count || 0} pending verification</p>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-4">Payment Methods Volume</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-stone-100 bg-stone-50">
                    <div className="text-xs font-bold text-stone-700">Online Gateway (Razorpay)</div>
                    <div className="text-lg font-bold text-stone-900 mt-1">₹{tabData.methods?.razorpay?.amount?.toLocaleString() || 0}</div>
                    <div className="text-[11px] text-stone-500 mt-1">{tabData.methods?.razorpay?.count || 0} transactions</div>
                  </div>
                  <div className="p-4 rounded-xl border border-stone-100 bg-stone-50">
                    <div className="text-xs font-bold text-stone-700">Dynamic UPI QR</div>
                    <div className="text-lg font-bold text-stone-900 mt-1">₹{tabData.methods?.upi?.amount?.toLocaleString() || 0}</div>
                    <div className="text-[11px] text-stone-500 mt-1">{tabData.methods?.upi?.count || 0} transactions</div>
                  </div>
                  <div className="p-4 rounded-xl border border-stone-100 bg-stone-50">
                    <div className="text-xs font-bold text-stone-700">Hand-to-Hand Cash (COD)</div>
                    <div className="text-lg font-bold text-stone-900 mt-1">₹{tabData.methods?.cash?.amount?.toLocaleString() || 0}</div>
                    <div className="text-[11px] text-stone-500 mt-1">{tabData.methods?.cash?.count || 0} transactions</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DELIVERIES */}
          {activeTab === 'deliveries' && tabData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-500">Total Shipments</span>
                  <div className="text-xl font-bold text-stone-900 mt-1">{tabData.totalDeliveries}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-blue-600">Active In Transit</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">{tabData.activeDeliveries}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-emerald-600">Delivered</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{tabData.delivered}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-teal-600">Drivers Tracking Live</span>
                  <div className="text-xl font-bold text-teal-700 mt-1">{tabData.activeDriversTracking}</div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-3">Delivery Status Pipeline</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <span className="text-[11px] text-stone-500">Packed</span>
                    <div className="text-base font-bold text-stone-800 mt-1">{tabData.packed}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <span className="text-[11px] text-blue-600">Shipped</span>
                    <div className="text-base font-bold text-blue-800 mt-1">{tabData.shipped}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <span className="text-[11px] text-amber-600">Out For Delivery</span>
                    <div className="text-base font-bold text-amber-800 mt-1">{tabData.outForDelivery}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <span className="text-[11px] text-emerald-600">Delivered</span>
                    <div className="text-base font-bold text-emerald-800 mt-1">{tabData.delivered}</div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <span className="text-[11px] text-rose-600">Cancelled</span>
                    <div className="text-base font-bold text-rose-800 mt-1">{tabData.cancelled}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI TELEMETRY */}
          {activeTab === 'ai' && tabData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-500">AI Inquiries</span>
                  <div className="text-xl font-bold text-stone-900 mt-1">{tabData.totalRequests}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-emerald-600">Successful Responses</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{tabData.successfulRequests}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-purple-600">Avg Latency</span>
                  <div className="text-xl font-bold text-purple-700 mt-1">{tabData.averageResponseTimeMs} ms</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-stone-600">Tokens Processed</span>
                  <div className="text-xl font-bold text-stone-900 mt-1">{tabData.totalTokensConsumed?.toLocaleString() || 0}</div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-3">AI Requests by Feature</h3>
                <div className="space-y-2">
                  {tabData.byType?.map((t: any) => (
                    <div key={t.type} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-50">
                      <span className="font-mono text-stone-700">{t.type}</span>
                      <span className="font-bold text-stone-900">{t.count} calls</span>
                    </div>
                  ))}
                  {(!tabData.byType || tabData.byType.length === 0) && (
                    <p className="text-xs text-stone-400 py-4 text-center">No AI queries recorded in this period.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: REVIEWS */}
          {activeTab === 'reviews' && tabData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-4">
                  <div className="text-3xl font-extrabold text-amber-500 flex items-center gap-1">
                    <Star className="w-8 h-8 fill-amber-500" />
                    {tabData.averageRating}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">Platform Average</div>
                    <div className="text-[11px] text-stone-400">Based on {tabData.totalReviews} reviews</div>
                  </div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <span className="text-xs text-stone-500">Published Reviews</span>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{tabData.published}</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <span className="text-xs text-stone-500">Moderated / Hidden</span>
                  <div className="text-2xl font-bold text-rose-700 mt-1">{tabData.hidden}</div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-3">Star Rating Distribution</h3>
                <div className="space-y-2">
                  {tabData.starDistribution?.map((s: any) => (
                    <div key={s.star} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-bold text-stone-700">{s.star} Stars</span>
                      <div className="flex-1 bg-stone-100 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{
                            width: tabData.totalReviews > 0 ? `${(s.count / tabData.totalReviews) * 100}%` : '0%',
                          }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium text-stone-500">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
