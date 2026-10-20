import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name?: string;
  role?: 'FARMER' | 'OWNER' | 'ADMIN' | string;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  role,
  size = 'md',
  showBorder = true,
}) => {
  const getInitials = (n?: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const getRoleColors = (r?: string) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-700 text-white border-purple-300';
      case 'OWNER':
        return 'bg-amber-600 text-white border-amber-300';
      case 'FARMER':
      default:
        return 'bg-emerald-700 text-white border-emerald-300';
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg font-bold',
  };

  const borderClass = showBorder ? 'border-2' : '';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-bold shadow-xs select-none ${sizeClasses[size]} ${getRoleColors(
        role
      )} ${borderClass}`}
      title={name ? `${name} (${role || 'User'})` : 'User'}
    >
      {name ? getInitials(name) : <User className="h-5 w-5" />}
    </div>
  );
};
