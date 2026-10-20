import { query } from '../config/db.js';

export interface DateFilter {
  period?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_3_months' | 'this_year' | 'custom' | string;
  from?: string;
  to?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  periodLabel: string;
}

export class AnalyticsService {
  /**
   * Parse date filter into concrete start, end, and prior comparison date ranges.
   */
  static parseDateRange(filter: DateFilter): DateRange {
    const now = new Date();
    const period = filter.period || 'last_30_days';

    let startDate: Date;
    let endDate: Date = new Date(now.getTime());

    switch (period) {
      case 'today': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      }
      case 'yesterday': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      }
      case 'last_7_days': {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'last_30_days': {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'last_3_months': {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'this_year': {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      }
      case 'custom': {
        if (filter.from && !isNaN(Date.parse(filter.from))) {
          startDate = new Date(filter.from);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        if (filter.to && !isNaN(Date.parse(filter.to))) {
          endDate = new Date(filter.to);
        }
        break;
      }
      default: {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const durationMs = Math.max(1000, endDate.getTime() - startDate.getTime());
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

    return {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      periodLabel: period,
    };
  }

  /**
   * Helper to compute percentage delta. Returns null if comparison data is unavailable.
   */
  static calculateDelta(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  /**
   * Overall platform analytics and KPIs with comparisons
   */
  static async getOverview(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();
    const prevStartIso = range.prevStartDate.toISOString();
    const prevEndIso = range.prevEndDate.toISOString();

    // 1. Current Period Counts
    const [
      usersNow,
      usersPrev,
      bookingsNow,
      bookingsPrev,
      ordersNow,
      ordersPrev,
      paymentsNow,
      paymentsPrev,
      equipmentCount,
      animalsCount,
      activeDeliveriesRes,
      aiRequestsRes,
      revenueTrendRes,
      bookingStatusRes,
    ] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN $1 AND $2', [startIso, endIso]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN $1 AND $2', [prevStartIso, prevEndIso]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM equipment_bookings WHERE created_at BETWEEN $1 AND $2', [startIso, endIso]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM equipment_bookings WHERE created_at BETWEEN $1 AND $2', [prevStartIso, prevEndIso]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM animal_orders WHERE created_at BETWEEN $1 AND $2', [startIso, endIso]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM animal_orders WHERE created_at BETWEEN $1 AND $2', [prevStartIso, prevEndIso]),
      query<{ sum: string }>('SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE payment_status = $1 AND created_at BETWEEN $2 AND $3', ['PAID', startIso, endIso]),
      query<{ sum: string }>('SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE payment_status = $1 AND created_at BETWEEN $2 AND $3', ['PAID', prevStartIso, prevEndIso]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM equipment'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM animal_listings'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM animal_orders WHERE delivery_status IN ($1, $2, $3)', ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY']),
      query<{ count: string }>('SELECT COUNT(*) as count FROM ai_usage_logs WHERE created_at BETWEEN $1 AND $2', [startIso, endIso]),
      query<{ date: string; amount: string }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COALESCE(SUM(amount), 0) as amount 
         FROM payments 
         WHERE payment_status = 'PAID' AND created_at BETWEEN $1 AND $2
         GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
         ORDER BY date ASC`,
        [startIso, endIso]
      ),
      query<{ status: string; count: string }>(
        `SELECT booking_status as status, COUNT(*) as count 
         FROM equipment_bookings 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY booking_status`,
        [startIso, endIso]
      ),
    ]);

    const totalUsers = parseInt(usersNow.rows[0]?.count || '0', 10);
    const prevUsers = parseInt(usersPrev.rows[0]?.count || '0', 10);

    const totalBookings = parseInt(bookingsNow.rows[0]?.count || '0', 10);
    const prevBookings = parseInt(bookingsPrev.rows[0]?.count || '0', 10);

    const totalOrders = parseInt(ordersNow.rows[0]?.count || '0', 10);
    const prevOrders = parseInt(ordersPrev.rows[0]?.count || '0', 10);

    const totalRevenue = parseFloat(paymentsNow.rows[0]?.sum || '0');
    const prevRevenue = parseFloat(paymentsPrev.rows[0]?.sum || '0');

    // All-time totals
    const [allUsersRes, allFarmersRes, allOwnersRes, allRevenueRes] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'FARMER'"),
      query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'OWNER'"),
      query<{ sum: string }>("SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE payment_status = 'PAID'"),
    ]);

    return {
      period: range.periodLabel,
      dateRange: {
        start: range.startDate.toISOString(),
        end: range.endDate.toISOString(),
      },
      cards: {
        users: {
          value: totalUsers,
          delta: this.calculateDelta(totalUsers, prevUsers),
          allTime: parseInt(allUsersRes.rows[0]?.count || '0', 10),
        },
        bookings: {
          value: totalBookings,
          delta: this.calculateDelta(totalBookings, prevBookings),
        },
        orders: {
          value: totalOrders,
          delta: this.calculateDelta(totalOrders, prevOrders),
        },
        revenue: {
          value: totalRevenue,
          delta: this.calculateDelta(totalRevenue, prevRevenue),
          allTime: parseFloat(allRevenueRes.rows[0]?.sum || '0'),
        },
      },
      counts: {
        totalFarmers: parseInt(allFarmersRes.rows[0]?.count || '0', 10),
        totalOwners: parseInt(allOwnersRes.rows[0]?.count || '0', 10),
        totalEquipment: parseInt(equipmentCount.rows[0]?.count || '0', 10),
        totalAnimals: parseInt(animalsCount.rows[0]?.count || '0', 10),
        activeDeliveries: parseInt(activeDeliveriesRes.rows[0]?.count || '0', 10),
        aiRequests: parseInt(aiRequestsRes.rows[0]?.count || '0', 10),
      },
      revenueTrend: revenueTrendRes.rows.map(r => ({
        date: r.date,
        amount: parseFloat(r.amount),
      })),
      bookingStatusDistribution: bookingStatusRes.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
    };
  }

  /**
   * User analytics deep dive
   */
  static async getUsersAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [totalUsers, rolesRes, statusRes, trendRes] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      query<{ role: string; count: string }>('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      query<{ status: string; count: string }>(
        `SELECT COALESCE(status, CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END) as status, COUNT(*) as count 
         FROM users GROUP BY COALESCE(status, CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END)`
      ),
      query<{ date: string; count: string }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count 
         FROM users 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
         ORDER BY date ASC`,
        [startIso, endIso]
      ),
    ]);

    const newRegistrationsRes = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN $1 AND $2',
      [startIso, endIso]
    );

    const roleMap: Record<string, number> = {};
    for (const row of rolesRes.rows) {
      roleMap[row.role] = parseInt(row.count, 10);
    }

    const statusMap: Record<string, number> = { ACTIVE: 0, INACTIVE: 0, SUSPENDED: 0 };
    for (const row of statusRes.rows) {
      statusMap[row.status] = parseInt(row.count, 10);
    }

    return {
      totalUsers: parseInt(totalUsers.rows[0]?.count || '0', 10),
      newRegistrations: parseInt(newRegistrationsRes.rows[0]?.count || '0', 10),
      farmers: roleMap['FARMER'] || 0,
      owners: roleMap['OWNER'] || 0,
      admins: roleMap['ADMIN'] || 0,
      activeUsers: statusMap['ACTIVE'] || 0,
      inactiveUsers: statusMap['INACTIVE'] || 0,
      suspendedUsers: statusMap['SUSPENDED'] || 0,
      registrationTrend: trendRes.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count, 10),
      })),
      roleDistribution: [
        { role: 'FARMER', count: roleMap['FARMER'] || 0 },
        { role: 'OWNER', count: roleMap['OWNER'] || 0 },
        { role: 'ADMIN', count: roleMap['ADMIN'] || 0 },
      ],
    };
  }

  /**
   * Equipment analytics deep dive
   */
  static async getEquipmentAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [
      totalsRes,
      categoriesRes,
      mostBookedRes,
      hoursAndRevRes,
      avgPriceRes,
    ] = await Promise.all([
      query<{
        total: string;
        approved: string;
        pending: string;
        rejected: string;
        available: string;
        unavailable: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE approval_status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE approval_status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE approval_status = 'REJECTED') as rejected,
          COUNT(*) FILTER (WHERE availability_status = 'AVAILABLE') as available,
          COUNT(*) FILTER (WHERE availability_status = 'UNAVAILABLE') as unavailable
        FROM equipment
      `),
      query<{ category: string; count: string }>(
        `SELECT category, COUNT(*) as count FROM equipment GROUP BY category ORDER BY count DESC`
      ),
      query<{ equipment_id: string; name: string; category: string; booking_count: string; total_revenue: string }>(
        `SELECT 
          e.id as equipment_id, 
          e.name, 
          e.category, 
          COUNT(eb.id) as booking_count, 
          COALESCE(SUM(eb.total_amount), 0) as total_revenue
        FROM equipment e
        JOIN equipment_bookings eb ON e.id = eb.equipment_id
        WHERE eb.created_at BETWEEN $1 AND $2 AND eb.booking_status NOT IN ('CANCELLED', 'REJECTED')
        GROUP BY e.id, e.name, e.category
        ORDER BY booking_count DESC
        LIMIT 5`,
        [startIso, endIso]
      ),
      query<{ total_hours: string; total_rev: string }>(
        `SELECT 
          COALESCE(SUM(duration_hours), 0) as total_hours, 
          COALESCE(SUM(total_amount), 0) as total_rev
        FROM equipment_bookings
        WHERE created_at BETWEEN $1 AND $2 AND booking_status NOT IN ('CANCELLED', 'REJECTED')`,
        [startIso, endIso]
      ),
      query<{ avg_price: string }>(
        `SELECT COALESCE(AVG(price_per_hour), 0) as avg_price FROM equipment WHERE approval_status = 'APPROVED'`
      ),
    ]);

    const totalCount = parseInt(totalsRes.rows[0]?.total || '0', 10);
    const categoryBreakdown = categoriesRes.rows.map(r => {
      const count = parseInt(r.count, 10);
      const percentage = totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0;
      return { category: r.category, count, percentage };
    });

    return {
      totalEquipment: totalCount,
      approvedEquipment: parseInt(totalsRes.rows[0]?.approved || '0', 10),
      pendingEquipment: parseInt(totalsRes.rows[0]?.pending || '0', 10),
      rejectedEquipment: parseInt(totalsRes.rows[0]?.rejected || '0', 10),
      availableEquipment: parseInt(totalsRes.rows[0]?.available || '0', 10),
      unavailableEquipment: parseInt(totalsRes.rows[0]?.unavailable || '0', 10),
      averageRentalPrice: parseFloat(Number(avgPriceRes.rows[0]?.avg_price || 0).toFixed(2)),
      totalRentalHours: parseFloat(Number(hoursAndRevRes.rows[0]?.total_hours || 0).toFixed(1)),
      equipmentRevenue: parseFloat(Number(hoursAndRevRes.rows[0]?.total_rev || 0).toFixed(2)),
      categoryBreakdown,
      mostBooked: mostBookedRes.rows.map(r => ({
        id: r.equipment_id,
        name: r.name,
        category: r.category,
        bookingCount: parseInt(r.booking_count, 10),
        totalRevenue: parseFloat(r.total_revenue),
      })),
    };
  }

  /**
   * Booking analytics deep dive
   */
  static async getBookingAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [statusCountsRes, trendRes, metricsRes] = await Promise.all([
      query<{ status: string; count: string }>(
        `SELECT booking_status as status, COUNT(*) as count 
         FROM equipment_bookings 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY booking_status`,
        [startIso, endIso]
      ),
      query<{ date: string; count: string }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count 
         FROM equipment_bookings 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
         ORDER BY date ASC`,
        [startIso, endIso]
      ),
      query<{ total: string; avg_hours: string; avg_amount: string }>(
        `SELECT 
          COUNT(*) as total, 
          COALESCE(AVG(duration_hours), 0) as avg_hours, 
          COALESCE(AVG(total_amount), 0) as avg_amount 
        FROM equipment_bookings 
        WHERE created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of statusCountsRes.rows) {
      statusCounts[row.status] = parseInt(row.count, 10);
    }

    return {
      totalBookings: parseInt(metricsRes.rows[0]?.total || '0', 10),
      pending: statusCounts['PENDING'] || 0,
      confirmed: statusCounts['CONFIRMED'] || 0,
      active: statusCounts['ACTIVE'] || 0,
      completed: statusCounts['COMPLETED'] || 0,
      cancelled: statusCounts['CANCELLED'] || 0,
      rejected: statusCounts['REJECTED'] || 0,
      averageDurationHours: parseFloat(Number(metricsRes.rows[0]?.avg_hours || 0).toFixed(1)),
      averageBookingValue: parseFloat(Number(metricsRes.rows[0]?.avg_amount || 0).toFixed(2)),
      bookingTrend: trendRes.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count, 10),
      })),
      statusDistribution: statusCountsRes.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
    };
  }

  /**
   * Animal marketplace analytics deep dive
   */
  static async getAnimalAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [listingStatsRes, orderStatsRes, categoriesRes, topPurchasedRes] = await Promise.all([
      query<{
        total: string;
        approved: string;
        pending: string;
        sold: string;
        available: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE approval_status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE approval_status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE availability_status = 'SOLD') as sold,
          COUNT(*) FILTER (WHERE availability_status = 'AVAILABLE') as available
        FROM animal_listings
      `),
      query<{ total_orders: string; total_turnover: string; avg_order: string }>(
        `SELECT 
          COUNT(*) as total_orders, 
          COALESCE(SUM(total_amount), 0) as total_turnover,
          COALESCE(AVG(total_amount), 0) as avg_order
        FROM animal_orders
        WHERE created_at BETWEEN $1 AND $2 AND order_status NOT IN ('CANCELLED', 'REJECTED')`,
        [startIso, endIso]
      ),
      query<{ category: string; count: string }>(
        `SELECT category, COUNT(*) as count FROM animal_listings GROUP BY category ORDER BY count DESC LIMIT 8`
      ),
      query<{ category: string; order_count: string; sales: string }>(
        `SELECT 
          al.category, 
          COUNT(ao.id) as order_count, 
          COALESCE(SUM(ao.total_amount), 0) as sales
        FROM animal_orders ao
        JOIN animal_listings al ON ao.listing_id = al.id
        WHERE ao.created_at BETWEEN $1 AND $2 AND ao.order_status NOT IN ('CANCELLED', 'REJECTED')
        GROUP BY al.category
        ORDER BY sales DESC
        LIMIT 5`,
        [startIso, endIso]
      ),
    ]);

    return {
      totalListings: parseInt(listingStatsRes.rows[0]?.total || '0', 10),
      approvedListings: parseInt(listingStatsRes.rows[0]?.approved || '0', 10),
      pendingListings: parseInt(listingStatsRes.rows[0]?.pending || '0', 10),
      soldListings: parseInt(listingStatsRes.rows[0]?.sold || '0', 10),
      availableListings: parseInt(listingStatsRes.rows[0]?.available || '0', 10),
      totalOrders: parseInt(orderStatsRes.rows[0]?.total_orders || '0', 10),
      totalSalesTurnover: parseFloat(Number(orderStatsRes.rows[0]?.total_turnover || 0).toFixed(2)),
      averageOrderValue: parseFloat(Number(orderStatsRes.rows[0]?.avg_order || 0).toFixed(2)),
      popularCategories: categoriesRes.rows.map(r => ({
        category: r.category,
        count: parseInt(r.count, 10),
      })),
      mostPurchasedCategories: topPurchasedRes.rows.map(r => ({
        category: r.category,
        orderCount: parseInt(r.order_count, 10),
        sales: parseFloat(r.sales),
      })),
    };
  }

  /**
   * Driver and Farm Worker services analytics
   */
  static async getServiceAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [driversStatsRes, workersStatsRes, driverBookingsRes, workerBookingsRes, driverRatingRes, workerRatingRes] = await Promise.all([
      query<{ total: string; approved: string; available: string }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE approval_status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE availability_status = 'AVAILABLE') as available
        FROM service_profiles WHERE service_type = 'DRIVER'
      `),
      query<{ total: string; approved: string; available: string }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE approval_status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE availability_status = 'AVAILABLE') as available
        FROM service_profiles WHERE service_type = 'FARM_WORKER'
      `),
      query<{ total_bookings: string; completed: string; revenue: string }>(
        `SELECT 
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE booking_status = 'COMPLETED') as completed,
          COALESCE(SUM(total_amount) FILTER (WHERE booking_status NOT IN ('CANCELLED', 'REJECTED')), 0) as revenue
        FROM service_bookings
        WHERE service_type = 'DRIVER' AND created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
      query<{ total_bookings: string; completed: string; revenue: string }>(
        `SELECT 
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE booking_status = 'COMPLETED') as completed,
          COALESCE(SUM(total_amount) FILTER (WHERE booking_status NOT IN ('CANCELLED', 'REJECTED')), 0) as revenue
        FROM service_bookings
        WHERE service_type = 'FARM_WORKER' AND created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
      query<{ avg_rating: string }>(
        `SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE target_type = 'DRIVER' AND status = 'PUBLISHED'`
      ),
      query<{ avg_rating: string }>(
        `SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE target_type = 'FARM_WORKER' AND status = 'PUBLISHED'`
      ),
    ]);

    return {
      drivers: {
        total: parseInt(driversStatsRes.rows[0]?.total || '0', 10),
        approved: parseInt(driversStatsRes.rows[0]?.approved || '0', 10),
        available: parseInt(driversStatsRes.rows[0]?.available || '0', 10),
        bookings: parseInt(driverBookingsRes.rows[0]?.total_bookings || '0', 10),
        completedBookings: parseInt(driverBookingsRes.rows[0]?.completed || '0', 10),
        revenue: parseFloat(Number(driverBookingsRes.rows[0]?.revenue || 0).toFixed(2)),
        averageRating: parseFloat(Number(driverRatingRes.rows[0]?.avg_rating || 0).toFixed(1)),
      },
      farmWorkers: {
        total: parseInt(workersStatsRes.rows[0]?.total || '0', 10),
        approved: parseInt(workersStatsRes.rows[0]?.approved || '0', 10),
        available: parseInt(workersStatsRes.rows[0]?.available || '0', 10),
        bookings: parseInt(workerBookingsRes.rows[0]?.total_bookings || '0', 10),
        completedBookings: parseInt(workerBookingsRes.rows[0]?.completed || '0', 10),
        revenue: parseFloat(Number(workerBookingsRes.rows[0]?.revenue || 0).toFixed(2)),
        averageRating: parseFloat(Number(workerRatingRes.rows[0]?.avg_rating || 0).toFixed(1)),
      },
    };
  }

  /**
   * Payment analytics with method breakdowns and no secrets
   */
  static async getPaymentAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [statusRes, methodsRes, totalsRes] = await Promise.all([
      query<{ status: string; count: string; sum: string }>(
        `SELECT 
          payment_status as status, 
          COUNT(*) as count, 
          COALESCE(SUM(amount), 0) as sum 
        FROM payments 
        WHERE created_at BETWEEN $1 AND $2 
        GROUP BY payment_status`,
        [startIso, endIso]
      ),
      query<{ method: string; count: string; sum: string }>(
        `SELECT 
          payment_method as method, 
          COUNT(*) as count, 
          COALESCE(SUM(amount), 0) as sum 
        FROM payments 
        WHERE created_at BETWEEN $1 AND $2 
        GROUP BY payment_method`,
        [startIso, endIso]
      ),
      query<{ total_count: string; total_amount: string }>(
        `SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0) as total_amount 
         FROM payments 
         WHERE created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
    ]);

    const statusMap: Record<string, { count: number; sum: number }> = {};
    for (const r of statusRes.rows) {
      statusMap[r.status] = { count: parseInt(r.count, 10), sum: parseFloat(r.sum) };
    }

    const methodMap: Record<string, { count: number; sum: number }> = {};
    for (const r of methodsRes.rows) {
      methodMap[r.method] = { count: parseInt(r.count, 10), sum: parseFloat(r.sum) };
    }

    const totalCount = parseInt(totalsRes.rows[0]?.total_count || '0', 10);
    const paidCount = (statusMap['PAID']?.count || 0);
    const successRate = totalCount > 0 ? Number(((paidCount / totalCount) * 100).toFixed(1)) : 0;

    return {
      totalAmount: parseFloat(Number(totalsRes.rows[0]?.total_amount || 0).toFixed(2)),
      totalTransactions: totalCount,
      successRate,
      successful: {
        count: statusMap['PAID']?.count || 0,
        amount: statusMap['PAID']?.sum || 0,
      },
      pending: {
        count: (statusMap['PENDING']?.count || 0) + (statusMap['CASH_PENDING']?.count || 0) + (statusMap['PROCESSING']?.count || 0),
        amount: (statusMap['PENDING']?.sum || 0) + (statusMap['CASH_PENDING']?.sum || 0) + (statusMap['PROCESSING']?.sum || 0),
      },
      failed: {
        count: statusMap['FAILED']?.count || 0,
        amount: statusMap['FAILED']?.sum || 0,
      },
      refunded: {
        count: statusMap['REFUNDED']?.count || 0,
        amount: statusMap['REFUNDED']?.sum || 0,
      },
      methods: {
        razorpay: {
          count: methodMap['RAZORPAY']?.count || 0,
          amount: methodMap['RAZORPAY']?.sum || 0,
        },
        upi: {
          count: methodMap['UPI']?.count || 0,
          amount: methodMap['UPI']?.sum || 0,
        },
        cash: {
          count: methodMap['CASH']?.count || 0,
          amount: methodMap['CASH']?.sum || 0,
        },
      },
    };
  }

  /**
   * Revenue analytics: Gross Transaction Value vs Platform Revenue
   */
  static async getRevenueAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [typesRes, trendRes] = await Promise.all([
      query<{ payment_type: string; total: string; count: string }>(
        `SELECT 
          payment_type, 
          COALESCE(SUM(amount), 0) as total, 
          COUNT(*) as count 
        FROM payments 
        WHERE payment_status = 'PAID' AND created_at BETWEEN $1 AND $2 
        GROUP BY payment_type`,
        [startIso, endIso]
      ),
      query<{ date: string; amount: string }>(
        `SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') as date, 
          COALESCE(SUM(amount), 0) as amount 
        FROM payments 
        WHERE payment_status = 'PAID' AND created_at BETWEEN $1 AND $2 
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
        ORDER BY date ASC`,
        [startIso, endIso]
      ),
    ]);

    const typeMap: Record<string, number> = {};
    let gtv = 0;
    for (const r of typesRes.rows) {
      const amount = parseFloat(r.total);
      typeMap[r.payment_type] = amount;
      gtv += amount;
    }

    // Platform revenue calculation: Platform operates at 0% default take rate or configured commission
    const platformCommissionRate = 0.0; // 0% direct platform fee
    const platformRevenue = gtv * platformCommissionRate;

    return {
      grossTransactionValue: parseFloat(gtv.toFixed(2)),
      platformRevenue: parseFloat(platformRevenue.toFixed(2)),
      commissionNote: 'Platform currently facilitates 100% direct payouts to owners and service providers with zero commission fee.',
      breakdown: {
        equipment: typeMap['EQUIPMENT'] || 0,
        animalOrders: typeMap['ANIMAL_ORDER'] || 0,
        drivers: typeMap['DRIVER'] || 0,
        farmWorkers: typeMap['FARM_WORKER'] || 0,
      },
      timeline: trendRes.rows.map(r => ({
        date: r.date,
        amount: parseFloat(r.amount),
      })),
    };
  }

  /**
   * Deliveries & GPS tracking analytics
   */
  static async getDeliveryAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [statusRes, activeDriversRes, avgCompletionRes] = await Promise.all([
      query<{ status: string; count: string }>(
        `SELECT 
          COALESCE(delivery_status, 'PENDING') as status, 
          COUNT(*) as count 
        FROM animal_orders 
        WHERE created_at BETWEEN $1 AND $2 
        GROUP BY delivery_status`,
        [startIso, endIso]
      ),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT driver_id) as count 
         FROM delivery_tracking 
         WHERE created_at >= NOW() - INTERVAL '24 hours'`
      ),
      query<{ avg_hours: string }>(
        `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 3600), 0) as avg_hours 
         FROM animal_orders 
         WHERE delivery_status = 'DELIVERED' AND delivered_at IS NOT NULL AND created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
    ]);

    const statusMap: Record<string, number> = {};
    let total = 0;
    for (const r of statusRes.rows) {
      const count = parseInt(r.count, 10);
      statusMap[r.status] = count;
      total += count;
    }

    const activeCount =
      (statusMap['PACKED'] || 0) + (statusMap['SHIPPED'] || 0) + (statusMap['OUT_FOR_DELIVERY'] || 0);

    return {
      totalDeliveries: total,
      pending: statusMap['PENDING'] || 0,
      packed: statusMap['PACKED'] || 0,
      shipped: statusMap['SHIPPED'] || 0,
      outForDelivery: statusMap['OUT_FOR_DELIVERY'] || 0,
      delivered: statusMap['DELIVERED'] || 0,
      cancelled: statusMap['CANCELLED'] || 0,
      activeDeliveries: activeCount,
      activeDriversTracking: parseInt(activeDriversRes.rows[0]?.count || '0', 10),
      averageDeliveryHours: parseFloat(Number(avgCompletionRes.rows[0]?.avg_hours || 0).toFixed(1)),
      statusDistribution: statusRes.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
    };
  }

  /**
   * AI Assistant analytics from ai_usage_logs
   */
  static async getAiAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [statsRes, typesRes, trendRes] = await Promise.all([
      query<{
        total: string;
        successful: string;
        failed: string;
        avg_time: string;
        total_tokens: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = true) as successful,
          COUNT(*) FILTER (WHERE success = false) as failed,
          COALESCE(AVG(response_time_ms), 0) as avg_time,
          COALESCE(SUM(prompt_tokens + completion_tokens), 0) as total_tokens
        FROM ai_usage_logs
        WHERE created_at BETWEEN $1 AND $2
      `, [startIso, endIso]),
      query<{ request_type: string; count: string }>(
        `SELECT request_type, COUNT(*) as count 
         FROM ai_usage_logs 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY request_type 
         ORDER BY count DESC`,
        [startIso, endIso]
      ),
      query<{ date: string; count: string }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count 
         FROM ai_usage_logs 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
         ORDER BY date ASC`,
        [startIso, endIso]
      ),
    ]);

    const total = parseInt(statsRes.rows[0]?.total || '0', 10);
    const successful = parseInt(statsRes.rows[0]?.successful || '0', 10);
    const failed = parseInt(statsRes.rows[0]?.failed || '0', 10);

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTimeMs: Math.round(parseFloat(statsRes.rows[0]?.avg_time || '0')),
      totalTokensConsumed: parseInt(statsRes.rows[0]?.total_tokens || '0', 10),
      byType: typesRes.rows.map(r => ({
        type: r.request_type,
        count: parseInt(r.count, 10),
      })),
      dailyTrend: trendRes.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count, 10),
      })),
    };
  }

  /**
   * Reviews & Ratings analytics
   */
  static async getReviewAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [totalsRes, starsRes, statusRes] = await Promise.all([
      query<{ total: string; avg_rating: string }>(
        `SELECT COUNT(*) as total, COALESCE(AVG(rating), 0) as avg_rating 
         FROM reviews 
         WHERE created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
      query<{ rating: string; count: string }>(
        `SELECT rating, COUNT(*) as count 
         FROM reviews 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY rating 
         ORDER BY rating DESC`,
        [startIso, endIso]
      ),
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count 
         FROM reviews 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY status`,
        [startIso, endIso]
      ),
    ]);

    const starMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of starsRes.rows) {
      starMap[parseInt(r.rating, 10)] = parseInt(r.count, 10);
    }

    const statusMap: Record<string, number> = {};
    for (const r of statusRes.rows) {
      statusMap[r.status] = parseInt(r.count, 10);
    }

    return {
      totalReviews: parseInt(totalsRes.rows[0]?.total || '0', 10),
      averageRating: parseFloat(Number(totalsRes.rows[0]?.avg_rating || 0).toFixed(1)),
      starDistribution: [
        { star: 5, count: starMap[5] || 0 },
        { star: 4, count: starMap[4] || 0 },
        { star: 3, count: starMap[3] || 0 },
        { star: 2, count: starMap[2] || 0 },
        { star: 1, count: starMap[1] || 0 },
      ],
      published: statusMap['PUBLISHED'] || 0,
      hidden: statusMap['HIDDEN'] || 0,
      reported: statusMap['REPORTED'] || 0,
    };
  }

  /**
   * Notification statistics
   */
  static async getNotificationAnalytics(filter: DateFilter) {
    const range = this.parseDateRange(filter);
    const startIso = range.startDate.toISOString();
    const endIso = range.endDate.toISOString();

    const [totalsRes, typesRes] = await Promise.all([
      query<{ total: string; unread: string }>(
        `SELECT 
          COUNT(*) as total, 
          COUNT(*) FILTER (WHERE is_read = false) as unread 
        FROM notifications 
        WHERE created_at BETWEEN $1 AND $2`,
        [startIso, endIso]
      ),
      query<{ notification_type: string; count: string }>(
        `SELECT notification_type, COUNT(*) as count 
         FROM notifications 
         WHERE created_at BETWEEN $1 AND $2 
         GROUP BY notification_type 
         ORDER BY count DESC`,
        [startIso, endIso]
      ),
    ]);

    const total = parseInt(totalsRes.rows[0]?.total || '0', 10);
    const unread = parseInt(totalsRes.rows[0]?.unread || '0', 10);

    return {
      total,
      unread,
      read: total - unread,
      byType: typesRes.rows.map(r => ({
        type: r.notification_type,
        count: parseInt(r.count, 10),
      })),
    };
  }
}
