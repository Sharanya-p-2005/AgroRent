import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BarChart3,
  Activity,
  Cpu,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldAlert,
  Server,
  Database,
  Languages,
} from 'lucide-react';
import { adminAiApi } from '../../services/api.js';

export const AdminAiMonitoringView: React.FC = () => {
  const [days, setDays] = useState<number>(7);
  const [usageData, setUsageData] = useState<any | null>(null);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'usage' | 'errors'>('usage');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, eRes] = await Promise.all([
        adminAiApi.getUsage(days),
        adminAiApi.getErrors(days),
      ]);

      if (uRes.data?.success && uRes.data?.data) {
        setUsageData(uRes.data.data);
      }
      if (eRes.data?.success && Array.isArray(eRes.data.data)) {
        setErrorLogs(eRes.data.data);
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const summary = usageData?.summary || {
    total_requests: 0,
    total_prompt_tokens: 0,
    total_response_tokens: 0,
    avg_duration_ms: 0,
    fallback_count: 0,
  };

  const featureBreakdown = usageData?.feature_breakdown || [];
  const recentLogs = usageData?.recent_logs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">
              AI Assistant & Intelligence Monitoring
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
              Live Monitoring
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit AI Farmer Assistant query volume, token usage, latency metrics, and error rates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Days filter */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value={1}>Last 24 Hours</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Requests</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {Number(summary.total_requests).toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Across chat, search, and recs
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Tokens</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {(
              Number(summary.total_prompt_tokens) + Number(summary.total_response_tokens)
            ).toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            {Number(summary.total_prompt_tokens).toLocaleString()} in /{' '}
            {Number(summary.total_response_tokens).toLocaleString()} out
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Avg Latency</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {summary.avg_duration_ms ? `${Math.round(summary.avg_duration_ms)}ms` : '0ms'}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Response generation time
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Fallback Invocations</span>
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {Number(summary.fallback_count).toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Offline rule base responses
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active Engine</span>
            <Server className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-sm font-bold text-emerald-700">
            Gemini 2.5 Flash
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            + Rule Base Fallback
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('usage')}
          className={`pb-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
            activeSubTab === 'usage'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Recent Usage & Telemetry ({recentLogs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('errors')}
          className={`pb-2.5 text-sm font-medium border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === 'errors'
              ? 'border-red-600 text-red-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Error & Fallback Logs</span>
          {errorLogs.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {errorLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'usage' ? (
        <div className="space-y-6">
          {/* Feature Breakdown Table */}
          {featureBreakdown.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Feature Usage Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Feature Name</th>
                      <th className="py-2.5 px-3">Request Count</th>
                      <th className="py-2.5 px-3">Total Tokens</th>
                      <th className="py-2.5 px-3">Avg Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {featureBreakdown.map((f: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/70">
                        <td className="py-2 px-3 font-semibold text-gray-800">
                          {f.feature}
                        </td>
                        <td className="py-2 px-3 text-gray-600">{f.count}</td>
                        <td className="py-2 px-3 text-gray-600">
                          {Number(f.total_tokens || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {f.avg_latency ? `${Math.round(f.avg_latency)}ms` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Query Logs */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Live Query Telemetry
              </h3>
              <span className="text-xs text-gray-400">
                Privacy protected (prompt snippets only, no PII stored)
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No AI requests recorded in this timeframe.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Feature</th>
                      <th className="py-2.5 px-3">Lang</th>
                      <th className="py-2.5 px-3">Prompt Snippet</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Tokens</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50/70">
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-700">
                          {log.feature}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-gray-500 font-semibold text-[10px]">
                          {log.language || 'en'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-800 max-w-xs truncate">
                          {log.prompt_snippet || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {log.duration_ms}ms
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {(log.prompt_tokens || 0) + (log.response_tokens || 0)}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.is_fallback ? (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Fallback
                            </span>
                          ) : log.error_message ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Error
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center w-fit">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Errors Tab */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            AI Exceptions and Safety Triggers
          </h3>
          {errorLogs.length === 0 ? (
            <div className="text-center py-8 text-sm text-emerald-700 font-medium">
              ✓ No AI exceptions or system errors reported in the last {days} days.
            </div>
          ) : (
            <div className="space-y-3">
              {errorLogs.map((err: any) => (
                <div
                  key={err.id}
                  className="bg-red-50/60 border border-red-200 rounded-lg p-3 text-xs"
                >
                  <div className="flex items-center justify-between text-red-800 font-semibold mb-1">
                    <span>Feature: {err.feature}</span>
                    <span>{new Date(err.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-red-700 font-mono mt-1">{err.error_message}</p>
                  {err.prompt_snippet && (
                    <p className="text-gray-500 mt-1">Prompt: "{err.prompt_snippet}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
