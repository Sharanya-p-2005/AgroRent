import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface SchemeDisclaimerBannerProps {
  language?: 'EN' | 'KN';
  className?: string;
}

export const SchemeDisclaimerBanner: React.FC<SchemeDisclaimerBannerProps> = ({ language = 'EN', className = '' }) => {
  return (
    <div
      id="scheme-official-disclaimer-banner"
      className={`bg-blue-50/90 border border-blue-200/80 rounded-xl p-3.5 sm:p-4 text-blue-900 shadow-sm flex items-start gap-3 ${className}`}
    >
      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="text-xs sm:text-sm leading-relaxed">
        <div className="font-semibold text-blue-950 flex items-center gap-1.5 mb-0.5">
          <span>
            {language === 'KN'
              ? 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಮಾಹಿತಿ ಮಾರ್ಗದರ್ಶಿ'
              : 'Official Government Information Advisory'}
          </span>
        </div>
        <p className="text-blue-800/90">
          {language === 'KN'
            ? 'ಕೃಷಿ ಬಾಡಿಗೆಯು ರೈತರಿಗೆ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಅಧಿಕೃತ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸುತ್ತದೆ. ಯೋಜನೆಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಮತ್ತು ನೇರ ಪ್ರಯೋಜನಗಳನ್ನು ಪಡೆಯಲು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳಿಗೆ ಭೇಟಿ ನೀಡಿ.'
            : 'AgroRent is an informational facilitation directory and does not approve or disburse government subsidies directly. Farmers are safely redirected to official Central & State Government portals (.gov.in / .nic.in) to submit authentic applications.'}
        </p>
      </div>
    </div>
  );
};
