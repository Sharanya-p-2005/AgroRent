import React from 'react';
import { Search, X } from 'lucide-react';

interface AnimalSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const AnimalSearch: React.FC<AnimalSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by animal name, breed, species, or village location...',
}) => {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
        <Search className="h-5 w-5" />
      </div>
      <input
        type="text"
        id="input-animal-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-10 text-sm font-medium text-stone-900 placeholder:text-stone-400 shadow-xs focus:border-emerald-600 focus:outline-hidden transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          title="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
