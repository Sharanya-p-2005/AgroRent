import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { NotificationModel, NotificationType } from '../models/notificationModel.js';
import { query } from '../config/db.js';

export class NotificationController {
  /**
   * GET /api/notifications
   * Fetch current authenticated user's notifications
   */
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit, unreadOnly, type } = req.query;

      const result = await NotificationModel.findForUser(userId, {
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
        unreadOnly: unreadOnly === 'true',
        type: type ? String(type) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });
    } catch (error: any) {
      console.error('[NotificationController.getNotifications] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Returns current user's unread notification count
   */
  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await NotificationModel.countUnread(userId);

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error: any) {
      console.error('[NotificationController.getUnreadCount] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unread notification count',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const updated = await NotificationModel.markAsRead(id, userId);
      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Notification not found or access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: updated,
      });
    } catch (error: any) {
      console.error('[NotificationController.markAsRead] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for current user
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const updatedCount = await NotificationModel.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        count: updatedCount,
      });
    } catch (error: any) {
      console.error('[NotificationController.markAllAsRead] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a notification for current user
   */
  static async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await NotificationModel.delete(id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Notification not found or access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      console.error('[NotificationController.deleteNotification] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/admin/notifications
   * Admin sends broadcast or targeted notifications
   */
  static async adminSendNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, message, target, userId, notification_type } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Notification title is required' });
        return;
      }
      if (!message || !message.trim()) {
        res.status(400).json({ success: false, message: 'Notification message is required' });
        return;
      }

      const validTargets = ['ALL_FARMERS', 'ALL_OWNERS', 'ALL_USERS', 'SPECIFIC_USER'];
      if (!validTargets.includes(target)) {
        res.status(400).json({
          success: false,
          message: `Target must be one of: ${validTargets.join(', ')}`,
        });
        return;
      }

      if (target === 'SPECIFIC_USER' && (!userId || !userId.trim())) {
        res.status(400).json({
          success: false,
          message: 'User ID is required when target is SPECIFIC_USER',
        });
        return;
      }

      const result = await NotificationModel.createBroadcast({
        target,
        specificUserId: userId,
        title: title.trim(),
        message: message.trim(),
        notificationType: (notification_type as NotificationType) || 'ADMIN',
      });

      res.status(201).json({
        success: true,
        message: `Notification dispatched successfully to ${result.count} recipient(s).`,
        count: result.count,
      });
    } catch (error: any) {
      console.error('[NotificationController.adminSendNotification] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/notifications
   * Admin lists all notifications
   */
  static async adminGetAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, type } = req.query;

      const result = await NotificationModel.getAllForAdmin({
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
        search: search ? String(search) : undefined,
        type: type ? String(type) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        total: result.total,
      });
    } catch (error: any) {
      console.error('[NotificationController.adminGetAll] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve administrative notifications',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/admin/notifications/:id
   * Admin deletes notification by ID
   */
  static async adminDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await NotificationModel.adminDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted by admin',
      });
    } catch (error: any) {
      console.error('[NotificationController.adminDelete] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/notifications/preferences
   * Fetch current user's notification preferences
   */
  static async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      let pRes = await query('SELECT * FROM notification_preferences WHERE user_id = $1', [userId]);
      if (pRes.rows.length === 0) {
        const newId = `pref-${userId}`;
        pRes = await query(
          `INSERT INTO notification_preferences (id, user_id, booking_notifications, order_notifications, payment_notifications, delivery_notifications, scheme_notifications, system_notifications, created_at, updated_at)
           VALUES ($1, $2, true, true, true, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [newId, userId]
        );
      }
      res.status(200).json({
        success: true,
        data: pRes.rows[0],
      });
    } catch (error: any) {
      console.error('[NotificationController.getPreferences] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve notification preferences' });
    }
  }

  /**
   * PUT /api/notifications/preferences
   * Update current user's notification preferences
   */
  static async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        booking_notifications,
        order_notifications,
        payment_notifications,
        delivery_notifications,
        scheme_notifications,
        system_notifications,
      } = req.body;

      const pRes = await query(
        `INSERT INTO notification_preferences (id, user_id, booking_notifications, order_notifications, payment_notifications, delivery_notifications, scheme_notifications, system_notifications, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           booking_notifications = COALESCE($3, notification_preferences.booking_notifications),
           order_notifications = COALESCE($4, notification_preferences.order_notifications),
           payment_notifications = COALESCE($5, notification_preferences.payment_notifications),
           delivery_notifications = COALESCE($6, notification_preferences.delivery_notifications),
           scheme_notifications = COALESCE($7, notification_preferences.scheme_notifications),
           system_notifications = COALESCE($8, notification_preferences.system_notifications),
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          `pref-${userId}`,
          userId,
          booking_notifications ?? true,
          order_notifications ?? true,
          payment_notifications ?? true,
          delivery_notifications ?? true,
          scheme_notifications ?? true,
          system_notifications ?? true,
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: pRes.rows[0],
      });
    } catch (error: any) {
      console.error('[NotificationController.updatePreferences] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update notification preferences' });
    }
  }
}
