import React, { useState, useEffect } from 'react';
import { Heart, Tractor, Bird, UserCheck, FileText, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../../services/api.js';

interface EnrichedFavorite {
  id: string;
  item_type: 'EQUIPMENT' | 'ANIMAL' | 'DRIVER' | 'FARM_WORKER' | 'SCHEME';
  item_id: string;
  created_at: string;
  details: any;
}

interface FavoritesViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onNavigateTab }) => {
  const [favorites, setFavorites] = useState<EnrichedFavorite[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await favoritesApi.getAll(activeTab !== 'ALL' ? activeTab : undefined);
      if (res.data && Array.isArray(res.data.data)) {
        setFavorites(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [activeTab]);

  const handleRemove = async (itemType: string, itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await favoritesApi.remove(itemType, itemId);
      setFavorites((prev) => prev.filter((f) => !(f.item_type === itemType && f.item_id === itemId)));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'EQUIPMENT':
        return <Tractor className="h-4 w-4" />;
      case 'ANIMAL':
        return <Bird className="h-4 w-4" />;
      case 'DRIVER':
      case 'FARM_WORKER':
        return <UserCheck className="h-4 w-4" />;
      case 'SCHEME':
        return <FileText className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const renderItemCard = (fav: EnrichedFavorite) => {
    const { item_type, item_id, details } = fav;
    if (!details) return null;

    let title = 'Listing';
    let subtitle = '';
    let badge: string = item_type;
    let priceText = '';
    let targetTab = 'rent-equipment';

    if (item_type === 'EQUIPMENT') {
      title = details.name;
      subtitle = `${details.category || 'Machinery'} • ${details.location || 'Local'}`;
      badge = 'Equipment';
      priceText = `₹${details.price_per_hour}/hr`;
      targetTab = 'rent-equipment';
    } else if (item_type === 'ANIMAL') {
      title = details.name;
      subtitle = `${details.category} • ${details.breed || 'Standard'} • ${details.location || 'Local'}`;
      badge = 'Livestock';
      priceText = `₹${Number(details.price).toLocaleString('en-IN')}`;
      targetTab = 'animals-birds';
    } else if (item_type === 'DRIVER') {
      title = details.name;
      subtitle = `Tractor Driver • ${details.location || 'Local'} • ${details.experience_years || 0} yrs exp`;
      badge = 'Driver';
      priceText = details.hourly_rate ? `₹${details.hourly_rate}/hr` : (details.daily_rate ? `₹${details.daily_rate}/day` : '');
      targetTab = 'drivers';
    } else if (item_type === 'FARM_WORKER') {
      title = details.name;
      subtitle = `Farm Worker • ${details.location || 'Local'} • ${details.experience_years || 0} yrs exp`;
      badge = 'Worker';
      priceText = details.hourly_rate ? `₹${details.hourly_rate}/hr` : (details.daily_rate ? `₹${details.daily_rate}/day` : '');
      targetTab = 'farm-workers';
    } else if (item_type === 'SCHEME') {
      title = details.title;
      subtitle = `${details.government_level} • ${details.category}`;
      badge = 'Govt Scheme';
      priceText = details.benefits || 'Official Scheme';
      targetTab = 'government-schemes';
    }

    return (
      <div
        key={`${item_type}-${item_id}`}
        className="group relative rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-100">
              {getTabIcon(item_type)}
              <span>{badge}</span>
            </span>

            <button
              type="button"
              onClick={(e) => handleRemove(item_type, item_id, e)}
              title="Remove from favorites"
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            </button>
          </div>

          <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{subtitle}</p>

          {priceText && (
            <div className="mt-3 text-sm font-bold text-stone-900">{priceText}</div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Saved {new Date(fav.created_at).toLocaleDateString()}
          </span>

          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => onNavigateTab(targetTab)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <span>View in {badge}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to={`/dashboard/farmer?tab=${targetTab}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Saved Favorites</h2>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-100">
            {favorites.length} saved
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Quickly access your saved machinery, livestock, farm drivers, and government schemes.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-xs overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Saved' },
          { id: 'EQUIPMENT', label: 'Equipment' },
          { id: 'ANIMAL', label: 'Livestock' },
          { id: 'DRIVER', label: 'Drivers' },
          { id: 'FARM_WORKER', label: 'Farm Workers' },
          { id: 'SCHEME', label: 'Govt Schemes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            {getTabIcon(tab.id)}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-stone-500">Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
          <Heart className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">No favorites saved in this category</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Click the heart icon on any listing card or scheme to save it for quick booking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => renderItemCard(fav))}
        </div>
      )}
    </div>
  );
};
