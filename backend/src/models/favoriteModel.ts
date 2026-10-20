import crypto from 'crypto';
import { query } from '../config/db.js';

export type FavoriteItemType = 'EQUIPMENT' | 'ANIMAL' | 'DRIVER' | 'FARM_WORKER' | 'SCHEME';

export interface FavoriteRecord {
  id: string;
  user_id: string;
  item_type: FavoriteItemType;
  item_id: string;
  created_at: string;
}

export interface EnrichedFavorite extends FavoriteRecord {
  item: {
    id: string;
    name: string;
    title?: string;
    category?: string;
    image_url?: string;
    price?: number;
    price_unit?: string;
    location?: string;
    rating?: number;
    review_count?: number;
    details_route: string;
  } | null;
}

export class FavoriteModel {
  /**
   * Check if an item exists and is active/valid for favoriting
   */
  static async validateItemExists(
    itemType: FavoriteItemType,
    itemId: string
  ): Promise<{ valid: boolean; name?: string; message?: string }> {
    switch (itemType) {
      case 'EQUIPMENT': {
        const res = await query(
          `SELECT id, name, approval_status, availability_status FROM equipment WHERE id = $1`,
          [itemId]
        );
        if (res.rows.length === 0) {
          return { valid: false, message: 'Equipment not found' };
        }
        if (res.rows[0].approval_status !== 'APPROVED') {
          return { valid: false, message: 'This equipment is pending approval or unavailable' };
        }
        return { valid: true, name: res.rows[0].name };
      }
      case 'ANIMAL': {
        const res = await query(
          `SELECT id, name, approval_status, availability_status FROM animal_listings WHERE id = $1`,
          [itemId]
        );
        if (res.rows.length === 0) {
          return { valid: false, message: 'Animal listing not found' };
        }
        if (res.rows[0].approval_status !== 'APPROVED') {
          return { valid: false, message: 'This animal listing is not currently approved' };
        }
        return { valid: true, name: res.rows[0].name };
      }
      case 'DRIVER': {
        const res = await query(
          `SELECT id, name, approval_status FROM service_profiles WHERE id = $1 AND service_type = 'DRIVER'`,
          [itemId]
        );
        if (res.rows.length === 0) {
          return { valid: false, message: 'Driver profile not found' };
        }
        if (res.rows[0].approval_status !== 'APPROVED') {
          return { valid: false, message: 'This driver profile is not currently approved' };
        }
        return { valid: true, name: res.rows[0].name };
      }
      case 'FARM_WORKER': {
        const res = await query(
          `SELECT id, name, approval_status FROM service_profiles WHERE id = $1 AND service_type = 'FARM_WORKER'`,
          [itemId]
        );
        if (res.rows.length === 0) {
          return { valid: false, message: 'Farm worker profile not found' };
        }
        if (res.rows[0].approval_status !== 'APPROVED') {
          return { valid: false, message: 'This farm worker profile is not currently approved' };
        }
        return { valid: true, name: res.rows[0].name };
      }
      case 'SCHEME': {
        const res = await query(
          `SELECT id, title, status FROM government_schemes WHERE id = $1`,
          [itemId]
        );
        if (res.rows.length === 0) {
          return { valid: false, message: 'Government scheme not found' };
        }
        if (res.rows[0].status !== 'PUBLISHED') {
          return { valid: false, message: 'This scheme is not currently published' };
        }
        return { valid: true, name: res.rows[0].title };
      }
      default:
        return { valid: false, message: 'Invalid item type' };
    }
  }

  /**
   * Add an item to user's favorites
   */
  static async addFavorite(
    userId: string,
    itemType: FavoriteItemType,
    itemId: string
  ): Promise<{ favorite: FavoriteRecord; created: boolean }> {
    // Check if already favorited
    const existing = await query(
      `SELECT * FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
      [userId, itemType, itemId]
    );

    if (existing.rows.length > 0) {
      return { favorite: existing.rows[0], created: false };
    }

    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO favorites (id, user_id, item_type, item_id, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, itemType, itemId]
    );

    return { favorite: res.rows[0], created: true };
  }

  /**
   * Remove item from user's favorites
   */
  static async removeFavorite(
    userId: string,
    itemType: FavoriteItemType,
    itemId: string
  ): Promise<boolean> {
    const res = await query(
      `DELETE FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3 RETURNING id`,
      [userId, itemType, itemId]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Check if an item is favorited by user
   */
  static async isFavorited(
    userId: string,
    itemType: FavoriteItemType,
    itemId: string
  ): Promise<boolean> {
    const res = await query(
      `SELECT 1 FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3 LIMIT 1`,
      [userId, itemType, itemId]
    );
    return res.rows.length > 0;
  }

  /**
   * Get all favorites for a user with enriched metadata
   */
  static async getUserFavorites(
    userId: string,
    typeFilter?: string
  ): Promise<EnrichedFavorite[]> {
    let sql = `SELECT * FROM favorites WHERE user_id = $1`;
    const params: any[] = [userId];

    if (typeFilter && typeFilter !== 'ALL') {
      params.push(typeFilter);
      sql += ` AND item_type = $2`;
    }

    sql += ` ORDER BY created_at DESC`;

    const res = await query(sql, params);
    const rawFavorites: FavoriteRecord[] = res.rows;

    const enriched: EnrichedFavorite[] = [];

    for (const fav of rawFavorites) {
      let itemDetails: any = null;

      try {
        if (fav.item_type === 'EQUIPMENT') {
          const eqRes = await query(
            `SELECT e.id, e.name, e.category, e.image_url, e.price_per_hour, e.location,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.id) as review_count
             FROM equipment e
             LEFT JOIN reviews r ON r.target_type = 'EQUIPMENT' AND r.target_id = e.id AND r.status = 'PUBLISHED'
             WHERE e.id = $1
             GROUP BY e.id`,
            [fav.item_id]
          );
          if (eqRes.rows.length > 0) {
            const row = eqRes.rows[0];
            itemDetails = {
              id: row.id,
              name: row.name,
              category: row.category,
              image_url: row.image_url,
              price: Number(row.price_per_hour),
              price_unit: '₹/hour',
              location: row.location,
              rating: parseFloat(Number(row.avg_rating).toFixed(1)),
              review_count: parseInt(row.review_count, 10),
              details_route: `/equipment/${row.id}`,
            };
          }
        } else if (fav.item_type === 'ANIMAL') {
          const aRes = await query(
            `SELECT a.id, a.name, a.category, a.breed, a.image_url, a.price, a.location,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.id) as review_count
             FROM animal_listings a
             LEFT JOIN reviews r ON r.target_type = 'ANIMAL_SELLER' AND r.target_id = a.seller_id AND r.status = 'PUBLISHED'
             WHERE a.id = $1
             GROUP BY a.id`,
            [fav.item_id]
          );
          if (aRes.rows.length > 0) {
            const row = aRes.rows[0];
            itemDetails = {
              id: row.id,
              name: `${row.name} (${row.breed || row.category})`,
              category: row.category,
              image_url: row.image_url,
              price: Number(row.price),
              price_unit: '₹',
              location: row.location,
              rating: parseFloat(Number(row.avg_rating).toFixed(1)),
              review_count: parseInt(row.review_count, 10),
              details_route: `/animals/${row.id}`,
            };
          }
        } else if (fav.item_type === 'DRIVER' || fav.item_type === 'FARM_WORKER') {
          const sType = fav.item_type;
          const sRes = await query(
            `SELECT sp.id, sp.name, sp.service_type, sp.profile_image_url, sp.price_per_hour, sp.price_per_day, sp.location, sp.user_id,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.id) as review_count
             FROM service_profiles sp
             LEFT JOIN reviews r ON r.target_type = $2 AND r.target_id = sp.id AND r.status = 'PUBLISHED'
             WHERE sp.id = $1
             GROUP BY sp.id`,
            [fav.item_id, sType]
          );
          if (sRes.rows.length > 0) {
            const row = sRes.rows[0];
            itemDetails = {
              id: row.id,
              name: row.name,
              category: row.service_type === 'DRIVER' ? 'Tractor/Vehicle Driver' : 'Farm Laborer',
              image_url: row.profile_image_url,
              price: Number(row.price_per_hour) > 0 ? Number(row.price_per_hour) : Number(row.price_per_day),
              price_unit: Number(row.price_per_hour) > 0 ? '₹/hr' : '₹/day',
              location: row.location,
              rating: parseFloat(Number(row.avg_rating).toFixed(1)),
              review_count: parseInt(row.review_count, 10),
              details_route: row.service_type === 'DRIVER' ? `/drivers/${row.id}` : `/farm-workers/${row.id}`,
            };
          }
        } else if (fav.item_type === 'SCHEME') {
          const scRes = await query(
            `SELECT id, title, category, department, image_url, government_level, state
             FROM government_schemes
             WHERE id = $1`,
            [fav.item_id]
          );
          if (scRes.rows.length > 0) {
            const row = scRes.rows[0];
            itemDetails = {
              id: row.id,
              name: row.title,
              title: row.title,
              category: `${row.government_level} - ${row.category}`,
              image_url: row.image_url,
              location: row.state,
              details_route: `/farmer/schemes?schemeId=${row.id}`,
            };
          }
        }
      } catch (err: any) {
        console.warn(`[FavoriteModel] Error fetching details for ${fav.item_type} ${fav.item_id}:`, err.message);
      }

      // If the original item still exists in database, include it
      if (itemDetails) {
        enriched.push({
          ...fav,
          item: itemDetails,
        });
      }
    }

    return enriched;
  }
}
