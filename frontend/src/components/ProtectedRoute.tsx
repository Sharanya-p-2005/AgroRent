import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { RoleBadge } from './RoleBadge.js';
import { getDashboardPathForRole } from '../utils/helpers.js';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'FARMER' | 'OWNER' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-700" />
        <p className="mt-4 text-sm font-medium text-stone-600">Verifying authentication session...</p>
      </div>
    );
  }

  // 1. If not authenticated, redirect to /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If role is not allowed, render clean Access Denied page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const userDashboardPath = getDashboardPathForRole(user.role);

    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-stone-900">
          Access Restricted (403 Forbidden)
        </h1>

        <p className="mt-2 text-base text-stone-600">
          You are currently signed in as a <RoleBadge role={user.role} size="sm" />.
          This dashboard requires <strong>{allowedRoles.join(' or ')}</strong> role authorization.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={userDashboardPath}
            id="unauthorized-return-dashboard-btn"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Your Authorized Dashboard
          </Link>
          <Link
            to="/login"
            id="unauthorized-switch-account-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
