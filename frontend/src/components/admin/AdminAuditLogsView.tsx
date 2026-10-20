import React, { useState, useEffect } from 'react';
import { adminAuditLogsApi } from '../../services/api.js';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Eye,
  X,
  Code,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ENTITY_TYPES = [
  'ALL',
  'USER',
  'EQUIPMENT',
  'ANIMAL',
  'SERVICE',
  'PAYMENT',
  'SCHEME',
  'SETTINGS',
  'DELIVERY',
  'REVIEW',
];

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminAuditLogsApi.getAll({
        page,
        limit,
        entity_type: entityFilter !== 'ALL' ? entityFilter : undefined,
        search: search.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });

      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setTotalLogs(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error('[AdminAuditLogsView] Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const totalPages = Math.ceil(totalLogs / limit) || 1;

  const renderActionBadge = (action: string) => {
    let colorClasses = 'text-stone-700 bg-stone-100';
    if (action.includes('APPROVE') || action.includes('ACTIVE') || action.includes('CREATE')) {
      colorClasses = 'text-emerald-700 bg-emerald-50';
    } else if (action.includes('REJECT') || action.includes('DELETE') || action.includes('SUSPEND')) {
      colorClasses = 'text-rose-700 bg-rose-50';
    } else if (action.includes('UPDATE') || action.includes('TOGGLE')) {
      colorClasses = 'text-blue-700 bg-blue-50';
    }

    return (
      <span className={`inline-flex items-center text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${colorClasses}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-purple-600" />
            Append-Only Security & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Immutable log of all administrative interventions, entity state mutations, and platform policy updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Trail
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search action or entity ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Entity:
          </span>
          <select
            value={entityFilter}
            onChange={e => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-stone-600 ml-2">Date:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
          />
          <span className="text-xs text-stone-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={e => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-7 h-7 text-purple-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-500">Querying security audit log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400">
            No audit records found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {logs.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">{renderActionBadge(item.action)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-800">{item.entity_type}</span>
                      {item.entity_id && (
                        <span className="ml-1.5 text-[11px] font-mono text-stone-400">
                          #{item.entity_id.substring(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{item.user_name || 'System / Admin'}</div>
                      <div className="text-[11px] text-stone-400">{item.user_email}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {item.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <span className="font-semibold text-stone-800">{logs.length}</span> of{' '}
            <span className="font-semibold text-stone-800">{totalLogs}</span> entries
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

      {/* Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-stone-900">Audit Log Record Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-[11px] text-stone-400">Action Name:</span>
                  <div className="font-bold text-stone-900">{selectedLog.action}</div>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400">Target Entity:</span>
                  <div className="font-bold text-stone-900">
                    {selectedLog.entity_type} (#{selectedLog.entity_id || 'N/A'})
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400">Performed By:</span>
                  <div className="font-bold text-stone-900">
                    {selectedLog.user_name} ({selectedLog.user_role})
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400">Timestamp:</span>
                  <div className="font-bold text-stone-900">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Diff Inspection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block mb-1">
                    Previous State (old_values):
                  </span>
                  <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                    {selectedLog.old_values
                      ? JSON.stringify(selectedLog.old_values, null, 2)
                      : '// No previous record (New entity created)'}
                  </pre>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block mb-1">
                    Updated State (new_values):
                  </span>
                  <pre className="p-3 bg-stone-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                    {selectedLog.new_values
                      ? JSON.stringify(selectedLog.new_values, null, 2)
                      : '// No updated state recorded'}
                  </pre>
                </div>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Security Assurance: Sensitive fields like passwords, secrets, and PINs are automatically redacted prior to persistence.</span>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
