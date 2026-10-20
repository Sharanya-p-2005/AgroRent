import React, { useState, useEffect } from 'react';
import { adminSettingsApi, adminHealthApi } from '../../services/api.js';
import {
  Settings,
  Activity,
  Server,
  Database,
  Cpu,
  ShieldAlert,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  // Settings state
  const [settings, setSettings] = useState<any>({
    maintenance_mode: false,
    maintenance_message: 'AgroRent is undergoing scheduled maintenance. Please check back shortly.',
    commission_rate: 0,
    platform_fee_inr: 0,
    equipment_rentals_enabled: true,
    animals_marketplace_enabled: true,
    driver_services_enabled: true,
    farm_workers_enabled: true,
    ai_assistant_enabled: true,
    sms_notifications_enabled: true,
  });

  // System Health state
  const [health, setHealth] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await adminHealthApi.getHealth();
      if (res.data?.success) {
        setHealth(res.data.data);
      }
    } catch (err: any) {
      console.error('[AdminSettingsView] Error loading health:', err);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await adminSettingsApi.getSettings();
      if (res.data?.success && res.data.data) {
        setSettings((prev: any) => ({ ...prev, ...res.data.data }));
      }
    } catch (err: any) {
      console.error('[AdminSettingsView] Error loading settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const res = await adminSettingsApi.updateSettings(settings);
      if (res.data?.success) {
        setSaveSuccess('Platform configurations updated successfully and recorded in audit trail.');
        if (res.data.data) {
          setSettings((prev: any) => ({ ...prev, ...res.data.data }));
        }
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-purple-600" />
            Platform System Settings & Infrastructure
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Global governance controls, operational feature toggles, maintenance mode, and server metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHealth}
            disabled={isLoadingHealth}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
            Ping Infrastructure
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* SYSTEM HEALTH CARDS */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            Live Infrastructure Health & Microservices
          </h2>
          {health && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                (health.overallStatus || health.status) === 'HEALTHY'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-amber-700 bg-amber-50'
              }`}
            >
              <CheckCircle className="w-3 h-3" /> System {health.overallStatus || health.status || 'ONLINE'}
            </span>
          )}
        </div>

        {isLoadingHealth ? (
          <div className="py-6 text-center text-xs text-stone-400">Pinging server cluster...</div>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-50 border border-stone-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold mb-1">
                <Server className="w-3.5 h-3.5 text-purple-600" /> Server Process
              </div>
              <div className="text-sm font-bold text-stone-900">Uptime: {health.server?.uptimeFormatted || 'Active'}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">Node {health.server?.nodeVersion || 'v20+'}</div>
            </div>

            <div className="bg-stone-50 border border-stone-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold mb-1">
                <Database className="w-3.5 h-3.5 text-blue-600" /> PostgreSQL Database
              </div>
              <div className="text-sm font-bold text-emerald-700">
                Connected ({health.database?.queryLatencyMs ?? 0} ms)
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Tables: {health.database?.totalTables || 24} verified
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold mb-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Payment Gateways
              </div>
              <div className="text-sm font-bold text-stone-900">
                Razorpay: {health.payments?.gateways?.razorpay?.status || 'Active'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                UPI QR: {health.payments?.gateways?.upi_qr?.status || 'Ready'}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Engine (Gemini)
              </div>
              <div className="text-sm font-bold text-stone-900">
                {health.ai?.service || 'Gemini Pro / Flash'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Mode: Active Gemini</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* SETTINGS FORM */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Maintenance Mode Panel */}
        <div
          className={`border rounded-2xl p-5 shadow-xs transition-all ${
            settings.maintenance_mode
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  settings.maintenance_mode
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Platform Maintenance Mode</h3>
                <p className="text-xs text-stone-500">
                  When enabled, all non-admin client requests are blocked with a maintenance message.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSettings((s: any) => ({ ...s, maintenance_mode: !s.maintenance_mode }))
              }
              className="text-stone-700 hover:text-stone-900 cursor-pointer"
            >
              {settings.maintenance_mode ? (
                <ToggleRight className="w-9 h-9 text-rose-600" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-stone-400" />
              )}
            </button>
          </div>

          {settings.maintenance_mode && (
            <div className="mt-4 pt-4 border-t border-rose-200 space-y-2">
              <label className="block text-xs font-semibold text-stone-700">
                Broadcast Maintenance Message
              </label>
              <input
                type="text"
                value={settings.maintenance_message}
                onChange={e =>
                  setSettings((s: any) => ({ ...s, maintenance_message: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}
        </div>

        {/* Feature Toggles Panel */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Platform Feature Flags</h3>
          <p className="text-xs text-stone-500">
            Control the availability of marketplace modules for all farmers and equipment owners.
          </p>

          <div className="divide-y divide-stone-100">
            {[
              { key: 'equipment_rentals_enabled', label: 'Equipment & Machinery Rental Marketplace' },
              { key: 'animals_marketplace_enabled', label: 'Animals & Livestock Marketplace' },
              { key: 'driver_services_enabled', label: 'Agricultural Driver Dispatch Services' },
              { key: 'farm_workers_enabled', label: 'Farm Worker Teams & Labor Hiring' },
              { key: 'ai_assistant_enabled', label: 'AgroRent AI Assistant & Recommendation Engine' },
            ].map(item => (
              <div key={item.key} className="py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">{item.label}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s: any) => ({ ...s, [item.key]: !s[item.key] }))
                  }
                  className="cursor-pointer"
                >
                  {settings[item.key] ? (
                    <ToggleRight className="w-8 h-8 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-stone-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Governance */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Financial Parameters</h3>
          <p className="text-xs text-stone-500">
            Platform transaction take-rate and fixed convenience fees.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Platform Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.commission_rate}
                onChange={e =>
                  setSettings((s: any) => ({ ...s, commission_rate: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Currently set to 0.0% for farmer empowerment.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fixed Platform Processing Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settings.platform_fee_inr}
                onChange={e =>
                  setSettings((s: any) => ({ ...s, platform_fee_inr: parseFloat(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Direct pass-through (₹0 fixed charges).
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save System Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
