import React from 'react';
import { AnimalListing } from '../../types/animal.js';
import { ReviewsList } from '../reviews/ReviewsList.js';
import {
  X,
  MapPin,
  Phone,
  User,
  Tag,
  ShieldCheck,
  HeartPulse,
  ShoppingCart,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface AnimalDetailsModalProps {
  animal: AnimalListing | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderNow: (animal: AnimalListing) => void;
}

export const AnimalDetailsModal: React.FC<AnimalDetailsModalProps> = ({
  animal,
  isOpen,
  onClose,
  onOrderNow,
}) => {
  if (!isOpen || !animal) return null;

  const isAvailable = animal.availability_status === 'AVAILABLE' && animal.quantity > 0;
  const isSold = animal.availability_status === 'SOLD' || animal.quantity <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          id="btn-close-animal-details"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Photo Banner */}
        <div className="relative aspect-16/9 w-full bg-stone-100 overflow-hidden">
          <CategoryPlaceholderImage
            src={animal.image_url}
            alt={animal.name}
            category={animal.category}
            listingType={animal.listing_type}
            aspectClassName="aspect-16/9"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />

          {/* Type & Availability */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-bold text-stone-950">
                  <Tag className="h-3 w-3" />
                  {animal.category}
                </span>
                <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-xs font-semibold">
                  {animal.listing_type === 'BIRD' ? 'Bird / Poultry' : 'Livestock'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">{animal.name}</h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-stone-300 block">Unit Price</span>
              <span className="text-2xl font-black text-amber-300">
                ₹{animal.price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 text-center">
              <span className="text-xs text-stone-500 block">Breed</span>
              <span className="text-sm font-bold text-stone-900">{animal.breed || 'Native / Desi'}</span>
            </div>
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 text-center">
              <span className="text-xs text-stone-500 block">Age</span>
              <span className="text-sm font-bold text-stone-900">{animal.age}</span>
            </div>
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 text-center">
              <span className="text-xs text-stone-500 block">Gender</span>
              <span className="text-sm font-bold text-stone-900">{animal.gender}</span>
            </div>
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 text-center">
              <span className="text-xs text-stone-500 block">Stock Available</span>
              <span className="text-sm font-bold text-stone-900">{animal.quantity} units</span>
            </div>
          </div>

          {/* Health and Veterinary Status */}
          {animal.health_status && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2 mb-1 text-emerald-900 font-bold text-sm">
                <HeartPulse className="h-4 w-4 text-emerald-700" />
                <span>Health & Vaccination Status</span>
              </div>
              <p className="text-sm text-emerald-800 font-medium">{animal.health_status}</p>
            </div>
          )}

          {/* Description */}
          {animal.description && (
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-2">Detailed Information</h4>
              <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 rounded-2xl p-4 border border-stone-100 whitespace-pre-line">
                {animal.description}
              </p>
            </div>
          )}

          {/* Location & Seller Section */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Verified Rural Seller</span>
              </h4>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                AgroRent Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-stone-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-stone-400 shrink-0" />
                <span className="font-semibold text-stone-900">{animal.seller_name || 'Registered Owner'}</span>
              </div>
              {animal.seller_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                  <a href={`tel:${animal.seller_phone}`} className="hover:underline font-medium text-emerald-800">
                    {animal.seller_phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {animal.location}
                  {animal.seller_village ? ` (${animal.seller_village}, ${animal.seller_district})` : ''}
                </span>
              </div>
            </div>

            {/* Verified Livestock Reviews */}
            <div className="pt-3 border-t border-stone-100">
              <ReviewsList targetType="ANIMAL" targetId={animal.id} title="Livestock & Breeder Reviews" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 bg-stone-50 p-4 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-stone-500 block">Total Unit Price</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900">
              ₹{animal.price.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              id="btn-order-from-details"
              onClick={() => {
                onClose();
                onOrderNow(animal);
              }}
              disabled={!isAvailable}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-xs transition-colors cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{isAvailable ? 'Place Order' : 'Item Sold Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
