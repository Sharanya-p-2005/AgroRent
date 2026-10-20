import React from 'react';
import {
  X,
  Building2,
  ExternalLink,
  Phone,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  FileText,
  HelpCircle,
  Award,
  Calendar,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { GovernmentScheme } from '../../types/scheme.js';
import { SchemeDisclaimerBanner } from './SchemeDisclaimerBanner.js';

interface SchemeDetailsModalProps {
  scheme: GovernmentScheme | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave?: (scheme: GovernmentScheme) => void;
  isSaving?: boolean;
  language?: 'EN' | 'KN';
}

export const SchemeDetailsModal: React.FC<SchemeDetailsModalProps> = ({
  scheme,
  isOpen,
  onClose,
  onToggleSave,
  isSaving = false,
  language = 'EN',
}) => {
  if (!isOpen || !scheme) return null;

  const isCentral = scheme.government_level === 'CENTRAL';

  const copyShareLink = () => {
    const url = `${window.location.origin}/farmer/schemes/${scheme.id}`;
    navigator.clipboard.writeText(url);
    alert(language === 'KN' ? 'ಯೋಜನೆಯ ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ!' : 'Scheme link copied to clipboard!');
  };

  return (
    <div
      id="scheme-details-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="scheme-details-modal-card"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Background/Image banner */}
        <div className="relative bg-emerald-900 text-white p-5 sm:p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 max-w-[85%]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isCentral ? 'bg-amber-400/90 text-amber-950' : 'bg-emerald-400/90 text-emerald-950'
                  }`}
                >
                  {isCentral ? 'Central Govt. Scheme' : `State Scheme (${scheme.state || 'Karnataka'})`}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  {scheme.category}
                </span>
                {scheme.featured && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                    ★ Featured
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                {scheme.title}
              </h2>

              {scheme.department && (
                <p className="text-xs sm:text-sm text-emerald-100 flex items-center gap-1.5 opacity-90">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{scheme.department}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleSave && (
                <button
                  id="modal-toggle-save-btn"
                  onClick={() => onToggleSave(scheme)}
                  disabled={isSaving}
                  title={scheme.is_saved ? 'Remove Bookmark' : 'Bookmark Scheme'}
                  className={`p-2 rounded-xl transition-colors ${
                    scheme.is_saved
                      ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {scheme.is_saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              )}
              <button
                id="modal-share-btn"
                onClick={copyShareLink}
                title="Share link"
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                id="modal-close-btn"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-neutral-800 text-sm">
          {/* Official Disclaimer */}
          <SchemeDisclaimerBanner language={language} />

          {/* Short / Full Overview */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{language === 'KN' ? 'ಯೋಜನೆಯ ವಿವರಣೆ' : 'Scheme Overview'}</span>
            </h3>
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 text-neutral-700 leading-relaxed space-y-2">
              <p className="font-medium text-neutral-900">{scheme.short_description}</p>
              {scheme.full_description && (
                <p className="text-neutral-600 text-xs sm:text-sm whitespace-pre-line pt-2 border-t border-neutral-200">
                  {scheme.full_description}
                </p>
              )}
            </div>
          </div>

          {/* Key Benefits */}
          {scheme.benefits && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>{language === 'KN' ? 'ಪ್ರಮುಖ ಪ್ರಯೋಜನಗಳು' : 'Key Benefits & Subsidies'}</span>
              </h3>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-amber-950 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {scheme.benefits}
              </div>
            </div>
          )}

          {/* Eligibility Criteria */}
          {scheme.eligibility && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'KN' ? 'ಅರ್ಹತೆಯ ಮಾನದಂಡ' : 'Eligibility Criteria'}</span>
              </h3>
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-emerald-950 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {scheme.eligibility}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {scheme.required_documents && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{language === 'KN' ? 'ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು' : 'Required Documents'}</span>
              </h3>
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-blue-950 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {scheme.required_documents}
              </div>
            </div>
          )}

          {/* Application Process */}
          {scheme.application_process && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>{language === 'KN' ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ' : 'How to Apply (Application Process)'}</span>
              </h3>
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 text-indigo-950 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {scheme.application_process}
              </div>
            </div>
          )}

          {/* Helpline & Contacts */}
          {scheme.helpline && (
            <div className="bg-neutral-100/80 rounded-xl p-3.5 flex items-center justify-between gap-3 border border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white text-emerald-700 rounded-lg shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-500">
                    {language === 'KN' ? 'ಅಧಿಕೃತ ಸಹಾಯವಾಣಿ' : 'Official Helpline'}
                  </div>
                  <div className="text-sm font-bold text-neutral-900">{scheme.helpline}</div>
                </div>
              </div>
              <a
                href={`tel:${scheme.helpline.split('/')[0].trim()}`}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>{language === 'KN' ? 'ಕರೆ ಮಾಡಿ' : 'Call Helpdesk'}</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 text-center sm:text-left">
            <span>
              {language === 'KN'
                ? 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್ ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯುತ್ತದೆ'
                : 'Official government portal opens securely in a new tab'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="modal-footer-close-btn"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 hover:bg-neutral-200/80 bg-white border border-neutral-300 rounded-xl transition-colors"
            >
              {language === 'KN' ? 'ಮುಚ್ಚಿ' : 'Close'}
            </button>

            {scheme.official_url && (
              <a
                id="modal-official-portal-btn"
                href={scheme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>{language === 'KN' ? 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ' : 'Apply on Official Portal'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
