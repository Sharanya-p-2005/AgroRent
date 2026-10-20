import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { formatLocation } from '../../utils/helpers.js';
import { DashboardShell } from '../../components/DashboardShell.js';
import { StatCard } from '../../components/StatCard.js';
import { DashboardCard } from '../../components/DashboardCard.js';
import { PlaceholderView } from '../../components/PlaceholderView.js';
import { ApiTester } from '../../components/ApiTester.js';
import { RoleBadge } from '../../components/RoleBadge.js';
import { SidebarItem } from '../../components/Sidebar.js';
import { OwnerEquipmentView } from '../../components/equipment/OwnerEquipmentView.js';
import { OwnerBookingsView } from '../../components/equipment/OwnerBookingsView.js';
import { OwnerEarningsView } from '../../components/equipment/OwnerEarningsView.js';
import { OwnerAddEquipmentModal } from '../../components/equipment/OwnerAddEquipmentModal.js';
import { OwnerAnimalsView } from '../../components/animals/OwnerAnimalsView.js';
import { OwnerAddAnimalModal } from '../../components/animals/OwnerAddAnimalModal.js';
import { OwnerAnimalOrdersView } from '../../components/animals/OwnerAnimalOrdersView.js';
import { OwnerServicesView } from '../../components/services/OwnerServicesView.js';
import { OwnerServiceBookingsView } from '../../components/services/OwnerServiceBookingsView.js';
import { OwnerServiceEarningsView } from '../../components/services/OwnerServiceEarningsView.js';
import { OwnerPaymentsSummary } from '../../components/payments/OwnerPaymentsSummary.js';
import { NotificationsView } from '../../components/notifications/NotificationsView.js';
import { ownerApi, notificationsApi } from '../../services/api.js';
import {
  LayoutDashboard,
  Tractor,
  PlusCircle,
  CalendarCheck,
  DollarSign,
  Beef,
  ShoppingBag,
  Truck,
  Users,
  CreditCard,
  Bell,
  User,
  Settings,
  MapPin,
  Phone,
  Layers,
  Sparkles
} from 'lucide-react';

interface OwnerDashboardProps {
  defaultTab?: string;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ defaultTab = 'dashboard' }) => {
  const { user } = useAuth();
  const profile = user?.profile;
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [totalEquipmentCount, setTotalEquipmentCount] = useState(0);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState('₹0');
  const [totalAnimalsCount, setTotalAnimalsCount] = useState(0);
  const [animalOrdersCount, setAnimalOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    // Fetch equipment & earnings counts
    ownerApi
      .getEquipment()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTotalEquipmentCount(res.data.data.length);
        }
      })
      .catch((err) => console.warn('[OwnerDashboard] Could not fetch equipment:', err.message));

    ownerApi
      .getEarnings()
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          const activeCount = Number(d.active_bookings_count ?? d.confirmedBookings ?? 0);
          const pendingCount = Number(d.pending_bookings_count ?? d.pendingBookings ?? 0);
          const sumActive = activeCount + pendingCount;
          setActiveBookingsCount(Number.isFinite(sumActive) ? sumActive : 0);
          const earned = Number(d.total_earnings ?? d.totalEarnings ?? 0);
          setTotalEarnings(`₹${Number.isFinite(earned) ? earned : 0}`);
        }
      })
      .catch((err) => console.warn('[OwnerDashboard] Could not fetch earnings:', err.message));

    // Fetch animals count
    ownerApi
      .getAnimals()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTotalAnimalsCount(res.data.data.length);
        }
      })
      .catch((err) => console.warn('[OwnerDashboard] Could not fetch animals:', err.message));

    // Fetch animal orders count
    ownerApi
      .getAnimalOrders()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAnimalOrdersCount(res.data.data.length);
        }
      })
      .catch((err) => console.warn('[OwnerDashboard] Could not fetch animal orders:', err.message));

    // Fetch unread notifications count
    notificationsApi
      .getUnreadCount()
      .then((res) => {
        if (typeof res.data?.unreadCount === 'number') {
          setUnreadNotificationsCount(res.data.unreadCount);
        }
      })
      .catch((err) => console.warn('[OwnerDashboard] Could not fetch unread notifications:', err.message));
  }, [activeTab]);

  const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-equipment', label: 'My Equipment', icon: Tractor, badge: 'Active' },
    { id: 'add-equipment', label: 'Add Equipment', icon: PlusCircle, badge: 'Active' },
    {
      id: 'equipment-bookings',
      label: 'Equipment Bookings',
      icon: CalendarCheck,
      badge: activeBookingsCount > 0 ? `${activeBookingsCount}` : 'Active',
    },
    { id: 'earnings', label: 'Equipment Earnings', icon: DollarSign, badge: 'Active' },
    {
      id: 'my-animals',
      label: 'My Animals',
      icon: Beef,
      badge: totalAnimalsCount > 0 ? `${totalAnimalsCount}` : 'Active',
    },
    { id: 'add-animal', label: 'Add Animal', icon: PlusCircle, badge: 'Active' },
    {
      id: 'animal-orders',
      label: 'Animal Orders',
      icon: ShoppingBag,
      badge: animalOrdersCount > 0 ? `${animalOrdersCount}` : 'Active',
    },
    { id: 'my-services', label: 'Drivers & Labor', icon: Users, badge: 'Active' },
    { id: 'service-bookings', label: 'Service Bookings', icon: CalendarCheck, badge: 'Active' },
    { id: 'service-earnings', label: 'Service Revenue', icon: DollarSign, badge: 'Active' },
    { id: 'all-payments', label: 'Consolidated Payments', icon: CreditCard, badge: 'Active' },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} new` : 'Active',
    },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Placeholder configurations for when navigation items are selected
  const placeholderConfig: Record<string, { title: string; desc: string; icon: any }> = {
    'my-equipment': {
      title: 'My Equipment',
      desc: 'Manage your listed agricultural machinery, view tractor status, check maintenance intervals, and adjust daily rental rates.',
      icon: Tractor,
    },
    'add-equipment': {
      title: 'Add Equipment Listing',
      desc: 'List your tractor, rotavator, harvester, or farm implement for rent with high-resolution photos, hourly/daily rates, and operating terms.',
      icon: PlusCircle,
    },
    'equipment-bookings': {
      title: 'Equipment Bookings',
      desc: 'View farmer rental booking requests, approve or decline schedules, track check-ins, and inspect machinery return condition.',
      icon: CalendarCheck,
    },
    'earnings': {
      title: 'Earnings & Payouts',
      desc: 'Track your total rental earnings, completed contracts, pending settlements, and direct bank deposits.',
      icon: DollarSign,
    },
    'my-animals': {
      title: 'My Animals & Birds',
      desc: 'View and manage your dairy cattle, goats, sheep, poultry, and bird listings with health verification cards.',
      icon: Beef,
    },
    'add-animal': {
      title: 'Add Animal Listing',
      desc: 'Create an animal or bird listing with breed details, age, lactation records, asking price, and vaccination certificates.',
      icon: PlusCircle,
    },
    'animal-orders': {
      title: 'Animal Orders & Inquiries',
      desc: 'Review inquiries, buyer bids, and schedule physical inspection visits at your farm.',
      icon: ShoppingBag,
    },
    'notifications': {
      title: 'Notifications & Alerts',
      desc: 'Stay informed about new booking requests, farmer messages, settlement alerts, and platform announcements.',
      icon: Bell,
    },
    'profile': {
      title: 'Equipment Owner Profile',
      desc: 'Manage your owner profile, farm address, machinery storage yard location, and verification badges.',
      icon: User,
    },
    'settings': {
      title: 'Account Settings',
      desc: 'Manage security credentials, payout bank account details, and language preferences.',
      icon: Settings,
    },
  };

  return (
    <DashboardShell
      title="Equipment Owner Dashboard"
      subtitle="Manage machinery listings, bookings, livestock & revenue"
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {activeTab === 'dashboard' ? (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-800 to-amber-900 p-6 sm:p-8 text-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RoleBadge role={user?.role} size="sm" />
                  <span className="text-xs text-amber-300 font-medium">AgroRent Certified Owner</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to AgroRent, {user?.name || 'Equipment Owner'}
                </h1>
                <p className="mt-1 text-sm sm:text-base text-amber-100">
                  Maximize machine utilization by renting your tractors, harvesters, and livestock.
                </p>
              </div>

              {/* Location pill */}
              {profile && (
                <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur text-xs sm:text-sm text-amber-100 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">{formatLocation(profile)}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistics Section (Placeholder values as requested: Total Equipment: 0, Active Bookings: 0, Animal Listings: 0, Total Earnings: ₹0) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                Performance Metrics
              </h2>
              <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                Live Counts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <StatCard
                id="stat-total-equipment"
                label="Total Equipment"
                value={totalEquipmentCount}
                icon={Tractor}
                colorScheme="amber"
                subtitle="Listed machinery"
              />
              <StatCard
                id="stat-owner-active-bookings"
                label="Active Bookings"
                value={activeBookingsCount}
                icon={CalendarCheck}
                colorScheme="emerald"
                subtitle="Currently reserved or in field"
              />
              <StatCard
                id="stat-animal-listings"
                label="Animal Listings"
                value={0}
                icon={Beef}
                colorScheme="purple"
                subtitle="Active marketplace ads"
              />
              <StatCard
                id="stat-total-earnings"
                label="Total Earnings"
                value={totalEarnings}
                icon={DollarSign}
                colorScheme="blue"
                subtitle="Net payout balance"
              />
            </div>
          </div>

          {/* Dashboard Feature Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  Equipment & Animal Management
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Manage your rental fleet, animal inventory, and customer bookings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <DashboardCard
                id="card-my-equipment"
                title="My Equipment"
                description="Manage your agricultural machinery"
                buttonText="View Equipment"
                icon={Tractor}
                badge="Active"
                colorScheme="amber"
                onAction={() => setActiveTab('my-equipment')}
              />

              <DashboardCard
                id="card-add-equipment"
                title="Add Equipment"
                description="List your equipment for rent"
                buttonText="Add Equipment"
                icon={PlusCircle}
                badge="Active"
                colorScheme="emerald"
                onAction={() => setActiveTab('add-equipment')}
              />

              <DashboardCard
                id="card-equipment-bookings"
                title="Equipment Bookings"
                description="View farmer booking requests"
                buttonText="View Bookings"
                icon={CalendarCheck}
                badge="Active"
                colorScheme="blue"
                onAction={() => setActiveTab('equipment-bookings')}
              />

              <DashboardCard
                id="card-my-animals"
                title="My Animals"
                description="Sell your animals and birds"
                buttonText="View Animals"
                icon={Beef}
                badge="Active"
                colorScheme="purple"
                onAction={() => setActiveTab('my-animals')}
              />

              <DashboardCard
                id="card-add-animal"
                title="Add Animal"
                description="Create an animal or bird listing"
                buttonText="Add Animal"
                icon={PlusCircle}
                badge="Active"
                colorScheme="teal"
                onAction={() => setActiveTab('add-animal')}
              />

              <DashboardCard
                id="card-my-services"
                title="Drivers & Farm Workers"
                description="List tractor drivers and agricultural labor crews"
                buttonText="Manage Services"
                icon={Users}
                badge="Active"
                colorScheme="blue"
                onAction={() => setActiveTab('my-services')}
              />

              <DashboardCard
                id="card-service-bookings"
                title="Service Bookings"
                description="Review incoming driver & worker hire requests"
                buttonText="View Requests"
                icon={CalendarCheck}
                badge="Active"
                colorScheme="teal"
                onAction={() => setActiveTab('service-bookings')}
              />

              <DashboardCard
                id="card-earnings"
                title="Equipment Earnings"
                description="Track your machinery rental earnings"
                buttonText="View Earnings"
                icon={DollarSign}
                badge="Active"
                colorScheme="emerald"
                onAction={() => setActiveTab('earnings')}
              />
            </div>
          </div>

          {/* Role Authorization Tester */}
          <ApiTester currentRole={user?.role} />
        </div>
      ) : activeTab === 'my-equipment' ? (
        <OwnerEquipmentView />
      ) : activeTab === 'add-equipment' ? (
        <OwnerAddEquipmentModal
          onClose={() => setActiveTab('my-equipment')}
          onSuccess={() => setActiveTab('my-equipment')}
        />
      ) : activeTab === 'equipment-bookings' ? (
        <OwnerBookingsView />
      ) : activeTab === 'earnings' ? (
        <OwnerEarningsView />
      ) : activeTab === 'my-animals' ? (
        <OwnerAnimalsView />
      ) : activeTab === 'add-animal' ? (
        <OwnerAddAnimalModal
          isOpen={true}
          onClose={() => setActiveTab('my-animals')}
          onSaved={() => setActiveTab('my-animals')}
        />
      ) : activeTab === 'animal-orders' ? (
        <OwnerAnimalOrdersView />
      ) : activeTab === 'my-services' ? (
        <OwnerServicesView />
      ) : activeTab === 'service-bookings' ? (
        <OwnerServiceBookingsView />
      ) : activeTab === 'service-earnings' ? (
        <OwnerServiceEarningsView />
      ) : activeTab === 'all-payments' ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Consolidated Revenue & Payments</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comprehensive financial breakdown across equipment hires, livestock sales, driver shifts, and farm labor.
            </p>
          </div>
          <OwnerPaymentsSummary />
        </div>
      ) : activeTab === 'notifications' ? (
        <NotificationsView />
      ) : (
        <PlaceholderView
          title={placeholderConfig[activeTab]?.title || 'Module'}
          description={placeholderConfig[activeTab]?.desc || 'This module is currently being updated. Please check back shortly.'}
          icon={placeholderConfig[activeTab]?.icon || LayoutDashboard}
          onBackToDashboard={() => setActiveTab('dashboard')}
          colorScheme="amber"
        />
      )}
    </DashboardShell>
  );
};
