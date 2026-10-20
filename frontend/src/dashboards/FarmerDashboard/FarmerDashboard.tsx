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
import { EquipmentMarketplace } from '../../components/equipment/EquipmentMarketplace.js';
import { FarmerBookingsView } from '../../components/equipment/FarmerBookingsView.js';
import { AnimalMarketplace } from '../../components/animals/AnimalMarketplace.js';
import { FarmerAnimalOrdersView } from '../../components/animals/FarmerAnimalOrdersView.js';
import { DriverMarketplace } from '../../components/services/DriverMarketplace.js';
import { WorkerMarketplace } from '../../components/services/WorkerMarketplace.js';
import { FarmerServiceBookingsView } from '../../components/services/FarmerServiceBookingsView.js';
import { FarmerPaymentsHistory } from '../../components/payments/FarmerPaymentsHistory.js';
import { FarmerSchemesView } from '../../components/schemes/FarmerSchemesView.js';
import { FarmerResourcesView } from '../../components/schemes/FarmerResourcesView.js';
import { SavedSchemesView } from '../../components/schemes/SavedSchemesView.js';
import { NotificationsView } from '../../components/notifications/NotificationsView.js';
import { FavoritesView } from '../../components/favorites/FavoritesView.js';
import { AIChatWindow } from '../../components/ai/AIChatWindow.js';
import { AIRecommendationSection } from '../../components/ai/AIRecommendationSection.js';
import { AINaturalSearch } from '../../components/ai/AINaturalSearch.js';
import { AIAssistantFloatingButton } from '../../components/ai/AIAssistantFloatingButton.js';
import { farmerApi, notificationsApi, favoritesApi, equipmentApi } from '../../services/api.js';
import { WeatherCard } from '../../components/farmer/WeatherCard.js';
import { CropRecommendationModal } from '../../components/farmer/CropRecommendationModal.js';
import { EquipmentComparisonModal } from '../../components/farmer/EquipmentComparisonModal.js';
import { GlobalSearchModal } from '../../components/common/GlobalSearchModal.js';
import { NotificationSettingsModal } from '../../components/farmer/NotificationSettingsModal.js';
import { FarmerProfileModal } from '../../components/farmer/FarmerProfileModal.js';
import { FarmerOrderTrackingView } from '../../components/location/FarmerOrderTrackingView.js';
import { PWAInstallButton } from '../../components/common/PWAInstallButton.js';
import { OfflineStatusBanner } from '../../components/common/OfflineStatusBanner.js';
import {
  LayoutDashboard,
  Tractor,
  Beef,
  Truck,
  Users,
  FileText,
  CalendarCheck,
  ShoppingBag,
  CreditCard,
  Bell,
  Heart,
  User,
  Settings,
  Clock,
  BookmarkCheck,
  CheckCircle2,
  MapPin,
  Phone,
  BookOpen,
  Sparkles,
  CloudSun,
  Sprout,
  Scale,
  Search,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

interface FarmerDashboardProps {
  defaultTab?: string;
  schemeId?: string;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  defaultTab = 'dashboard',
  schemeId,
}) => {
  const { user, refreshUser } = useAuth();
  const profile = user?.profile;
  const userLocationString = formatLocation(
    profile || {
      village: (user as any)?.village,
      taluk: (user as any)?.taluk,
      district: (user as any)?.district,
      state: (user as any)?.state,
    },
    'Mandya, Karnataka'
  );
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);
  const [animalOrdersCount, setAnimalOrdersCount] = useState(0);
  const [savedSchemesCount, setSavedSchemesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  useEffect(() => {
    // Fetch equipment for comparison
    equipmentApi
      .getAll({ sort: 'popular' })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setEquipmentList(res.data.data);
        }
      })
      .catch((err) => console.warn('[FarmerDashboard] Could not fetch equipment catalog:', err.message));
  }, []);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    // Fetch live farmer bookings for activity stats
    farmerApi
      .getBookings()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const list = res.data.data;
          const active = list.filter((b: any) => {
            const st = b.status || b.booking_status;
            return st === 'PENDING' || st === 'APPROVED' || st === 'CONFIRMED' || st === 'ACTIVE';
          }).length;
          const completed = list.filter((b: any) => {
            const st = b.status || b.booking_status;
            return st === 'COMPLETED';
          }).length;
          setActiveBookingsCount(Number.isFinite(active) ? active : 0);
          setCompletedBookingsCount(Number.isFinite(completed) ? completed : 0);
        }
      })
      .catch((err) => console.warn('[FarmerDashboard] Could not fetch bookings count:', err.message));

    // Fetch live animal orders count
    farmerApi
      .getAnimalOrders()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAnimalOrdersCount(res.data.data.length);
        }
      })
      .catch((err) => console.warn('[FarmerDashboard] Could not fetch animal orders:', err.message));

    // Fetch saved schemes count
    farmerApi
      .getSavedSchemes()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSavedSchemesCount(res.data.data.length);
        }
      })
      .catch((err) => console.warn('[FarmerDashboard] Could not fetch saved schemes:', err.message));

    // Fetch unread notifications count
    notificationsApi
      .getUnreadCount()
      .then((res) => {
        if (typeof res.data?.unreadCount === 'number') {
          setUnreadNotificationsCount(res.data.unreadCount);
        }
      })
      .catch((err) => console.warn('[FarmerDashboard] Could not fetch unread notifications:', err.message));

    // Fetch favorites count
    favoritesApi
      .getAll()
      .then((res) => {
        if (Array.isArray(res.data?.data)) {
          setFavoritesCount(res.data.data.length);
        }
      })
      .catch((err) => console.warn('[FarmerDashboard] Could not fetch favorites:', err.message));
  }, [activeTab]);

  const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Smart' },
    { id: 'weather-advisory', label: 'Weather & Agromet', icon: CloudSun, badge: 'Live' },
    { id: 'crop-recommendation', label: 'Crop Advisory', icon: Sprout, badge: 'Smart' },
    { id: 'compare-equipment', label: 'Compare Machinery', icon: Scale },
    { id: 'rent-equipment', label: 'Rent Equipment', icon: Tractor, badge: 'Active' },
    { id: 'delivery-tracking', label: 'Order Tracking', icon: Truck, badge: 'Live' },
    { id: 'animals-birds', label: 'Animals & Birds', icon: Beef, badge: 'Active' },
    { id: 'drivers', label: 'Drivers', icon: Truck, badge: 'Active' },
    { id: 'farm-workers', label: 'Farm Workers', icon: Users, badge: 'Active' },
    {
      id: 'service-bookings',
      label: 'Service Bookings',
      icon: CalendarCheck,
      badge: 'Active',
    },
    {
      id: 'my-bookings',
      label: 'Equipment Bookings',
      icon: CalendarCheck,
      badge: activeBookingsCount > 0 ? `${activeBookingsCount}` : 'Active',
    },
    {
      id: 'my-orders',
      label: 'My Orders',
      icon: ShoppingBag,
      badge: animalOrdersCount > 0 ? `${animalOrdersCount}` : 'Active',
    },
    { id: 'government-schemes', label: 'Government Schemes', icon: FileText, badge: 'Active' },
    { id: 'farmer-resources', label: 'Farmer Resources', icon: BookOpen, badge: 'Active' },
    {
      id: 'saved-schemes',
      label: 'Saved Schemes',
      icon: BookmarkCheck,
      badge: savedSchemesCount > 0 ? `${savedSchemesCount}` : undefined,
    },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: 'Active' },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} new` : 'Active',
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      badge: favoritesCount > 0 ? `${favoritesCount}` : 'Active',
    },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Placeholder configurations for when navigation items are selected
  const placeholderConfig: Record<string, { title: string; desc: string; icon: any }> = {
    'rent-equipment': {
      title: 'Rent Equipment',
      desc: 'Find and rent agricultural machinery including tractors, harvesters, tillers, and implements directly from verified owners.',
      icon: Tractor,
    },
    'animals-birds': {
      title: 'Animals & Birds Marketplace',
      desc: 'Buy and sell dairy livestock, cattle, sheep, goats, poultry, and farm birds from certified rural sellers.',
      icon: Beef,
    },
    'drivers': {
      title: 'Agricultural Drivers',
      desc: 'Hire licensed, experienced machinery and tractor drivers on daily or hourly wages for peak agricultural operations.',
      icon: Truck,
    },
    'farm-workers': {
      title: 'Farm Workers & Labor Crews',
      desc: 'Find and hire agricultural worker teams for sowing, weeding, spraying, and crop harvesting near your village.',
      icon: Users,
    },
    'government-schemes': {
      title: 'Government Schemes & Subsidies',
      desc: 'Discover central and state government agricultural subsidies, PM-Kisan benefits, solar pump grants, and crop insurance.',
      icon: FileText,
    },
    'my-bookings': {
      title: 'My Bookings',
      desc: 'Review your machinery rental reservations, driver appointments, active rental schedules, and delivery updates.',
      icon: CalendarCheck,
    },
    'my-orders': {
      title: 'My Orders',
      desc: 'Track animal purchases, inspection visits, seller communication, and order fulfillment history.',
      icon: ShoppingBag,
    },
    'payments': {
      title: 'Payments & Invoices',
      desc: 'Manage rental payments, security deposits, refund requests, and tax receipts.',
      icon: CreditCard,
    },
    'notifications': {
      title: 'Alerts & Notifications',
      desc: 'Real-time notifications for booking approvals, owner messages, reminder alerts, and weather advisories.',
      icon: Bell,
    },
    'favorites': {
      title: 'Saved Listings & Favorites',
      desc: 'Quickly access machinery, drivers, and animal listings you bookmarked for later.',
      icon: Heart,
    },
    'profile': {
      title: 'Farmer Profile',
      desc: 'Manage your verified personal details, village location, land records, and emergency contact information.',
      icon: User,
    },
    'settings': {
      title: 'Account Settings',
      desc: 'Configure notification preferences, language choices (Kannada, Hindi, English), and security credentials.',
      icon: Settings,
    },
  };

  return (
    <DashboardShell
      title="Farmer Dashboard"
      subtitle="Find equipment, animals, drivers & agricultural workers"
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
    >
      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <OfflineStatusBanner />

          {/* Top Row: Welcome Banner & Live Weather Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-800 to-emerald-900 p-6 sm:p-7 text-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RoleBadge role={user?.role} size="sm" />
                  <span className="text-xs text-emerald-300 font-medium">AgroRent Verified Farmer</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to AgroRent, {user?.name || 'Farmer'}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Find machinery, livestock, skilled operators, and farm labor near your village with real-time weather & subsidy advisory.
                </p>
              </div>

              {/* Location pill & Quick Info */}
              <div className="mt-4 pt-3 border-t border-emerald-700/50 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-100">
                <div className="flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-700/60">
                  <MapPin className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">{userLocationString}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-700/60">
                    <Phone className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-xs font-semibold underline text-emerald-200 hover:text-white transition cursor-pointer"
                >
                  Edit Farm Profile & Soil Type &rarr;
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <WeatherCard
                userLocation={userLocationString}
                onOpenForecast={() => setShowCropModal(true)}
              />
            </div>
          </div>

          {/* Quick Actions Grid for Farmers */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Farmer Quick Actions & Smart Tools
              </span>
              <PWAInstallButton />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              <button
                onClick={() => setShowCropModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 transition cursor-pointer group"
              >
                <Sprout className="w-5 h-5 text-emerald-700 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-center">Crop Advisor</span>
                <span className="text-[10px] text-emerald-600">Soil & Season Recs</span>
              </button>

              <button
                onClick={() => setShowCompareModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 transition cursor-pointer group"
              >
                <Scale className="w-5 h-5 text-blue-700 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-center">Compare Machines</span>
                <span className="text-[10px] text-blue-600">Side-by-side specs</span>
              </button>

              <button
                onClick={() => setShowSearchModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80 transition cursor-pointer group"
              >
                <Search className="w-5 h-5 text-purple-700 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-center">Global Search</span>
                <span className="text-[10px] text-purple-600">Cross-Platform Hub</span>
              </button>

              <button
                onClick={() => setShowProfileModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition cursor-pointer group"
              >
                <User className="w-5 h-5 text-amber-700 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-center">Soil & Land</span>
                <span className="text-[10px] text-amber-600">Farm details</span>
              </button>

              <button
                onClick={() => setShowNotificationModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200/80 transition cursor-pointer group"
              >
                <SlidersHorizontal className="w-5 h-5 text-stone-700 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-center">Alert Prefs</span>
                <span className="text-[10px] text-stone-500">SMS / Push</span>
              </button>
            </div>
          </div>

          {/* AI Natural Language Search Bar */}
          <AINaturalSearch onNavigate={(tab, item) => setActiveTab(tab)} />

          {/* Statistics Section (Placeholder values: 0) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                Activity Overview
              </h2>
              <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                Live Counts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <StatCard
                id="stat-active-bookings"
                label="Active Bookings"
                value={activeBookingsCount}
                icon={CalendarCheck}
                colorScheme="emerald"
                subtitle="Approved or pending rentals"
              />
              <StatCard
                id="stat-completed-bookings"
                label="Completed Bookings"
                value={completedBookingsCount}
                icon={CheckCircle2}
                colorScheme="blue"
                subtitle="Past rental contracts"
              />
              <StatCard
                id="stat-orders"
                label="Livestock Orders"
                value={animalOrdersCount}
                icon={ShoppingBag}
                colorScheme="amber"
                subtitle="Livestock purchases"
              />
              <StatCard
                id="stat-saved-schemes"
                label="Saved Schemes"
                value={savedSchemesCount}
                icon={BookmarkCheck}
                colorScheme="purple"
                subtitle="Bookmarked for reference"
              />
            </div>
          </div>

          {/* Smart Agricultural Recommendations Widget */}
          <AIRecommendationSection onSelectTab={(tab, item) => setActiveTab(tab)} />

          {/* Dashboard Feature Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  Agricultural Services & Schemes
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Select a category to explore available services, machinery, and government benefits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <DashboardCard
                id="card-equipment-rental"
                title="Equipment Rental"
                description="Find and rent agricultural machinery"
                buttonText="Browse Equipment"
                icon={Tractor}
                badge="Active"
                colorScheme="emerald"
                onAction={() => setActiveTab('rent-equipment')}
              />

              <DashboardCard
                id="card-animals-birds"
                title="Animals & Birds"
                description="Buy animals and birds from verified sellers"
                buttonText="Browse Marketplace"
                icon={Beef}
                badge="Active"
                colorScheme="amber"
                onAction={() => setActiveTab('animals-birds')}
              />

              <DashboardCard
                id="card-driver-booking"
                title="Driver Booking"
                description="Find licensed drivers for agricultural machinery"
                buttonText="Find Drivers"
                icon={Truck}
                badge="Active"
                colorScheme="blue"
                onAction={() => setActiveTab('drivers')}
              />

              <DashboardCard
                id="card-farm-workers"
                title="Farm Workers"
                description="Find agricultural workers and labor crews near you"
                buttonText="Find Workers"
                icon={Users}
                badge="Active"
                colorScheme="teal"
                onAction={() => setActiveTab('farm-workers')}
              />

              <DashboardCard
                id="card-government-schemes"
                title="Government Schemes"
                description="Central & Karnataka State subsidies, PM-Kisan, solar grants"
                buttonText="View Schemes"
                icon={FileText}
                badge="Active"
                colorScheme="emerald"
                onAction={() => setActiveTab('government-schemes')}
              />

              <DashboardCard
                id="card-farmer-resources"
                title="Farmer Guides & Resources"
                description="Field manuals, soil testing, pest management & helplines"
                buttonText="Read Guides"
                icon={BookOpen}
                badge="Active"
                colorScheme="blue"
                onAction={() => setActiveTab('farmer-resources')}
              />

              <DashboardCard
                id="card-farmer-favorites"
                title="Saved Favorites"
                description="Quick access to bookmarked equipment, livestock breeds, drivers & schemes"
                buttonText="View Favorites"
                icon={Heart}
                badge={favoritesCount > 0 ? `${favoritesCount} items` : 'Active'}
                colorScheme="purple"
                onAction={() => setActiveTab('favorites')}
              />

              <DashboardCard
                id="card-farmer-notifications"
                title="Alerts & Status Updates"
                description="Booking approvals, shipment updates, payment alerts, and scheme announcements"
                buttonText="Open Alerts"
                icon={Bell}
                badge={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread` : 'Active'}
                colorScheme="purple"
                onAction={() => setActiveTab('notifications')}
              />
            </div>
          </div>

          {/* Role Authorization Tester */}
          <ApiTester currentRole={user?.role} />
        </div>
      ) : activeTab === 'ai-assistant' ? (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">AgroRent Kisan Sathi AI Assistant</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ask about machinery recommendations, cattle care, agricultural subsidies, or seasonal farming advisories in English or Kannada.
            </p>
          </div>
          <AIChatWindow isEmbedded={true} />
        </div>
      ) : activeTab === 'rent-equipment' ? (
        <EquipmentMarketplace onGoToBookings={() => setActiveTab('my-bookings')} />
      ) : activeTab === 'delivery-tracking' ? (
        <FarmerOrderTrackingView onBack={() => setActiveTab('dashboard')} />
      ) : activeTab === 'my-bookings' ? (
        <FarmerBookingsView onBrowseEquipment={() => setActiveTab('rent-equipment')} />
      ) : activeTab === 'animals-birds' ? (
        <AnimalMarketplace onGoToOrders={() => setActiveTab('my-orders')} />
      ) : activeTab === 'my-orders' ? (
        <FarmerAnimalOrdersView onBrowseMarketplace={() => setActiveTab('animals-birds')} />
      ) : activeTab === 'drivers' ? (
        <DriverMarketplace onGoToBookings={() => setActiveTab('service-bookings')} />
      ) : activeTab === 'farm-workers' ? (
        <WorkerMarketplace onGoToBookings={() => setActiveTab('service-bookings')} />
      ) : activeTab === 'service-bookings' ? (
        <FarmerServiceBookingsView
          onBrowseDrivers={() => setActiveTab('drivers')}
          onBrowseWorkers={() => setActiveTab('farm-workers')}
        />
      ) : activeTab === 'government-schemes' ? (
        <FarmerSchemesView
          initialSchemeId={schemeId}
          onNavigateToResources={() => setActiveTab('farmer-resources')}
        />
      ) : activeTab === 'farmer-resources' ? (
        <FarmerResourcesView onBackToSchemes={() => setActiveTab('government-schemes')} />
      ) : activeTab === 'saved-schemes' ? (
        <SavedSchemesView onBackToDirectory={() => setActiveTab('government-schemes')} />
      ) : activeTab === 'notifications' ? (
        <NotificationsView />
      ) : activeTab === 'favorites' ? (
        <FavoritesView onNavigateTab={(tab) => setActiveTab(tab)} />
      ) : activeTab === 'payments' ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Payment Invoices & Receipts</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track invoices, initiate Razorpay/UPI/Cash payments, and download receipts for all your agricultural services.
            </p>
          </div>
          <FarmerPaymentsHistory />
        </div>
      ) : activeTab === 'weather-advisory' ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Agrometeorology & Weather Advisory</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Real-time temperature, humidity, rainfall probability, and crop management advisories tailored for your village.
            </p>
          </div>
          <WeatherCard
            userLocation={userLocationString}
            onOpenForecast={() => setShowCropModal(true)}
          />
        </div>
      ) : activeTab === 'crop-recommendation' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-emerald-950">Crop Suitability & Advisory</h1>
              <p className="text-xs text-emerald-800 mt-1 max-w-xl">
                Get precision crop recommendations based on soil type, seasonal rainfall, and current market demand.
              </p>
            </div>
            <button
              onClick={() => setShowCropModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>Launch Advisor Tool</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'compare-equipment' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-blue-950">Agricultural Machinery Comparison</h1>
              <p className="text-xs text-blue-800 mt-1 max-w-xl">
                Evaluate power ratings, fuel efficiency, rental rates per hour, and driver options across multiple machines side-by-side.
              </p>
            </div>
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span>Open Comparison Matrix</span>
            </button>
          </div>
          <EquipmentMarketplace onGoToBookings={() => setActiveTab('my-bookings')} />
        </div>
      ) : activeTab === 'profile' || activeTab === 'profile-settings' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Farmer Land & Soil Profile</h1>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                Keep your farm acreage, soil classification, irrigation type, and primary crops up to date for precise recommendations.
              </p>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Edit Farm Profile</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notification & Alert Settings</h1>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                Customize your SMS, WhatsApp, and in-app alert channels for booking updates, weather warnings, and new schemes.
              </p>
            </div>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Configure Notifications</span>
            </button>
          </div>
        </div>
      ) : (
        <PlaceholderView
          title={placeholderConfig[activeTab]?.title || 'Module'}
          description={placeholderConfig[activeTab]?.desc || 'This module is currently being updated. Please check back shortly.'}
          icon={placeholderConfig[activeTab]?.icon || LayoutDashboard}
          onBackToDashboard={() => setActiveTab('dashboard')}
          colorScheme="emerald"
        />
      )}
      {activeTab !== 'ai-assistant' && <AIAssistantFloatingButton />}

      {/* Modals */}
      <CropRecommendationModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        defaultDistrict={profile?.district ? `${profile.district}, Karnataka` : 'Mandya, Karnataka'}
      />

      <EquipmentComparisonModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        availableEquipment={equipmentList}
        onSelectForBooking={(_eq) => {
          setShowCompareModal(false);
          setActiveTab('rent-equipment');
        }}
      />

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigateTab={(tabId) => {
          setShowSearchModal(false);
          setActiveTab(tabId);
        }}
      />

      <NotificationSettingsModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <FarmerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={user}
        onProfileUpdated={async (updated) => {
          if (refreshUser) {
            await refreshUser();
          }
        }}
      />
    </DashboardShell>
  );
};
