import axios from 'axios';

// Base API configuration
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrorent_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401 states
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('agrorent_token');
        localStorage.removeItem('agrorent_user');
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const testApi = {
  getHealth: () => api.get('/health'),
  farmerTest: () => api.get('/farmer/test'),
  ownerTest: () => api.get('/owner/test'),
  adminTest: () => api.get('/admin/test'),
};

// Public Equipment Catalog
export const equipmentApi = {
  getAll: (params?: { search?: string; category?: string; maxPrice?: number; location?: string; sort?: string }) =>
    api.get('/equipment', { params }),
  getById: (id: string) => api.get(`/equipment/${id}`),
};

// Public Services (Drivers and Farm Workers) Catalog
export const servicesApi = {
  getAll: (params?: {
    service_type?: 'DRIVER' | 'FARM_WORKER';
    type?: 'DRIVER' | 'FARM_WORKER';
    search?: string;
    location?: string;
    skill?: string;
    minPrice?: number;
    maxPrice?: number;
    minExperience?: number;
    sortBy?: string;
  }) => api.get('/services', { params }),
  getById: (id: string) => api.get(`/services/${id}`),
};

// Service Bookings (Farmer, Owner, and Admin)
export const serviceBookingsApi = {
  createBooking: (data: any) => api.post('/service-bookings', data),
  getFarmerBookings: () => api.get('/farmer/service-bookings'),
  getFarmerBookingById: (id: string) => api.get(`/farmer/service-bookings/${id}`),
  cancelBooking: (id: string) => api.put(`/farmer/service-bookings/${id}/cancel`),

  // Owner Actions
  getOwnerBookings: (params?: { service_type?: string; type?: string }) =>
    api.get('/owner/service-bookings', { params }),
  confirmBooking: (id: string) => api.put(`/owner/service-bookings/${id}/confirm`),
  rejectBooking: (id: string) => api.put(`/owner/service-bookings/${id}/reject`),
  markActive: (id: string) => api.put(`/owner/service-bookings/${id}/active`),
  markComplete: (id: string) => api.put(`/owner/service-bookings/${id}/complete`),
  getOwnerEarnings: () => api.get('/owner/service-earnings'),

  // Owner Services
  getOwnerServices: (params?: { service_type?: string; type?: string }) =>
    api.get('/owner/services', { params }),
  createService: (data: any) => api.post('/owner/services', data),
  updateService: (id: string, data: any) => api.put(`/owner/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/owner/services/${id}`),
  toggleAvailability: (id: string, availability_status: string) =>
    api.put(`/owner/services/${id}/availability`, { availability_status }),

  // Admin Actions
  getAllAdminServices: (params?: { service_type?: string; type?: string; approval_status?: string; search?: string }) =>
    api.get('/admin/services', { params }),
  approveService: (id: string) => api.put(`/admin/services/${id}/approve`),
  rejectService: (id: string, rejection_reason?: string) =>
    api.put(`/admin/services/${id}/reject`, { rejection_reason }),
  disableService: (id: string) => api.put(`/admin/services/${id}/disable`),
  deleteAdminService: (id: string) => api.delete(`/admin/services/${id}`),
  getAllAdminBookings: () => api.get('/admin/service-bookings'),
};

// Public Animal & Bird Marketplace Catalog
export const animalApi = {
  getAll: (params?: {
    search?: string;
    listing_type?: string;
    category?: string;
    gender?: string;
    location?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
  }) => api.get('/animals', { params }),
  getById: (id: string) => api.get(`/animals/${id}`),
  createOrder: (data: {
    listing_id: string;
    quantity: number;
    delivery_name: string;
    delivery_phone: string;
    delivery_address: string;
    delivery_city: string;
    delivery_state: string;
    delivery_pincode: string;
  }) => api.post('/animal-orders', data),
};

// Farmer Bookings & Actions
export const farmerApi = {
  getBookings: () => api.get('/farmer/bookings'),
  getBookingById: (id: string) => api.get(`/farmer/bookings/${id}`),
  createBooking: (data: {
    equipment_id: string;
    start_time: string;
    end_time: string;
    delivery_location?: string;
    notes?: string;
  }) => api.post('/bookings', data),
  cancelBooking: (id: string) => api.put(`/farmer/bookings/${id}/cancel`),
  getAnimalOrders: () => api.get('/farmer/animal-orders'),
  getAnimalOrderById: (id: string) => api.get(`/farmer/animal-orders/${id}`),
  cancelAnimalOrder: (id: string) => api.put(`/farmer/animal-orders/${id}/cancel`),
  getServiceBookings: () => api.get('/farmer/service-bookings'),
  getPayments: () => api.get('/farmer/payments'),
  // Saved Schemes
  getSavedSchemes: () => api.get('/farmer/saved-schemes'),
  saveScheme: (id: string) => api.post(`/farmer/schemes/${id}/save`),
  removeSavedScheme: (id: string) => api.delete(`/farmer/schemes/${id}/save`),
};

// Owner Fleet & Bookings
export const ownerApi = {
  getEquipment: () => api.get('/owner/equipment'),
  createEquipment: (data: {
    name: string;
    category: string;
    description: string;
    brand: string;
    model: string;
    image_url?: string;
    price_per_hour: number;
    location: string;
  }) => api.post('/owner/equipment', data),
  updateEquipment: (id: string, data: any) => api.put(`/owner/equipment/${id}`, data),
  deleteEquipment: (id: string) => api.delete(`/owner/equipment/${id}`),
  getBookings: () => api.get('/owner/bookings'),
  updateBookingStatus: (id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED') =>
    api.put(`/owner/bookings/${id}/status`, { status }),
  getEarnings: () => api.get('/owner/earnings'),
  // Animals & Birds
  getAnimals: () => api.get('/owner/animals'),
  getAnimalStats: () => api.get('/owner/animals/stats'),
  createAnimal: (data: any) => api.post('/owner/animals', data),
  updateAnimal: (id: string, data: any) => api.put(`/owner/animals/${id}`, data),
  deleteAnimal: (id: string) => api.delete(`/owner/animals/${id}`),
  getAnimalOrders: () => api.get('/owner/animal-orders'),
  confirmAnimalOrder: (id: string) => api.put(`/owner/animal-orders/${id}/confirm`),
  rejectAnimalOrder: (id: string) => api.put(`/owner/animal-orders/${id}/reject`),
  shipAnimalOrder: (id: string) => api.put(`/owner/animal-orders/${id}/ship`),
  deliverAnimalOrder: (id: string) => api.put(`/owner/animal-orders/${id}/deliver`),
  // Driver & Farm Worker Services
  getServices: () => api.get('/owner/services'),
  getServiceBookings: () => api.get('/owner/service-bookings'),
  getServiceEarnings: () => api.get('/owner/service-earnings'),
  // Multi-Channel Payments & Revenue Summary
  getPayments: () => api.get('/owner/payments'),
};

// Admin Platform Operations
export const adminApi = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getEquipment: () => api.get('/admin/equipment'),
  approveEquipment: (id: string) => api.put(`/admin/equipment/${id}/approve`),
  rejectEquipment: (id: string) => api.put(`/admin/equipment/${id}/reject`),
  toggleAvailability: (id: string) => api.put(`/admin/equipment/${id}/toggle-status`),
  deleteEquipment: (id: string) => api.delete(`/admin/equipment/${id}`),
  // Animals
  getAnimals: (params?: any) => api.get('/admin/animals', { params }),
  approveAnimal: (id: string) => api.put(`/admin/animals/${id}/approve`),
  rejectAnimal: (id: string, reason?: string) => api.put(`/admin/animals/${id}/reject`, { reason }),
  disableAnimal: (id: string) => api.put(`/admin/animals/${id}/disable`),
  deleteAnimal: (id: string) => api.delete(`/admin/animals/${id}`),
  getAnimalOrders: (params?: any) => api.get('/admin/animal-orders', { params }),
  // Services
  getServices: (params?: any) => api.get('/admin/services', { params }),
  getServiceBookings: (params?: any) => api.get('/admin/service-bookings', { params }),
  // Payments Audit
  getPayments: (params?: { payment_status?: string; payment_type?: string; payment_method?: string; search?: string }) =>
    api.get('/admin/payments', { params }),
  getPaymentByReference: (reference: string) => api.get(`/admin/payments/${reference}`),
  // Schemes & Resources Management
  getSchemes: (params?: any) => api.get('/admin/schemes', { params }),
  createScheme: (data: any) => api.post('/admin/schemes', data),
  updateScheme: (id: string, data: any) => api.put(`/admin/schemes/${id}`, data),
  deleteScheme: (id: string) => api.delete(`/admin/schemes/${id}`),
  publishScheme: (id: string) => api.put(`/admin/schemes/${id}/publish`),
  archiveScheme: (id: string) => api.put(`/admin/schemes/${id}/archive`),
  featureScheme: (id: string) => api.put(`/admin/schemes/${id}/feature`),
  unfeatureScheme: (id: string) => api.put(`/admin/schemes/${id}/unfeature`),
  // Resources
  getResources: (params?: any) => api.get('/admin/resources', { params }),
  createResource: (data: any) => api.post('/admin/resources', data),
  updateResource: (id: string, data: any) => api.put(`/admin/resources/${id}`, data),
  deleteResource: (id: string) => api.delete(`/admin/resources/${id}`),
  publishResource: (id: string) => api.put(`/admin/resources/${id}/publish`),
  archiveResource: (id: string) => api.put(`/admin/resources/${id}/archive`),
  // Admin Notifications & Reviews Moderation
  getNotifications: (params?: any) => api.get('/admin/notifications', { params }),
  sendNotification: (data: {
    title: string;
    message: string;
    target: 'ALL_FARMERS' | 'ALL_OWNERS' | 'ALL_USERS' | 'SPECIFIC_USER';
    userId?: string;
    notification_type?: string;
  }) => api.post('/admin/notifications', data),
  deleteNotification: (id: string) => api.delete(`/admin/notifications/${id}`),
  getReviews: (params?: any) => api.get('/admin/reviews', { params }),
  getReviewStats: () => api.get('/admin/reviews/stats'),
  updateReviewStatus: (id: string, status: 'PUBLISHED' | 'HIDDEN' | 'REPORTED') =>
    api.patch(`/admin/reviews/${id}/status`, { status }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
};

// Public & Farmer Government Schemes
export const schemesApi = {
  getPublicSchemes: (params?: any) => api.get('/schemes', { params }),
  getSchemeById: (id: string) => api.get(`/schemes/${id}`),
  getSavedSchemes: () => api.get('/farmer/saved-schemes'),
  saveScheme: (id: string) => api.post(`/farmer/schemes/${id}/save`),
  removeSavedScheme: (id: string) => api.delete(`/farmer/schemes/${id}/save`),
};

// Educational & Agricultural Resources
export const resourcesApi = {
  getPublicResources: (params?: any) => api.get('/resources', { params }),
  getResourceById: (id: string) => api.get(`/resources/${id}`),
};

// Payment System
export const paymentApi = {
  initializePayment: (data: { payment_type: string; target_id: string }) =>
    api.post('/payments/initialize', data),
  getDetails: (paymentReference: string) => api.get(`/payments/${paymentReference}`),
  createRazorpayOrder: (data: { payment_reference: string }) =>
    api.post('/payments/create-order', data),
  verifyRazorpayPayment: (data: {
    payment_reference: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post('/payments/verify', data),
  getUpiQr: (paymentReference: string) => api.get(`/payments/${paymentReference}/upi-qr`),
  selectCashPayment: (paymentReference: string) =>
    api.post(`/payments/${paymentReference}/cash`),
  submitUpiPayment: (paymentReference: string, upi_transaction_id?: string) =>
    api.post(`/payments/${paymentReference}/upi-submit`, { upi_transaction_id }),
  retryPayment: (paymentReference: string) =>
    api.post(`/payments/${paymentReference}/retry`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean; type?: string }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Favorites API
export const favoritesApi = {
  getAll: (type?: string) => api.get('/favorites', { params: type ? { type } : {} }),
  add: (item_type: string, item_id: string) => api.post('/favorites', { item_type, item_id }),
  remove: (item_type: string, item_id: string) => api.delete(`/favorites/${item_type}/${item_id}`),
  check: (item_type: string, item_id: string) => api.get(`/favorites/check/${item_type}/${item_id}`),
};

// Ratings & Reviews API
export const reviewsApi = {
  getForTarget: (targetType: string, targetId: string) =>
    api.get(`/reviews/${targetType}/${targetId}`),
  getEligible: () => api.get('/reviews/user/eligible'),
  create: (data: {
    target_type: 'EQUIPMENT' | 'OWNER' | 'DRIVER' | 'FARM_WORKER' | 'ANIMAL_SELLER';
    target_id: string;
    source_type: 'EQUIPMENT_BOOKING' | 'ANIMAL_ORDER' | 'DRIVER_BOOKING' | 'WORKER_BOOKING';
    source_id: string;
    rating: number;
    comment?: string;
  }) => api.post('/reviews', data),
  update: (id: string, data: { rating: number; comment?: string }) =>
    api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Locations API
export const locationsApi = {
  getAll: () => api.get('/locations'),
  create: (data: {
    label: 'HOME' | 'FARM' | 'OFFICE' | 'OTHER';
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number | null;
    longitude?: number | null;
    is_default?: boolean;
  }) => api.post('/locations', data),
  update: (id: string, data: any) => api.put(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
  setDefault: (id: string) => api.patch(`/locations/${id}/default`),
};

// Animal Delivery Tracking API (Farmer & General)
export const deliveriesApi = {
  getAll: (params?: { status?: string }) => api.get('/deliveries', { params }),
  getById: (id: string) => api.get(`/deliveries/${id}`),
  getTracking: (id: string) => api.get(`/deliveries/${id}/tracking`),
  updateStatus: (id: string, data: { status: string; note?: string; latitude?: number; longitude?: number }) =>
    api.patch(`/deliveries/${id}/status`, data),
  updateLocation: (id: string, data: { latitude: number; longitude: number; note?: string }) =>
    api.post(`/deliveries/${id}/location`, data),
  getStats: () => api.get('/deliveries/stats'),
};

// Driver Delivery Work API
export const driverDeliveriesApi = {
  getDeliveries: (params?: { status?: string }) => api.get('/driver/deliveries', { params }),
  getDeliveryById: (id: string) => api.get(`/driver/deliveries/${id}`),
  updateLocation: (id: string, data: { latitude: number; longitude: number; note?: string }) =>
    api.post(`/driver/deliveries/${id}/location`, data),
  updateStatus: (id: string, data: { status: string; note?: string; latitude?: number; longitude?: number }) =>
    api.patch(`/driver/deliveries/${id}/status`, data),
};

// Admin Delivery Management API
export const adminDeliveriesApi = {
  getAll: (params?: { status?: string }) => api.get('/admin/deliveries', { params }),
  assignDriver: (id: string, driver_id: string) =>
    api.post(`/admin/deliveries/${id}/assign-driver`, { driver_id }),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.patch(`/admin/deliveries/${id}/status`, data),
};

// AI Assistant, Recommendations & Intelligence API
export const aiApi = {
  sendMessage: (data: {
    message: string;
    conversation_id?: string;
    language?: 'en' | 'kn' | 'hi';
    location_override?: string;
  }) => api.post('/ai/chat', data),
  getConversations: () => api.get('/ai/conversations'),
  getMessages: (conversationId: string) => api.get(`/ai/conversations/${conversationId}/messages`),
  deleteConversation: (conversationId: string) => api.delete(`/ai/conversations/${conversationId}`),
  search: (query: string) => api.post('/ai/search', { query }),
  getRecommendations: (
    type: 'equipment' | 'animals' | 'drivers' | 'workers' | 'schemes' | 'resources',
    limit?: number
  ) => api.get(`/ai/recommendations/${type}`, { params: { limit } }),
  getRateLimitStatus: () => api.get('/ai/rate-limit'),
};

// Admin AI Monitoring & Usage API
export const adminAiApi = {
  getUsage: (days = 7) => api.get('/admin/ai/usage', { params: { days } }),
  getErrors: (days = 7) => api.get('/admin/ai/errors', { params: { days } }),
};

// Admin Analytics API
export const adminAnalyticsApi = {
  getOverview: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/overview', { params }),
  getUsers: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/users', { params }),
  getEquipment: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/equipment', { params }),
  getBookings: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/bookings', { params }),
  getAnimals: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/animals', { params }),
  getServices: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/services', { params }),
  getPayments: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/payments', { params }),
  getRevenue: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/revenue', { params }),
  getDeliveries: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/deliveries', { params }),
  getAi: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/ai', { params }),
  getReviews: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/reviews', { params }),
  getNotifications: (params?: { period?: string; from?: string; to?: string }) =>
    api.get('/admin/analytics/notifications', { params }),
};

// Admin Audit Logs API
export const adminAuditLogsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity_type?: string;
    user_id?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => api.get('/admin/audit-logs', { params }),
  getById: (id: string) => api.get(`/admin/audit-logs/${id}`),
};

// Admin User Management API
export const adminUsersApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) =>
    api.get('/admin/users', { params }),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  updateStatus: (id: string, data: { status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; reason?: string }) =>
    api.put(`/admin/users/${id}/status`, data),
};

// Admin Reports & Export API
export const adminReportsApi = {
  getReport: (
    type: 'users' | 'equipment' | 'bookings' | 'orders' | 'payments' | 'deliveries' | 'reviews' | 'ai',
    params?: { page?: number; limit?: number; from?: string; to?: string; status?: string; role?: string; category?: string; search?: string }
  ) => api.get(`/admin/reports/${type}`, { params }),
  getCsvUrl: (
    type: 'users' | 'equipment' | 'bookings' | 'orders' | 'payments' | 'deliveries' | 'reviews' | 'ai',
    params?: { from?: string; to?: string; status?: string; role?: string; category?: string; search?: string }
  ) => {
    const searchParams = new URLSearchParams();
    searchParams.set('format', 'csv');
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.set(k, String(v));
      });
    }
    return `/api/admin/reports/${type}?${searchParams.toString()}`;
  },
};

// System Health & Status API
export const adminHealthApi = {
  getHealth: () => api.get('/admin/system-health'),
};

// Platform Settings API
export const adminSettingsApi = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: Record<string, any>) => api.put('/admin/settings', data),
};

export default api;
