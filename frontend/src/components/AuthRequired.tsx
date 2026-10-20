import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, LogIn, ArrowRight } from 'lucide-react';

export const AuthRequired: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-xs">
        <Lock className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
        Authentication Required
      </h1>

      <p className="mt-3 text-base text-stone-600 max-w-md">
        You must be signed in to your AgroRent account to access this page.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/login"
          state={{ from: location }}
          id="auth-required-login-btn"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          to="/register"
          id="auth-required-register-btn"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <span>Create an Account</span>
        </Link>
      </div>
    </div>
  );
};
