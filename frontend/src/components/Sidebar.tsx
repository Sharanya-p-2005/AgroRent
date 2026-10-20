import React from 'react';
import { LucideIcon, LogOut, Tractor } from 'lucide-react';
import { RoleBadge } from './RoleBadge.js';
import { UserAvatar } from './UserAvatar.js';

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeTab,
  onSelectTab,
  onLogout,
  userName,
  userRole,
  userEmail,
}) => {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:inset-y-0 lg:border-r lg:border-stone-200 lg:bg-white lg:min-h-screen">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-stone-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
          <Tractor className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-black tracking-tight text-stone-900 leading-none">
            AgroRent
          </div>
          <div className="text-[11px] font-semibold text-emerald-800 tracking-wide mt-0.5">
            Rent. Buy. Hire. Grow.
          </div>
        </div>
      </div>

      {/* User Quick Info */}
      <div className="border-b border-stone-100 p-4 bg-stone-50/70">
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

      {/* Navigation Items */}
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
              id={`sidebar-item-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${
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

      {/* Logout Action at Bottom */}
      <div className="border-t border-stone-200 p-3">
        <button
          type="button"
          id="sidebar-logout-btn"
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 text-red-600 group-hover:text-red-700" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
