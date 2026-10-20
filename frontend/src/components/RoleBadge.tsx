import React from 'react';
import { getRoleBadgeColor, getRoleLabel } from '../utils/helpers.js';

interface RoleBadgeProps {
  role?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const { bg, text, border } = getRoleBadgeColor(role);
  const label = getRoleLabel(role);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs md:text-sm px-2.5 py-1',
    lg: 'text-sm md:text-base px-3 py-1.5 font-medium',
  };

  return (
    <span
      id={`role-badge-${(role || 'user').toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide whitespace-nowrap ${bg} ${text} ${border} ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
};
