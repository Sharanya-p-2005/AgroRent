import React from 'react';
import { ServiceProfile } from '../../types/service.js';
import { ReviewsList } from '../reviews/ReviewsList.js';
import { Truck, Users, MapPin, Award, Phone, Mail, ShieldCheck, X, Calendar, Clock, DollarSign } from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: ServiceProfile) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
}) => {
  if (!isOpen || !service) return null;

  const isDriver = service.service_type === 'DRIVER';
  const isAvailable = service.availability_status === 'AVAILABLE';

  const skillList = service.skills
    ? service.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="service-detail-modal"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150"
      >
        {/* Header */}
        <div
          className={`p-6 flex items-start justify-between text-white ${
            isDriver ? 'bg-blue-700' : 'bg-emerald-700'
          }`}
        >
          <div className="flex items-center gap-4">
            {service.profile_image_url ? (
              <img
                src={service.profile_image_url}
                alt={service.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/80 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white">
                {isDriver ? <Truck className="w-8 h-8" /> : <Users className="w-8 h-8" />}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                  {isDriver ? 'Agricultural Driver' : 'Farm Worker'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isAvailable ? 'bg-emerald-400 text-emerald-950' : 'bg-red-400 text-red-950'
                  }`}
                >
                  {isAvailable ? 'Available for Work' : 'Currently Booked'}
                </span>
              </div>
              <h2 className="text-2xl font-bold mt-1">{service.name}</h2>
              <div className="flex items-center gap-2 text-xs opacity-90 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{service.location}</span>
                <span>•</span>
                <Award className="w-3.5 h-3.5" />
                <span>{service.experience_years} Years Experience</span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Rate Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Hourly Rate</div>
              <div className="text-2xl font-extrabold text-stone-900 mt-1">
                ₹{Number(service.price_per_hour).toLocaleString('en-IN')}
                <span className="text-sm font-normal text-stone-500"> / hour</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Ideal for short farm tasks & tilling</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Full Day Rate (8 hrs)</div>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                ₹{Number(service.price_per_day).toLocaleString('en-IN')}
                <span className="text-sm font-normal text-emerald-600"> / day</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">Best value for seasonal harvesting</div>
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-700 mb-2">
                About / Professional Experience
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
                {service.description}
              </p>
            </div>
          )}

          {/* Skills & Machinery Expertise */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Skills & Machinery Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillList.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Provider & Verification Details */}
          <div className="border-t border-stone-200 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-700 mb-3">
              Provider & Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-stone-500 shrink-0" />
                <div>
                  <div className="text-stone-400">Direct Contact</div>
                  <div className="font-semibold text-stone-900">{service.phone}</div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-stone-400">Owner / Agency</div>
                  <div className="font-semibold text-stone-900">{service.provider_name || 'AgroRent Verified Provider'}</div>
                </div>
              </div>
            </div>

            {/* Verified Reviews */}
            <div className="pt-3 border-t border-stone-100">
              <ReviewsList
                targetType={isDriver ? 'DRIVER' : 'FARM_WORKER'}
                targetId={service.id}
                title="Client Ratings & Reviews"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            id="btn-close-details"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-white text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button
            id="btn-book-from-detail"
            onClick={() => {
              onClose();
              onBookNow(service);
            }}
            disabled={!isAvailable}
            className={`px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-sm ${
              isAvailable
                ? isDriver
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-stone-300 cursor-not-allowed'
            }`}
          >
            {isAvailable ? 'Book This Service' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};
