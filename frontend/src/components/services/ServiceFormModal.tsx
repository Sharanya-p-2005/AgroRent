import React, { useState, useEffect } from 'react';
import { ServiceProfile, ServiceType } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import { X, Truck, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialService?: ServiceProfile | null;
  defaultServiceType?: ServiceType;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialService,
  defaultServiceType = 'DRIVER',
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialService);

  const [serviceType, setServiceType] = useState<ServiceType>(
    initialService?.service_type || defaultServiceType
  );
  const [name, setName] = useState(initialService?.name || '');
  const [phone, setPhone] = useState(initialService?.phone || '');
  const [imageUrl, setImageUrl] = useState(initialService?.profile_image_url || '');
  const [description, setDescription] = useState(initialService?.description || '');
  const [experienceYears, setExperienceYears] = useState(
    initialService?.experience_years !== undefined ? String(initialService.experience_years) : '2'
  );
  const [skills, setSkills] = useState(initialService?.skills || '');
  const [pricePerHour, setPricePerHour] = useState(
    initialService?.price_per_hour !== undefined ? String(initialService.price_per_hour) : '350'
  );
  const [pricePerDay, setPricePerDay] = useState(
    initialService?.price_per_day !== undefined ? String(initialService.price_per_day) : '2500'
  );
  const [location, setLocation] = useState(initialService?.location || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(
    initialService?.availability_status || 'AVAILABLE'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialService) {
      setServiceType(initialService.service_type);
      setName(initialService.name);
      setPhone(initialService.phone);
      setImageUrl(initialService.profile_image_url || '');
      setDescription(initialService.description || '');
      setExperienceYears(String(initialService.experience_years));
      setSkills(initialService.skills);
      setPricePerHour(String(initialService.price_per_hour));
      setPricePerDay(String(initialService.price_per_day));
      setLocation(initialService.location);
      setAvailabilityStatus(initialService.availability_status);
    } else {
      setServiceType(defaultServiceType);
      if (defaultServiceType === 'DRIVER') {
        setSkills('Tractor Driving, Rotavator Operation, Ploughing');
        setPricePerHour('350');
        setPricePerDay('2500');
      } else {
        setSkills('Crop Harvesting, Sowing, Hand Weeding, Drip Irrigation');
        setPricePerHour('150');
        setPricePerDay('1000');
      }
    }
  }, [initialService, defaultServiceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Contact phone number is required');
      return;
    }
    if (!skills.trim()) {
      setError('At least one skill or specialization is required');
      return;
    }
    if (!location.trim()) {
      setError('Operating location (village/taluk/district) is required');
      return;
    }

    const exp = parseInt(experienceYears, 10);
    if (isNaN(exp) || exp < 0) {
      setError('Experience must be 0 or more years');
      return;
    }

    const hourly = parseFloat(pricePerHour);
    const daily = parseFloat(pricePerDay);
    if (isNaN(hourly) || hourly <= 0) {
      setError('Hourly rate must be greater than 0');
      return;
    }
    if (isNaN(daily) || daily <= 0) {
      setError('Daily rate must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && initialService) {
        const payload = {
          name: name.trim(),
          phone: phone.trim(),
          profile_image_url: imageUrl.trim() || undefined,
          description: description.trim() || undefined,
          experience_years: exp,
          skills: skills.trim(),
          price_per_hour: hourly,
          price_per_day: daily,
          location: location.trim(),
          availability_status: availabilityStatus,
        };

        const res = await serviceBookingsApi.updateService(initialService.id, payload);
        if (res.data?.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.data?.message || 'Failed to update profile');
        }
      } else {
        const payload = {
          service_type: serviceType,
          name: name.trim(),
          phone: phone.trim(),
          profile_image_url: imageUrl.trim() || undefined,
          description: description.trim() || undefined,
          experience_years: exp,
          skills: skills.trim(),
          price_per_hour: hourly,
          price_per_day: daily,
          location: location.trim(),
        };

        const res = await serviceBookingsApi.createService(payload);
        if (res.data?.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.data?.message || 'Failed to create profile');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="service-form-modal"
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150"
      >
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {serviceType === 'DRIVER' ? (
              <Truck className="w-5 h-5 text-blue-400" />
            ) : (
              <Users className="w-5 h-5 text-emerald-400" />
            )}
            <h2 className="text-lg font-bold">
              {isEditing
                ? `Edit ${initialService?.name}`
                : `List New ${serviceType === 'DRIVER' ? 'Agricultural Driver' : 'Farm Worker'}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-stone-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Type Selection (only when creating) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Service Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-select-driver-type"
                  onClick={() => {
                    setServiceType('DRIVER');
                    setSkills('Tractor Driving, Rotavator Operation, Ploughing');
                    setPricePerHour('350');
                    setPricePerDay('2500');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    serviceType === 'DRIVER'
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Agricultural Driver
                </button>
                <button
                  type="button"
                  id="btn-select-worker-type"
                  onClick={() => {
                    setServiceType('FARM_WORKER');
                    setSkills('Crop Harvesting, Sowing, Hand Weeding, Drip Irrigation');
                    setPricePerHour('150');
                    setPricePerDay('1000');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    serviceType === 'FARM_WORKER'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Farm Worker
                </button>
              </div>
            </div>
          )}

          {/* Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Full Name / Team Name <span className="text-red-500">*</span>
              </label>
              <input
                id="input-service-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="input-service-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9845123401"
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Location and Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Operating Location <span className="text-red-500">*</span>
              </label>
              <input
                id="input-service-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mandya, Karnataka"
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Experience (Years) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-service-experience"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Hourly and Daily Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Price Per Hour (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-service-price-hour"
                type="number"
                min="1"
                step="10"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Price Per Day (₹ - 8 hrs) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-service-price-day"
                type="number"
                min="1"
                step="50"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Skills / Specializations */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Skills & Equipment Handled (comma separated) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-service-skills"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Tractor Driving, Rotavator, Disc Harrow, Laser Leveller"
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Profile Photo URL (Optional)
            </label>
            <input
              id="input-service-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              About / Work History
            </label>
            <textarea
              id="input-service-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail operating machinery, field specializations, crops worked on, and availability details..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* Availability Status in Edit Mode */}
          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Availability Status
              </label>
              <select
                id="select-service-availability"
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="AVAILABLE">Available for bookings</option>
                <option value="UNAVAILABLE">Unavailable / Booked</option>
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-service-profile"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
