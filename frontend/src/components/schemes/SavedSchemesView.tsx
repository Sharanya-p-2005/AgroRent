import React, { useState, useEffect } from 'react';
import { Bookmark, RefreshCw, Trash2, ExternalLink, ChevronRight, ArrowLeft } from 'lucide-react';
import { farmerApi } from '../../services/api.js';
import { GovernmentScheme } from '../../types/scheme.js';
import { SchemeDetailsModal } from './SchemeDetailsModal.js';
import { SchemeDisclaimerBanner } from './SchemeDisclaimerBanner.js';

interface SavedSchemesViewProps {
  onBackToDirectory: () => void;
}

export const SavedSchemesView: React.FC<SavedSchemesViewProps> = ({ onBackToDirectory }) => {
  const [savedSchemes, setSavedSchemes] = useState<GovernmentScheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  const fetchSaved = async () => {
    setIsLoading(true);
    try {
      const res = await farmerApi.getSavedSchemes();
      if (res.data?.success) {
        setSavedSchemes(res.data.data || []);
      }
    } catch (err) {
      console.error('[SavedSchemesView] Error fetching saved schemes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (schemeId: string) => {
    setIsRemovingId(schemeId);
    // Optimistic removal
    setSavedSchemes((prev) => prev.filter((s) => s.id !== schemeId));
    try {
      await farmerApi.removeSavedScheme(schemeId);
    } catch (err) {
      console.error('[SavedSchemesView] Error removing scheme:', err);
      // Re-fetch on error
      fetchSaved();
    } finally {
      setIsRemovingId(null);
    }
  };

  return (
    <div id="saved-schemes-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={onBackToDirectory}
              className="text-xs text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Schemes Directory</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-amber-500" />
              <span>My Saved Government Schemes</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Your bookmarked agricultural schemes for quick offline reference and application tracking.
            </p>
          </div>

          <button
            onClick={onBackToDirectory}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shrink-0"
          >
            + Browse More Schemes
          </button>
        </div>

        <div className="mt-4">
          <SchemeDisclaimerBanner />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700">Loading your saved schemes...</p>
        </div>
      ) : savedSchemes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No Saved Schemes Yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            You have not bookmarked any government schemes. When exploring schemes, tap the bookmark icon to save them here for fast access.
          </p>
          <button
            onClick={onBackToDirectory}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Explore Schemes Directory
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {savedSchemes.map((scheme) => (
            <div
              key={scheme.id}
              id={`saved-scheme-row-${scheme.id}`}
              className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      scheme.government_level === 'CENTRAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {scheme.government_level === 'CENTRAL' ? 'Central' : 'Karnataka State'}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {scheme.category}
                  </span>
                </div>
                <h3
                  onClick={() => {
                    setSelectedScheme(scheme);
                    setIsModalOpen(true);
                  }}
                  className="text-base font-bold text-neutral-900 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {scheme.title}
                </h3>
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {scheme.short_description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {scheme.official_url && (
                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-neutral-500 hover:text-emerald-700 rounded-xl hover:bg-neutral-100 transition-colors"
                    title="Visit Official Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  id={`saved-scheme-remove-btn-${scheme.id}`}
                  onClick={() => handleRemove(scheme.id)}
                  disabled={isRemovingId === scheme.id}
                  title="Remove from saved"
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  id={`saved-scheme-view-btn-${scheme.id}`}
                  onClick={() => {
                    setSelectedScheme(scheme);
                    setIsModalOpen(true);
                  }}
                  className="px-3.5 py-2 font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SchemeDetailsModal
        scheme={selectedScheme}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToggleSave={() => selectedScheme && handleRemove(selectedScheme.id)}
      />
    </div>
  );
};
