import React, { useState, useEffect } from 'react';
import { adminReportsApi } from '../../services/api.js';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Tractor,
  CalendarCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  Sparkles,
} from 'lucide-react';

type ReportType =
  | 'users'
  | 'equipment'
  | 'bookings'
  | 'orders'
  | 'payments'
  | 'deliveries'
  | 'reviews'
  | 'ai';

const REPORT_TABS: { id: ReportType; label: string; icon: any; desc: string }[] = [
  { id: 'users', label: 'Users Directory', icon: Users, desc: 'Registered accounts, roles, districts, and status' },
  { id: 'equipment', label: 'Equipment Inventory', icon: Tractor, desc: 'Machinery catalog, categories, pricing, and owners' },
  { id: 'bookings', label: 'Rental Bookings', icon: CalendarCheck, desc: 'Machinery reservation contracts, dates, and amounts' },
  { id: 'orders', label: 'Marketplace Orders', icon: ShoppingBag, desc: 'Livestock contracts, buyer, seller, and handover status' },
  { id: 'payments', label: 'Payments & Revenue', icon: CreditCard, desc: 'Financial transaction ledgers, gateways, and status' },
  { id: 'deliveries', label: 'Deliveries & Fleet', icon: Truck, desc: 'Animal dispatch, driver assignments, and delivery tracking' },
  { id: 'reviews', label: 'Ratings & Reviews', icon: Star, desc: 'User feedback, satisfaction ratings, and moderated notes' },
  { id: 'ai', label: 'AI Telemetry', icon: Sparkles, desc: 'AI queries, latency in ms, token usage, and response codes' },
];

export const AdminReportsView: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('users');
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const res = await adminReportsApi.getReport(activeReport, {
        page,
        limit,
        from: fromDate || undefined,
        to: toDate || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });

      if (res.data?.success) {
        setRecords(res.data.data.records || []);
        setTotalRecords(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error('[AdminReportsView] Error loading report preview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, page, fromDate, toDate, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReportData();
  };

  const getCsvDownloadUrl = () => {
    return adminReportsApi.getCsvUrl(activeReport, {
      from: fromDate || undefined,
      to: toDate || undefined,
      status: statusFilter || undefined,
      search: search.trim() || undefined,
    });
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-purple-600" />
            Platform Reports & CSV Export Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Generate and export RFC 4180-compliant administrative reports across all platform operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getCsvDownloadUrl()}
            download={`agrorent-${activeReport}-report.csv`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download CSV Report
          </a>
          <button
            type="button"
            onClick={fetchReportData}
            disabled={isLoading}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Types Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {REPORT_TABS.map(tab => {
          const Icon = tab.icon;
          const isSelected = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveReport(tab.id);
                setPage(1);
              }}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-50/80 border-purple-300 shadow-xs'
                  : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon
                  className={`w-4 h-4 ${isSelected ? 'text-purple-700' : 'text-stone-500'}`}
                />
              </div>
              <div
                className={`text-xs font-bold leading-tight ${
                  isSelected ? 'text-purple-900' : 'text-stone-800'
                }`}
              >
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search report records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Date Range:
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={e => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-xs text-stone-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={e => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {(fromDate || toDate || search) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Data Preview */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              {REPORT_TABS.find(t => t.id === activeReport)?.label} Preview
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {REPORT_TABS.find(t => t.id === activeReport)?.desc}
            </p>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Total Records: <strong className="text-stone-800">{totalRecords}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-7 h-7 text-purple-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-500">Preparing report preview...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400">
            No records match the selected date or search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  {Object.keys(records[0]).map(key => (
                    <th key={key} className="py-3 px-4 whitespace-nowrap">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                    {Object.entries(row).map(([k, val]: [string, any], cIdx) => (
                      <td key={cIdx} className="py-2.5 px-4 whitespace-nowrap text-stone-700">
                        {val === null || val === undefined
                          ? '—'
                          : typeof val === 'object'
                          ? JSON.stringify(val)
                          : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <span className="font-semibold text-stone-800">{records.length}</span> of{' '}
            <span className="font-semibold text-stone-800">{totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-stone-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
