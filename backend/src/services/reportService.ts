import { query } from '../config/db.js';

export interface ReportFilter {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  status?: string;
  category?: string;
  search?: string;
  format?: 'json' | 'csv';
}

export class ReportService {
  /**
   * Escape fields for CSV format according to RFC 4180
   */
  static toCsv(rows: Record<string, any>[], headers?: { key: string; label: string }[]): string {
    if (!rows || rows.length === 0) {
      if (headers && headers.length > 0) {
        return headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',') + '\r\n';
      }
      return '';
    }

    const cols = headers || Object.keys(rows[0]).map(k => ({ key: k, label: k }));
    const headerLine = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

    const lines = rows.map(row => {
      return cols
        .map(c => {
          const val = row[c.key];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    return [headerLine, ...lines].join('\r\n');
  }

  /**
   * 1. Users Report
   */
  static async getUsersReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`u.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`u.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`COALESCE(u.status, CASE WHEN u.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END) = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.category && filter.category !== 'ALL') {
      conditions.push(`u.role = $${idx++}`);
      params.push(filter.category.toUpperCase());
    }
    if (filter.search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`);
      params.push(`%${filter.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM users u ${where}`, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.role, 
        COALESCE(u.status, CASE WHEN u.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END) as status,
        COALESCE(fp.district, op.district, 'N/A') as district,
        COALESCE(fp.state, op.state, 'N/A') as state,
        TO_CHAR(u.created_at, 'YYYY-MM-DD HH24:MI:SS') as registered_at
      FROM users u
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id AND u.role = 'FARMER'
      LEFT JOIN owner_profiles op ON u.id = op.user_id AND u.role = 'OWNER'
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Account Status' },
      { key: 'district', label: 'District' },
      { key: 'state', label: 'State' },
      { key: 'registered_at', label: 'Registered At' },
    ];

    return {
      title: 'Users Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 2. Equipment Report
   */
  static async getEquipmentReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`e.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`e.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`e.approval_status = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.category && filter.category !== 'ALL') {
      conditions.push(`e.category = $${idx++}`);
      params.push(filter.category);
    }
    if (filter.search) {
      conditions.push(`(e.name ILIKE $${idx} OR e.brand ILIKE $${idx} OR e.location ILIKE $${idx} OR u.name ILIKE $${idx})`);
      params.push(`%${filter.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM equipment e JOIN users u ON e.owner_id = u.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        e.id, 
        e.name, 
        e.category, 
        e.brand, 
        e.model, 
        e.price_per_hour, 
        e.location, 
        e.availability_status, 
        e.approval_status, 
        u.name as owner_name, 
        u.phone as owner_phone,
        TO_CHAR(e.created_at, 'YYYY-MM-DD HH24:MI:SS') as listed_at
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      ${where}
      ORDER BY e.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'id', label: 'Equipment ID' },
      { key: 'name', label: 'Equipment Name' },
      { key: 'category', label: 'Category' },
      { key: 'brand', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'price_per_hour', label: 'Price Per Hour (INR)' },
      { key: 'location', label: 'Location' },
      { key: 'availability_status', label: 'Availability' },
      { key: 'approval_status', label: 'Approval Status' },
      { key: 'owner_name', label: 'Owner Name' },
      { key: 'owner_phone', label: 'Owner Phone' },
      { key: 'listed_at', label: 'Listed At' },
    ];

    return {
      title: 'Equipment Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 3. Bookings Report
   */
  static async getBookingsReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`eb.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`eb.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`eb.booking_status = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.search) {
      conditions.push(`(e.name ILIKE $${idx} OR f.name ILIKE $${idx} OR o.name ILIKE $${idx} OR eb.id ILIKE $${idx})`);
      params.push(`%${filter.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM equipment_bookings eb
       JOIN equipment e ON eb.equipment_id = e.id
       JOIN users f ON eb.farmer_id = f.id
       JOIN users o ON eb.owner_id = o.id
       ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        eb.id,
        e.name as equipment_name,
        e.category as equipment_category,
        f.name as farmer_name,
        f.phone as farmer_phone,
        o.name as owner_name,
        o.phone as owner_phone,
        TO_CHAR(eb.booking_date, 'YYYY-MM-DD') as booking_date,
        eb.start_time,
        eb.end_time,
        eb.duration_hours,
        eb.total_amount,
        eb.booking_status,
        eb.payment_status,
        TO_CHAR(eb.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM equipment_bookings eb
      JOIN equipment e ON eb.equipment_id = e.id
      JOIN users f ON eb.farmer_id = f.id
      JOIN users o ON eb.owner_id = o.id
      ${where}
      ORDER BY eb.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'id', label: 'Booking ID' },
      { key: 'equipment_name', label: 'Equipment' },
      { key: 'equipment_category', label: 'Category' },
      { key: 'farmer_name', label: 'Farmer Name' },
      { key: 'farmer_phone', label: 'Farmer Phone' },
      { key: 'owner_name', label: 'Owner Name' },
      { key: 'owner_phone', label: 'Owner Phone' },
      { key: 'booking_date', label: 'Date' },
      { key: 'start_time', label: 'Start Time' },
      { key: 'end_time', label: 'End Time' },
      { key: 'duration_hours', label: 'Hours' },
      { key: 'total_amount', label: 'Total Amount (INR)' },
      { key: 'booking_status', label: 'Status' },
      { key: 'payment_status', label: 'Payment Status' },
      { key: 'created_at', label: 'Booked On' },
    ];

    return {
      title: 'Equipment Bookings Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 4. Animal Orders Report
   */
  static async getOrdersReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`ao.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`ao.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`ao.order_status = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.search) {
      conditions.push(`(al.name ILIKE $${idx} OR b.name ILIKE $${idx} OR s.name ILIKE $${idx} OR ao.id ILIKE $${idx})`);
      params.push(`%${filter.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM animal_orders ao
       JOIN animal_listings al ON ao.listing_id = al.id
       JOIN users b ON ao.buyer_id = b.id
       JOIN users s ON ao.seller_id = s.id
       ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        ao.id,
        al.name as item_name,
        al.category,
        b.name as buyer_name,
        b.phone as buyer_phone,
        s.name as seller_name,
        s.phone as seller_phone,
        ao.quantity,
        ao.unit_price,
        ao.total_amount,
        ao.order_status,
        ao.payment_status,
        COALESCE(ao.delivery_status, 'PENDING') as delivery_status,
        ao.delivery_city,
        ao.delivery_state,
        TO_CHAR(ao.created_at, 'YYYY-MM-DD HH24:MI:SS') as order_date
      FROM animal_orders ao
      JOIN animal_listings al ON ao.listing_id = al.id
      JOIN users b ON ao.buyer_id = b.id
      JOIN users s ON ao.seller_id = s.id
      ${where}
      ORDER BY ao.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'id', label: 'Order ID' },
      { key: 'item_name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'buyer_name', label: 'Buyer' },
      { key: 'buyer_phone', label: 'Buyer Phone' },
      { key: 'seller_name', label: 'Seller' },
      { key: 'seller_phone', label: 'Seller Phone' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit_price', label: 'Unit Price (INR)' },
      { key: 'total_amount', label: 'Total Amount (INR)' },
      { key: 'order_status', label: 'Order Status' },
      { key: 'payment_status', label: 'Payment Status' },
      { key: 'delivery_status', label: 'Delivery Status' },
      { key: 'delivery_city', label: 'City' },
      { key: 'delivery_state', label: 'State' },
      { key: 'order_date', label: 'Order Date' },
    ];

    return {
      title: 'Animal Marketplace Orders Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 5. Payments Report
   */
  static async getPaymentsReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`p.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`p.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`p.payment_status = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.category && filter.category !== 'ALL') {
      conditions.push(`p.payment_type = $${idx++}`);
      params.push(filter.category.toUpperCase());
    }
    if (filter.search) {
      conditions.push(`(p.payment_reference ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${filter.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM payments p JOIN users u ON p.user_id = u.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        p.id,
        p.payment_reference,
        p.payment_type,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        u.name as payer_name,
        u.email as payer_email,
        u.phone as payer_phone,
        TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as payment_date
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'payment_reference', label: 'Payment Reference' },
      { key: 'payment_type', label: 'Service Category' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'payment_method', label: 'Method' },
      { key: 'payment_status', label: 'Status' },
      { key: 'payer_name', label: 'Payer Name' },
      { key: 'payer_email', label: 'Payer Email' },
      { key: 'payer_phone', label: 'Payer Phone' },
      { key: 'payment_date', label: 'Date & Time' },
    ];

    return {
      title: 'Payments Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 6. Deliveries Report
   */
  static async getDeliveriesReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`ao.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`ao.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`ao.delivery_status = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.search) {
      conditions.push(`(ao.delivery_name ILIKE $${idx} OR ao.delivery_city ILIKE $${idx} OR al.name ILIKE $${idx})`);
      params.push(`%${filter.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM animal_orders ao 
       JOIN animal_listings al ON ao.listing_id = al.id
       ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        ao.id as order_id,
        al.name as item_name,
        ao.delivery_name,
        ao.delivery_phone,
        ao.delivery_city,
        ao.delivery_state,
        ao.delivery_pincode,
        COALESCE(ao.delivery_status, 'PENDING') as delivery_status,
        sp.name as assigned_driver_name,
        sp.phone as assigned_driver_phone,
        TO_CHAR(ao.estimated_delivery_date, 'YYYY-MM-DD') as estimated_date,
        TO_CHAR(ao.delivered_at, 'YYYY-MM-DD HH24:MI:SS') as delivered_at,
        TO_CHAR(ao.created_at, 'YYYY-MM-DD HH24:MI:SS') as order_placed_at
      FROM animal_orders ao
      JOIN animal_listings al ON ao.listing_id = al.id
      LEFT JOIN service_profiles sp ON ao.assigned_driver_id = sp.id
      ${where}
      ORDER BY ao.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'order_id', label: 'Order ID' },
      { key: 'item_name', label: 'Item' },
      { key: 'delivery_name', label: 'Recipient Name' },
      { key: 'delivery_phone', label: 'Recipient Phone' },
      { key: 'delivery_city', label: 'City' },
      { key: 'delivery_state', label: 'State' },
      { key: 'delivery_status', label: 'Delivery Status' },
      { key: 'assigned_driver_name', label: 'Driver' },
      { key: 'assigned_driver_phone', label: 'Driver Phone' },
      { key: 'estimated_date', label: 'Estimated Delivery' },
      { key: 'delivered_at', label: 'Delivered On' },
      { key: 'order_placed_at', label: 'Order Date' },
    ];

    return {
      title: 'Deliveries Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 7. Reviews Report
   */
  static async getReviewsReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`r.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`r.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`r.status = $${idx++}`);
      params.push(filter.status.toUpperCase());
    }
    if (filter.category && filter.category !== 'ALL') {
      conditions.push(`r.target_type = $${idx++}`);
      params.push(filter.category.toUpperCase());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM reviews r JOIN users u ON r.reviewer_id = u.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        r.id,
        u.name as reviewer_name,
        r.target_type,
        r.target_id,
        r.rating,
        r.comment,
        r.status,
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') as review_date
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'id', label: 'Review ID' },
      { key: 'reviewer_name', label: 'Reviewer' },
      { key: 'target_type', label: 'Target Type' },
      { key: 'rating', label: 'Rating (1-5)' },
      { key: 'comment', label: 'Review Comment' },
      { key: 'status', label: 'Status' },
      { key: 'review_date', label: 'Date' },
    ];

    return {
      title: 'Ratings & Reviews Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }

  /**
   * 8. AI Usage Report
   */
  static async getAiReport(filter: ReportFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = filter.format === 'csv' ? 5000 : Math.min(100, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.from) {
      conditions.push(`a.created_at >= $${idx++}`);
      params.push(new Date(filter.from).toISOString());
    }
    if (filter.to) {
      conditions.push(`a.created_at <= $${idx++}`);
      params.push(new Date(filter.to).toISOString());
    }
    if (filter.category && filter.category !== 'ALL') {
      conditions.push(`a.request_type = $${idx++}`);
      params.push(filter.category);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ai_usage_logs a ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const rowsRes = await query<any>(
      `SELECT 
        a.id,
        u.name as user_name,
        u.email as user_email,
        a.request_type,
        a.model,
        a.prompt_tokens,
        a.completion_tokens,
        a.response_time_ms,
        a.success,
        a.error_message,
        TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') as requested_at
      FROM ai_usage_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    const headers = [
      { key: 'id', label: 'Log ID' },
      { key: 'user_name', label: 'User Name' },
      { key: 'user_email', label: 'User Email' },
      { key: 'request_type', label: 'Request Type' },
      { key: 'model', label: 'Model' },
      { key: 'prompt_tokens', label: 'Prompt Tokens' },
      { key: 'completion_tokens', label: 'Completion Tokens' },
      { key: 'response_time_ms', label: 'Response Time (ms)' },
      { key: 'success', label: 'Success' },
      { key: 'requested_at', label: 'Timestamp' },
    ];

    return {
      title: 'AI Usage & Telemetry Report',
      total,
      page,
      limit,
      headers,
      rows: rowsRes.rows,
      csv: () => this.toCsv(rowsRes.rows, headers),
    };
  }
}
