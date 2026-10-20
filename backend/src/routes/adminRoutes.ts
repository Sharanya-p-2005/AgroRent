import { Router } from 'express';
import { TestController } from '../controllers/testController.js';
import { AdminController } from '../controllers/adminController.js';
import { EquipmentController } from '../controllers/equipmentController.js';
import { AnimalController } from '../controllers/animalController.js';
import { AnimalOrderController } from '../controllers/animalOrderController.js';
import { ServiceAdminController } from '../controllers/serviceAdminController.js';
import { PaymentController } from '../controllers/paymentController.js';
import { SchemeController } from '../controllers/schemeController.js';
import { ResourceController } from '../controllers/resourceController.js';
import { NotificationController } from '../controllers/notificationController.js';
import { ReviewController } from '../controllers/reviewController.js';
import { DeliveryController } from '../controllers/deliveryController.js';
import { AiController } from '../ai/ai.controller.js';
import { AdminAnalyticsController } from '../controllers/adminAnalyticsController.js';
import { AuditLogController } from '../controllers/auditLogController.js';
import { AdminUserController } from '../controllers/adminUserController.js';
import { ReportController } from '../controllers/reportController.js';
import { SystemHealthController } from '../controllers/systemHealthController.js';
import { AdminSettingsController } from '../controllers/adminSettingsController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all /api/admin routes: must be authenticated and have role ADMIN
router.use(requireAuth, requireAdmin);

// Test endpoint for verifying admin authorization
router.get('/test', TestController.adminTest);

// Admin dashboard statistics
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Admin Equipment review & actions
router.get('/equipment', EquipmentController.getAdminEquipment);
router.put('/equipment/:id/approve', EquipmentController.approveEquipment);
router.put('/equipment/:id/reject', EquipmentController.rejectEquipment);
router.put('/equipment/:id/toggle-status', EquipmentController.toggleAvailability);
router.delete('/equipment/:id', EquipmentController.adminDeleteEquipment);

// Admin Animal & Bird review & actions
router.get('/animals', AnimalController.getAdminAnimals);
router.put('/animals/:id/approve', AnimalController.approveAnimal);
router.put('/animals/:id/reject', AnimalController.rejectAnimal);
router.put('/animals/:id/disable', AnimalController.disableAnimal);
router.delete('/animals/:id', AnimalController.deleteAdminAnimal);

// Admin Animal Orders oversight
router.get('/animal-orders', AnimalOrderController.getAdminOrders);

// Admin Driver & Farm Worker Services review & actions
router.get('/services', ServiceAdminController.getAllServices);
router.put('/services/:id/approve', ServiceAdminController.approveService);
router.put('/services/:id/reject', ServiceAdminController.rejectService);
router.put('/services/:id/disable', ServiceAdminController.disableService);
router.delete('/services/:id', ServiceAdminController.deleteService);

// Admin Service Bookings oversight
router.get('/service-bookings', ServiceAdminController.getAllBookings);

// Admin Payments Dashboard & Detailed Inspection
router.get('/payments', PaymentController.getAdminPayments);
router.get('/payments/:paymentReference', PaymentController.getAdminPaymentDetails);

// Phase 7: Admin Government Schemes Management
router.get('/schemes', SchemeController.getAdminSchemes);
router.post('/schemes', SchemeController.createScheme);
router.put('/schemes/:id', SchemeController.updateScheme);
router.delete('/schemes/:id', SchemeController.deleteScheme);
router.put('/schemes/:id/publish', SchemeController.publishScheme);
router.put('/schemes/:id/archive', SchemeController.archiveScheme);
router.put('/schemes/:id/feature', SchemeController.featureScheme);
router.put('/schemes/:id/unfeature', SchemeController.unfeatureScheme);

// Phase 7: Admin Farmer Educational Resources Management
router.get('/resources', ResourceController.getAdminResources);
router.post('/resources', ResourceController.createResource);
router.put('/resources/:id', ResourceController.updateResource);
router.delete('/resources/:id', ResourceController.deleteResource);
router.put('/resources/:id/publish', ResourceController.publishResource);
router.put('/resources/:id/archive', ResourceController.archiveResource);

// Phase 8: Admin Notifications Management & Broadcast
router.post('/notifications', NotificationController.adminSendNotification);
router.get('/notifications', NotificationController.adminGetAll);
router.delete('/notifications/:id', NotificationController.adminDelete);

// Phase 8: Admin Reviews Moderation
router.get('/reviews', ReviewController.adminGetAllReviews);
router.get('/reviews/stats', ReviewController.adminGetStats);
router.patch('/reviews/:id/status', ReviewController.adminUpdateStatus);
router.delete('/reviews/:id', ReviewController.adminDeleteReview);

// Phase 9: Admin Animal Deliveries & Driver Assignment
router.get('/deliveries', DeliveryController.getAdminDeliveries);
router.get('/deliveries/drivers/available', DeliveryController.getAvailableDrivers);
router.post('/deliveries/:id/assign-driver', DeliveryController.assignDriver);
router.patch('/deliveries/:id/status', DeliveryController.updateDeliveryStatus);

// Phase 10: Admin AI Monitoring & Telemetry
router.get('/ai/usage', AiController.getAdminUsage);
router.get('/ai/errors', AiController.getAdminErrors);

// ==========================================
// Phase 11: Admin Analytics Deep Dives
// ==========================================
router.get('/analytics/overview', AdminAnalyticsController.getOverview);
router.get('/analytics/users', AdminAnalyticsController.getUsers);
router.get('/analytics/equipment', AdminAnalyticsController.getEquipment);
router.get('/analytics/bookings', AdminAnalyticsController.getBookings);
router.get('/analytics/animals', AdminAnalyticsController.getAnimals);
router.get('/analytics/services', AdminAnalyticsController.getServices);
router.get('/analytics/payments', AdminAnalyticsController.getPayments);
router.get('/analytics/revenue', AdminAnalyticsController.getRevenue);
router.get('/analytics/deliveries', AdminAnalyticsController.getDeliveries);
router.get('/analytics/ai', AdminAnalyticsController.getAi);
router.get('/analytics/reviews', AdminAnalyticsController.getReviews);
router.get('/analytics/notifications', AdminAnalyticsController.getNotifications);

// ==========================================
// Phase 11: Audit Logs System (Append-only)
// ==========================================
router.get('/audit-logs', AuditLogController.getAuditLogs);
router.get('/audit-logs/:id', AuditLogController.getAuditLogById);

// ==========================================
// Phase 11: Admin User Management
// ==========================================
router.get('/users', AdminUserController.getUsers);
router.get('/users/:id', AdminUserController.getUserDetails);
router.put('/users/:id/status', AdminUserController.updateUserStatus);

// ==========================================
// Phase 11: Reports Generation & CSV Export
// ==========================================
router.get('/reports/users', ReportController.getUsersReport);
router.get('/reports/equipment', ReportController.getEquipmentReport);
router.get('/reports/bookings', ReportController.getBookingsReport);
router.get('/reports/orders', ReportController.getOrdersReport);
router.get('/reports/payments', ReportController.getPaymentsReport);
router.get('/reports/deliveries', ReportController.getDeliveriesReport);
router.get('/reports/reviews', ReportController.getReviewsReport);
router.get('/reports/ai', ReportController.getAiReport);

// ==========================================
// Phase 11: Platform System Health Monitoring
// ==========================================
router.get('/system-health', SystemHealthController.getSystemHealth);

// ==========================================
// Phase 11: Platform Settings Management
// ==========================================
router.get('/settings', AdminSettingsController.getSettings);
router.put('/settings', AdminSettingsController.updateSettings);

export default router;


