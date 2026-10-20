/**
 * Phase 10: AI Prompt Engineering & Context Assembly Service
 * Grounds AI reasoning strictly in actual database records (schemes, resources, orders, locations)
 * while enforcing safety rules and language support (English & Kannada).
 */

import { query } from '../config/db.js';

export interface UserContext {
  userId: string;
  name: string;
  role: string;
  defaultLocation?: {
    label?: string;
    city?: string;
    state?: string;
    pincode?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  latestBooking?: {
    id: string;
    equipment_name: string;
    status: string;
    start_date: string;
    total_price: number;
  };
  latestAnimalOrder?: {
    id: string;
    listing_name: string;
    order_status: string;
    delivery_status: string;
    assigned_driver_name?: string;
    eta_text?: string;
  };
  favoriteCategories?: string[];
}

export class PromptService {
  /**
   * Fetch authenticated user's non-sensitive application context from the database.
   */
  static async getUserContext(userId: string): Promise<UserContext> {
    // 1. User basic info
    const userRes = await query<any>(`SELECT id, name, role FROM users WHERE id = $1`, [userId]);
    const user = userRes.rows[0] || { id: userId, name: 'Farmer', role: 'FARMER' };

    // 2. Default location
    let defaultLocation: any = undefined;
    try {
      const locRes = await query<any>(
        `SELECT label, city, state, pincode, address, latitude, longitude 
         FROM user_locations 
         WHERE user_id = $1 AND is_default = true LIMIT 1`,
        [userId]
      );
      if (locRes.rows.length > 0) {
        defaultLocation = locRes.rows[0];
      }
    } catch {
      // Ignore if table not yet queried
    }

    // 3. Latest equipment booking
    let latestBooking: any = undefined;
    try {
      const bookRes = await query<any>(
        `SELECT b.id, e.name as equipment_name, b.booking_status as status, b.booking_date, b.total_amount as total_price
         FROM equipment_bookings b
         JOIN equipment e ON b.equipment_id = e.id
         WHERE b.farmer_id = $1
         ORDER BY b.created_at DESC LIMIT 1`,
        [userId]
      );
      if (bookRes.rows.length > 0) {
        latestBooking = bookRes.rows[0];
      }
    } catch {
      // Ignore
    }

    // 4. Latest animal order & delivery
    let latestAnimalOrder: any = undefined;
    try {
      const orderRes = await query<any>(
        `SELECT o.id, a.name as listing_name, o.order_status, o.delivery_status, sp.name as assigned_driver_name
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         LEFT JOIN service_profiles sp ON o.assigned_driver_id = sp.id
         WHERE o.buyer_id = $1
         ORDER BY o.created_at DESC LIMIT 1`,
        [userId]
      );
      if (orderRes.rows.length > 0) {
        latestAnimalOrder = orderRes.rows[0];
      }
    } catch {
      // Ignore
    }

    // 5. User favorite categories
    let favoriteCategories: string[] = [];
    try {
      const favRes = await query<any>(
        `SELECT DISTINCT e.category
         FROM favorites f
         JOIN equipment e ON f.item_id = e.id
         WHERE f.user_id = $1 AND f.item_type = 'EQUIPMENT'
         LIMIT 5`,
        [userId]
      );
      favoriteCategories = favRes.rows.map((r: any) => r.category);
    } catch {
      // Ignore
    }

    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      defaultLocation,
      latestBooking,
      latestAnimalOrder,
      favoriteCategories,
    };
  }

  /**
   * Search relevant government schemes from database to ground the prompt.
   */
  static async retrieveRelevantSchemes(userQuery: string): Promise<any[]> {
    try {
      const terms = userQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (terms.length === 0) {
        const res = await query<any>(
          `SELECT id, name, category, department, benefit_summary, official_url, max_subsidy_amount
           FROM government_schemes
           WHERE status = 'ACTIVE'
           ORDER BY created_at DESC LIMIT 3`
        );
        return res.rows;
      }

      const matchRes = await query<any>(
        `SELECT id, name, category, department, benefit_summary, official_url, max_subsidy_amount
         FROM government_schemes
         WHERE status = 'ACTIVE' AND (
           name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 OR benefit_summary ILIKE $1
         )
         LIMIT 4`,
        [`%${terms[0]}%`]
      );
      return matchRes.rows;
    } catch {
      return [];
    }
  }

  /**
   * Search relevant farmer resources from database.
   */
  static async retrieveRelevantResources(userQuery: string): Promise<any[]> {
    try {
      const terms = userQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (terms.length === 0) {
        const res = await query<any>(
          `SELECT id, title, category, description, language, tags
           FROM farmer_resources
           WHERE status = 'PUBLISHED'
           ORDER BY created_at DESC LIMIT 3`
        );
        return res.rows;
      }

      const res = await query<any>(
        `SELECT id, title, category, description, language, tags
         FROM farmer_resources
         WHERE status = 'PUBLISHED' AND (
           title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
         )
         LIMIT 3`,
        [`%${terms[0]}%`]
      );
      return res.rows;
    } catch {
      return [];
    }
  }

  /**
   * Constructs the full system prompt with safety rules, context, and retrieval grounding.
   */
  static buildSystemPrompt(
    context: UserContext,
    schemes: any[] = [],
    resources: any[] = []
  ): string {
    const locStr = context.defaultLocation
      ? `${context.defaultLocation.city || 'Karnataka'}, ${context.defaultLocation.state || 'India'} (${context.defaultLocation.label || 'Farm'})`
      : 'Karnataka, India';

    const orderContext = context.latestAnimalOrder
      ? `Latest Animal Order: #${context.latestAnimalOrder.id.slice(0, 8)} (${context.latestAnimalOrder.listing_name}), Status: ${context.latestAnimalOrder.order_status}, Delivery: ${context.latestAnimalOrder.delivery_status}${context.latestAnimalOrder.assigned_driver_name ? `, Driver: ${context.latestAnimalOrder.assigned_driver_name}` : ''}`
      : 'No recent animal orders found.';

    const bookingContext = context.latestBooking
      ? `Latest Equipment Booking: #${context.latestBooking.id.slice(0, 8)} (${context.latestBooking.equipment_name}), Status: ${context.latestBooking.status}`
      : 'No recent equipment bookings found.';

    const schemesContext =
      schemes.length > 0
        ? schemes
            .map(
              (s, i) =>
                `${i + 1}. ${s.name} (${s.category}): ${s.benefit_summary || ''} - Official URL: ${s.official_url || 'Available on official state portal'}`
            )
            .join('\n')
        : 'No specific government schemes matching this query.';

    const resourcesContext =
      resources.length > 0
        ? resources
            .map((r, i) => `${i + 1}. "${r.title}" (${r.category}): ${r.description}`)
            .join('\n')
        : 'No specific curated resources retrieved.';

    return `You are "AgroRent AI", the smart farming assistant for AgroRent - an Indian agricultural equipment rental, livestock marketplace, and farm services platform.
You are assisting ${context.name} (Role: ${context.role}), located in ${locStr}.

=== STRICT SAFETY & ACCURACY RULES ===
1. SOURCE OF TRUTH: The AgroRent database is your ONLY source of truth for orders, bookings, payments, and schemes. NEVER invent or fabricate prices, equipment availability, delivery ETAs, booking statuses, or payment states.
2. If data is not found in database, say: "I couldn't retrieve this information from your account. Please check your Orders or Bookings dashboard."
3. DISTINCTION: Always clearly differentiate between:
   - "General agricultural guidance" (educational advice on soil, irrigation, weather, crop cycles)
   - "Official government information" (published schemes from state/central govts).
4. GOVERNMENT SCHEMES: Always use "may be relevant" rather than guaranteeing eligibility. Include the official portal link when mentioning a scheme.
5. RESTRICTIONS:
   - Do NOT pretend to be a government officer or state authority.
   - Do NOT guarantee crop yields, profits, or financial investments.
   - Do NOT prescribe veterinary medicines or diagnose animal diseases with certainty.
   - Do NOT recommend banned chemicals or dangerous pesticide mixes.
   - Do NOT perform or claim to perform automatic payments, cancellations, or bookings. Always guide the user to the appropriate application page.
6. LANGUAGE: Support both English and simple Kannada (ಕನ್ನಡ). If the user writes in Kannada, reply in warm, helpful Kannada with key terms explained.

=== CURRENT USER APPLICATION STATE ===
${orderContext}
${bookingContext}

=== RETRIEVED DATABASE SCHEMES ===
${schemesContext}

=== RETRIEVED CURATED FARMER RESOURCES ===
${resourcesContext}

Respond in a concise, warm, helpful manner suitable for farmers. Keep responses clear and formatted with markdown lists or bullet points when helpful.`;
  }
}
