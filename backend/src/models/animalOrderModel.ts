import { query, withTransaction } from '../config/db.js';
import crypto from 'crypto';

export type AnimalOrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
export type AnimalPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CASH_ON_DELIVERY';

export interface AnimalOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_status: AnimalOrderStatus;
  payment_status: AnimalPaymentStatus;
  payment_reference?: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  listing_name?: string;
  listing_category?: string;
  listing_type?: string;
  listing_breed?: string;
  listing_image_url?: string;
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
}

export interface CreateAnimalOrderInput {
  listing_id: string;
  quantity: number;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_address_id?: string;
}

export class AnimalOrderModel {
  /**
   * Create an order within an ACID database transaction.
   * Decrements listing inventory atomically and marks SOLD if quantity reaches 0.
   */
  static async createOrder(buyerId: string, input: CreateAnimalOrderInput): Promise<AnimalOrder> {
    if (!input.quantity || input.quantity <= 0) {
      const err = new Error('Order quantity must be at least 1');
      (err as any).statusCode = 400;
      throw err;
    }

    if (!input.delivery_name || !input.delivery_phone || !input.delivery_address || !input.delivery_city || !input.delivery_state || !input.delivery_pincode) {
      const err = new Error('All delivery fields are required');
      (err as any).statusCode = 400;
      throw err;
    }

    return withTransaction(async (tx) => {
      // 1. Lock and inspect listing
      const listingRes = await tx.query<any>(
        `SELECT * FROM animal_listings WHERE id = $1 FOR UPDATE`,
        [input.listing_id]
      );

      const listing = listingRes.rows[0];
      if (!listing) {
        const err = new Error('Animal or bird listing not found');
        (err as any).statusCode = 404;
        throw err;
      }

      if (listing.approval_status !== 'APPROVED') {
        const err = new Error('This listing is not currently approved for sale');
        (err as any).statusCode = 400;
        throw err;
      }

      if (listing.availability_status !== 'AVAILABLE') {
        const err = new Error('This listing is no longer available');
        (err as any).statusCode = 400;
        throw err;
      }

      if (listing.seller_id === buyerId) {
        const err = new Error('You cannot place an order for your own listing');
        (err as any).statusCode = 400;
        throw err;
      }

      const availableQty = parseInt(listing.quantity, 10) || 0;
      if (input.quantity > availableQty) {
        const err = new Error(`Requested quantity (${input.quantity}) exceeds available stock (${availableQty})`);
        (err as any).statusCode = 400;
        throw err;
      }

      const unitPrice = parseFloat(listing.price) || 0;
      const totalAmount = unitPrice * input.quantity;
      const orderId = crypto.randomUUID();

      // 2. Insert order
      const orderSql = `
        INSERT INTO animal_orders (
          id, buyer_id, seller_id, listing_id, quantity, unit_price, total_amount,
          order_status, payment_status, delivery_status, delivery_name, delivery_phone,
          delivery_address, delivery_city, delivery_state, delivery_pincode,
          delivery_latitude, delivery_longitude, delivery_address_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          'PLACED', 'PENDING', 'PENDING', $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      const orderRes = await tx.query<any>(orderSql, [
        orderId,
        buyerId,
        listing.seller_id,
        input.listing_id,
        input.quantity,
        unitPrice,
        totalAmount,
        input.delivery_name.trim(),
        input.delivery_phone.trim(),
        input.delivery_address.trim(),
        input.delivery_city.trim(),
        input.delivery_state.trim(),
        input.delivery_pincode.trim(),
        input.delivery_latitude || null,
        input.delivery_longitude || null,
        input.delivery_address_id || null,
      ]);

      // 3. Atomically decrement listing stock
      const remainingQty = availableQty - input.quantity;
      const newAvailability = remainingQty <= 0 ? 'SOLD' : 'AVAILABLE';

      await tx.query(
        `UPDATE animal_listings 
         SET quantity = $1, availability_status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [remainingQty, newAvailability, input.listing_id]
      );

      const row = orderRes.rows[0];
      return {
        ...row,
        quantity: parseInt(row.quantity, 10),
        unit_price: parseFloat(row.unit_price),
        total_amount: parseFloat(row.total_amount),
        listing_name: listing.name,
        listing_category: listing.category,
        listing_image_url: listing.image_url,
      };
    });
  }

  /**
   * Cancel order by buyer within a database transaction.
   * Restores purchased quantity back to the listing.
   */
  static async cancelOrder(orderId: string, buyerId: string): Promise<AnimalOrder> {
    return withTransaction(async (tx) => {
      // 1. Lock order
      const orderRes = await tx.query<any>(
        `SELECT o.*, a.name as listing_name, a.quantity as current_listing_qty
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         WHERE o.id = $1 FOR UPDATE`,
        [orderId]
      );

      const order = orderRes.rows[0];
      if (!order) {
        const err = new Error('Order not found');
        (err as any).statusCode = 404;
        throw err;
      }

      if (order.buyer_id !== buyerId) {
        const err = new Error('You are not authorized to cancel this order');
        (err as any).statusCode = 403;
        throw err;
      }

      if (order.order_status !== 'PLACED' && order.order_status !== 'CONFIRMED') {
        const err = new Error(`Cannot cancel order in '${order.order_status}' status. Only PLACED or CONFIRMED orders can be cancelled.`);
        (err as any).statusCode = 400;
        throw err;
      }

      // 2. Mark order as CANCELLED
      const updateOrderRes = await tx.query<any>(
        `UPDATE animal_orders
         SET order_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [orderId]
      );

      // 3. Restore quantity to listing and make it AVAILABLE if previously SOLD
      const orderQty = parseInt(order.quantity, 10) || 1;
      await tx.query(
        `UPDATE animal_listings
         SET quantity = quantity + $1,
             availability_status = CASE WHEN availability_status = 'SOLD' THEN 'AVAILABLE' ELSE availability_status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [orderQty, order.listing_id]
      );

      const row = updateOrderRes.rows[0];
      return {
        ...row,
        quantity: parseInt(row.quantity, 10),
        unit_price: parseFloat(row.unit_price),
        total_amount: parseFloat(row.total_amount),
        listing_name: order.listing_name,
      };
    });
  }

  /**
   * Owner updates order status according to strict transition rules.
   * If rejected, restores listing quantity.
   */
  static async updateOrderStatusBySeller(
    orderId: string,
    sellerId: string,
    targetStatus: 'CONFIRMED' | 'REJECTED' | 'SHIPPED' | 'DELIVERED'
  ): Promise<AnimalOrder> {
    return withTransaction(async (tx) => {
      const orderRes = await tx.query<any>(
        `SELECT o.*, a.name as listing_name
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         WHERE o.id = $1 FOR UPDATE`,
        [orderId]
      );

      const order = orderRes.rows[0];
      if (!order) {
        const err = new Error('Order not found');
        (err as any).statusCode = 404;
        throw err;
      }

      if (order.seller_id !== sellerId) {
        const err = new Error('You are not authorized to update this order');
        (err as any).statusCode = 403;
        throw err;
      }

      const currentStatus = order.order_status;

      // Validate allowed transitions
      if (targetStatus === 'CONFIRMED' && currentStatus !== 'PLACED') {
        const err = new Error(`Cannot confirm an order with status '${currentStatus}'`);
        (err as any).statusCode = 400;
        throw err;
      }

      if (targetStatus === 'REJECTED' && currentStatus !== 'PLACED') {
        const err = new Error(`Cannot reject an order with status '${currentStatus}'`);
        (err as any).statusCode = 400;
        throw err;
      }

      if (targetStatus === 'SHIPPED' && currentStatus !== 'CONFIRMED') {
        const err = new Error(`Order must be CONFIRMED before it can be marked as SHIPPED (current: '${currentStatus}')`);
        (err as any).statusCode = 400;
        throw err;
      }

      if (targetStatus === 'DELIVERED' && currentStatus !== 'SHIPPED') {
        const err = new Error(`Order must be SHIPPED before it can be marked as DELIVERED (current: '${currentStatus}')`);
        (err as any).statusCode = 400;
        throw err;
      }

      // If REJECTED, restore inventory
      if (targetStatus === 'REJECTED') {
        const orderQty = parseInt(order.quantity, 10) || 1;
        await tx.query(
          `UPDATE animal_listings
           SET quantity = quantity + $1,
               availability_status = CASE WHEN availability_status = 'SOLD' THEN 'AVAILABLE' ELSE availability_status END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [orderQty, order.listing_id]
        );
      }

      const updateRes = await tx.query<any>(
        `UPDATE animal_orders
         SET order_status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [targetStatus, orderId]
      );

      const row = updateRes.rows[0];
      return {
        ...row,
        quantity: parseInt(row.quantity, 10),
        unit_price: parseFloat(row.unit_price),
        total_amount: parseFloat(row.total_amount),
        listing_name: order.listing_name,
      };
    });
  }

  /**
   * Farmer: get all orders placed by this user.
   */
  static async getFarmerOrders(buyerId: string): Promise<AnimalOrder[]> {
    const sql = `
      SELECT 
        o.*,
        p.payment_reference,
        a.name as listing_name,
        a.category as listing_category,
        a.listing_type,
        a.breed as listing_breed,
        a.image_url as listing_image_url,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users u ON o.seller_id = u.id
      LEFT JOIN payments p ON o.id = p.animal_order_id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
    `;
    const res = await query<any>(sql, [buyerId]);
    return res.rows.map(row => ({
      ...row,
      quantity: parseInt(row.quantity, 10),
      unit_price: parseFloat(row.unit_price),
      total_amount: parseFloat(row.total_amount),
    }));
  }

  /**
   * Find single order by ID (internal/service lookup)
   */
  static async findById(orderId: string): Promise<AnimalOrder | null> {
    const sql = `
      SELECT 
        o.*,
        p.payment_reference,
        a.name as listing_name,
        a.category as listing_category,
        a.listing_type,
        a.breed as listing_breed,
        a.image_url as listing_image_url,
        a.health_status as listing_health_status,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users u ON o.seller_id = u.id
      LEFT JOIN payments p ON o.id = p.animal_order_id
      WHERE o.id = $1
    `;
    const res = await query<any>(sql, [orderId]);
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      quantity: parseInt(row.quantity, 10),
      unit_price: parseFloat(row.unit_price),
      total_amount: parseFloat(row.total_amount),
    };
  }

  /**
   * Farmer: get single order details.
   */
  static async getFarmerOrderById(orderId: string, buyerId: string): Promise<AnimalOrder | null> {
    const sql = `
      SELECT 
        o.*,
        p.payment_reference,
        a.name as listing_name,
        a.category as listing_category,
        a.listing_type,
        a.breed as listing_breed,
        a.image_url as listing_image_url,
        a.health_status as listing_health_status,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users u ON o.seller_id = u.id
      LEFT JOIN payments p ON o.id = p.animal_order_id
      WHERE o.id = $1 AND o.buyer_id = $2
    `;
    const res = await query<any>(sql, [orderId, buyerId]);
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      quantity: parseInt(row.quantity, 10),
      unit_price: parseFloat(row.unit_price),
      total_amount: parseFloat(row.total_amount),
    };
  }

  /**
   * Owner: get all orders for listings owned by this seller.
   */
  static async getOwnerOrders(sellerId: string): Promise<AnimalOrder[]> {
    const sql = `
      SELECT 
        o.*,
        a.name as listing_name,
        a.category as listing_category,
        a.listing_type,
        a.breed as listing_breed,
        a.image_url as listing_image_url,
        u.name as buyer_name,
        u.phone as buyer_phone,
        u.email as buyer_email
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
      ORDER BY o.created_at DESC
    `;
    const res = await query<any>(sql, [sellerId]);
    return res.rows.map(row => ({
      ...row,
      quantity: parseInt(row.quantity, 10),
      unit_price: parseFloat(row.unit_price),
      total_amount: parseFloat(row.total_amount),
    }));
  }

  /**
   * Admin: view all orders across the platform.
   */
  static async getAllOrdersForAdmin(filters: {
    status?: string;
    search?: string;
  } = {}): Promise<AnimalOrder[]> {
    let sql = `
      SELECT 
        o.*,
        a.name as listing_name,
        a.category as listing_category,
        a.listing_type,
        buyer.name as buyer_name,
        buyer.phone as buyer_phone,
        buyer.email as buyer_email,
        seller.name as seller_name,
        seller.phone as seller_phone,
        seller.email as seller_email
      FROM animal_orders o
      JOIN animal_listings a ON o.listing_id = a.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (filters.status && filters.status !== 'ALL') {
      sql += ` AND o.order_status = $${pIndex++}`;
      params.push(filters.status.toUpperCase());
    }

    if (filters.search) {
      sql += ` AND (
        LOWER(o.id) LIKE LOWER($${pIndex}) OR
        LOWER(a.name) LIKE LOWER($${pIndex}) OR
        LOWER(buyer.name) LIKE LOWER($${pIndex}) OR
        LOWER(seller.name) LIKE LOWER($${pIndex}) OR
        LOWER(o.delivery_city) LIKE LOWER($${pIndex})
      )`;
      params.push(`%${filters.search.trim()}%`);
      pIndex++;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const res = await query<any>(sql, params);
    return res.rows.map(row => ({
      ...row,
      quantity: parseInt(row.quantity, 10),
      unit_price: parseFloat(row.unit_price),
      total_amount: parseFloat(row.total_amount),
    }));
  }

  /**
   * Metrics for Owner Dashboard (Animal Orders).
   */
  static async getOwnerOrderStats(sellerId: string): Promise<{
    totalOrders: number;
    placedOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    const totalRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM animal_orders WHERE seller_id = $1', [sellerId]);
    const placedRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE seller_id = $1 AND order_status = 'PLACED'", [sellerId]);
    const confRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE seller_id = $1 AND order_status = 'CONFIRMED'", [sellerId]);
    const shipRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE seller_id = $1 AND order_status = 'SHIPPED'", [sellerId]);
    const delivRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE seller_id = $1 AND order_status = 'DELIVERED'", [sellerId]);
    const cancRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE seller_id = $1 AND order_status = 'CANCELLED'", [sellerId]);
    const revRes = await query<{ sum: string }>("SELECT COALESCE(SUM(total_amount), 0) as sum FROM animal_orders WHERE seller_id = $1 AND order_status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')", [sellerId]);

    return {
      totalOrders: parseInt(totalRes.rows[0]?.count || '0', 10),
      placedOrders: parseInt(placedRes.rows[0]?.count || '0', 10),
      confirmedOrders: parseInt(confRes.rows[0]?.count || '0', 10),
      shippedOrders: parseInt(shipRes.rows[0]?.count || '0', 10),
      deliveredOrders: parseInt(delivRes.rows[0]?.count || '0', 10),
      cancelledOrders: parseInt(cancRes.rows[0]?.count || '0', 10),
      totalRevenue: parseFloat(revRes.rows[0]?.sum || '0'),
    };
  }

  /**
   * Metrics for Admin Dashboard (Animal Orders).
   */
  static async getAdminOrderStats(): Promise<{
    totalOrders: number;
    placedOrders: number;
    deliveredOrders: number;
    totalTurnover: number;
  }> {
    const totalRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM animal_orders');
    const placedRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE order_status = 'PLACED'");
    const delivRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_orders WHERE order_status = 'DELIVERED'");
    const revRes = await query<{ sum: string }>("SELECT COALESCE(SUM(total_amount), 0) as sum FROM animal_orders WHERE order_status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')");

    return {
      totalOrders: parseInt(totalRes.rows[0]?.count || '0', 10),
      placedOrders: parseInt(placedRes.rows[0]?.count || '0', 10),
      deliveredOrders: parseInt(delivRes.rows[0]?.count || '0', 10),
      totalTurnover: parseFloat(revRes.rows[0]?.sum || '0'),
    };
  }
}
