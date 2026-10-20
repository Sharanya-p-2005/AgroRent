import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { RoleBadge } from './RoleBadge.js';
import { getDashboardPathForRole } from '../utils/helpers.js';
import { Tractor, Sprout, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardPath = user ? getDashboardPathForRole(user.role) : '/login';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <Link to="/" id="nav-brand-link" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs transition-transform group-hover:scale-105">
            <Tractor className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-stone-900">AgroRent</span>
              <Sprout className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-800 tracking-wide hidden sm:inline-block">
              Rent. Buy. Hire. Grow.
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated && user ? (
            <>
              {/* Role badge */}
              <div className="hidden md:flex items-center gap-2">
                <RoleBadge role={user.role} size="sm" />
                <span className="text-sm font-medium text-stone-700 max-w-[140px] truncate" title={user.name}>
                  {user.name}
                </span>
              </div>

              {/* Dashboard Link */}
              <Link
                to={dashboardPath}
                id="nav-dashboard-button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                id="nav-logout-button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-red-700 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                id="nav-login-link"
                className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                id="nav-register-link"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
