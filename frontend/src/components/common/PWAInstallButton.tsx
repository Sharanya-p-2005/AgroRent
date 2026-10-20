import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS, render a helpful install option or prompt
  return (
    <>
      {installSuccess ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>AgroRent App Installed!</span>
        </div>
      ) : (
        <button
          id="pwa-install-btn"
          onClick={handleInstallClick}
          title="Install AgroRent on your mobile phone or desktop"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors shadow-xs ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install App</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-emerald-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-3 text-emerald-800">
              <Smartphone className="w-5 h-5" />
              <h3 className="font-semibold text-base">Install AgroRent on iPhone</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              To install AgroRent as a standalone mobile app on iOS Safari:
            </p>
            <ol className="text-xs text-gray-700 space-y-2.5 list-decimal pl-4 mb-5">
              <li>Tap the <strong>Share</strong> icon in the Safari bottom toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the top-right corner to launch with full offline support.</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
