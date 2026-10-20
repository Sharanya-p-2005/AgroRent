import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getDashboardPathForRole } from '../utils/helpers.js';

export const NotFound: React.FC = () => {
  const { user } = useAuth();
  const returnPath = user ? getDashboardPathForRole(user.role) : '/';

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 shadow-xs">
        <FileQuestion className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
        Page Not Found (404)
      </h1>

      <p className="mt-3 text-base text-stone-600 max-w-md">
        The requested URL was not found on this server. Please check the address or return to safety.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          to={returnPath}
          id="not-found-return-btn"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
        >
          {user ? <ArrowLeft className="h-4 w-4" /> : <Home className="h-4 w-4" />}
          <span>{user ? 'Go to Dashboard' : 'Return Home'}</span>
        </Link>
      </div>
    </div>
  );
};
