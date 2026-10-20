import React, { useState, useEffect } from 'react';
import { AnimalListing, ListingType, AnimalGender } from '../../types/animal.js';
import { ownerApi } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatLocation } from '../../utils/helpers.js';
import {
  X,
  PlusCircle,
  Beef,
  Bird,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface OwnerAddAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  animalToEdit?: AnimalListing | null;
}

const PRESET_IMAGES = [
  { label: 'Gir Cow', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=60' },
  { label: 'Dairy Buffalo', url: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=800&auto=format&fit=crop&q=60' },
  { label: 'Farm Goat', url: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&auto=format&fit=crop&q=60' },
  { label: 'Sheep', url: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&auto=format&fit=crop&q=60' },
  { label: 'Rooster / Chicken', url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60' },
  { label: 'Farm Ducks', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60' },
];

export const OwnerAddAnimalModal: React.FC<OwnerAddAnimalModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  animalToEdit,
}) => {
  const { user } = useAuth();
  const profile = user?.profile;

  const isEditing = Boolean(animalToEdit);

  const [listingType, setListingType] = useState<ListingType>('ANIMAL');
  const [category, setCategory] = useState('Cow');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<AnimalGender>('FEMALE');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [healthStatus, setHealthStatus] = useState('Vaccinated, Dewormed & Vet Certified');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (animalToEdit) {
      setListingType(animalToEdit.listing_type);
      setCategory(animalToEdit.category);
      setName(animalToEdit.name);
      setBreed(animalToEdit.breed || '');
      setAge(animalToEdit.age);
      setGender(animalToEdit.gender);
      setDescription(animalToEdit.description || '');
      setPrice(animalToEdit.price);
      setQuantity(animalToEdit.quantity);
      setLocation(animalToEdit.location);
      setImageUrl(animalToEdit.image_url || '');
      setHealthStatus(animalToEdit.health_status || '');
    } else {
      // Defaults for new listing
      setListingType('ANIMAL');
      setCategory('Cow');
      setName('');
      setBreed('');
      setAge('2 Years');
      setGender('FEMALE');
      setDescription('');
      setPrice('');
      setQuantity(1);
      setLocation(
        formatLocation(profile, 'Mandya, Karnataka')
      );
      setImageUrl('');
      setHealthStatus('Vaccinated, Dewormed & Vet Certified');
    }
    setErrorMsg(null);
  }, [animalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a listing name or title');
      return;
    }
    if (!category.trim()) {
      setErrorMsg('Please enter or select a category');
      return;
    }
    if (!age.trim()) {
      setErrorMsg('Please specify the age (e.g., 2 Years or 6 Months)');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('Please enter a valid price greater than 0');
      return;
    }
    if (!quantity || Number(quantity) < 1) {
      setErrorMsg('Quantity must be at least 1');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Please specify the farm or village location');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        listing_type: listingType,
        category: category.trim(),
        name: name.trim(),
        breed: breed.trim() || null,
        age: age.trim(),
        gender,
        description: description.trim() || null,
        price: Number(price),
        quantity: Number(quantity),
        location: location.trim(),
        image_url: imageUrl.trim() || null,
        health_status: healthStatus.trim() || null,
      };

      if (isEditing && animalToEdit) {
        await ownerApi.updateAnimal(animalToEdit.id, payload);
      } else {
        await ownerApi.createAnimal(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error saving listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/80">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <Beef className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                {isEditing ? 'Edit Livestock Listing' : 'List Animal or Bird for Sale'}
              </h3>
              <p className="text-xs text-stone-500">
                Publish verified livestock to the rural farmer marketplace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs sm:text-sm text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Toggle: Animal vs Bird */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-1.5">
              Classification *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setListingType('ANIMAL');
                  if (category === 'Chicken' || category === 'Duck') setCategory('Cow');
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl p-3 border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  listingType === 'ANIMAL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Beef className="h-4 w-4" />
                <span>Livestock (Cattle, Goats, Sheep)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setListingType('BIRD');
                  if (category === 'Cow' || category === 'Buffalo') setCategory('Chicken');
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl p-3 border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  listingType === 'BIRD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Bird className="h-4 w-4" />
                <span>Birds & Poultry (Chicken, Duck, Turkey)</span>
              </button>
            </div>
          </div>

          {/* Category & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Category / Species *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              >
                {listingType === 'ANIMAL' ? (
                  <>
                    <option value="Cow">Cow (Dairy / Indigenous)</option>
                    <option value="Buffalo">Buffalo</option>
                    <option value="Goat">Goat</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Bull / Ox">Bull / Draught Ox</option>
                    <option value="Horse">Horse / Pony</option>
                    <option value="Other Animal">Other Animal</option>
                  </>
                ) : (
                  <>
                    <option value="Chicken">Chicken / Country Fowl</option>
                    <option value="Duck">Duck</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Quail">Quail</option>
                    <option value="Pigeon">Pigeon</option>
                    <option value="Other Bird">Other Bird</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Listing Title / Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pure Gir Dairy Cow, Kadaknath Pair"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Breed, Age, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Breed</label>
              <input
                type="text"
                placeholder="e.g. Gir, Murrah, Boer"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Age *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2.5 Years, 6 Months"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other / Group</option>
              </select>
            </div>
          </div>

          {/* Pricing & Stock Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Price per Unit (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 45000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs sm:text-sm font-bold text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Stock Quantity Available *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs sm:text-sm font-bold text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Location & Health Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Farm / Village Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Holenarasipura, Hassan, Karnataka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Health & Vaccination Status
              </label>
              <input
                type="text"
                placeholder="e.g. Vaccinated for FMD, Vet certified"
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Image URL & Preset Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Photo URL (Web image or Presets)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-stone-500 font-medium">Quick Presets:</span>
              {PRESET_IMAGES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setImageUrl(p.url)}
                  className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Live Thumbnail Preview */}
            {imageUrl && (
              <div className="mt-2 flex items-center gap-3 rounded-2xl bg-stone-50 p-2.5 border border-stone-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-16 w-16 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                  }}
                />
                <div className="text-xs text-stone-600">
                  <span className="font-semibold text-stone-900 block">Photo Preview</span>
                  <span>Will be displayed to farmers across the marketplace.</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Detailed Description & Farm Notes
            </label>
            <textarea
              rows={3}
              placeholder="Mention daily milk yield (liters/day), temperament, diet, parent pedigree, or training..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-stone-200 p-3 text-xs sm:text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Action Footer */}
          <div className="border-t border-stone-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-animal-listing"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isEditing ? 'Save Changes' : 'Publish Listing'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
