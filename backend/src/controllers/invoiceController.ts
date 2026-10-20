import { Response } from 'express';
import { query } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class InvoiceController {
  /**
   * GET /api/invoices
   * List invoices for authenticated user based on role:
   * - FARMER: Invoices where farmer is the payer
   * - OWNER: Invoices where owner is the recipient/seller
   * - ADMIN: All invoices across platform
   */
  static async getAll(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const invoices: any[] = [];

      // 1. Equipment Booking Invoices
      let eqSql = `
        SELECT b.id, b.total_amount, b.booking_status, b.payment_status,
               b.booking_date, b.start_time, b.end_time, b.duration_hours, b.created_at,
               eq.name as item_name, eq.category as item_category, eq.price_per_hour,
               farmer.name as customer_name, farmer.email as customer_email, farmer.phone as customer_phone,
               owner.name as provider_name, owner.email as provider_email, owner.phone as provider_phone,
               b.farmer_id, b.owner_id
        FROM equipment_bookings b
        JOIN equipment eq ON b.equipment_id = eq.id
        JOIN users farmer ON b.farmer_id = farmer.id
        JOIN users owner ON b.owner_id = owner.id
      `;
      const eqParams: any[] = [];

      if (user.role === 'FARMER') {
        eqSql += ` WHERE b.farmer_id = $1`;
        eqParams.push(user.id);
      } else if (user.role === 'OWNER') {
        eqSql += ` WHERE b.owner_id = $1`;
        eqParams.push(user.id);
      }

      eqSql += ` ORDER BY b.created_at DESC LIMIT 50`;
      const eqRes = await query(eqSql, eqParams);

      for (const row of eqRes.rows) {
        invoices.push({
          id: `INV-EQ-${row.id.substring(0, 8).toUpperCase()}`,
          raw_id: row.id,
          type: 'EQUIPMENT_RENTAL',
          type_label: 'Equipment Machinery Rental',
          item_name: row.item_name,
          category: row.item_category,
          amount: parseFloat(row.total_amount || '0'),
          status: row.payment_status === 'PAID' ? 'PAID' : row.booking_status === 'COMPLETED' ? 'PAID' : 'PENDING',
          date: row.created_at,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          provider_name: row.provider_name,
          provider_phone: row.provider_phone,
          duration: `${row.duration_hours} Hour(s)`,
          unit_rate: `₹${row.price_per_hour}/hr`,
        });
      }

      // 2. Animal Order Invoices
      let anSql = `
        SELECT o.id, o.total_amount, o.unit_price, o.quantity, o.order_status, o.payment_status, o.created_at,
               a.name as item_name, a.category as item_category, a.breed,
               buyer.name as customer_name, buyer.email as customer_email, buyer.phone as customer_phone,
               seller.name as provider_name, seller.email as provider_email, seller.phone as provider_phone,
               o.buyer_id, o.seller_id
        FROM animal_orders o
        JOIN animal_listings a ON o.listing_id = a.id
        JOIN users buyer ON o.buyer_id = buyer.id
        JOIN users seller ON o.seller_id = seller.id
      `;
      const anParams: any[] = [];

      if (user.role === 'FARMER') {
        anSql += ` WHERE o.buyer_id = $1`;
        anParams.push(user.id);
      } else if (user.role === 'OWNER') {
        anSql += ` WHERE o.seller_id = $1`;
        anParams.push(user.id);
      }

      anSql += ` ORDER BY o.created_at DESC LIMIT 50`;
      const anRes = await query(anSql, anParams);

      for (const row of anRes.rows) {
        invoices.push({
          id: `INV-AN-${row.id.substring(0, 8).toUpperCase()}`,
          raw_id: row.id,
          type: 'ANIMAL_PURCHASE',
          type_label: 'Livestock & Poultry Purchase',
          item_name: `${row.item_name} (${row.breed || row.item_category})`,
          category: row.item_category,
          amount: parseFloat(row.total_amount || '0'),
          status: row.payment_status === 'PAID' ? 'PAID' : row.order_status === 'DELIVERED' ? 'PAID' : 'PENDING',
          date: row.created_at,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          provider_name: row.provider_name,
          provider_phone: row.provider_phone,
          duration: `${row.quantity} Unit(s)`,
          unit_rate: `₹${row.unit_price}`,
        });
      }

      // 3. Service Booking Invoices (Drivers / Farm Workers)
      let srvSql = `
        SELECT sb.id, sb.total_amount, sb.booking_status, sb.payment_status, sb.service_type,
               sb.booking_date, sb.start_time, sb.end_time, sb.duration_hours, sb.created_at,
               sp.service_type, sp.price_per_day, sp.price_per_hour,
               farmer.name as customer_name, farmer.email as customer_email, farmer.phone as customer_phone,
               provider.name as provider_name, provider.email as provider_email, provider.phone as provider_phone,
               sb.farmer_id, sb.provider_id
        FROM service_bookings sb
        JOIN service_profiles sp ON sb.service_profile_id = sp.id
        JOIN users farmer ON sb.farmer_id = farmer.id
        JOIN users provider ON sb.provider_id = provider.id
      `;
      const srvParams: any[] = [];

      if (user.role === 'FARMER') {
        srvSql += ` WHERE sb.farmer_id = $1`;
        srvParams.push(user.id);
      } else if (user.role === 'OWNER') {
        srvSql += ` WHERE sb.provider_id = $1`;
        srvParams.push(user.id);
      }

      srvSql += ` ORDER BY sb.created_at DESC LIMIT 50`;
      const srvRes = await query(srvSql, srvParams);

      for (const row of srvRes.rows) {
        invoices.push({
          id: `INV-SR-${row.id.substring(0, 8).toUpperCase()}`,
          raw_id: row.id,
          type: row.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
          type_label: row.service_type === 'DRIVER' ? 'Agricultural Driver Service' : 'Farm Worker Crew Service',
          item_name: `${row.service_type === 'DRIVER' ? 'Tractor/Machinery Driver' : 'Farm Labor Team'} - ${row.provider_name}`,
          category: row.service_type,
          amount: parseFloat(row.total_amount || '0'),
          status: row.payment_status === 'PAID' ? 'PAID' : row.booking_status === 'COMPLETED' ? 'PAID' : 'PENDING',
          date: row.created_at,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          provider_name: row.provider_name,
          provider_phone: row.provider_phone,
          duration: `${row.duration_hours} Hour(s)`,
          unit_rate: `₹${row.price_per_hour}/hr`,
        });
      }

      // Sort all invoices by newest date
      invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return res.status(200).json({
        success: true,
        count: invoices.length,
        data: invoices,
      });
    } catch (error: any) {
      console.error('[InvoiceController.getAll error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoices',
      });
    }
  }

  /**
   * GET /api/invoices/:id
   * Retrieve single detailed invoice for viewing or printing
   */
  static async getById(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const rawId = req.params.id;

      // 1. Check equipment bookings
      const bRes = await query(
        `SELECT b.*, eq.name as item_name, eq.category as item_category, eq.price_per_hour,
                farmer.name as customer_name, farmer.email as customer_email, farmer.phone as customer_phone,
                fp.address as customer_address, fp.village as customer_village, fp.district as customer_district, fp.state as customer_state, fp.pincode as customer_pincode,
                owner.name as provider_name, owner.email as provider_email, owner.phone as provider_phone,
                op.address as provider_address, op.village as provider_village, op.district as provider_district, op.state as provider_state, op.pincode as provider_pincode
         FROM equipment_bookings b
         JOIN equipment eq ON b.equipment_id = eq.id
         JOIN users farmer ON b.farmer_id = farmer.id
         LEFT JOIN farmer_profiles fp ON farmer.id = fp.user_id
         JOIN users owner ON b.owner_id = owner.id
         LEFT JOIN owner_profiles op ON owner.id = op.user_id
         WHERE b.id::text ILIKE $1 OR $2 ILIKE CONCAT('%', SUBSTRING(b.id::text, 1, 8), '%')`,
        [rawId, rawId]
      );

      if (bRes.rows.length > 0) {
        const row = bRes.rows[0];
        const subtotal = parseFloat(row.total_amount || '0');
        const tax = 0; // Agricultural equipment rental is exempt under GST Section 11
        const total = subtotal;

        return res.status(200).json({
          success: true,
          data: {
            invoice_number: `INV-EQ-${row.id.substring(0, 8).toUpperCase()}`,
            transaction_id: row.id,
            type: 'EQUIPMENT_RENTAL',
            type_title: 'Tax Invoice & Rental Contract Receipt',
            issued_date: row.created_at,
            due_date: row.booking_date,
            status: row.payment_status === 'PAID' ? 'PAID' : row.booking_status === 'COMPLETED' ? 'PAID' : 'PENDING',
            payment_method: row.payment_status === 'PAID' ? 'Razorpay / Digital Transfer' : 'Direct Cash / Escrow',
            payment_reference: `PAY-${row.id.substring(0, 8).toUpperCase()}`,
            customer: {
              id: row.farmer_id,
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              address: `${row.customer_address || ''}, ${row.customer_village || ''}, ${row.customer_district || ''}, ${row.customer_state || 'Karnataka'} ${row.customer_pincode || ''}`,
            },
            provider: {
              id: row.owner_id,
              name: row.provider_name,
              business_name: 'AgroRent Registered Machinery Partner',
              email: row.provider_email,
              phone: row.provider_phone,
              address: `${row.provider_address || ''}, ${row.provider_village || ''}, ${row.provider_district || ''}, ${row.provider_state || 'Karnataka'} ${row.provider_pincode || ''}`,
            },
            items: [
              {
                description: `${row.item_name} (${row.item_category})`,
                period: `${row.booking_date} (${row.start_time} to ${row.end_time})`,
                quantity: `${row.duration_hours} Hour(s)`,
                rate: parseFloat(row.price_per_hour || '0'),
                total: subtotal,
              },
            ],
            subtotal,
            tax,
            tax_note: 'GST Exempted under Agricultural Services Exemption Notification',
            total,
            platform_name: 'AgroRent Agricultural Marketplace & Rental Platform',
            notes: 'Thank you for supporting sustainable rural mechanization. Retain this invoice for agricultural subsidy or insurance claims.',
          },
        });
      }

      // 2. Check animal orders
      const anRes = await query(
        `SELECT o.*, a.name as item_name, a.category as item_category, a.breed,
                buyer.name as customer_name, buyer.email as customer_email, buyer.phone as customer_phone,
                fp.address as customer_address, fp.village as customer_village, fp.district as customer_district, fp.state as customer_state,
                seller.name as provider_name, seller.email as provider_email, seller.phone as provider_phone,
                op.address as provider_address, op.village as provider_village, op.district as provider_district, op.state as provider_state
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         JOIN users buyer ON o.buyer_id = buyer.id
         LEFT JOIN farmer_profiles fp ON buyer.id = fp.user_id
         JOIN users seller ON o.seller_id = seller.id
         LEFT JOIN owner_profiles op ON seller.id = op.user_id
         WHERE o.id::text ILIKE $1 OR $2 ILIKE CONCAT('%', SUBSTRING(o.id::text, 1, 8), '%')`,
        [rawId, rawId]
      );

      if (anRes.rows.length > 0) {
        const row = anRes.rows[0];
        const unitPrice = parseFloat(row.unit_price || '0');
        const quantity = parseInt(row.quantity || '1', 10);
        const total = parseFloat(row.total_amount || (unitPrice * quantity).toString());

        return res.status(200).json({
          success: true,
          data: {
            invoice_number: `INV-AN-${row.id.substring(0, 8).toUpperCase()}`,
            transaction_id: row.id,
            type: 'ANIMAL_PURCHASE',
            type_title: 'Livestock Purchase Bill of Sale',
            issued_date: row.created_at,
            due_date: row.created_at,
            status: row.payment_status === 'PAID' ? 'PAID' : row.order_status === 'DELIVERED' ? 'PAID' : 'PENDING',
            payment_method: 'Escrow / Bank Transfer',
            payment_reference: `PAY-${row.id.substring(0, 8).toUpperCase()}`,
            customer: {
              id: row.buyer_id,
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              address: `${row.delivery_address || row.customer_address || ''}, ${row.delivery_city || row.customer_village || ''}, ${row.delivery_state || row.customer_state || 'Karnataka'} ${row.delivery_pincode || ''}`,
            },
            provider: {
              id: row.seller_id,
              name: row.provider_name,
              business_name: 'AgroRent Verified Livestock Seller',
              email: row.provider_email,
              phone: row.provider_phone,
              address: `${row.provider_address || ''}, ${row.provider_village || ''}, ${row.provider_district || ''}, ${row.provider_state || 'Karnataka'}`,
            },
            items: [
              {
                description: `${row.item_name} - Breed: ${row.breed || 'Indigenous'} (${row.item_category})`,
                period: 'Immediate Purchase & Transfer',
                quantity: `${quantity} Head / Unit(s)`,
                rate: unitPrice,
                total: total,
              },
            ],
            subtotal: total,
            tax: 0,
            tax_note: 'Agricultural livestock sales exempt from GST',
            total,
            platform_name: 'AgroRent Agricultural Marketplace & Rental Platform',
            notes: 'Ownership title and veterinary health records transferred to buyer.',
          },
        });
      }

      // 3. Check service bookings
      const srvRes = await query(
        `SELECT sb.*, sp.service_type, sp.price_per_day, sp.price_per_hour,
                farmer.name as customer_name, farmer.email as customer_email, farmer.phone as customer_phone,
                fp.address as customer_address, fp.village as customer_village, fp.district as customer_district, fp.state as customer_state,
                provider.name as provider_name, provider.email as provider_email, provider.phone as provider_phone,
                op.address as provider_address, op.village as provider_village, op.district as provider_district, op.state as provider_state
         FROM service_bookings sb
         JOIN service_profiles sp ON sb.service_profile_id = sp.id
         JOIN users farmer ON sb.farmer_id = farmer.id
         LEFT JOIN farmer_profiles fp ON farmer.id = fp.user_id
         JOIN users provider ON sb.provider_id = provider.id
         LEFT JOIN owner_profiles op ON provider.id = op.user_id
         WHERE sb.id::text ILIKE $1 OR $2 ILIKE CONCAT('%', SUBSTRING(sb.id::text, 1, 8), '%')`,
        [rawId, rawId]
      );

      if (srvRes.rows.length > 0) {
        const row = srvRes.rows[0];
        const subtotal = parseFloat(row.total_amount || '0');

        return res.status(200).json({
          success: true,
          data: {
            invoice_number: `INV-SR-${row.id.substring(0, 8).toUpperCase()}`,
            transaction_id: row.id,
            type: 'SERVICE_BOOKING',
            type_title: 'Agricultural Service Voucher & Payment Receipt',
            issued_date: row.created_at,
            due_date: row.booking_date,
            status: row.payment_status === 'PAID' ? 'PAID' : row.booking_status === 'COMPLETED' ? 'PAID' : 'PENDING',
            payment_method: 'Direct Settlement / UPI',
            payment_reference: `PAY-${row.id.substring(0, 8).toUpperCase()}`,
            customer: {
              id: row.farmer_id,
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              address: `${row.work_location || row.customer_address || ''}, ${row.customer_village || ''}, ${row.customer_district || ''}, ${row.customer_state || 'Karnataka'}`,
            },
            provider: {
              id: row.provider_id,
              name: row.provider_name,
              business_name: row.service_type === 'DRIVER' ? 'Certified Equipment Driver' : 'Farm Labor Crew',
              email: row.provider_email,
              phone: row.provider_phone,
              address: `${row.provider_address || ''}, ${row.provider_village || ''}, ${row.provider_district || ''}, ${row.provider_state || 'Karnataka'}`,
            },
            items: [
              {
                description: `${row.service_type === 'DRIVER' ? 'Agricultural Machinery Driver Service' : 'Farm Worker Operations Crew'}`,
                period: `${row.booking_date} (${row.start_time} to ${row.end_time})`,
                quantity: `${row.duration_hours} Hour(s)`,
                rate: parseFloat(row.price_per_hour || '0'),
                total: subtotal,
              },
            ],
            subtotal,
            tax: 0,
            total: subtotal,
            platform_name: 'AgroRent Agricultural Marketplace & Rental Platform',
            notes: 'Field labor services completed in accordance with AgroRent rural safety benchmarks.',
          },
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    } catch (error: any) {
      console.error('[InvoiceController.getById error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoice details',
      });
    }
  }
}
