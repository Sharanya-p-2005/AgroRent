import React, { useState } from 'react';
import { testApi } from '../services/api.js';
import { Play, CheckCircle2, XCircle, Loader2, ShieldCheck, Terminal } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: number;
  data: any;
  timestamp: string;
  success: boolean;
}

export const ApiTester: React.FC<{ currentRole?: string }> = ({ currentRole }) => {
  const [loadingEndpoint, setLoadingEndpoint] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  const executeTest = async (endpointName: string, callFn: () => Promise<any>) => {
    setLoadingEndpoint(endpointName);
    setResult(null);

    try {
      const res = await callFn();
      setResult({
        endpoint: endpointName,
        status: res.status,
        data: res.data,
        timestamp: new Date().toLocaleTimeString(),
        success: true,
      });
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };
      setResult({
        endpoint: endpointName,
        status,
        data,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
      });
    } finally {
      setLoadingEndpoint(null);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-800" />
          <h3 className="text-base font-bold text-stone-900">Backend API Role Authorization Verifier</h3>
        </div>
        <span className="text-xs font-medium text-stone-500">
          Current JWT Role: <strong className="text-stone-800">{currentRole || 'None'}</strong>
        </span>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-stone-600">
        Click an endpoint below to test the live backend authorization middleware (<code className="bg-stone-200/80 px-1 py-0.5 rounded text-xs">requireFarmer</code>, <code className="bg-stone-200/80 px-1 py-0.5 rounded text-xs">requireOwner</code>, <code className="bg-stone-200/80 px-1 py-0.5 rounded text-xs">requireAdmin</code>):
      </p>

      {/* Button Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          id="test-btn-health"
          onClick={() => executeTest('GET /api/health', testApi.getHealth)}
          disabled={loadingEndpoint !== null}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loadingEndpoint === 'GET /api/health' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-stone-500" />}
          GET /health
        </button>

        <button
          type="button"
          id="test-btn-farmer"
          onClick={() => executeTest('GET /api/farmer/test', testApi.farmerTest)}
          disabled={loadingEndpoint !== null}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
            currentRole === 'FARMER'
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          {loadingEndpoint === 'GET /api/farmer/test' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
          GET /farmer/test
        </button>

        <button
          type="button"
          id="test-btn-owner"
          onClick={() => executeTest('GET /api/owner/test', testApi.ownerTest)}
          disabled={loadingEndpoint !== null}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
            currentRole === 'OWNER'
              ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          {loadingEndpoint === 'GET /api/owner/test' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-amber-600" />}
          GET /owner/test
        </button>

        <button
          type="button"
          id="test-btn-admin"
          onClick={() => executeTest('GET /api/admin/test', testApi.adminTest)}
          disabled={loadingEndpoint !== null}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
            currentRole === 'ADMIN'
              ? 'border-purple-400 bg-purple-50 text-purple-800 hover:bg-purple-100'
              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          {loadingEndpoint === 'GET /api/admin/test' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-purple-600" />}
          GET /admin/test
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div
          id="api-test-result-box"
          className={`mt-4 rounded-xl border p-4 transition-all ${
            result.status === 200
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
              : result.status === 403
              ? 'border-amber-200 bg-amber-50/70 text-amber-950'
              : 'border-red-200 bg-red-50/70 text-red-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.status === 200 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-xs font-bold font-mono">{result.endpoint}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-bold font-mono ${
                  result.status === 200
                    ? 'bg-emerald-200 text-emerald-900'
                    : result.status === 403
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-red-200 text-red-900'
                }`}
              >
                HTTP {result.status} {result.status === 200 ? 'OK' : result.status === 403 ? 'FORBIDDEN' : 'ERROR'}
              </span>
            </div>
            <span className="text-xs text-stone-500 font-mono">{result.timestamp}</span>
          </div>

          <pre className="mt-2.5 overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs font-mono text-stone-100">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
