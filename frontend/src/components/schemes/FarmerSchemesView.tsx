import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  Building2,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Globe,
  CheckCircle,
  XCircle,
  HelpCircle,
  Layers,
  BookOpen,
} from 'lucide-react';
import { schemesApi } from '../../services/api.js';
import { GovernmentScheme, SchemeFilterParams } from '../../types/scheme.js';
import { SchemeCard } from './SchemeCard.js';
import { SchemeDetailsModal } from './SchemeDetailsModal.js';
import { SchemeDisclaimerBanner } from './SchemeDisclaimerBanner.js';

interface FarmerSchemesViewProps {
  initialSchemeId?: string;
  onNavigateToResources?: () => void;
}

const CATEGORIES = [
  'ALL',
  'Financial Assistance',
  'Crop Insurance',
  'Agriculture',
  'Irrigation',
  'Equipment Subsidy',
  'Farmer Loans',
  'Livestock',
  'Organic Farming',
];

export const FarmerSchemesView: React.FC<FarmerSchemesViewProps> = ({
  initialSchemeId,
  onNavigateToResources,
}) => {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [governmentLevel, setGovernmentLevel] = useState<'ALL' | 'CENTRAL' | 'STATE'>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'alphabetical'>('featured');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'KN'>('EN');

  // Modal state
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSchemes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: SchemeFilterParams = {
        search: search.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        government_level: governmentLevel !== 'ALL' ? governmentLevel : undefined,
        sort: sortBy,
      };

      const res = await schemesApi.getPublicSchemes(params);
      if (res.data?.success) {
        setSchemes(res.data.data || []);
      }
    } catch (err: any) {
      console.error('[FarmerSchemesView] Error loading schemes:', err);
      setError(err.response?.data?.error || 'Failed to load government schemes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [selectedCategory, governmentLevel, sortBy]);

  // Handle initialSchemeId prop (e.g. from deep link or direct URL)
  useEffect(() => {
    if (initialSchemeId && schemes.length > 0) {
      const match = schemes.find((s) => s.id === initialSchemeId);
      if (match) {
        setSelectedScheme(match);
        setIsModalOpen(true);
      }
    }
  }, [initialSchemeId, schemes]);

  // Save / Bookmark handler with optimistic UI update
  const handleToggleSave = async (scheme: GovernmentScheme) => {
    const isCurrentlySaved = Boolean(scheme.is_saved);
    const newSavedStatus = !isCurrentlySaved;

    // Optimistic local update
    setIsSavingId(scheme.id);
    setSchemes((prev) =>
      prev.map((s) => (s.id === scheme.id ? { ...s, is_saved: newSavedStatus } : s))
    );
    if (selectedScheme?.id === scheme.id) {
      setSelectedScheme((prev) => (prev ? { ...prev, is_saved: newSavedStatus } : null));
    }

    try {
      if (newSavedStatus) {
        await schemesApi.saveScheme(scheme.id);
        showToast(
          language === 'KN'
            ? 'ಯೋಜನೆಯನ್ನು ನಿಮ್ಮ ಉಳಿಸಿದ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ'
            : 'Scheme bookmarked to your saved list!'
        );
      } else {
        await schemesApi.removeSavedScheme(scheme.id);
        showToast(
          language === 'KN'
            ? 'ಯೋಜನೆಯನ್ನು ಉಳಿಸಿದ ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ'
            : 'Scheme removed from your saved list.'
        );
      }
    } catch (err: any) {
      console.error('[FarmerSchemesView] Error saving scheme:', err);
      // Revert optimistic update on failure
      setSchemes((prev) =>
        prev.map((s) => (s.id === scheme.id ? { ...s, is_saved: isCurrentlySaved } : s))
      );
      if (selectedScheme?.id === scheme.id) {
        setSelectedScheme((prev) => (prev ? { ...prev, is_saved: isCurrentlySaved } : null));
      }
      showToast('Could not update saved status. Please try again.');
    } finally {
      setIsSavingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenDetails = (scheme: GovernmentScheme) => {
    setSelectedScheme(scheme);
    setIsModalOpen(true);
  };

  // Filter schemes locally for search and saved toggle
  const filteredSchemes = useMemo(() => {
    let result = schemes;

    if (showSavedOnly) {
      result = result.filter((s) => s.is_saved);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.short_description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.department && s.department.toLowerCase().includes(q))
      );
    }

    return result;
  }, [schemes, showSavedOnly, search]);

  const savedCount = useMemo(() => schemes.filter((s) => s.is_saved).length, [schemes]);

  return (
    <div id="farmer-schemes-view-container" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="scheme-action-toast"
          className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Government Subsidies & Grants
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs text-neutral-500">Central & Karnataka State</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {language === 'KN' ? 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳು' : 'Government Schemes Directory'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
              {language === 'KN'
                ? 'ರೈತರಿಗಾಗಿ ಲಭ್ಯವಿರುವ ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸರ್ಕಾರದ ಅಧಿಕೃತ ಕೃಷಿ ಯೋಜನೆಗಳು, ಸಬ್ಸಿಡಿಗಳು ಮತ್ತು ಸಾಲ ಸೌಲಭ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.'
                : 'Explore verified agricultural subsidies, crop insurance, financial aid, solar pump grants, and credit facilities directly from official departments.'}
            </p>
          </div>

          {/* Quick Actions / Language toggle */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Language Switcher */}
            <button
              id="scheme-language-toggle-btn"
              onClick={() => setLanguage((prev) => (prev === 'EN' ? 'KN' : 'EN'))}
              title="Toggle English / Kannada (ಕನ್ನಡ)"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'EN' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Link to Resources */}
            {onNavigateToResources && (
              <button
                id="view-educational-resources-btn"
                onClick={onNavigateToResources}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Farmer Guides</span>
              </button>
            )}

            {/* Saved filter shortcut */}
            <button
              id="filter-saved-schemes-btn"
              onClick={() => setShowSavedOnly((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                showSavedOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>
                {language === 'KN' ? 'ಉಳಿಸಿದವುಗಳು' : 'Saved Schemes'}{' '}
                {savedCount > 0 && `(${savedCount})`}
              </span>
            </button>
          </div>
        </div>

        {/* Informational Disclaimer Banner */}
        <div className="mt-4">
          <SchemeDisclaimerBanner language={language} />
        </div>
      </div>

      {/* Search, Government Level, and Sorting Toolbar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="scheme-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === 'KN'
                  ? 'ಯೋಜನೆಯ ಹೆಸರು, ಸಬ್ಸಿಡಿ ಅಥವಾ ಇಲಾಖೆಯನ್ನು ಹುಡುಕಿ...'
                  : 'Search by scheme name, subsidy keyword, department...'
              }
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-neutral-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-neutral-400 hover:text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Government Level Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl shrink-0">
            <button
              id="gov-level-all-btn"
              onClick={() => setGovernmentLevel('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                governmentLevel === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Levels
            </button>
            <button
              id="gov-level-central-btn"
              onClick={() => setGovernmentLevel('CENTRAL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                governmentLevel === 'CENTRAL'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Central Govt.
            </button>
            <button
              id="gov-level-state-btn"
              onClick={() => setGovernmentLevel('STATE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                governmentLevel === 'STATE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Karnataka State
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              id="scheme-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Recently Added</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-neutral-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" />
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`scheme-category-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid or Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700">Loading government schemes...</p>
          <p className="text-xs text-neutral-400 mt-1">Retrieving latest agricultural subsidies catalog</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800">
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchSchemes}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">
            {showSavedOnly ? 'No Saved Schemes Yet' : 'No Government Schemes Found'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {showSavedOnly
              ? 'You have not saved any government schemes to your bookmarks. Browse through the directory and click the bookmark icon to save schemes for quick access.'
              : 'No agricultural schemes match your search or filter criteria. Try changing categories or clearing search keywords.'}
          </p>
          {showSavedOnly && (
            <button
              onClick={() => setShowSavedOnly(false)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              Browse All Schemes
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onViewDetails={handleOpenDetails}
              onToggleSave={handleToggleSave}
              isSaving={isSavingId === scheme.id}
              language={language}
            />
          ))}
        </div>
      )}

      {/* Scheme Details Modal */}
      <SchemeDetailsModal
        scheme={selectedScheme}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToggleSave={handleToggleSave}
        isSaving={isSavingId === selectedScheme?.id}
        language={language}
      />
    </div>
  );
};
