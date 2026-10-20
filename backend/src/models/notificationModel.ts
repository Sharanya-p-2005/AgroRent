import crypto from 'crypto';
import { query } from '../config/db.js';

export type NotificationType =
  | 'BOOKING'
  | 'ORDER'
  | 'PAYMENT'
  | 'EQUIPMENT'
  | 'SERVICE'
  | 'ANIMAL'
  | 'SCHEME'
  | 'ADMIN'
  | 'SYSTEM';

export type ReferenceType =
  | 'EQUIPMENT_BOOKING'
  | 'ANIMAL_ORDER'
  | 'DRIVER_BOOKING'
  | 'WORKER_BOOKING'
  | 'PAYMENT'
  | 'EQUIPMENT'
  | 'ANIMAL'
  | 'SERVICE'
  | 'SCHEME'
  | 'NONE';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  reference_type: ReferenceType;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  notificationType?: NotificationType;
  referenceType?: ReferenceType;
  referenceId?: string | null;
}

export class NotificationModel {
  /**
   * Create a new notification for a specific user
   */
  static async create(params: CreateNotificationParams): Promise<NotificationItem> {
    const id = crypto.randomUUID();
    const notificationType = params.notificationType || 'SYSTEM';
    const referenceType = params.referenceType || 'NONE';
    const referenceId = params.referenceId || null;

    const sql = `
      INSERT INTO notifications (
        id, user_id, title, message, notification_type, reference_type, reference_id, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const res = await query(sql, [
      id,
      params.userId,
      params.title,
      params.message,
      notificationType,
      referenceType,
      referenceId,
    ]);

    return res.rows[0];
  }

  /**
   * Fetch paginated notifications for a user
   */
  static async findForUser(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean; type?: string } = {}
  ): Promise<{ notifications: NotificationItem[]; total: number; unreadCount: number }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    const queryParams: any[] = [userId];

    if (options.unreadOnly) {
      whereClause += ' AND is_read = false';
    }

    if (options.type && options.type !== 'ALL') {
      queryParams.push(options.type);
      whereClause += ` AND notification_type = $${queryParams.length}`;
    }

    const countSql = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
    const countRes = await query(countSql, queryParams);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const unreadCountRes = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    const unreadCount = parseInt(unreadCountRes.rows[0]?.count || '0', 10);

    const fetchSql = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const fetchParams = [...queryParams, limit, offset];
    const fetchRes = await query(fetchSql, fetchParams);

    return {
      notifications: fetchRes.rows,
      total,
      unreadCount,
    };
  }

  /**
   * Count unread notifications for a user
   */
  static async countUnread(userId: string): Promise<number> {
    const res = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  /**
   * Mark a single notification as read (strictly enforced for user)
   */
  static async markAsRead(id: string, userId: string): Promise<NotificationItem | null> {
    const res = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Mark all unread notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const res = await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id`,
      [userId]
    );
    return res.rowCount || 0;
  }

  /**
   * Delete a notification (strictly enforced for user)
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Admin broadcast: create notifications for multiple users
   */
  static async createBroadcast(params: {
    target: 'ALL_FARMERS' | 'ALL_OWNERS' | 'ALL_USERS' | 'SPECIFIC_USER';
    specificUserId?: string;
    title: string;
    message: string;
    notificationType?: NotificationType;
    referenceType?: ReferenceType;
    referenceId?: string | null;
  }): Promise<{ count: number }> {
    let targetUserIds: string[] = [];

    if (params.target === 'SPECIFIC_USER') {
      if (!params.specificUserId) {
        throw new Error('specificUserId is required when target is SPECIFIC_USER');
      }
      targetUserIds = [params.specificUserId];
    } else if (params.target === 'ALL_FARMERS') {
      const res = await query(`SELECT id FROM users WHERE role = 'FARMER' AND is_active = true`);
      targetUserIds = res.rows.map((r: any) => r.id);
    } else if (params.target === 'ALL_OWNERS') {
      const res = await query(`SELECT id FROM users WHERE role = 'OWNER' AND is_active = true`);
      targetUserIds = res.rows.map((r: any) => r.id);
    } else if (params.target === 'ALL_USERS') {
      const res = await query(`SELECT id FROM users WHERE is_active = true`);
      targetUserIds = res.rows.map((r: any) => r.id);
    }

    if (targetUserIds.length === 0) {
      return { count: 0 };
    }

    for (const uId of targetUserIds) {
      const notifId = crypto.randomUUID();
      await query(
        `INSERT INTO notifications (
          id, user_id, title, message, notification_type, reference_type, reference_id, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP)`,
        [
          notifId,
          uId,
          params.title,
          params.message,
          params.notificationType || 'ADMIN',
          params.referenceType || 'NONE',
          params.referenceId || null,
        ]
      );
    }

    return { count: targetUserIds.length };
  }

  /**
   * Admin: Get all notifications across system with user details
   */
  static async getAllForAdmin(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  } = {}): Promise<{ notifications: any[]; total: number }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (options.type && options.type !== 'ALL') {
      queryParams.push(options.type);
      whereConditions.push(`n.notification_type = $${queryParams.length}`);
    }

    if (options.search && options.search.trim()) {
      queryParams.push(`%${options.search.trim()}%`);
      whereConditions.push(
        `(n.title ILIKE $${queryParams.length} OR n.message ILIKE $${queryParams.length} OR u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length})`
      );
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ${whereClause}
    `;
    const countRes = await query(countSql, queryParams);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const fetchSql = `
      SELECT n.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const fetchParams = [...queryParams, limit, offset];
    const fetchRes = await query(fetchSql, fetchParams);

    return {
      notifications: fetchRes.rows,
      total,
    };
  }

  /**
   * Admin delete notification by ID
   */
  static async adminDelete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM notifications WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Total notification counts for admin stats
   */
  static async getStats(): Promise<{ total: number; unread: number }> {
    const res = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread
      FROM notifications
    `);
    return {
      total: parseInt(res.rows[0]?.total || '0', 10),
      unread: parseInt(res.rows[0]?.unread || '0', 10),
    };
  }
}
