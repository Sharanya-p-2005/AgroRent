import React from 'react';
import { Tractor, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-800 text-white">
              <Tractor className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-stone-900">AgroRent</span>
            <span className="text-sm text-stone-500">• Rent. Buy. Hire. Grow.</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Secure Agricultural Equipment, Livestock & Services Platform</span>
          </div>

          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} AgroRent. Built for farmers and rural prosperity.
          </p>
        </div>
      </div>
    </footer>
  );
};
