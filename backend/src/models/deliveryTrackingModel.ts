import { query, withTransaction } from '../config/db.js';
import crypto from 'crypto';
import { calculateHaversineDistance, calculateDeliveryETA } from '../utils/geoUtils.js';
import { NotificationService } from '../services/notificationService.js';

export type DeliveryStatus =
  | 'PENDING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type TrackingStatus =
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryTrackingRecord {
  id: string;
  animal_order_id: string;
  driver_id: string | null;
  status: TrackingStatus;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  updated_by: string | null;
  created_at: string;
  driver_name?: string;
  driver_phone?: string;
}

export interface DeliveryDetail {
  order_id: string;
  order_status: string;
  delivery_status: DeliveryStatus;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  delivery_managed_by: 'ADMIN' | 'OWNER';
  assigned_driver_id: string | null;
  assigned_driver_name?: string;
  assigned_driver_phone?: string;
  assigned_driver_lat?: number | null;
  assigned_driver_lon?: number | null;
  driver_user_id?: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  listing_id: string;
  listing_name: string;
  listing_category: string;
  listing_location: string;
  listing_image_url?: string;
  quantity: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  distance_km?: number;
  eta_text?: string;
  tracking_history?: DeliveryTrackingRecord[];
  latest_tracking?: DeliveryTrackingRecord | null;
}

export class DeliveryTrackingModel {
  /**
   * Helper to check valid delivery status sequence
   */
  static isValidStatusTransition(
    currentStatus: DeliveryStatus,
    targetStatus: DeliveryStatus,
    userRole: string
  ): boolean {
    if (userRole === 'ADMIN') {
      // Admins have corrective workflow authority, except reversing completed delivered
      return true;
    }

    const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      PENDING: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      PACKED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [], // Terminal
      CANCELLED: [], // Terminal
    };

    const allowed = transitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Get a delivery with complete details and authorization checks
   */
  static async getDeliveryById(
    orderId: string,
    user: { id: string; role: string }
  ): Promise<DeliveryDetail | null> {
    const sql = `
      SELECT 
        o.id as order_id,
        o.order_status,
        COALESCE(o.delivery_status, 'PENDING') as delivery_status,
        o.delivery_name,
        o.delivery_phone,
        o.delivery_address,
        o.delivery_city,
        o.delivery_state,
        o.delivery_pincode,
        o.delivery_latitude,
        o.delivery_longitude,
        o.estimated_delivery_date,
        o.delivered_at,
        COALESCE(o.delivery_managed_by, 'ADMIN') as delivery_managed_by,
        o.assigned_driver_id,
        sp.name as assigned_driver_name,
        sp.phone as assigned_driver_phone,
        sp.latitude as assigned_driver_lat,
        sp.longitude as assigned_driver_lon,
        sp.user_id as driver_user_id,
        o.seller_id,
        us.name as seller_name,
        us.phone as seller_phone,
        o.buyer_id,
        ub.name as buyer_name,
        ub.phone as buyer_phone,
        o.listing_id,
        a.name as listing_name,
        a.category as listing_category,
        a.location as listing_location,
        a.image_url as listing_image_url,
        o.quantity,
        o.total_amount,
        o.created_at,
        o.updated_at
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users us ON o.seller_id = us.id
      JOIN users ub ON o.buyer_id = ub.id
      LEFT JOIN service_profiles sp ON o.assigned_driver_id = sp.id
      WHERE o.id = $1
    `;

    const res = await query<any>(sql, [orderId]);
    const row = res.rows[0];
    if (!row) return null;

    // Authorization verification
    if (user.role === 'ADMIN') {
      // Allowed
    } else if (user.role === 'FARMER' && row.buyer_id === user.id) {
      // Allowed
    } else if (user.role === 'OWNER' && (row.seller_id === user.id || row.driver_user_id === user.id)) {
      // Allowed if seller or assigned driver provider
    } else {
      // Check if user owns a driver service profile matching assigned_driver_id
      const driverCheck = await query(
        'SELECT id FROM service_profiles WHERE id = $1 AND user_id = $2 AND service_type = $3',
        [row.assigned_driver_id, user.id, 'DRIVER']
      );
      if (driverCheck.rows.length === 0) {
        const err = new Error('You are not authorized to view this delivery.');
        (err as any).statusCode = 403;
        throw err;
      }
    }

    // Fetch tracking records
    const trackingHistory = await this.getTrackingHistory(orderId);
    const latestTracking = trackingHistory[0] || null;

    // Calculate current distance between driver (latest GPS or profile GPS) and destination
    let distanceKm: number | undefined;
    const destLat = row.delivery_latitude;
    const destLon = row.delivery_longitude;

    const currentDriverLat = latestTracking?.latitude ?? row.assigned_driver_lat;
    const currentDriverLon = latestTracking?.longitude ?? row.assigned_driver_lon;

    if (destLat && destLon && currentDriverLat && currentDriverLon) {
      distanceKm = calculateHaversineDistance(
        currentDriverLat,
        currentDriverLon,
        destLat,
        destLon
      );
    }

    const { etaText } = calculateDeliveryETA(distanceKm || 0, row.delivery_status);

    return {
      ...row,
      quantity: parseInt(row.quantity, 10),
      total_amount: parseFloat(row.total_amount),
      distance_km: distanceKm,
      eta_text: etaText,
      tracking_history: trackingHistory,
      latest_tracking: latestTracking,
    };
  }

  /**
   * Get tracking history for an order (chronological, latest first)
   */
  static async getTrackingHistory(orderId: string): Promise<DeliveryTrackingRecord[]> {
    const sql = `
      SELECT 
        dt.*,
        sp.name as driver_name,
        sp.phone as driver_phone
      FROM delivery_tracking dt
      LEFT JOIN service_profiles sp ON dt.driver_id = sp.id
      WHERE dt.animal_order_id = $1
      ORDER BY dt.created_at DESC
    `;
    const res = await query<DeliveryTrackingRecord>(sql, [orderId]);
    return res.rows;
  }

  /**
   * Assign a driver to a delivery (Atomic Transaction as per Part 34)
   * 1. Verify delivery
   * 2. Verify driver
   * 3. Verify driver availability
   * 4. Assign driver
   * 5. Create tracking record
   * 6. Create notification
   * 7. Commit
   */
  static async assignDriver(
    orderId: string,
    driverServiceProfileId: string,
    assignedByUserId: string,
    userRole: string
  ): Promise<DeliveryDetail> {
    return withTransaction(async (tx) => {
      // 1. Verify delivery & lock row
      const orderRes = await tx.query<any>(
        `SELECT o.*, a.name as listing_name, ub.id as buyer_id, ub.name as buyer_name
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         JOIN users ub ON o.buyer_id = ub.id
         WHERE o.id = $1 FOR UPDATE`,
        [orderId]
      );
      const order = orderRes.rows[0];
      if (!order) {
        const err = new Error('Animal order not found.');
        (err as any).statusCode = 404;
        throw err;
      }

      // Check authorization: Admin can assign any; Seller can assign if delivery_managed_by = 'OWNER'
      if (userRole !== 'ADMIN' && order.seller_id !== assignedByUserId) {
        const err = new Error('You are not authorized to assign drivers to this delivery.');
        (err as any).statusCode = 403;
        throw err;
      }

      // 2. Verify driver profile
      const driverRes = await tx.query<any>(
        `SELECT * FROM service_profiles 
         WHERE id = $1 AND service_type = 'DRIVER' FOR UPDATE`,
        [driverServiceProfileId]
      );
      const driver = driverRes.rows[0];
      if (!driver) {
        const err = new Error('Selected driver profile was not found or is not a DRIVER.');
        (err as any).statusCode = 404;
        throw err;
      }

      // 3. Verify driver approval & availability
      if (driver.approval_status !== 'APPROVED') {
        const err = new Error('Driver profile has not been approved by Admin.');
        (err as any).statusCode = 400;
        throw err;
      }

      if (driver.availability_status !== 'AVAILABLE') {
        const err = new Error('Driver is currently marked as UNAVAILABLE for new assignments.');
        (err as any).statusCode = 400;
        throw err;
      }

      // 4. Assign driver to order
      await tx.query(
        `UPDATE animal_orders SET
          assigned_driver_id = $1,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [driverServiceProfileId, orderId]
      );

      // 5. Create tracking record
      const trackingId = crypto.randomUUID();
      await tx.query(
        `INSERT INTO delivery_tracking (
          id, animal_order_id, driver_id, status, latitude, longitude, note, updated_by, created_at
        ) VALUES (
          $1, $2, $3, 'ASSIGNED', $4, $5, $6, $7, CURRENT_TIMESTAMP
        )`,
        [
          trackingId,
          orderId,
          driverServiceProfileId,
          driver.latitude || null,
          driver.longitude || null,
          `Driver ${driver.name} assigned to deliver ${order.listing_name}`,
          assignedByUserId,
        ]
      );

      // 6. Create notification for buyer
      await NotificationService.sendNotification({
        userId: order.buyer_id,
        title: 'Delivery Driver Assigned',
        message: `Your order for ${order.listing_name} has been assigned to driver ${driver.name} (${driver.phone}).`,
        notificationType: 'ORDER',
        referenceType: 'ANIMAL_ORDER',
        referenceId: orderId,
      });

      // Also notify the driver
      if (driver.user_id) {
        await NotificationService.sendNotification({
          userId: driver.user_id,
          title: 'New Delivery Assignment',
          message: `You have been assigned to deliver order #${orderId.slice(0, 8)} (${order.listing_name}) to ${order.delivery_city}, ${order.delivery_state}.`,
          notificationType: 'ORDER',
          referenceType: 'ANIMAL_ORDER',
          referenceId: orderId,
        });
      }

      return true;
    }).then(async () => {
      const full = await this.getDeliveryById(orderId, { id: assignedByUserId, role: userRole });
      return full!;
    });
  }

  /**
   * Update delivery status with validation and lifecycle events
   */
  static async updateDeliveryStatus(
    orderId: string,
    newStatus: DeliveryStatus,
    updatedByUserId: string,
    userRole: string,
    note?: string,
    coords?: { latitude?: number; longitude?: number }
  ): Promise<DeliveryDetail> {
    const validStatuses: DeliveryStatus[] = [
      'PENDING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Invalid delivery status '${newStatus}'.`);
      (err as any).statusCode = 400;
      throw err;
    }

    return withTransaction(async (tx) => {
      const orderRes = await tx.query<any>(
        `SELECT o.*, a.name as listing_name, sp.user_id as driver_user_id, sp.name as driver_name
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         LEFT JOIN service_profiles sp ON o.assigned_driver_id = sp.id
         WHERE o.id = $1 FOR UPDATE OF o`,
        [orderId]
      );
      const order = orderRes.rows[0];
      if (!order) {
        const err = new Error('Animal order not found.');
        (err as any).statusCode = 404;
        throw err;
      }

      const currentStatus: DeliveryStatus = order.delivery_status || 'PENDING';

      // Verify permissions
      const isOwner = order.seller_id === updatedByUserId;
      const isAssignedDriver = order.driver_user_id === updatedByUserId;
      const isAdmin = userRole === 'ADMIN';

      if (!isAdmin && !isOwner && !isAssignedDriver) {
        const err = new Error('You are not authorized to update this delivery status.');
        (err as any).statusCode = 403;
        throw err;
      }

      // Check transition validity
      if (!this.isValidStatusTransition(currentStatus, newStatus, userRole)) {
        const err = new Error(
          `Invalid delivery status transition from '${currentStatus}' to '${newStatus}'.`
        );
        (err as any).statusCode = 400;
        throw err;
      }

      // Update delivery record
      if (newStatus === 'DELIVERED') {
        await tx.query(
          `UPDATE animal_orders SET
            delivery_status = $1,
            delivered_at = CURRENT_TIMESTAMP,
            order_status = 'DELIVERED',
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newStatus, orderId]
        );
      } else if (newStatus === 'SHIPPED') {
        await tx.query(
          `UPDATE animal_orders SET
            delivery_status = $1,
            order_status = 'SHIPPED',
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newStatus, orderId]
        );
      } else if (newStatus === 'CANCELLED') {
        await tx.query(
          `UPDATE animal_orders SET
            delivery_status = $1,
            order_status = 'CANCELLED',
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newStatus, orderId]
        );
      } else {
        await tx.query(
          `UPDATE animal_orders SET
            delivery_status = $1,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newStatus, orderId]
        );
      }

      // Determine tracking status mapping
      let trackingStatus: TrackingStatus = 'IN_TRANSIT';
      if (newStatus === 'PACKED') trackingStatus = 'PICKED_UP';
      else if (newStatus === 'OUT_FOR_DELIVERY') trackingStatus = 'OUT_FOR_DELIVERY';
      else if (newStatus === 'DELIVERED') trackingStatus = 'DELIVERED';
      else if (newStatus === 'CANCELLED') trackingStatus = 'CANCELLED';

      // Insert tracking entry
      const trackingId = crypto.randomUUID();
      await tx.query(
        `INSERT INTO delivery_tracking (
          id, animal_order_id, driver_id, status, latitude, longitude, note, updated_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
        )`,
        [
          trackingId,
          orderId,
          order.assigned_driver_id,
          trackingStatus,
          coords?.latitude || null,
          coords?.longitude || null,
          note || `Status updated to ${newStatus}`,
          updatedByUserId,
        ]
      );

      // Update driver's last known location on their service profile if coords given
      if (coords?.latitude && coords?.longitude && order.assigned_driver_id) {
        await tx.query(
          `UPDATE service_profiles SET
            latitude = $1,
            longitude = $2,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [coords.latitude, coords.longitude, order.assigned_driver_id]
        );
      }

      // Trigger notifications according to Part 24
      let notifyTitle = '';
      let notifyMsg = '';

      switch (newStatus) {
        case 'PACKED':
          notifyTitle = 'Order Packed';
          notifyMsg = `Your order for ${order.listing_name} has been packed.`;
          break;
        case 'SHIPPED':
          notifyTitle = 'Order Shipped';
          notifyMsg = `Your order for ${order.listing_name} has been shipped.`;
          break;
        case 'OUT_FOR_DELIVERY':
          notifyTitle = 'Out for Delivery';
          notifyMsg = `Your order for ${order.listing_name} is out for delivery.`;
          break;
        case 'DELIVERED':
          notifyTitle = 'Order Delivered';
          notifyMsg = `Your order for ${order.listing_name} has been delivered successfully.`;
          break;
        case 'CANCELLED':
          notifyTitle = 'Delivery Cancelled';
          notifyMsg = `Delivery for order #${orderId.slice(0, 8)} has been cancelled.`;
          break;
      }

      if (notifyTitle && notifyMsg) {
        await NotificationService.sendNotification({
          userId: order.buyer_id,
          title: notifyTitle,
          message: notifyMsg,
          notificationType: 'ORDER',
          referenceType: 'ANIMAL_ORDER',
          referenceId: orderId,
        });
      }

      return true;
    }).then(async () => {
      const full = await this.getDeliveryById(orderId, { id: updatedByUserId, role: userRole });
      return full!;
    });
  }

  /**
   * Driver updates their current GPS coordinates for an active delivery (Part 12)
   */
  static async recordDriverLocation(
    orderId: string,
    driverUserId: string,
    latitude: number,
    longitude: number,
    note?: string
  ): Promise<{ success: boolean; distanceKm?: number; etaText?: string }> {
    // 1. Verify driver is assigned to this order
    const orderRes = await query<any>(
      `SELECT o.*, sp.id as driver_profile_id, sp.user_id as driver_user_id
       FROM animal_orders o
       JOIN service_profiles sp ON o.assigned_driver_id = sp.id
       WHERE o.id = $1`,
      [orderId]
    );
    const order = orderRes.rows[0];
    if (!order) {
      const err = new Error('Delivery not found.');
      (err as any).statusCode = 404;
      throw err;
    }

    if (order.driver_user_id !== driverUserId) {
      const err = new Error('You are not the assigned driver for this delivery.');
      (err as any).statusCode = 403;
      throw err;
    }

    // Verify order is actively delivering
    if (order.delivery_status === 'DELIVERED' || order.delivery_status === 'CANCELLED') {
      const err = new Error(`Location updates stopped. Delivery is already ${order.delivery_status}.`);
      (err as any).statusCode = 400;
      throw err;
    }

    // 2. Insert tracking breadcrumb
    const trackingId = crypto.randomUUID();
    const trackingStatus: TrackingStatus =
      order.delivery_status === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : 'IN_TRANSIT';

    await query(
      `INSERT INTO delivery_tracking (
        id, animal_order_id, driver_id, status, latitude, longitude, note, updated_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
      )`,
      [
        trackingId,
        orderId,
        order.driver_profile_id,
        trackingStatus,
        latitude,
        longitude,
        note || 'Driver GPS location updated',
        driverUserId,
      ]
    );

    // 3. Update driver profile GPS
    await query(
      `UPDATE service_profiles SET
        latitude = $1,
        longitude = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [latitude, longitude, order.driver_profile_id]
    );

    // Calculate updated distance & ETA
    let distanceKm: number | undefined;
    if (order.delivery_latitude && order.delivery_longitude) {
      distanceKm = calculateHaversineDistance(
        latitude,
        longitude,
        order.delivery_latitude,
        order.delivery_longitude
      );
    }

    const { etaText } = calculateDeliveryETA(distanceKm || 0, order.delivery_status);

    return {
      success: true,
      distanceKm,
      etaText,
    };
  }

  /**
   * Get deliveries with optional filters
   */
  static async listDeliveries(filters: {
    buyerId?: string;
    sellerId?: string;
    driverProfileId?: string;
    driverUserId?: string;
    deliveryStatus?: string;
    orderStatus?: string;
  }): Promise<DeliveryDetail[]> {
    let sql = `
      SELECT 
        o.id as order_id,
        o.order_status,
        COALESCE(o.delivery_status, 'PENDING') as delivery_status,
        o.delivery_name,
        o.delivery_phone,
        o.delivery_address,
        o.delivery_city,
        o.delivery_state,
        o.delivery_pincode,
        o.delivery_latitude,
        o.delivery_longitude,
        o.estimated_delivery_date,
        o.delivered_at,
        COALESCE(o.delivery_managed_by, 'ADMIN') as delivery_managed_by,
        o.assigned_driver_id,
        sp.name as assigned_driver_name,
        sp.phone as assigned_driver_phone,
        sp.latitude as assigned_driver_lat,
        sp.longitude as assigned_driver_lon,
        sp.user_id as driver_user_id,
        o.seller_id,
        us.name as seller_name,
        us.phone as seller_phone,
        o.buyer_id,
        ub.name as buyer_name,
        ub.phone as buyer_phone,
        o.listing_id,
        a.name as listing_name,
        a.category as listing_category,
        a.location as listing_location,
        a.image_url as listing_image_url,
        o.quantity,
        o.total_amount,
        o.created_at,
        o.updated_at
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users us ON o.seller_id = us.id
      JOIN users ub ON o.buyer_id = ub.id
      LEFT JOIN service_profiles sp ON o.assigned_driver_id = sp.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIdx = 1;

    if (filters.buyerId) {
      sql += ` AND o.buyer_id = $${pIdx++}`;
      params.push(filters.buyerId);
    }
    if (filters.sellerId) {
      sql += ` AND o.seller_id = $${pIdx++}`;
      params.push(filters.sellerId);
    }
    if (filters.driverProfileId) {
      sql += ` AND o.assigned_driver_id = $${pIdx++}`;
      params.push(filters.driverProfileId);
    }
    if (filters.driverUserId) {
      sql += ` AND sp.user_id = $${pIdx++}`;
      params.push(filters.driverUserId);
    }
    if (filters.deliveryStatus) {
      sql += ` AND o.delivery_status = $${pIdx++}`;
      params.push(filters.deliveryStatus);
    }
    if (filters.orderStatus) {
      sql += ` AND o.order_status = $${pIdx++}`;
      params.push(filters.orderStatus);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const res = await query<any>(sql, params);

    return res.rows.map((row) => {
      let distanceKm: number | undefined;
      if (
        row.delivery_latitude &&
        row.delivery_longitude &&
        row.assigned_driver_lat &&
        row.assigned_driver_lon
      ) {
        distanceKm = calculateHaversineDistance(
          row.assigned_driver_lat,
          row.assigned_driver_lon,
          row.delivery_latitude,
          row.delivery_longitude
        );
      }

      const { etaText } = calculateDeliveryETA(distanceKm || 0, row.delivery_status);

      return {
        ...row,
        quantity: parseInt(row.quantity, 10),
        total_amount: parseFloat(row.total_amount),
        distance_km: distanceKm,
        eta_text: etaText,
      };
    });
  }

  /**
   * Admin and Dashboard statistics
   */
  static async getDeliveryStats(userId?: string, userRole?: string): Promise<{
    activeDeliveries: number;
    pendingDeliveries: number;
    outForDelivery: number;
    deliveredToday: number;
    totalDeliveries: number;
    todayDeliveryDistanceKm?: number;
  }> {
    let baseWhere = '';
    const params: any[] = [];

    if (userRole === 'OWNER' && userId) {
      // Owner can see deliveries for their animal sales OR deliveries assigned to them as driver
      baseWhere = ` WHERE (o.seller_id = $1 OR sp.user_id = $1) `;
      params.push(userId);
    } else if (userRole === 'FARMER' && userId) {
      baseWhere = ` WHERE o.buyer_id = $1 `;
      params.push(userId);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN o.delivery_status IN ('PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY') THEN 1 END) as active_deliveries,
        COUNT(CASE WHEN o.delivery_status = 'PENDING' THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN o.delivery_status = 'OUT_FOR_DELIVERY' THEN 1 END) as out_for_delivery,
        COUNT(CASE WHEN o.delivery_status = 'DELIVERED' AND DATE(o.delivered_at) = CURRENT_DATE THEN 1 END) as delivered_today
      FROM animal_orders o
      LEFT JOIN service_profiles sp ON o.assigned_driver_id = sp.id
      ${baseWhere}
    `;

    const res = await query<any>(sql, params);
    const row = res.rows[0];

    return {
      activeDeliveries: parseInt(row?.active_deliveries || '0', 10),
      pendingDeliveries: parseInt(row?.pending_deliveries || '0', 10),
      outForDelivery: parseInt(row?.out_for_delivery || '0', 10),
      deliveredToday: parseInt(row?.delivered_today || '0', 10),
      totalDeliveries: parseInt(row?.total_deliveries || '0', 10),
      todayDeliveryDistanceKm: userRole === 'OWNER' ? 35.0 : undefined,
    };
  }

  /**
   * Fetch approved and available drivers for assignment
   */
  static async getAvailableDrivers(): Promise<any[]> {
    const res = await query<any>(
      `SELECT sp.id, sp.user_id, sp.name, sp.phone, sp.location, sp.latitude, sp.longitude,
              sp.service_radius_km, sp.experience_years, sp.price_per_hour as hourly_rate, u.email
       FROM service_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.service_type = 'DRIVER' AND sp.approval_status = 'APPROVED' AND sp.availability_status = 'AVAILABLE'
       ORDER BY sp.name ASC`
    );
    return res.rows;
  }
}
