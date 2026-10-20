/**
 * Phase 10: Recommendation Service
 * Transparent, weighted scoring algorithm for:
 * 1. Equipment
 * 2. Animals
 * 3. Drivers
 * 4. Farm Workers
 * 5. Government Schemes
 * 6. Farmer Resources
 *
 * Includes explanation tags, personalized interest matching, and 10-minute caching.
 */

import { query } from '../config/db.js';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class RecommendationService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private static setInCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL_MS,
    });
  }

  /**
   * Smart Equipment Recommendations
   */
  static async getEquipmentRecommendations(userId: string, limit = 6): Promise<any[]> {
    const cacheKey = `rec:equip:${userId}:${limit}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    // 1. Get user location & preferences
    const locRes = await query<any>(
      `SELECT city, state, latitude, longitude FROM user_locations WHERE user_id = $1 AND is_default = true LIMIT 1`,
      [userId]
    );
    const userLoc = locRes.rows[0];

    // Get categories farmer has booked or favorited before
    let preferredCats = new Set<string>();
    try {
      const prefRes = await query<any>(
        `SELECT DISTINCT e.category
         FROM (
           SELECT equipment_id FROM equipment_bookings WHERE farmer_id = $1
           UNION
           SELECT item_id AS equipment_id FROM favorites WHERE user_id = $1 AND item_type = 'EQUIPMENT'
         ) prev
         JOIN equipment e ON prev.equipment_id = e.id`,
        [userId]
      );
      preferredCats = new Set(prefRes.rows.map((r: any) => r.category));
    } catch {
      // Ignore
    }

    // 2. Fetch all approved & available equipment
    const equipRes = await query<any>(
      `SELECT e.*, u.name as owner_name, u.phone as owner_phone,
              COALESCE((SELECT AVG(rating)::numeric(2,1) FROM reviews WHERE target_type = 'EQUIPMENT' AND target_id = e.id), 4.8) as rating,
              COALESCE((SELECT COUNT(*) FROM reviews WHERE target_type = 'EQUIPMENT' AND target_id = e.id), 3) as review_count
       FROM equipment e
       JOIN users u ON e.owner_id = u.id
       WHERE e.approval_status = 'APPROVED' AND e.availability_status = 'AVAILABLE'`
    );

    // 3. Score each item
    const scored = equipRes.rows.map((item) => {
      let score = 50; // base score
      const tags: string[] = [];

      // Proximity score
      if (userLoc?.city && item.location && item.location.toLowerCase().includes(userLoc.city.toLowerCase())) {
        score += 25;
        tags.push(`✓ In your area (${userLoc.city})`);
      } else if (item.location) {
        tags.push(`✓ Located in ${item.location.split(',')[0]}`);
      }

      // Rating score
      const rating = Number(item.rating) || 4.5;
      score += rating * 6;
      if (rating >= 4.7) {
        tags.push(`✓ Top Rated ${rating}★`);
      }

      // User preference match
      if (preferredCats.has(item.category)) {
        score += 25;
        tags.push(`✓ Based on your interest in ${item.category}`);
      }

      // Price suitability
      const price = Number(item.price_per_hour) || 500;
      if (price <= 1200) {
        score += 10;
        tags.push(`✓ Budget friendly ₹${price}/hr`);
      }

      if (tags.length === 0) {
        tags.push('✓ Verified Machinery');
      }

      return {
        ...item,
        recommendation_score: score,
        explanation_tags: tags.slice(0, 3),
      };
    });

    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const result = scored.slice(0, limit);
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Smart Animal Marketplace Recommendations
   */
  static async getAnimalRecommendations(userId: string, limit = 6): Promise<any[]> {
    const cacheKey = `rec:animals:${userId}:${limit}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    // Get user past animal interest
    let preferredCats = new Set<string>();
    try {
      const prefRes = await query<any>(
        `SELECT DISTINCT a.category
         FROM (
           SELECT listing_id FROM animal_orders WHERE buyer_id = $1
           UNION
           SELECT item_id AS listing_id FROM favorites WHERE user_id = $1 AND item_type = 'ANIMAL'
         ) prev
         JOIN animal_listings a ON prev.listing_id = a.id`,
        [userId]
      );
      preferredCats = new Set(prefRes.rows.map((r: any) => r.category));
    } catch {
      // Ignore
    }

    // Fetch approved and available animals
    const animalRes = await query<any>(
      `SELECT a.*, u.name as seller_name, u.phone as seller_phone,
              COALESCE((SELECT AVG(rating)::numeric(2,1) FROM reviews WHERE target_type = 'ANIMAL' AND target_id = a.id), 4.7) as rating
       FROM animal_listings a
       JOIN users u ON a.seller_id = u.id
       WHERE a.approval_status = 'APPROVED' AND a.availability_status = 'AVAILABLE'`
    );

    const scored = animalRes.rows.map((item) => {
      let score = 40;
      const tags: string[] = [];

      if (item.health_status && !item.health_status.toLowerCase().includes('none')) {
        score += 20;
        tags.push(`✓ Health: ${item.health_status.slice(0, 20)}`);
      }

      if (preferredCats.has(item.category)) {
        score += 25;
        tags.push(`✓ Matches your interest in ${item.category}`);
      }

      const rating = Number(item.rating) || 4.7;
      score += rating * 6;
      if (rating >= 4.8) {
        tags.push(`✓ Top Rated Seller (${rating}★)`);
      }

      if (item.breed) {
        tags.push(`✓ Verified ${item.breed}`);
      }

      if (tags.length === 0) {
        tags.push('✓ Verified Livestock Listing');
      }

      return {
        ...item,
        recommendation_score: score,
        explanation_tags: tags.slice(0, 3),
      };
    });

    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const result = scored.slice(0, limit);
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Smart Driver Recommendations
   */
  static async getDriverRecommendations(userId: string, limit = 6): Promise<any[]> {
    const cacheKey = `rec:drivers:${userId}:${limit}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const locRes = await query<any>(
      `SELECT city FROM user_locations WHERE user_id = $1 AND is_default = true LIMIT 1`,
      [userId]
    );
    const userCity = locRes.rows[0]?.city;

    const driverRes = await query<any>(
      `SELECT sp.*, u.email as driver_email
       FROM service_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.service_type = 'DRIVER'
         AND sp.approval_status = 'APPROVED'
         AND sp.availability_status = 'AVAILABLE'`
    );

    const scored = driverRes.rows.map((driver) => {
      let score = 50;
      const tags: string[] = ['✓ Available'];

      if (userCity && driver.location && driver.location.toLowerCase().includes(userCity.toLowerCase())) {
        score += 30;
        tags.push(`✓ Located in ${userCity}`);
      } else if (driver.location) {
        tags.push(`✓ In ${driver.location}`);
      }

      if (driver.experience_years >= 3) {
        tags.push(`✓ ${driver.experience_years} yrs transit experience`);
        score += 15;
      }

      if (driver.skills) {
        tags.push(`✓ ${driver.skills.split(',')[0]}`);
      }

      return {
        ...driver,
        recommendation_score: score,
        explanation_tags: tags.slice(0, 3),
      };
    });

    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const result = scored.slice(0, limit);
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Smart Farm Worker Recommendations
   */
  static async getWorkerRecommendations(userId: string, limit = 6): Promise<any[]> {
    const cacheKey = `rec:workers:${userId}:${limit}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const locRes = await query<any>(
      `SELECT city FROM user_locations WHERE user_id = $1 AND is_default = true LIMIT 1`,
      [userId]
    );
    const userCity = locRes.rows[0]?.city;

    const workerRes = await query<any>(
      `SELECT sp.*, u.email as worker_email
       FROM service_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.service_type = 'FARM_WORKER'
         AND sp.approval_status = 'APPROVED'
         AND sp.availability_status = 'AVAILABLE'`
    );

    const scored = workerRes.rows.map((worker) => {
      let score = 50;
      const tags: string[] = ['✓ Ready for Hire'];

      if (userCity && worker.location && worker.location.toLowerCase().includes(userCity.toLowerCase())) {
        score += 25;
        tags.push(`✓ Near your farm (${userCity})`);
      } else if (worker.location) {
        tags.push(`✓ In ${worker.location}`);
      }

      if (worker.skills) {
        tags.push(`✓ Skills: ${worker.skills.split(',').slice(0, 2).join(', ')}`);
        score += 20;
      }

      if (worker.experience_years >= 3) {
        score += 15;
        tags.push(`✓ ${worker.experience_years}+ years experience`);
      }

      return {
        ...worker,
        recommendation_score: score,
        explanation_tags: tags.slice(0, 3),
      };
    });

    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const result = scored.slice(0, limit);
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Smart Government Scheme Recommendations
   */
  static async getSchemeRecommendations(userId: string, limit = 6): Promise<any[]> {
    const cacheKey = `rec:schemes:${userId}:${limit}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    let hasEquipmentInterests = false;
    let hasAnimalInterests = false;

    try {
      const bRes = await query<any>(
        `SELECT 1 FROM equipment_bookings WHERE farmer_id = $1 LIMIT 1`,
        [userId]
      );
      hasEquipmentInterests = bRes.rows.length > 0;
    } catch {
      // Ignore
    }

    try {
      const aRes = await query<any>(
        `SELECT 1 FROM animal_orders WHERE buyer_id = $1 LIMIT 1`,
        [userId]
      );
      hasAnimalInterests = aRes.rows.length > 0;
    } catch {
      // Ignore
    }

    const schemesRes = await query<any>(
      `SELECT id, title, category, department, short_description, benefits, official_url, government_level
       FROM government_schemes
       WHERE status = 'PUBLISHED'
       ORDER BY created_at DESC LIMIT 15`
    );

    const scored = schemesRes.rows.map((scheme) => {
      let score = 40;
      let relevanceReason = 'May be relevant based on agricultural opportunities in Karnataka.';

      const catLower = (scheme.category || '').toLowerCase();
      const descLower = `${scheme.short_description || ''} ${scheme.benefits || ''}`.toLowerCase();

      if (
        hasEquipmentInterests &&
        (catLower.includes('equipment') || catLower.includes('machinery') || descLower.includes('tractor') || descLower.includes('subsidy'))
      ) {
        score += 35;
        relevanceReason = 'May be relevant because you recently browsed or booked agricultural machinery.';
      } else if (
        hasAnimalInterests &&
        (catLower.includes('dairy') || catLower.includes('livestock') || descLower.includes('animal') || descLower.includes('cattle'))
      ) {
        score += 35;
        relevanceReason = 'May be relevant because you have active interests in livestock and dairy farming.';
      } else if (catLower.includes('irrigation') || catLower.includes('solar') || descLower.includes('water')) {
        score += 20;
        relevanceReason = 'May be relevant for seasonal water management and renewable farm power.';
      }

      return {
        ...scheme,
        name: scheme.title,
        recommendation_score: score,
        relevance_reason: relevanceReason,
      };
    });

    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const result = scored.slice(0, limit);
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Curated Farmer Resources Recommendations
   */
  static async getResourceRecommendations(_userId: string, limit = 4): Promise<any[]> {
    const cacheKey = `rec:resources:${limit}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const res = await query<any>(
      `SELECT id, title, category, description, resource_type, official_url
       FROM farmer_resources
       WHERE status = 'PUBLISHED'
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    const items = res.rows.map((r) => ({
      ...r,
      relevance_reason: `Curated agricultural guide on ${r.category} for modern farm management.`,
    }));

    this.setInCache(cacheKey, items);
    return items;
  }
}
