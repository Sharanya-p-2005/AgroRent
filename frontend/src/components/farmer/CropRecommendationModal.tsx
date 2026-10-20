import React, { useState, useEffect } from 'react';
import { Sprout, X, CheckCircle, AlertTriangle, ArrowRight, BookOpen, Droplets, Calendar, Layers } from 'lucide-react';
import { api } from '../../services/api';

interface CropRec {
  id: string;
  name: string;
  kannada_name: string;
  category: string;
  seasons: string[];
  soil_types: string[];
  water_level: string;
  duration_days: string;
  expected_yield: string;
  sowing_window: string;
  suitability_score: number;
  suitability_label: string;
  match_reasons: string[];
  agronomic_tips: string[];
  disease_management: string;
}

export const CropRecommendationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultDistrict?: string;
}> = ({ isOpen, onClose, defaultDistrict = 'Mandya, Karnataka' }) => {
  const [formData, setFormData] = useState({
    location: defaultDistrict,
    soil_type: 'Red Soil',
    season: 'Kharif',
    water_availability: 'Moderate',
    farm_size: 3,
    previous_crop: 'Paddy',
    irrigation_type: 'Borewell',
  });

  useEffect(() => {
    if (defaultDistrict) {
      setFormData((prev) => ({
        ...prev,
        location: defaultDistrict,
      }));
    }
  }, [defaultDistrict, isOpen]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CropRec[] | null>(null);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<CropRec | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/agriculture/crop-recommendation', formData);
      if (res.data?.success) {
        setResults(res.data.recommended_crops);
        setDisclaimer(res.data.educational_disclaimer);
        if (res.data.recommended_crops?.length > 0) {
          setSelectedCrop(res.data.recommended_crops[0]);
        }
      }
    } catch (err: any) {
      console.error('Crop recommendation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Regional Crop Suitability Advisor</h2>
              <p className="text-xs text-gray-500">
                Agronomic matching based on agro-climatic zones, soil, water and seasonal parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200/80">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Region / District</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="e.g. Ramanagara or Mandya"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dominant Soil Type</label>
              <select
                value={formData.soil_type}
                onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Red Soil">Red Soil / Red Loamy</option>
                <option value="Black Soil">Black Cotton Soil / Clayey</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay Loam">Clay Loam / Alluvial</option>
                <option value="Laterite">Laterite Soil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cropping Season</label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Kharif">Kharif (Monsoon / June - Oct)</option>
                <option value="Rabi">Rabi (Winter / Oct - March)</option>
                <option value="Summer">Summer / Zaid (Jan - May)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Water Availability</label>
              <select
                value={formData.water_availability}
                onChange={(e) => setFormData({ ...formData, water_availability: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="High">High (Perennial Canal / Tank)</option>
                <option value="Moderate">Moderate (Borewell / Open Well)</option>
                <option value="Low">Low / Rainfed Dryland</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Irrigation Method</label>
              <select
                value={formData.irrigation_type}
                onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Drip">Drip Irrigation</option>
                <option value="Sprinkler">Sprinkler Irrigation</option>
                <option value="Borewell">Borewell Channel / Flood</option>
                <option value="Canal">Canal Gravity Flow</option>
                <option value="Rainfed">Strictly Rainfed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Previous Crop Grown</label>
              <input
                type="text"
                value={formData.previous_crop}
                onChange={(e) => setFormData({ ...formData, previous_crop: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="e.g. Paddy, Sugarcane"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                {loading ? 'Evaluating Agronomic Model...' : 'Calculate Optimal Crops'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Results Area */}
          {results && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Top Agronomically Suited Crops for Your Field</span>
                </h3>
                <span className="text-xs text-gray-500">{results.length} Matches found</span>
              </div>

              {/* Crop Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.map((crop) => (
                  <div
                    key={crop.id}
                    onClick={() => setSelectedCrop(crop)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedCrop?.id === crop.id
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-400'
                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        {crop.suitability_score}% Match
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">{crop.category}</span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mt-2">{crop.name}</h4>
                    <p className="text-xs text-emerald-700 font-medium">{crop.kannada_name}</p>
                    <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="font-medium">{crop.duration_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Yield:</span>
                        <span className="font-medium text-gray-800">{crop.expected_yield}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Crop Detail Panel */}
              {selectedCrop && (
                <div className="bg-emerald-900/5 rounded-2xl p-5 border border-emerald-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span>{selectedCrop.name}</span>
                        <span className="text-sm font-semibold text-emerald-700">({selectedCrop.kannada_name})</span>
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Sowing Window: <strong>{selectedCrop.sowing_window}</strong> | Water Need: <strong>{selectedCrop.water_level}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg">
                        {selectedCrop.suitability_label} ({selectedCrop.suitability_score}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Why this matches */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
                      <div className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Agronomic Suitability Reasons</span>
                      </div>
                      <ul className="space-y-1.5 list-disc pl-4 text-gray-600">
                        {selectedCrop.match_reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Agronomic Best Practices */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
                      <div className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5 text-emerald-700">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Key Production Practices</span>
                      </div>
                      <ul className="space-y-1.5 list-disc pl-4 text-gray-600">
                        {selectedCrop.agronomic_tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pest & Disease Note */}
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Pest & Disease Advisory:</strong> {selectedCrop.disease_management}
                    </div>
                  </div>
                </div>
              )}

              {/* Educational Disclaimer Banner */}
              {disclaimer && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-600 flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <p>{disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 rounded-b-2xl">
          <span>AgroRent Agronomic Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
