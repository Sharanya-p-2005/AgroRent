import React from 'react';
import { ServiceProfile } from '../../types/service.js';
import { Truck, Users, MapPin, Award, Phone, Calendar, Clock, Star, ShieldCheck } from 'lucide-react';
import { FavoriteButton } from '../FavoriteButton.js';

interface ServiceCardProps {
  service: ServiceProfile;
  onViewDetails: (service: ServiceProfile) => void;
  onBookNow: (service: ServiceProfile) => void;
  userDistanceKm?: number | null;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onViewDetails, onBookNow, userDistanceKm }) => {
  const isDriver = service.service_type === 'DRIVER';
  const isAvailable = service.availability_status === 'AVAILABLE';
  const effectiveDistance = userDistanceKm ?? service.distance_km;
  const radius = service.service_radius_km || 25;
  const servesArea = effectiveDistance != null ? effectiveDistance <= radius : null;

  // Parse skills into array
  const skillList = service.skills
    ? service.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      id={`service-card-${service.id}`}
      className="bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Top Header Section */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {service.profile_image_url ? (
                <img
                  src={service.profile_image_url}
                  alt={service.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-stone-100 shadow-inner"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
                    isDriver ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isDriver ? <Truck className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-stone-900 text-lg leading-tight">{service.name}</h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDriver
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isDriver ? 'Driver' : 'Farm Worker'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-medium text-amber-700">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    {service.experience_years} {service.experience_years === 1 ? 'Year' : 'Years'} Exp
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <FavoriteButton
                itemType={isDriver ? 'DRIVER' : 'FARM_WORKER'}
                itemId={service.id}
                size="sm"
              />
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Location & Distance */}
          <div className="mt-3 flex items-center justify-between gap-1 text-xs text-stone-600">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{service.location}</span>
            </div>
            {effectiveDistance != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200 shrink-0">
                <span>📍</span>
                <span>{effectiveDistance} km</span>
              </span>
            )}
          </div>

          {servesArea !== null && (
            <div className="mt-1 text-[11px]">
              {servesArea ? (
                <span className="text-emerald-700 font-medium">✓ Serves your location (within {radius} km radius)</span>
              ) : (
                <span className="text-amber-700 font-medium">⚠ Exceeds standard service radius ({radius} km)</span>
              )}
            </div>
          )}

          {/* Description snippet */}
          {service.description && (
            <p className="mt-2.5 text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}

          {/* Skills Badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skillList.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/60"
              >
                {skill}
              </span>
            ))}
            {skillList.length > 4 && (
              <span className="px-2 py-0.5 rounded-md bg-stone-50 text-stone-500 text-xs font-medium">
                +{skillList.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="bg-stone-50/80 border-t border-b border-stone-200/70 px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Hourly Rate</div>
            <div className="text-base font-bold text-stone-900">
              ₹{Number(service.price_per_hour).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-stone-500"> / hr</span>
            </div>
          </div>
          <div className="h-7 w-px bg-stone-200" />
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Daily Rate (8 hrs)</div>
            <div className="text-base font-bold text-emerald-700">
              ₹{Number(service.price_per_day).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-stone-500"> / day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-4 grid grid-cols-2 gap-2.5">
        <button
          id={`btn-view-${service.id}`}
          onClick={() => onViewDetails(service)}
          className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs sm:text-sm transition-colors text-center"
        >
          View Profile
        </button>
        <button
          id={`btn-book-${service.id}`}
          onClick={() => onBookNow(service)}
          disabled={!isAvailable}
          className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-colors text-center ${
            isAvailable
              ? isDriver
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isAvailable ? 'Book Now' : 'Not Available'}
        </button>
      </div>
    </div>
  );
};
