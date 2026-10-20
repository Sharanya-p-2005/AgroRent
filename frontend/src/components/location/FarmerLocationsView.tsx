import React, { useState, useEffect } from 'react';
import { locationsApi } from '../../services/api.js';
import { requestCurrentLocation } from '../../utils/geolocation.js';
import { LocationMap } from './LocationMap.js';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Navigation,
  Loader2,
  AlertCircle,
  Home,
  Building2,
  Sparkles,
} from 'lucide-react';

interface SavedLocation {
  id: string;
  user_id: string;
  label: 'HOME' | 'FARM' | 'OFFICE' | 'OTHER';
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const FarmerLocationsView: React.FC = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    label: 'FARM' as 'HOME' | 'FARM' | 'OFFICE' | 'OTHER',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
    latitude: '' as string | number,
    longitude: '' as string | number,
    is_default: false,
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await locationsApi.getAll();
      if (res.data?.success) {
        setLocations(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load saved locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const resetForm = () => {
    setFormData({
      label: 'FARM',
      address: '',
      city: '',
      state: 'Karnataka',
      pincode: '',
      latitude: '',
      longitude: '',
      is_default: false,
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (loc: SavedLocation) => {
    setFormData({
      label: loc.label,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      latitude: loc.latitude ?? '',
      longitude: loc.longitude ?? '',
      is_default: loc.is_default,
    });
    setEditId(loc.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      setError(null);
      const loc = await requestCurrentLocation();
      const roundedLat = Math.round(loc.latitude * 10000) / 10000;
      const roundedLon = Math.round(loc.longitude * 10000) / 10000;

      setFormData((prev) => ({
        ...prev,
        latitude: roundedLat,
        longitude: roundedLon,
      }));
      setSuccessMsg('Current GPS coordinates detected successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Unable to access your GPS location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      setError('Please fill in address, city, and pincode.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        label: formData.label,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || 'Karnataka',
        pincode: formData.pincode.trim(),
        latitude: formData.latitude !== '' ? parseFloat(formData.latitude as any) : null,
        longitude: formData.longitude !== '' ? parseFloat(formData.longitude as any) : null,
        is_default: formData.is_default,
      };

      if (isEditing && editId) {
        await locationsApi.update(editId, payload);
        setSuccessMsg('Location updated successfully.');
      } else {
        await locationsApi.create(payload);
        setSuccessMsg('New farm location saved successfully.');
      }

      setShowModal(false);
      resetForm();
      fetchLocations();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to remove '${label}' from your saved locations?`)) {
      return;
    }

    try {
      setError(null);
      await locationsApi.delete(id);
      setSuccessMsg('Location deleted successfully.');
      fetchLocations();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete location.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setError(null);
      await locationsApi.setDefault(id);
      setSuccessMsg('Default delivery location updated.');
      fetchLocations();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update default location.');
    }
  };

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'FARM':
        return <MapPin className="w-5 h-5 text-emerald-600" />;
      case 'HOME':
        return <Home className="w-5 h-5 text-blue-600" />;
      case 'OFFICE':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      default:
        return <MapPin className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Farm Locations & Delivery Addresses
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Save your farm, warehouse, and delivery coordinates to automatically calculate distances to
            tractors, harvesters, drivers, and animal livestock transport.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Farm Location
        </button>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Locations Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          Loading your saved locations...
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 text-base">No Saved Locations Yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-5">
            Add your farm or home location so you can find equipment nearby, book machinery seamlessly,
            and track live animal deliveries.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={`p-5 rounded-2xl bg-white border transition shadow-sm flex flex-col justify-between ${
                loc.is_default
                  ? 'border-emerald-300 ring-2 ring-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                      {getLabelIcon(loc.label)}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-base">{loc.label}</span>
                      {loc.is_default && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Default Location
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(loc)}
                      title="Edit Location"
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id, loc.label)}
                      title="Delete Location"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 font-medium leading-relaxed">{loc.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {loc.city}, {loc.state} - <span className="font-semibold">{loc.pincode}</span>
                </p>

                {loc.latitude && loc.longitude && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-lg w-fit">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>
                      GPS: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                {!loc.is_default ? (
                  <button
                    onClick={() => handleSetDefault(loc.id)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Used for automatic nearby search</span>
                )}
                <span className="text-[11px] text-gray-400">
                  Updated: {new Date(loc.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Location Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                {isEditing ? 'Edit Saved Location' : 'Add Farm Location'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location Label */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Location Type / Label
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['FARM', 'HOME', 'OFFICE', 'OTHER'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setFormData({ ...formData, label: l })}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${
                        formData.label === l
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Address / Landmark
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Near Taluk Office, Survey No. 42, Bidadi Hobli"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-sm rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    City / Taluk
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramanagara or Mandya"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-sm rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full text-sm rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="562159"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full text-sm rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* GPS Coordinates & Current Location Button */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    GPS Coordinates
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg shadow-2xs transition disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    Use My Current Location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude (e.g. 12.7159)"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude (e.g. 77.2810)"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white"
                    />
                  </div>
                </div>

                {/* Interactive Map Picker */}
                <div className="mt-2">
                  <p className="text-[11px] text-gray-500 mb-1">
                    Or click on the map to pin exact coordinates:
                  </p>
                  <LocationMap
                    interactive={true}
                    height="180px"
                    selectedLocation={
                      formData.latitude && formData.longitude
                        ? {
                            latitude: parseFloat(formData.latitude as any),
                            longitude: parseFloat(formData.longitude as any),
                            label: formData.label,
                          }
                        : null
                    }
                    onLocationSelect={(lat, lon) => {
                      setFormData((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lon,
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Set Default checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_default" className="text-xs font-medium text-gray-700">
                  Set as my primary default farm location
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
