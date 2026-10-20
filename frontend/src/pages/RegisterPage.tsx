import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getDashboardPathForRole } from '../utils/helpers.js';
import {
  Tractor,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'FARMER' as 'FARMER' | 'OWNER',
    address: '',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
    pincode: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.phone.replace(/[\s-]/g, '').length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(formData);
      if (result.success && result.role) {
        navigate(getDashboardPathForRole(result.role), { replace: true });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Server error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-xs">
            <Tractor className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Create an AgroRent Account
          </h1>
          <p className="mt-1.5 text-sm font-medium text-emerald-800">
            Rent. Buy. Hire. Grow.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            id="register-error-alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-bold text-stone-900 mb-2">
              Select Your Role:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="role-farmer-select"
                onClick={() => setFormData((p) => ({ ...p, role: 'FARMER' }))}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                  formData.role === 'FARMER'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.role === 'FARMER' ? 'border-emerald-600 bg-emerald-600' : 'border-stone-400'}`}>
                  {formData.role === 'FARMER' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Farmer</div>
                  <div className="text-xs text-stone-500">Rent machines & hire workers</div>
                </div>
              </button>

              <button
                type="button"
                id="role-owner-select"
                onClick={() => setFormData((p) => ({ ...p, role: 'OWNER' }))}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                  formData.role === 'OWNER'
                    ? 'border-amber-600 bg-amber-50/80 text-amber-900 ring-2 ring-amber-600/20 shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.role === 'OWNER' ? 'border-amber-600 bg-amber-600' : 'border-stone-400'}`}>
                  {formData.role === 'OWNER' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Equipment Owner</div>
                  <div className="text-xs text-stone-500">List machinery & earn</div>
                </div>
              </button>
            </div>
            <p className="mt-1.5 text-xs text-stone-500">
              * Note: Administrator accounts require internal administrative authorization.
            </p>
          </div>

          {/* Section 1: Personal Details */}
          <div className="border-t border-stone-200 pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase">Full Name *</label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Gowda"
                    className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Email Address *</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ramesh@example.com"
                    className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Phone Number *</label>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-stone-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Password (min 6 chars) *</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Confirm Password *</label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Rural Profile & Location */}
          <div className="border-t border-stone-200 pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
              Location & Profile Details ({formData.role === 'FARMER' ? 'Farmer Profile' : 'Owner Profile'})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase">Address / Plot Details *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Survey 42, Main Road"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 px-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {/* Village */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Village / Town *</label>
                <input
                  type="text"
                  name="village"
                  required
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="e.g. Maddur"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 px-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {/* Taluk */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Taluk / Tehsil *</label>
                <input
                  type="text"
                  name="taluk"
                  required
                  value={formData.taluk}
                  onChange={handleChange}
                  placeholder="e.g. Maddur Taluk"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 px-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">District *</label>
                <input
                  type="text"
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Mandya"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 px-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 px-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 571428"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50/50 py-2.5 px-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 px-4 text-base font-bold text-white shadow-xs hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account & Setting Up Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center border-t border-stone-200 pt-5">
          <p className="text-sm text-stone-600">
            Already have an account?{' '}
            <Link
              to="/login"
              id="register-login-link"
              className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
