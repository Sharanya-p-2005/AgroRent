import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { favoritesApi } from '../services/api.js';

interface FavoriteButtonProps {
  itemType: 'EQUIPMENT' | 'ANIMAL' | 'DRIVER' | 'FARM_WORKER' | 'SCHEME';
  itemId: string;
  initialFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  itemType,
  itemId,
  initialFavorited = false,
  onToggle,
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState<boolean>(initialFavorited);
  const [loading, setLoading] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<string>('');

  // Synchronize initial state if provided or check status if authenticated
  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  useEffect(() => {
    let mounted = true;
    if (isAuthenticated && user?.role === 'FARMER' && itemId) {
      favoritesApi
        .check(itemType, itemId)
        .then((res) => {
          if (mounted && res.data && typeof res.data.isFavorite === 'boolean') {
            setIsFavorited(res.data.isFavorite);
          }
        })
        .catch(() => {
          // Silent fallback
        });
    }
    return () => {
      mounted = false;
    };
  }, [itemType, itemId, isAuthenticated, user?.role]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setTooltip('Please log in to save favorites');
      setTimeout(() => setTooltip(''), 2500);
      return;
    }

    if (user?.role !== 'FARMER' && user?.role !== 'ADMIN') {
      setTooltip('Only farmers can save items to favorites');
      setTimeout(() => setTooltip(''), 2500);
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState); // Optimistic update
    setLoading(true);

    try {
      if (nextState) {
        await favoritesApi.add(itemType, itemId);
      } else {
        await favoritesApi.remove(itemType, itemId);
      }
      if (onToggle) onToggle(nextState);
    } catch (err: any) {
      // Revert on error
      setIsFavorited(!nextState);
      setTooltip(err.response?.data?.message || 'Failed to update favorites');
      setTimeout(() => setTooltip(''), 2500);
    } finally {
      setLoading(false);
    }
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const btnPaddings = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        id={`fav-btn-${itemType.toLowerCase()}-${itemId}`}
        title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        className={`group flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${btnPaddings[size]} ${
          isFavorited
            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700'
            : 'bg-white/90 text-stone-400 hover:bg-stone-100 hover:text-stone-700 border border-stone-200 shadow-xs'
        } ${className}`}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`${iconSizes[size]} transition-transform duration-200 ${
            isFavorited
              ? 'fill-rose-500 text-rose-500 scale-105'
              : 'fill-transparent text-stone-400 group-hover:scale-110 group-hover:text-stone-600'
          }`}
        />
        {showLabel && (
          <span className="ml-1.5 text-xs font-semibold">
            {isFavorited ? 'Saved' : 'Save'}
          </span>
        )}
      </button>

      {/* Tooltip feedback */}
      {tooltip && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-md animate-in fade-in">
          {tooltip}
        </div>
      )}
    </div>
  );
};
