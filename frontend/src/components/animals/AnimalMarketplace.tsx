import React, { useState, useEffect } from 'react';
import { AnimalListing, AnimalFilterState, AnimalOrder } from '../../types/animal.js';
import { animalApi } from '../../services/api.js';
import { AnimalSearch } from './AnimalSearch.js';
import { AnimalFilter } from './AnimalFilter.js';
import { AnimalGrid } from './AnimalGrid.js';
import { AnimalDetailsModal } from './AnimalDetailsModal.js';
import { BuyAnimalModal } from './BuyAnimalModal.js';
import { Beef, Bird, ShoppingBag, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AnimalMarketplaceProps {
  onGoToOrders?: () => void;
}

const INITIAL_FILTERS: AnimalFilterState = {
  search: '',
  listing_type: 'ALL',
  category: 'ALL',
  gender: 'ALL',
  location: '',
  minPrice: undefined,
  maxPrice: undefined,
  sortBy: 'newest',
};

export const AnimalMarketplace: React.FC<AnimalMarketplaceProps> = ({ onGoToOrders }) => {
  const [animals, setAnimals] = useState<AnimalListing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<AnimalFilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalListing | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [animalToBuy, setAnimalToBuy] = useState<AnimalListing | null>(null);

  const fetchAnimals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        sort: filters.sortBy,
      };
      if (filters.search) params.search = filters.search;
      if (filters.listing_type !== 'ALL') params.listing_type = filters.listing_type;
      if (filters.category !== 'ALL') params.category = filters.category;
      if (filters.gender !== 'ALL') params.gender = filters.gender;
      if (filters.location) params.location = filters.location;
      if (filters.maxPrice) params.max_price = filters.maxPrice;

      const res = await animalApi.getAll(params);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list: AnimalListing[] = res.data.data;
        setAnimals(list);

        // Derive unique categories from items
        const catSet = new Set<string>();
        list.forEach((item) => {
          if (item.category) catSet.add(item.category);
        });
        // Default popular categories
        const defaults = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Chicken', 'Duck'];
        defaults.forEach((d) => catSet.add(d));
        setCategories(Array.from(catSet));
      } else {
        setError('Failed to fetch marketplace livestock listings');
      }
    } catch (err: any) {
      console.error('[AnimalMarketplace] Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Error loading animal marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, [filters]);

  const handleOpenDetails = (animal: AnimalListing) => {
    setSelectedAnimal(animal);
    setIsDetailsOpen(true);
  };

  const handleOpenBuy = (animal: AnimalListing) => {
    setAnimalToBuy(animal);
    setIsBuyModalOpen(true);
  };

  const handleOrderSuccess = (order: AnimalOrder) => {
    // Refresh inventory counts
    fetchAnimals();
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 p-6 sm:p-8 text-white shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/30 backdrop-blur-xs px-3 py-1 text-xs font-bold text-amber-200 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Verified Animal & Bird Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Buy & Trade Rural Livestock & Poultry
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-amber-100/90 leading-relaxed">
              Browse healthy dairy cattle, sheep, goats, country chickens, and farm birds directly from verified rural breeders and owners with doorstep delivery.
            </p>
          </div>

          {onGoToOrders && (
            <div className="shrink-0">
              <button
                type="button"
                id="btn-nav-to-animal-orders"
                onClick={onGoToOrders}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-stone-900 shadow-md hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 text-emerald-700" />
                <span>My Livestock Orders</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <AnimalSearch
          value={filters.search}
          onChange={(val) => setFilters({ ...filters, search: val })}
        />

        <AnimalFilter
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          categories={categories}
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs sm:text-sm font-medium text-stone-600">
          Showing <span className="font-bold text-stone-900">{animals.length}</span> verified livestock & bird listings
        </div>
        <button
          type="button"
          onClick={fetchAnimals}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <span className="font-bold">Error loading marketplace:</span> {error}
          </div>
        </div>
      )}

      {/* Animal Grid */}
      <AnimalGrid
        animals={animals}
        isLoading={isLoading}
        onSelect={handleOpenDetails}
        onBuyNow={handleOpenBuy}
        onResetFilters={handleResetFilters}
      />

      {/* Animal Details Modal */}
      <AnimalDetailsModal
        animal={selectedAnimal}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAnimal(null);
        }}
        onOrderNow={handleOpenBuy}
      />

      {/* Buy Checkout Modal */}
      <BuyAnimalModal
        animal={animalToBuy}
        isOpen={isBuyModalOpen}
        onClose={() => {
          setIsBuyModalOpen(false);
          setAnimalToBuy(null);
        }}
        onOrderSuccess={handleOrderSuccess}
        onNavigateToOrders={onGoToOrders}
      />
    </div>
  );
};
