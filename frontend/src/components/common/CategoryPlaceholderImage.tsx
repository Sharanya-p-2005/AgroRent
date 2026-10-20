import React, { useState } from 'react';
import {
  Tractor,
  Wheat,
  Cog,
  Shovel,
  Droplets,
  Truck,
  Sprout,
  Sparkles,
  Boxes,
  Wrench,
  Beef,
  Bird,
  HeartPulse,
  Tag,
  ShieldCheck,
} from 'lucide-react';

interface CategoryPlaceholderImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  listingType?: 'EQUIPMENT' | 'ANIMAL' | 'BIRD' | string;
  className?: string;
  aspectClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

interface CategoryStyle {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bgGradient: string;
  iconBg: string;
  textColor: string;
}

function getCategoryConfig(category: string = '', listingType?: string): CategoryStyle {
  const normCat = category.trim().toLowerCase();
  const normType = (listingType || '').trim().toUpperCase();

  // Animals & Birds
  if (normType === 'BIRD' || normCat === 'chicken' || normCat === 'duck' || normCat === 'rooster' || normCat === 'poultry') {
    return {
      icon: Bird,
      label: category || 'Poultry / Bird',
      bgGradient: 'from-amber-100 via-orange-50 to-stone-100',
      iconBg: 'bg-amber-600 text-white',
      textColor: 'text-amber-900',
    };
  }

  if (normType === 'ANIMAL' || normCat === 'cow' || normCat === 'cattle' || normCat === 'buffalo') {
    return {
      icon: Beef,
      label: category || 'Livestock / Cattle',
      bgGradient: 'from-emerald-100 via-stone-100 to-amber-50',
      iconBg: 'bg-emerald-700 text-white',
      textColor: 'text-emerald-950',
    };
  }

  if (normCat === 'goat' || normCat === 'sheep') {
    return {
      icon: Beef,
      label: category || 'Goat / Sheep',
      bgGradient: 'from-stone-200 via-emerald-50 to-stone-100',
      iconBg: 'bg-stone-700 text-white',
      textColor: 'text-stone-900',
    };
  }

  // Equipment categories
  if (normCat === 'tractor') {
    return {
      icon: Tractor,
      label: 'Agricultural Tractor',
      bgGradient: 'from-emerald-900 via-emerald-800 to-emerald-950',
      iconBg: 'bg-emerald-700/80 text-emerald-200',
      textColor: 'text-emerald-100',
    };
  }

  if (normCat === 'harvester') {
    return {
      icon: Wheat,
      label: 'Combine Harvester',
      bgGradient: 'from-amber-900 via-amber-800 to-stone-900',
      iconBg: 'bg-amber-600/80 text-amber-200',
      textColor: 'text-amber-100',
    };
  }

  if (normCat === 'rotavator') {
    return {
      icon: Cog,
      label: 'Rotary Tiller / Rotavator',
      bgGradient: 'from-slate-800 via-stone-800 to-zinc-900',
      iconBg: 'bg-slate-700 text-slate-200',
      textColor: 'text-slate-100',
    };
  }

  if (normCat === 'cultivator') {
    return {
      icon: Shovel,
      label: 'Tillage Cultivator',
      bgGradient: 'from-stone-800 via-stone-700 to-stone-900',
      iconBg: 'bg-stone-600 text-stone-200',
      textColor: 'text-stone-100',
    };
  }

  if (normCat === 'water pump') {
    return {
      icon: Droplets,
      label: 'High-Head Water Pump',
      bgGradient: 'from-sky-900 via-teal-900 to-stone-900',
      iconBg: 'bg-sky-600 text-sky-100',
      textColor: 'text-sky-100',
    };
  }

  if (normCat === 'jcb') {
    return {
      icon: Truck,
      label: 'Earthmoving JCB / Backhoe',
      bgGradient: 'from-amber-950 via-stone-900 to-stone-950',
      iconBg: 'bg-amber-500 text-stone-950',
      textColor: 'text-amber-200',
    };
  }

  if (normCat === 'power tiller') {
    return {
      icon: Tractor,
      label: 'Power Tiller',
      bgGradient: 'from-teal-900 via-stone-900 to-emerald-950',
      iconBg: 'bg-teal-700 text-teal-200',
      textColor: 'text-teal-100',
    };
  }

  if (normCat === 'seeder') {
    return {
      icon: Sprout,
      label: 'Planter & Seeder',
      bgGradient: 'from-lime-950 via-emerald-900 to-stone-900',
      iconBg: 'bg-lime-700 text-lime-100',
      textColor: 'text-lime-100',
    };
  }

  if (normCat === 'sprayer') {
    return {
      icon: Sparkles,
      label: 'Crop Sprayer',
      bgGradient: 'from-indigo-950 via-stone-900 to-stone-950',
      iconBg: 'bg-indigo-700 text-indigo-100',
      textColor: 'text-indigo-100',
    };
  }

  if (normCat === 'baler') {
    return {
      icon: Boxes,
      label: 'Straw Baler',
      bgGradient: 'from-amber-950 via-stone-900 to-stone-950',
      iconBg: 'bg-amber-600 text-white',
      textColor: 'text-amber-100',
    };
  }

  if (normCat === 'plough') {
    return {
      icon: Wrench,
      label: 'Heavy Mouldboard Plough',
      bgGradient: 'from-stone-900 via-stone-800 to-zinc-950',
      iconBg: 'bg-stone-700 text-stone-200',
      textColor: 'text-stone-100',
    };
  }

  // Generic fallback
  return {
    icon: Tractor,
    label: category || 'Agro Machinery',
    bgGradient: 'from-emerald-900 via-stone-900 to-zinc-900',
    iconBg: 'bg-emerald-800 text-emerald-200',
    textColor: 'text-emerald-100',
  };
}

export const CategoryPlaceholderImage: React.FC<CategoryPlaceholderImageProps> = ({
  src,
  alt,
  category = '',
  listingType,
  className = '',
  aspectClassName = 'aspect-16/10',
  size = 'full',
}) => {
  const [hasError, setHasError] = useState(false);
  const trimmedSrc = src?.trim();
  const config = getCategoryConfig(category, listingType);
  const IconComponent = config.icon;

  const isSmall = size === 'sm';

  // Render actual image if provided and no load failure
  if (trimmedSrc && !hasError) {
    return (
      <img
        src={trimmedSrc}
        alt={alt}
        className={`${aspectClassName} w-full object-cover transition-transform duration-300 group-hover:scale-105 ${className}`}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  // Render clean, professional category placeholder
  return (
    <div
      className={`relative ${aspectClassName} w-full overflow-hidden bg-gradient-to-br ${config.bgGradient} flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      role="img"
      aria-label={`${alt} (${config.label} category placeholder)`}
    >
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:16px_16px] pointer-events-none" />

      {/* Category Icon */}
      <div
        className={`rounded-2xl ${config.iconBg} shadow-md flex items-center justify-center mb-2 z-10 transition-transform duration-300 group-hover:scale-110 ${
          isSmall ? 'p-2' : 'p-3.5'
        }`}
      >
        <IconComponent className={isSmall ? 'h-5 w-5' : 'h-8 w-8'} />
      </div>

      {/* Category Title */}
      <div className={`font-bold z-10 tracking-tight ${config.textColor} ${isSmall ? 'text-xs' : 'text-sm'}`}>
        {category || config.label}
      </div>

      {/* Micro-label */}
      {!isSmall && (
        <div className="text-[11px] font-medium text-stone-300/80 z-10 mt-0.5">
          AgroRent Verified Listing
        </div>
      )}
    </div>
  );
};
