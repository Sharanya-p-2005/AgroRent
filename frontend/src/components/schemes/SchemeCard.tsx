import React from 'react';
import {
  Building2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Award,
  Sparkles,
  Phone,
} from 'lucide-react';
import { GovernmentScheme } from '../../types/scheme.js';

interface SchemeCardProps {
  scheme: GovernmentScheme;
  onViewDetails: (scheme: GovernmentScheme) => void;
  onToggleSave?: (scheme: GovernmentScheme) => void;
  isSaving?: boolean;
  language?: 'EN' | 'KN';
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onViewDetails,
  onToggleSave,
  isSaving = false,
  language = 'EN',
}) => {
  const isCentral = scheme.government_level === 'CENTRAL';

  return (
    <div
      id={`scheme-card-${scheme.id}`}
      className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-emerald-300"
    >
      {/* Top Banner / Badges */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase ${
                isCentral ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isCentral ? 'Central' : 'Karnataka State'}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {scheme.category}
            </span>
            {scheme.featured && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Featured
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          {onToggleSave && (
            <button
              id={`scheme-save-btn-${scheme.id}`}
              type="button"
              onClick={() => onToggleSave(scheme)}
              disabled={isSaving}
              title={scheme.is_saved ? 'Remove Bookmark' : 'Save Scheme'}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                scheme.is_saved
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800'
              }`}
            >
              {scheme.is_saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(scheme)}
          className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2 leading-snug"
        >
          {scheme.title}
        </h3>

        {/* Department */}
        {scheme.department && (
          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1 line-clamp-1">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
            <span>{scheme.department}</span>
          </p>
        )}

        {/* Short Description */}
        <p className="text-xs text-neutral-600 mt-2.5 line-clamp-2 leading-relaxed">
          {scheme.short_description}
        </p>

        {/* Benefits Teaser */}
        {scheme.benefits && (
          <div className="mt-3.5 p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-start gap-2 text-xs text-amber-900">
            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-snug">{scheme.benefits.replace(/•|\n/g, ' ')}</span>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="px-5 py-3.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
        {scheme.official_url ? (
          <a
            id={`scheme-portal-link-${scheme.id}`}
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors group/link"
          >
            <span>{language === 'KN' ? 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್' : 'Official Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover/link:text-emerald-600" />
          </a>
        ) : (
          <div />
        )}

        <button
          id={`scheme-view-details-btn-${scheme.id}`}
          onClick={() => onViewDetails(scheme)}
          className="px-3.5 py-1.5 font-semibold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1"
        >
          <span>{language === 'KN' ? 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View Details'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
