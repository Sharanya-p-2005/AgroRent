import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Tractor,
  Beef,
  Truck,
  Users,
  FileText,
  BookOpen,
  Star,
  MapPin,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Tag,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { aiApi } from '../../services/api.js';

interface AIRecommendationSectionProps {
  onSelectTab?: (tabId: string, itemData?: any) => void;
}

export const AIRecommendationSection: React.FC<AIRecommendationSectionProps> = ({
  onSelectTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'equipment' | 'animals' | 'drivers' | 'workers' | 'schemes' | 'resources'
  >('equipment');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'equipment', label: 'Machinery', icon: Tractor },
    { id: 'animals', label: 'Livestock', icon: Beef },
    { id: 'drivers', label: 'Drivers', icon: Truck },
    { id: 'workers', label: 'Farm Workers', icon: Users },
    { id: 'schemes', label: 'Govt Schemes', icon: FileText },
    { id: 'resources', label: 'Farm Guides', icon: BookOpen },
  ];

  const fetchRecommendations = async (cat: typeof activeCategory) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiApi.getRecommendations(cat, 6);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      setError('Unable to load smart recommendations at this time.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(activeCategory);
  }, [activeCategory]);

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold">Smart Agricultural Recommendations</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-700/80 border border-emerald-500/60 px-2 py-0.5 rounded-full text-emerald-100">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Personalized based on your farm location, rental history, and seasonal operations in Karnataka.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchRecommendations(activeCategory)}
          disabled={isLoading}
          className="self-start md:self-auto flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg text-white transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-2.5 flex items-center space-x-2 overflow-x-auto">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-xl bg-gray-100 animate-pulse border border-gray-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>{error}</p>
            <button
              onClick={() => fetchRecommendations(activeCategory)}
              className="mt-2 text-xs text-emerald-600 font-medium hover:underline"
            >
              Try reloading
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No smart recommendations available for this category right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition p-4 relative"
              >
                {/* Score badge */}
                {item.recommendation_score && (
                  <div className="absolute top-3 right-3 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Score: {Math.round(item.recommendation_score)}</span>
                  </div>
                )}

                <div>
                  <div className="pr-20">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                      {item.name || item.title || 'Recommended Item'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.category || item.service_type || 'Agricultural Resource'}
                    </p>
                  </div>

                  {/* Pricing / Details */}
                  <div className="mt-2.5 flex items-baseline space-x-2">
                    {item.price_per_hour && (
                      <span className="text-base font-bold text-emerald-700">
                        ₹{item.price_per_hour}
                        <span className="text-xs text-gray-500 font-normal">/hr</span>
                      </span>
                    )}
                    {item.price && !item.price_per_hour && (
                      <span className="text-base font-bold text-emerald-700">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </span>
                    )}
                    {item.price_per_day && (
                      <span className="text-xs text-gray-600 font-medium">
                        (₹{item.price_per_day}/day)
                      </span>
                    )}
                    {item.rating && (
                      <span className="flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-auto">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  {/* Location if present */}
                  {item.location && (
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  {/* Relevance reason for schemes */}
                  {item.relevance_reason && (
                    <p className="mt-2 text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                      💡 {item.relevance_reason}
                    </p>
                  )}

                  {/* Explanation Tags */}
                  {Array.isArray(item.explanation_tags) && item.explanation_tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {item.explanation_tags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-[11px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Action Navigation (Explicit farmer confirmation flow) */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {activeCategory === 'schemes' ? 'Official Scheme' : 'Verified Listing'}
                  </span>
                  <button
                    onClick={() => {
                      if (onSelectTab) {
                        if (activeCategory === 'equipment') onSelectTab('rent-equipment', item);
                        else if (activeCategory === 'animals') onSelectTab('animals-birds', item);
                        else if (activeCategory === 'drivers') onSelectTab('drivers', item);
                        else if (activeCategory === 'workers') onSelectTab('farm-workers', item);
                        else if (activeCategory === 'schemes') onSelectTab('government-schemes', item);
                        else if (activeCategory === 'resources') onSelectTab('farmer-resources', item);
                      }
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{activeCategory === 'schemes' ? 'Read Scheme' : 'View & Book'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
