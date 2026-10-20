import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading AgroRent...' }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-700" />
      <p className="mt-4 text-sm font-semibold text-stone-700">{message}</p>
      <p className="mt-1 text-xs text-stone-400">Please wait a moment</p>
    </div>
  );
};
