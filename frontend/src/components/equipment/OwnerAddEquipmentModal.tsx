import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory } from '../../types/equipment.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatLocation } from '../../utils/helpers.js';
import { ownerApi } from '../../services/api.js';
import {
  X,
  Tractor,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  MapPin,
  Tag
} from 'lucide-react';

const CATEGORIES: EquipmentCategory[] = [
  'Tractor',
  'Harvester',
  'Rotavator',
  'Cultivator',
  'Water Pump',
  'JCB',
  'Power Tiller',
  'Seeder',
  'Sprayer',
  'Baler',
  'Thresher',
  'Plough',
  'Other',
];

const PRESET_IMAGES = [
  {
    name: 'Tractor (Mahindra / JD)',
    url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Combine Harvester',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Rotavator / Tiller',
    url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Cultivator / Harrow',
    url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Diesel Water Pump',
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=60',
  },
  {
    name: 'Heavy JCB / Backhoe',
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=60',
  },
];

interface OwnerAddEquipmentModalProps {
  initialEquipment?: Equipment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerAddEquipmentModal: React.FC<OwnerAddEquipmentModalProps> = ({
  initialEquipment,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const profile = user?.profile;

  const [name, setName] = useState(initialEquipment?.name || '');
  const [category, setCategory] = useState<EquipmentCategory>(
    (initialEquipment?.category as EquipmentCategory) || 'Tractor'
  );
  const [description, setDescription] = useState(initialEquipment?.description || '');
  const [brand, setBrand] = useState(initialEquipment?.brand || '');
  const [model, setModel] = useState(initialEquipment?.model || '');
  const [pricePerHour, setPricePerHour] = useState<number | ''>(
    initialEquipment ? initialEquipment.price_per_hour : ''
  );
  const [location, setLocation] = useState(
    initialEquipment?.location || (profile ? formatLocation(profile, '') : '')
  );
  const [imageUrl, setImageUrl] = useState(
    initialEquipment?.image_url || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !category || !brand.trim() || !model.trim() || !location.trim()) {
      setErrorMessage('Please fill in all mandatory equipment details.');
      return;
    }

    if (typeof pricePerHour !== 'number' || pricePerHour <= 0) {
      setErrorMessage('Please specify a valid hourly rental rate (> ₹0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        brand: brand.trim(),
        model: model.trim(),
        image_url: imageUrl.trim() || '',
        price_per_hour: Number(pricePerHour),
        location: location.trim(),
      };

      if (initialEquipment) {
        await ownerApi.updateEquipment(initialEquipment.id, payload);
      } else {
        await ownerApi.createEquipment(payload);
      }

      onSuccess();
    } catch (err: any) {
      console.error('[OwnerAddEquipmentModal] error:', err);
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to save equipment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <Tractor className="h-5 w-5 text-amber-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              {initialEquipment ? 'Edit Equipment Listing' : 'Add Agricultural Equipment'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Equipment Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mahindra 575 DI 45HP Tractor"
              required
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          {/* Category & Hourly Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600 bg-white cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Rental Rate (₹ / Hour) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={pricePerHour}
                  onChange={(e) =>
                    setPricePerHour(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 750"
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Mahindra, John Deere, Kubota"
                required
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Model / Variant *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. 5050D PowerPro / 6-Feet Rotavator"
                required
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Equipment Location */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Stationing Yard / Farm Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Channapatna Rural, Ramanagara, Karnataka"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Description & Specifications
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail horse power, fuel consumption, included attachments, operating condition..."
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          {/* Image Selection with Preset suggestions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Equipment Photo URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-800 focus:outline-amber-600"
            />

            <div className="text-[11px] text-stone-500 font-medium pt-1">
              Or pick a standard agriculture machinery photo preset:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border text-[11px] text-left transition-all cursor-pointer ${
                    imageUrl === preset.url
                      ? 'border-amber-600 bg-amber-50 font-bold text-amber-900'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Listing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{initialEquipment ? 'Save Changes' : 'Publish Equipment Listing'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
