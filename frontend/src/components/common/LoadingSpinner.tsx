import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-700`} />
      {message && <p className="text-xs text-stone-600 font-medium animate-pulse">{message}</p>}
    </div>
  );
};
