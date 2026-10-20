import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getDashboardPathForRole } from '../utils/helpers.js';
import {
  Tractor,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email address and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success && result.role) {
        // Redirect to intended location or the role-specific dashboard
        const redirectPath = getDashboardPathForRole(result.role);
        navigate(redirectPath, { replace: true });
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-xs">
            <Tractor className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Sign In to AgroRent
          </h1>
          <p className="mt-1.5 text-sm font-medium text-emerald-800">
            Rent. Buy. Hire. Grow.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            id="login-error-alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="login-email-input" className="block text-sm font-semibold text-stone-700">
              Email Address
            </label>
            <div className="relative mt-1.5 rounded-xl shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="login-email-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-3 pl-11 pr-4 text-base text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password-input" className="block text-sm font-semibold text-stone-700">
              Password
            </label>
            <div className="relative mt-1.5 rounded-xl shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="login-password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-3 pl-11 pr-4 text-base text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 px-4 text-base font-bold text-white shadow-xs hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="text-center border-t border-stone-200 pt-5">
          <p className="text-sm text-stone-600">
            Don't have an AgroRent account?{' '}
            <Link
              to="/register"
              id="login-register-link"
              className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
