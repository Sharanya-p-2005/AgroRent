import React from 'react';
import { Check, Clock, PackageCheck, Truck, MapPin, AlertCircle } from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

const STEPS: TimelineStep[] = [
  { key: 'PLACED', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: Check },
  { key: 'PACKED', label: 'Packed', icon: PackageCheck },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
];

interface DeliveryStatusTimelineProps {
  currentStatus: string;
  orderStatus?: string;
  deliveredAt?: string | null;
  className?: string;
}

export const DeliveryStatusTimeline: React.FC<DeliveryStatusTimelineProps> = ({
  currentStatus,
  orderStatus,
  deliveredAt,
  className = '',
}) => {
  const isCancelled = currentStatus === 'CANCELLED' || orderStatus === 'CANCELLED';

  // Map status to progress index
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PACKED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'OUT_FOR_DELIVERY':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  if (isCancelled) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 ${className}`}>
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-semibold block text-sm">Delivery Cancelled</span>
          <span className="text-xs text-red-600">This order or delivery has been cancelled.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full py-4 ${className}`}>
      {/* Desktop Horizontal Timeline */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                    : isCurrent
                    ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100 animate-pulse'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-xs mt-2 font-medium tracking-tight ${
                  isCurrent
                    ? 'text-emerald-800 font-bold'
                    : isCompleted
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="sm:hidden space-y-3">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                    : 'bg-gray-100 border border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span
                className={`text-xs ${
                  isCurrent
                    ? 'text-emerald-800 font-bold'
                    : isCompleted
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
