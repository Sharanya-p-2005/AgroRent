import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All notification endpoints require user authentication
router.use(requireAuth);

// Get current user's notifications (supports page, limit, unreadOnly, type)
router.get('/', NotificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark single notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Notification Preferences
router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

// Delete user notification
router.delete('/:id', NotificationController.deleteNotification);

export default router;
