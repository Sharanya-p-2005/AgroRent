import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getDashboardPathForRole } from '../utils/helpers.js';
import {
  Tractor,
  Beef,
  Truck,
  FileText,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { AIAssistantFloatingButton } from '../components/ai/AIAssistantFloatingButton.js';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-800/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-emerald-200 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Integrated Rural Agricultural Equipment, Livestock & Services Network</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            AgroRent
          </h1>
          <p className="mt-2 text-xl sm:text-2xl font-semibold tracking-wide text-emerald-300">
            Rent. Buy. Hire. Grow.
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-emerald-100/90 leading-relaxed">
            A smart, unified agricultural platform where farmers can rent essential machinery, buy & sell livestock, book trusted drivers and farm workers, and access government welfare schemes.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {isAuthenticated && user ? (
              <Link
                to={getDashboardPathForRole(user.role)}
                id="home-goto-dashboard-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-stone-900 shadow-md hover:bg-amber-400 transition-colors"
              >
                Go to {user.role.toLowerCase()} Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  id="home-login-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-md hover:bg-emerald-500 border border-emerald-400/40 transition-colors"
                >
                  <KeyRound className="h-5 w-5" />
                  Sign In to Account
                </Link>
                <Link
                  to="/register"
                  id="home-register-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-emerald-900 shadow-md hover:bg-stone-100 transition-colors"
                >
                  Register as Farmer or Owner
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Smart Agriculture Ecosystem
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600">
            Empowering farmers, equipment owners, and rural entrepreneurs through a unified digital marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-4">
              <Tractor className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Equipment Rental</h3>
            <p className="mt-1.5 text-sm text-stone-600">
              Rent tractors, harvesters, seeders, and tillage tools directly from certified regional equipment owners.
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-emerald-700">Verified Equipment Listings</span>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-4">
              <Beef className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Animal Marketplace</h3>
            <p className="mt-1.5 text-sm text-stone-600">
              Direct peer-to-peer livestock trade for cows, buffaloes, sheep, goats, and poultry without middlemen.
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-amber-700">Direct Livestock Marketplace</span>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800 mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Driver & Worker Booking</h3>
            <p className="mt-1.5 text-sm text-stone-600">
              Book skilled tractor drivers and agricultural day workers on-demand during sowing and harvesting seasons.
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-blue-700">On-Demand Rural Workforce</span>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs sm:col-span-2 lg:col-span-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Government Schemes & Farmer Resources</h3>
                  <p className="text-sm text-stone-600">
                    Stay updated with verified Central and Karnataka State subsidies, PM-Kisan, solar pumps, soil testing, and helpline guides.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  Verified Subsidies
                </span>
                <Link
                  to="/schemes"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Browse Schemes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <AIAssistantFloatingButton />
    </div>
  );
};
