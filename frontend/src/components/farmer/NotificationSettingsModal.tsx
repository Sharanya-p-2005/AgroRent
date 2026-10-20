import React, { useState, useEffect } from 'react';
import { Bell, X, Check, MessageSquare, Phone, CloudRain, Award, Tag, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const NotificationSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState({
    whatsapp_enabled: true,
    sms_enabled: true,
    in_app_enabled: true,
    weather_alerts: true,
    scheme_alerts: true,
    promotional_alerts: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPrefs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/notifications/preferences');
        if (res.data?.success && res.data?.data) {
          setPreferences({
            whatsapp_enabled: res.data.data.whatsapp_enabled ?? true,
            sms_enabled: res.data.data.sms_enabled ?? true,
            in_app_enabled: res.data.data.in_app_enabled ?? true,
            weather_alerts: res.data.data.weather_alerts ?? true,
            scheme_alerts: res.data.data.scheme_alerts ?? true,
            promotional_alerts: res.data.data.promotional_alerts ?? false,
          });
        }
      } catch (err) {
        console.warn('Failed to load notification preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/notifications/preferences', preferences);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Alert & Notification Settings</h3>
              <p className="text-xs text-gray-500">Configure how and when you receive farming updates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Loading alert preferences...</span>
          </div>
        ) : (
          <div className="py-4 space-y-4 text-xs">
            {/* Delivery Channels */}
            <div>
              <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block mb-2">
                Communication Channels
              </span>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 cursor-pointer hover:bg-emerald-50/40">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-gray-900 block">WhatsApp Broadcasts</span>
                      <span className="text-gray-500 text-[11px]">Instant booking confirmation and driver GPS tracking links</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp_enabled}
                    onChange={() => handleToggle('whatsapp_enabled')}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 cursor-pointer hover:bg-emerald-50/40">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-gray-900 block">SMS Alerts</span>
                      <span className="text-gray-500 text-[11px]">Transactional messages and critical booking reminders</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.sms_enabled}
                    onChange={() => handleToggle('sms_enabled')}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Content Preferences */}
            <div>
              <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block mb-2">
                Advisory & Topic Subscriptions
              </span>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 cursor-pointer hover:bg-emerald-50/40">
                  <div className="flex items-center gap-2.5">
                    <CloudRain className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-semibold text-gray-900 block">Severe Weather & Rain Warnings</span>
                      <span className="text-gray-500 text-[11px]">Daily forecast summaries and unexpected storm warnings</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.weather_alerts}
                    onChange={() => handleToggle('weather_alerts')}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 cursor-pointer hover:bg-emerald-50/40">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-semibold text-gray-900 block">Government Subsidies & Schemes</span>
                      <span className="text-gray-500 text-[11px]">New Karnataka & Central farm subsidy application announcements</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.scheme_alerts}
                    onChange={() => handleToggle('scheme_alerts')}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 cursor-pointer hover:bg-emerald-50/40">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-gray-900 block">Seasonal Rental Promotions</span>
                      <span className="text-gray-500 text-[11px]">Special machinery rates during harvesting peak season</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.promotional_alerts}
                    onChange={() => handleToggle('promotional_alerts')}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
