import React from 'react';
import { Equipment } from '../../types/equipment.js';
import { MapPin, Phone, User, Calendar, Tag, ShieldCheck, Clock } from 'lucide-react';
import { FavoriteButton } from '../FavoriteButton.js';

import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect: (equipment: Equipment) => void;
  onBookNow: (equipment: Equipment) => void;
  userDistanceKm?: number | null;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onSelect,
  onBookNow,
  userDistanceKm,
}) => {
  const isAvailable = equipment.availability_status === 'AVAILABLE';
  const effectiveDistance = userDistanceKm ?? equipment.distance_km;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200">
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
          <CategoryPlaceholderImage
            src={equipment.image_url}
            alt={equipment.name}
            category={equipment.category}
            aspectClassName="aspect-16/10"
          />

          {/* Category Chip */}
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white">
            <Tag className="h-3 w-3 text-emerald-400" />
            {equipment.category}
          </span>

          {/* Top Right: Favorite Button & Availability Status */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <FavoriteButton itemType="EQUIPMENT" itemId={equipment.id} size="sm" />
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-xs shadow-xs ${
                isAvailable
                  ? 'bg-emerald-600/90 text-white'
                  : equipment.availability_status === 'RENTED'
                  ? 'bg-amber-600/90 text-white'
                  : 'bg-stone-700/90 text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAvailable ? 'bg-emerald-200 animate-pulse' : 'bg-stone-300'
                }`}
              />
              {equipment.availability_status}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          {/* Brand & Model */}
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
            <span>{equipment.brand} • {equipment.model}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {equipment.name}
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
            {equipment.description}
          </p>

          {/* Location & Owner Details */}
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex items-center justify-between gap-1 text-stone-600">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{equipment.location}</span>
              </div>
              {effectiveDistance != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 shrink-0">
                  <span>📍</span>
                  <span>{effectiveDistance} km</span>
                </span>
              )}
            </div>
            {equipment.owner_name && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="truncate font-medium text-stone-700">{equipment.owner_name}</span>
                </div>
                {equipment.owner_phone && (
                  <span className="text-[11px] text-stone-400 font-mono">
                    {equipment.owner_phone}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
          <div>
            <div className="text-[11px] text-stone-500 font-medium">Rental Rate</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-emerald-800">
                ₹{equipment.price_per_hour}
              </span>
              <span className="text-xs text-stone-500">/ hour</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(equipment)}
              className="px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onBookNow(equipment)}
              disabled={!isAvailable}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              Rent Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
