import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { UserAvatar } from './UserAvatar.js';
import { NotificationIcon } from './NotificationIcon.js';
import { RoleBadge } from './RoleBadge.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: 'FARMER' | 'OWNER' | 'ADMIN' | string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  userName,
  userRole,
  onOpenMobileMenu,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur">
      {/* Left: Mobile hamburger menu & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          id="mobile-menu-toggle-btn"
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-stone-500 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Notification, User info, Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationIcon count={0} />

        <div className="h-6 w-px bg-stone-200" />

        {/* User Identity */}
        <div className="flex items-center gap-2.5">
          <UserAvatar name={userName} role={userRole} size="sm" />
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-stone-800 leading-tight">
              {userName || 'Authenticated User'}
            </div>
            <div className="mt-0.5">
              <RoleBadge role={userRole} size="sm" />
            </div>
          </div>
        </div>

        {/* Quick Logout */}
        <button
          type="button"
          id="header-logout-btn"
          onClick={onLogout}
          title="Sign Out of AgroRent"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-red-600 transition-colors cursor-pointer"
          aria-label="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
