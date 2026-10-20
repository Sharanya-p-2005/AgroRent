import { Request, Response } from 'express';
import { query } from '../config/db.js';

export class SearchController {
  /**
   * GET /api/search or /api/search/global
   * Query params:
   *  q: string (search keyword)
   *  type: 'all' | 'equipment' | 'animals' | 'services' | 'schemes' | 'resources'
   *  location: string
   *  minPrice: number
   *  maxPrice: number
   *  availability: boolean (default true)
   */
  static async search(req: Request, res: Response): Promise<any> {
    try {
      const q = (req.query.q as string || '').trim();
      const type = (req.query.type as string || 'all').toLowerCase();
      const location = (req.query.location as string || '').trim();
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : null;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : null;
      const keywordPattern = q ? `%${q}%` : '%';
      const locPattern = location ? `%${location}%` : '%';

      const results: {
        equipment: any[];
        animals: any[];
        services: any[];
        schemes: any[];
        resources: any[];
        totalCount: number;
      } = {
        equipment: [],
        animals: [],
        services: [],
        schemes: [],
        resources: [],
        totalCount: 0,
      };

      // 1. Search Equipment
      if (type === 'all' || type === 'equipment') {
        let sql = `
          SELECT id, name, category, description, rent_price, price_unit, status, is_approved,
                 location, district, state, images, rating, total_ratings
          FROM equipment
          WHERE is_approved = true AND status = 'AVAILABLE'
            AND (name ILIKE $1 OR category ILIKE $1 OR description ILIKE $1)
            AND (location ILIKE $2 OR district ILIKE $2 OR state ILIKE $2)
        `;
        const params: any[] = [keywordPattern, locPattern];
        let idx = 3;

        if (minPrice !== null && !isNaN(minPrice)) {
          sql += ` AND rent_price >= $${idx++}`;
          params.push(minPrice);
        }
        if (maxPrice !== null && !isNaN(maxPrice)) {
          sql += ` AND rent_price <= $${idx++}`;
          params.push(maxPrice);
        }

        sql += ` ORDER BY rating DESC, created_at DESC LIMIT 10`;
        const eqRes = await query(sql, params);
        results.equipment = eqRes.rows;
      }

      // 2. Search Animals & Birds
      if (type === 'all' || type === 'animals') {
        let sql = `
          SELECT id, name, category, breed, age_months, price, status,
                 location, district, state, images, health_status, milk_yield_liters, vaccination_status
          FROM animals
          WHERE status = 'AVAILABLE'
            AND (name ILIKE $1 OR category ILIKE $1 OR breed ILIKE $1 OR description ILIKE $1)
            AND (location ILIKE $2 OR district ILIKE $2 OR state ILIKE $2)
        `;
        const params: any[] = [keywordPattern, locPattern];
        let idx = 3;

        if (minPrice !== null && !isNaN(minPrice)) {
          sql += ` AND price >= $${idx++}`;
          params.push(minPrice);
        }
        if (maxPrice !== null && !isNaN(maxPrice)) {
          sql += ` AND price <= $${idx++}`;
          params.push(maxPrice);
        }

        sql += ` ORDER BY created_at DESC LIMIT 10`;
        const anRes = await query(sql, params);
        results.animals = anRes.rows;
      }

      // 3. Search Services (Drivers & Farm Workers)
      if (type === 'all' || type === 'services') {
        let sql = `
          SELECT sp.id, sp.user_id, sp.service_type, sp.daily_rate, sp.hourly_rate,
                 sp.experience_years, sp.skills, sp.service_areas, sp.district, sp.state,
                 sp.is_available, sp.is_verified, sp.rating, sp.total_ratings,
                 u.name as provider_name, u.phone as provider_phone
          FROM service_profiles sp
          JOIN users u ON sp.user_id = u.id
          WHERE sp.is_available = true
            AND (sp.service_type ILIKE $1 OR u.name ILIKE $1 OR array_to_string(sp.skills, ',') ILIKE $1)
            AND (sp.district ILIKE $2 OR sp.state ILIKE $2 OR array_to_string(sp.service_areas, ',') ILIKE $2)
        `;
        const params: any[] = [keywordPattern, locPattern];
        let idx = 3;

        if (minPrice !== null && !isNaN(minPrice)) {
          sql += ` AND (sp.daily_rate >= $${idx} OR sp.hourly_rate >= $${idx})`;
          params.push(minPrice);
          idx++;
        }
        if (maxPrice !== null && !isNaN(maxPrice)) {
          sql += ` AND (sp.daily_rate <= $${idx} OR sp.hourly_rate <= $${idx})`;
          params.push(maxPrice);
          idx++;
        }

        sql += ` ORDER BY sp.rating DESC, sp.experience_years DESC LIMIT 10`;
        const srvRes = await query(sql, params);
        results.services = srvRes.rows;
      }

      // 4. Search Government Schemes
      if (type === 'all' || type === 'schemes') {
        const sql = `
          SELECT id, title, description, department, level, category,
                 subsidy_percentage, max_benefit_amount, official_portal_url, is_active
          FROM government_schemes
          WHERE is_active = true
            AND (title ILIKE $1 OR description ILIKE $1 OR department ILIKE $1 OR category ILIKE $1)
          ORDER BY created_at DESC LIMIT 10
        `;
        const schRes = await query(sql, [keywordPattern]);
        results.schemes = schRes.rows;
      }

      // 5. Search Farmer Resources
      if (type === 'all' || type === 'resources') {
        const sql = `
          SELECT id, title, category, description, content, language, external_link
          FROM farmer_resources
          WHERE (title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)
          ORDER BY title ASC LIMIT 10
        `;
        const resRes = await query(sql, [keywordPattern]);
        results.resources = resRes.rows;
      }

      results.totalCount =
        results.equipment.length +
        results.animals.length +
        results.services.length +
        results.schemes.length +
        results.resources.length;

      return res.status(200).json({
        success: true,
        query: {
          q,
          type,
          location,
          minPrice,
          maxPrice,
        },
        data: results,
      });
    } catch (error: any) {
      console.error('[SearchController.search error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Search failed due to a server error',
      });
    }
  }
}
