import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Banknote, RefreshCw } from 'lucide-react';
import { PaymentStatus } from '../../types/payment';

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const normalized = (status || 'PENDING').toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  switch (normalized) {
    case 'PAID':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSizes[size]} text-emerald-600`} />}
          Paid
        </span>
      );

    case 'CASH_PENDING':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses[size]}`}
        >
          {showIcon && <Banknote className={`${iconSizes[size]} text-amber-600`} />}
          Cash Pending
        </span>
      );

    case 'PROCESSING':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
        >
          {showIcon && <RefreshCw className={`${iconSizes[size]} text-blue-600 animate-spin`} />}
          Processing
        </span>
      );

    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
        >
          {showIcon && <XCircle className={`${iconSizes[size]} text-rose-600`} />}
          Failed
        </span>
      );

    case 'REFUNDED':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}
        >
          {showIcon && <RefreshCw className={`${iconSizes[size]} text-purple-600`} />}
          Refunded
        </span>
      );

    case 'PENDING':
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 ${sizeClasses[size]}`}
        >
          {showIcon && <Clock className={`${iconSizes[size]} text-yellow-600`} />}
          Pending
        </span>
      );
  }
};
