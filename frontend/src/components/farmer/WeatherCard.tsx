import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  description: string;
  icon: string;
  timestamp: string;
  advisory: string;
}

export const WeatherCard: React.FC<{ userLocation?: string; onOpenForecast?: () => void }> = ({
  userLocation = 'Mandya, Karnataka',
  onOpenForecast,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [configured, setConfigured] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/weather/current?location=${encodeURIComponent(userLocation)}`);
      if (res.data?.configured === false) {
        setConfigured(false);
        setMessage(res.data.message || 'Weather API is unconfigured.');
      } else if (res.data?.success && res.data?.data) {
        setWeather(res.data.data);
        setConfigured(true);
      } else {
        setMessage(res.data?.message || 'Unable to load weather telemetry.');
      }
    } catch (err: any) {
      console.warn('Weather fetch error:', err);
      setMessage('Unable to connect to meteorological service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [userLocation]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/20 rounded"></div>
          <div className="h-8 w-24 bg-white/20 rounded"></div>
          <div className="h-3 w-48 bg-white/20 rounded"></div>
        </div>
        <Cloud className="w-12 h-12 text-white/30" />
      </div>
    );
  }

  // Graceful unconfigured notice (No fabricated data per instructions)
  if (!configured || !weather) {
    return (
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md border border-emerald-700/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Regional Agromet Weather Advisory</span>
            </div>
            <h3 className="text-lg font-bold mt-1 text-white">{userLocation}</h3>
          </div>
          <button
            onClick={fetchWeather}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 p-3 bg-white/10 rounded-xl border border-white/10 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-100 leading-relaxed flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-white">Live Telemetry Notice</p>
              <button
                type="button"
                onClick={fetchWeather}
                className="text-[11px] font-bold text-emerald-300 hover:text-white underline cursor-pointer"
              >
                Retry
              </button>
            </div>
            <p>{message || 'Connect WEATHER_API_KEY to stream real-time radar and micro-climate advisories.'}</p>
            <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-emerald-200/80">
              <span className="font-semibold text-amber-300">General Farming Tip ({userLocation}): </span>
              Maintain optimal irrigation schedules during early morning or evening hours.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md border border-emerald-700/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            <CloudRain className="w-4 h-4 text-emerald-300" />
            <span>Field Weather & Advisory</span>
          </div>
          <h3 className="text-xl font-bold mt-1 text-white">{weather.location}</h3>
          <p className="text-xs text-emerald-200 capitalize">{weather.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {weather.temperature}°C
          </div>
          <div className="text-[11px] text-emerald-200">
            Feels like {weather.feels_like}°C
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
        <div className="bg-white/10 rounded-lg py-1.5 px-2">
          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-200">
            <Droplets className="w-3 h-3 text-emerald-300" />
            <span>Humidity</span>
          </div>
          <div className="font-bold text-sm text-white mt-0.5">{weather.humidity}%</div>
        </div>
        <div className="bg-white/10 rounded-lg py-1.5 px-2">
          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-200">
            <Wind className="w-3 h-3 text-emerald-300" />
            <span>Wind</span>
          </div>
          <div className="font-bold text-sm text-white mt-0.5">{weather.wind_speed} m/s</div>
        </div>
        <div className="bg-white/10 rounded-lg py-1.5 px-2">
          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-200">
            <Compass className="w-3 h-3 text-emerald-300" />
            <span>Range</span>
          </div>
          <div className="font-bold text-sm text-white mt-0.5">{weather.temp_min}°-{weather.temp_max}°</div>
        </div>
      </div>

      {weather.advisory && (
        <div className="mt-3.5 bg-white/10 rounded-xl p-2.5 border border-white/15 flex items-start gap-2">
          <Sun className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-100 leading-snug">
            <strong className="text-white">Agronomic Note:</strong> {weather.advisory}
          </p>
        </div>
      )}
    </div>
  );
};
