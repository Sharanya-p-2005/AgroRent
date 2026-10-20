import React from 'react';
import { X, LogOut, Tractor } from 'lucide-react';
import { SidebarItem } from './Sidebar.js';
import { UserAvatar } from './UserAvatar.js';
import { RoleBadge } from './RoleBadge.js';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: SidebarItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  items,
  activeTab,
  onSelectTab,
  onLogout,
  userName,
  userRole,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-2xl">
        {/* Top Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-stone-900 leading-none">
                AgroRent
              </div>
              <div className="text-[10px] font-semibold text-emerald-800 tracking-wide mt-0.5">
                Rent. Buy. Hire. Grow.
              </div>
            </div>
          </div>

          <button
            type="button"
            id="mobile-menu-close-btn"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Identity */}
        <div className="border-b border-stone-100 p-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <UserAvatar name={userName} role={userRole} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-stone-900">{userName || 'User'}</p>
              <p className="truncate text-xs text-stone-500">{userEmail}</p>
              <div className="mt-1">
                <RoleBadge role={userRole} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Navigation
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="border-t border-stone-200 p-3">
          <button
            type="button"
            id="mobile-logout-btn"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-red-600 group-hover:text-red-700" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
