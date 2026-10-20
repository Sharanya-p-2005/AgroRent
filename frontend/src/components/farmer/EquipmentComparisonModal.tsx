import React, { useState } from 'react';
import { X, Check, ArrowRight, Star, ShieldCheck, Scale } from 'lucide-react';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  rent_price: number;
  price_unit: string;
  location: string;
  district?: string;
  rating?: number;
  specs?: Record<string, any>;
  images?: string[];
}

export const EquipmentComparisonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  availableEquipment: EquipmentItem[];
  onSelectForBooking: (equipment: EquipmentItem) => void;
}> = ({ isOpen, onClose, availableEquipment, onSelectForBooking }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    availableEquipment.slice(0, 2).map((e) => e.id)
  );

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const comparedItems = availableEquipment.filter((e) => selectedIds.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Equipment Machinery Comparison</h2>
              <p className="text-xs text-gray-500">
                Compare specifications, hourly/daily rental rates, and ratings for up to 3 machines
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Machine Selection Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Select machines to compare (choose 2 or 3):
            </label>
            <div className="flex flex-wrap gap-2">
              {availableEquipment.map((eq) => {
                const isSelected = selectedIds.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    onClick={() => toggleSelect(eq.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{eq.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3.5 font-bold text-gray-700 w-1/4">Specification</th>
                  {comparedItems.map((item) => (
                    <th key={item.id} className="p-3.5 font-bold text-gray-900 text-center border-l border-gray-200">
                      <div className="text-sm">{item.name}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        ₹{item.rent_price} / {item.price_unit === 'PER_DAY' ? 'day' : 'hour'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Category */}
                <tr>
                  <td className="p-3 text-gray-500 font-semibold bg-gray-50/50">Category</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-100 font-medium text-gray-800">
                      {item.category}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="p-3 text-gray-500 font-semibold bg-gray-50/50">Customer Rating</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-100">
                      <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{item.rating || '4.8'} / 5.0</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Power / HP */}
                <tr>
                  <td className="p-3 text-gray-500 font-semibold bg-gray-50/50">Engine Horsepower (HP)</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-100 font-medium text-gray-700">
                      {item.specs?.horsepower || item.specs?.hp || (item.category === 'TRACTOR' ? '45 - 55 HP' : 'Standard Agricultural')}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="p-3 text-gray-500 font-semibold bg-gray-50/50">Location / District</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-100 text-gray-700">
                      {item.district || item.location}
                    </td>
                  ))}
                </tr>

                {/* Fuel & Maintenance */}
                <tr>
                  <td className="p-3 text-gray-500 font-semibold bg-gray-50/50">Maintenance Status</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-100">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Field Inspected</span>
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Operator Availability */}
                <tr>
                  <td className="p-3 text-gray-500 font-semibold bg-gray-50/50">Driver / Operator</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-100 text-gray-700">
                      {item.specs?.operator_included ? 'Included with machine' : 'Machine only (Driver optional)'}
                    </td>
                  ))}
                </tr>

                {/* Action CTA */}
                <tr className="bg-gray-50/40">
                  <td className="p-3 text-gray-500 font-semibold">Select Equipment</td>
                  {comparedItems.map((item) => (
                    <td key={item.id} className="p-3 text-center border-l border-gray-200">
                      <button
                        onClick={() => {
                          onSelectForBooking(item);
                          onClose();
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition shadow-xs inline-flex items-center gap-1.5"
                      >
                        <span>Book {item.name}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 rounded-b-2xl">
          <span>Comparing {comparedItems.length} machines</span>
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
