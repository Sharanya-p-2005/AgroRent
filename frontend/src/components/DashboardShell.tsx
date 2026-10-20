import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Sidebar, SidebarItem } from './Sidebar.js';
import { MobileMenu } from './MobileMenu.js';
import { Header } from './Header.js';

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  sidebarItems: SidebarItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  subtitle,
  sidebarItems,
  activeTab,
  onSelectTab,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900 font-sans antialiased">
      {/* Desktop Permanent Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onLogout={handleLogout}
        userName={user?.name}
        userRole={user?.role}
        userEmail={user?.email}
      />

      {/* Mobile Drawer Menu */}
      <MobileMenu
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        items={sidebarItems}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onLogout={handleLogout}
        userName={user?.name}
        userRole={user?.role}
        userEmail={user?.email}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          userName={user?.name}
          userRole={user?.role}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Dashboard Footer */}
        <footer className="border-t border-stone-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>© 2026 AgroRent. All rights reserved.</span>
            <span className="font-semibold text-emerald-800">Rent. Buy. Hire. Grow.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
