import React, { useState, useEffect } from 'react';
import { User, X, Check, Save, MapPin, Sprout, Droplets, Globe, Loader2, Home } from 'lucide-react';
import { api } from '../../services/api.js';

export const FarmerProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: (updatedUser: any) => void;
}> = ({ isOpen, onClose, currentUser, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
    address: '',
    pincode: '',
    farm_size_acres: 3,
    soil_type: 'Red Soil',
    primary_crops: 'Paddy, Ragi, Sugarcane',
    irrigation_type: 'Borewell',
    preferred_language: 'kn',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const prof = currentUser.profile || currentUser.farmer_profile || {};
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        village: prof.village || currentUser.village || '',
        taluk: prof.taluk || currentUser.taluk || '',
        district: prof.district || currentUser.district || currentUser.address?.district || '',
        state: prof.state || currentUser.state || currentUser.address?.state || 'Karnataka',
        address: prof.address || currentUser.address?.address || '',
        pincode: prof.pincode || currentUser.address?.pincode || '',
        farm_size_acres: prof.farm_size || prof.farm_size_acres || currentUser.farm_size_acres || 3,
        soil_type: prof.soil_type || currentUser.soil_type || 'Red Soil',
        primary_crops: Array.isArray(prof.crops_grown)
          ? prof.crops_grown.join(', ')
          : prof.main_crops || prof.primary_crops || 'Paddy, Ragi',
        irrigation_type: prof.irrigation_type || 'Borewell',
        preferred_language: prof.preferred_language || currentUser.preferred_language || 'kn',
      });
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
        village: formData.village.trim(),
        taluk: formData.taluk.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        farm_size: Number(formData.farm_size_acres),
        farm_size_acres: Number(formData.farm_size_acres),
        soil_type: formData.soil_type,
        primary_crops: formData.primary_crops,
        main_crops: formData.primary_crops,
        crops_grown: formData.primary_crops.split(',').map((c) => c.trim()),
        irrigation_type: formData.irrigation_type,
        preferred_language: formData.preferred_language,
      });

      if (res.data?.success) {
        setSuccess(true);
        if (onProfileUpdated) {
          onProfileUpdated(res.data.user || res.data.data);
        }
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update agricultural profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Farmer Farm & Soil Profile</h3>
              <p className="text-xs text-gray-500">
                Personalized agronomy, weather telemetry, and subsidy matching
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Location Details: Village & Taluk */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Geographic Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Village / Town</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Harohalli or Maddur"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Taluk / Tehsil</label>
                <input
                  type="text"
                  value={formData.taluk}
                  onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Kanakapura or Maddur Taluk"
                />
              </div>
            </div>

            {/* District & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">District</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Ramanagara or Mandya"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Select your single home district (e.g. Ramanagara or Mandya)
                </span>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Address & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-semibold mb-1">Farm / Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Survey No. 42, Farm Road"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. 562159"
                />
              </div>
            </div>
          </div>

          {/* Farm Land & Soil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>Farm Landholding (Acres)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.farm_size_acres}
                onChange={(e) => setFormData({ ...formData, farm_size_acres: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Primary Soil Type</label>
              <select
                value={formData.soil_type}
                onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Red Soil">Red Soil / Red Loam</option>
                <option value="Black Soil">Black Cotton Soil / Clayey</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay Loam">Clay Loam / Alluvial</option>
                <option value="Laterite">Laterite Soil</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                <span>Irrigation Infrastructure</span>
              </label>
              <select
                value={formData.irrigation_type}
                onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Borewell">Borewell Channel</option>
                <option value="Drip">Drip Irrigation</option>
                <option value="Sprinkler">Sprinkler System</option>
                <option value="Canal">Canal Irrigation</option>
                <option value="Rainfed">Rainfed / Dryland</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Preferred Language</span>
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Crops Cultivated (Comma separated)</label>
            <input
              type="text"
              value={formData.primary_crops}
              onChange={(e) => setFormData({ ...formData, primary_crops: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="e.g. Paddy, Ragi, Sugarcane, Maize"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Profile Saved!</span>
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Farm Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
