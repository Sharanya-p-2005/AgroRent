import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getDashboardPathForRole } from '../utils/helpers.js';
import { RoleBadge } from './RoleBadge.js';

interface UnauthorizedProps {
  requiredRoles?: Array<'FARMER' | 'OWNER' | 'ADMIN'>;
}

export const Unauthorized: React.FC<UnauthorizedProps> = ({ requiredRoles }) => {
  const { user } = useAuth();
  const dashboardPath = user ? getDashboardPathForRole(user.role) : '/login';

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
        Access Restricted (403 Forbidden)
      </h1>

      <p className="mt-3 text-base text-stone-600 max-w-md">
        You do not have permission to access this page.
      </p>

      {user && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
          <span>Signed in as:</span>
          <strong className="text-stone-800">{user.name}</strong>
          <RoleBadge role={user.role} size="sm" />
        </div>
      )}

      {requiredRoles && (
        <p className="mt-2 text-xs text-stone-500">
          Requires authorization: <strong>{requiredRoles.join(' or ')}</strong>
        </p>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          to={dashboardPath}
          id="unauthorized-go-dashboard-btn"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go to Dashboard</span>
        </Link>

        <Link
          to="/login"
          id="unauthorized-switch-user-btn"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
          <span>Switch Account</span>
        </Link>
      </div>
    </div>
  );
};
