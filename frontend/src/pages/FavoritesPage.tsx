import React, { useState, useEffect } from 'react';
import { Heart, Tractor, Bird, UserCheck, FileText, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { favoritesApi } from '../services/api.js';
import { Navbar } from '../components/Navbar.js';
import { Footer } from '../components/Footer.js';

interface EnrichedFavorite {
  id: string;
  item_type: 'EQUIPMENT' | 'ANIMAL' | 'DRIVER' | 'FARM_WORKER' | 'SCHEME';
  item_id: string;
  created_at: string;
  details: any;
}

export const FavoritesPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

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
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, activeTab]);

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
    let linkPath = '#';

    if (item_type === 'EQUIPMENT') {
      title = details.name;
      subtitle = `${details.category || 'Machinery'} • ${details.location || 'Local'}`;
      badge = 'Equipment';
      priceText = `₹${details.price_per_hour}/hr`;
      linkPath = `/dashboard/farmer?tab=equipment`;
    } else if (item_type === 'ANIMAL') {
      title = details.name;
      subtitle = `${details.category} • ${details.breed || 'Standard'} • ${details.location || 'Local'}`;
      badge = 'Livestock';
      priceText = `₹${Number(details.price).toLocaleString('en-IN')}`;
      linkPath = `/dashboard/farmer?tab=animals`;
    } else if (item_type === 'DRIVER' || item_type === 'FARM_WORKER') {
      title = details.name;
      subtitle = `${item_type === 'DRIVER' ? 'Tractor Driver' : 'Farm Worker'} • ${details.location || 'Local'} • ${details.experience_years || 0} yrs exp`;
      badge = item_type === 'DRIVER' ? 'Driver' : 'Worker';
      priceText = details.hourly_rate ? `₹${details.hourly_rate}/hr` : (details.daily_rate ? `₹${details.daily_rate}/day` : '');
      linkPath = `/dashboard/farmer?tab=services`;
    } else if (item_type === 'SCHEME') {
      title = details.title;
      subtitle = `${details.government_level} • ${details.category} ${details.department ? `• ${details.department}` : ''}`;
      badge = 'Govt Scheme';
      priceText = details.benefits || 'Official Assistance';
      linkPath = `/schemes`;
    }

    return (
      <div
        key={`${item_type}-${item_id}`}
        className="group relative rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div>
          {/* Top meta */}
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

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Saved {new Date(fav.created_at).toLocaleDateString()}
          </span>

          <Link
            to={linkPath}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Explore</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">Saved Favorites</h1>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-100">
                  {favorites.length} saved
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Quickly access equipment, livestock, drivers, and government schemes you've bookmarked.
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-xs mb-6 overflow-x-auto">
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

        {/* Content Grid */}
        {loading ? (
          <div className="py-16 text-center text-sm text-stone-500">Loading your favorites...</div>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
            <Heart className="h-12 w-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No favorites saved in this category</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Click the heart icon on any equipment, animal, driver, or government scheme card to keep it here for quick access.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/farmer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-xs"
              >
                <span>Browse Marketplace</span>
              </Link>
              <Link
                to="/schemes"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
              >
                <span>View Government Schemes</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((fav) => renderItemCard(fav))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
