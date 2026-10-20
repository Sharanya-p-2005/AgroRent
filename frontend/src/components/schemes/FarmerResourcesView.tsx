import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  Video,
  Phone,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { resourcesApi } from '../../services/api.js';
import { FarmerResource, ResourceType } from '../../types/scheme.js';

interface FarmerResourcesViewProps {
  onBackToSchemes?: () => void;
}

const RESOURCE_TYPES: { type: string; label: string; icon: any }[] = [
  { type: 'ALL', label: 'All Resources', icon: Layers },
  { type: 'GUIDE', label: 'Practical Guides', icon: BookOpen },
  { type: 'ARTICLE', label: 'Technical Articles', icon: FileText },
  { type: 'DOCUMENT', label: 'Manuals & PDFs', icon: FileText },
  { type: 'HELPLINE', label: 'Helplines & Experts', icon: Phone },
  { type: 'VIDEO', label: 'Workshops & Videos', icon: Video },
];

export const FarmerResourcesView: React.FC<FarmerResourcesViewProps> = ({ onBackToSchemes }) => {
  const [resources, setResources] = useState<FarmerResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState<FarmerResource | null>(null);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        resource_type: selectedType !== 'ALL' ? selectedType : undefined,
      };
      const res = await resourcesApi.getPublicResources(params);
      if (res.data?.success) {
        setResources(res.data.data || []);
      }
    } catch (err) {
      console.error('[FarmerResourcesView] Error fetching resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const getBadgeForType = (type: ResourceType) => {
    switch (type) {
      case 'GUIDE':
        return 'bg-emerald-100 text-emerald-800';
      case 'ARTICLE':
        return 'bg-blue-100 text-blue-800';
      case 'DOCUMENT':
        return 'bg-indigo-100 text-indigo-800';
      case 'HELPLINE':
        return 'bg-amber-100 text-amber-800';
      case 'VIDEO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div id="farmer-resources-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Knowledge Base & Extension
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs text-neutral-500">Karnataka Agricultural Advisory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              <span>Farmer Resources & Agricultural Guides</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
              Access field-tested manuals on micro-irrigation, soil health testing, pest management, vermicompost setup, and verified agronomist helpline contacts.
            </p>
          </div>

          {onBackToSchemes && (
            <button
              onClick={onBackToSchemes}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shrink-0 self-start sm:self-auto"
            >
              ← Back to Government Schemes
            </button>
          )}
        </div>
      </div>

      {/* Search & Type Filter Tabs */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="resource-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides, crop advisory, irrigation manuals, contacts..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Resource Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {RESOURCE_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.type}
                id={`resource-type-btn-${t.type.toLowerCase()}`}
                onClick={() => setSelectedType(t.type)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                  selectedType === t.type
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Resources */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs">
          <p className="text-sm font-medium text-neutral-600">Loading resources and guides...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-2xs space-y-2">
          <BookOpen className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-800">No Resources Found</h3>
          <p className="text-xs text-neutral-500">Try changing your search keywords or selected resource type.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <div
              key={res.id}
              id={`resource-card-${res.id}`}
              className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-emerald-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${getBadgeForType(
                      res.resource_type
                    )}`}
                  >
                    {res.resource_type}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {res.category}
                  </span>
                </div>

                <h3
                  onClick={() => setSelectedResource(res)}
                  className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2 leading-snug"
                >
                  {res.title}
                </h3>

                <p className="text-xs text-neutral-600 mt-2 line-clamp-3 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
                {res.official_url ? (
                  <a
                    href={res.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>External Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div />
                )}

                <button
                  id={`resource-read-btn-${res.id}`}
                  onClick={() => setSelectedResource(res)}
                  className="px-3.5 py-1.5 font-semibold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1"
                >
                  <span>Read Guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Reader Modal */}
      {selectedResource && (
        <div
          id="resource-reader-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setSelectedResource(null)}
        >
          <div
            id="resource-reader-modal-card"
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 bg-emerald-900 text-white flex items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase">
                    {selectedResource.resource_type}
                  </span>
                  <span className="text-xs font-medium text-emerald-200">
                    {selectedResource.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {selectedResource.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-neutral-800 leading-relaxed">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700 font-medium">
                {selectedResource.description}
              </div>

              <div className="whitespace-pre-line text-neutral-800 space-y-2 pt-2">
                {selectedResource.content}
              </div>

              {selectedResource.official_url && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 mt-4">
                  <span className="text-xs text-emerald-900 font-medium">
                    Verified Agricultural Extension Resource
                  </span>
                  <a
                    href={selectedResource.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setSelectedResource(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 hover:bg-neutral-200 bg-white border border-neutral-300 rounded-xl transition-colors"
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
