import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <div className="bg-emerald-600 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 transition-all duration-300 shadow-xs z-50 sticky top-0">
        <Wifi className="w-3.5 h-3.5 animate-bounce" />
        <span>You are back online. Synchronizing agricultural data...</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between gap-2 transition-all duration-300 shadow-md z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse" />
        <span>
          <strong>Offline Mode Active:</strong> You are currently disconnected. Cached equipment, contacts, and farming guides remain available offline.
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded text-xs transition"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  );
};
