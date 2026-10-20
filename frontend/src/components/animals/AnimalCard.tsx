import React from 'react';
import { AnimalListing } from '../../types/animal.js';
import { MapPin, Phone, User, Tag, ShieldCheck, HeartPulse, ShoppingCart, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { FavoriteButton } from '../FavoriteButton.js';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface AnimalCardProps {
  animal: AnimalListing;
  onSelect: (animal: AnimalListing) => void;
  onBuyNow: (animal: AnimalListing) => void;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onSelect, onBuyNow }) => {
  const isAvailable = animal.availability_status === 'AVAILABLE' && animal.quantity > 0;
  const isSold = animal.availability_status === 'SOLD' || animal.quantity <= 0;

  return (
    <div
      id={`animal-card-${animal.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-400 transition-all duration-200"
    >
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
          <CategoryPlaceholderImage
            src={animal.image_url}
            alt={animal.name}
            category={animal.category}
            listingType={animal.listing_type}
            aspectClassName="aspect-16/10"
          />

          {/* Type & Category Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white">
              <Tag className="h-3 w-3 text-amber-400" />
              {animal.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-700/85 backdrop-blur-xs px-2 py-0.5 text-xs font-medium text-emerald-100">
              {animal.listing_type === 'BIRD' ? 'Bird / Poultry' : 'Livestock'}
            </span>
          </div>

          {/* Availability Status Badge & Favorite Button */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <FavoriteButton itemType="ANIMAL" itemId={animal.id} size="sm" />
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-xs shadow-xs ${
                isAvailable
                  ? 'bg-emerald-600/90 text-white'
                  : isSold
                  ? 'bg-stone-700/90 text-white'
                  : 'bg-amber-600/90 text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAvailable ? 'bg-emerald-200 animate-pulse' : 'bg-stone-300'
                }`}
              />
              {isAvailable ? 'Available' : isSold ? 'Sold' : animal.availability_status}
            </span>
          </div>

          {/* Stock Tag on Bottom Left of Image */}
          {isAvailable && (
            <div className="absolute bottom-2.5 left-3 rounded-lg bg-black/60 backdrop-blur-xs px-2 py-0.5 text-xs font-medium text-stone-200">
              In Stock: <span className="font-bold text-white">{animal.quantity}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          {/* Header Title & Breed */}
          <div className="mb-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                {animal.name}
              </h3>
              <span className="shrink-0 text-xs font-semibold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                {animal.gender}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-stone-600">
              {animal.breed ? `Breed: ${animal.breed}` : `Category: ${animal.category}`} • Age: {animal.age}
            </p>
          </div>

          {/* Health Status Pill */}
          {animal.health_status && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-100">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate" title={animal.health_status}>
                {animal.health_status}
              </span>
            </div>
          )}

          {/* Description snippet */}
          {animal.description && (
            <p className="text-xs text-stone-500 line-clamp-2 mb-3">
              {animal.description}
            </p>
          )}

          {/* Seller & Location Info */}
          <div className="space-y-1.5 border-t border-stone-100 pt-3 text-xs text-stone-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{animal.location}</span>
            </div>
            {animal.seller_name && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="truncate font-medium text-stone-700">{animal.seller_name}</span>
                </div>
                {animal.seller_phone && (
                  <div className="flex items-center gap-1 text-stone-500">
                    <Phone className="h-3 w-3" />
                    <span>{animal.seller_phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Price & CTAs */}
      <div className="border-t border-stone-100 bg-stone-50/60 p-4 sm:p-5 flex items-center justify-between gap-3">
        <div>
          <span className="block text-xs font-medium text-stone-500">Fixed Price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-stone-900">
              ₹{animal.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-stone-500">/ unit</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id={`btn-view-${animal.id}`}
            onClick={() => onSelect(animal)}
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-stone-700 shadow-xs hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            title="View Details"
          >
            <Info className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Details</span>
          </button>

          <button
            type="button"
            id={`btn-buy-${animal.id}`}
            onClick={() => onBuyNow(animal)}
            disabled={!isAvailable}
            className={`inline-flex items-center gap-1.5 justify-center rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer ${
              isAvailable
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{isAvailable ? 'Buy Now' : 'Sold Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
