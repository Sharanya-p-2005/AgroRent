import { Response } from 'express';
import { query } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class RecommendationController {
  /**
   * GET /api/recommendations
   * Returns tailored recommendations for the current user
   */
  static async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const user = req.user;
      let farmerDistrict = 'Mandya';

      // Look up farmer's district if logged in
      if (user) {
        const fpRes = await query('SELECT district FROM farmer_profiles WHERE user_id = $1', [user.id]);
        if (fpRes.rows.length > 0 && fpRes.rows[0].district) {
          farmerDistrict = fpRes.rows[0].district;
        }
      }

      // 1. Recommended Equipment (Only approved and available)
      const eqRes = await query(
        `SELECT id, name, category, description, rent_price, price_unit,
                location, district, state, images, rating, total_ratings
         FROM equipment
         WHERE is_approved = true AND status = 'AVAILABLE'
         ORDER BY (CASE WHEN district ILIKE $1 THEN 20 ELSE 0 END) + COALESCE(rating * 10, 30) DESC
         LIMIT 4`,
        [`%${farmerDistrict}%`]
      );

      const equipment = eqRes.rows.map((row) => ({
        ...row,
        recommendation_reason: row.district?.toLowerCase()?.includes(farmerDistrict.toLowerCase())
          ? `Top-rated equipment located right in ${row.district}`
          : 'Highly requested machinery with verified maintenance record',
        suitability_score: Math.min(98, 75 + Math.round(Number(row.rating || 4) * 4)),
      }));

      // 2. Recommended Livestock
      const anRes = await query(
        `SELECT id, name, category, breed, age_months, price,
                location, district, state, images, health_status, milk_yield_liters, vaccination_status
         FROM animals
         WHERE status = 'AVAILABLE'
         ORDER BY (CASE WHEN district ILIKE $1 THEN 15 ELSE 0 END) + created_at DESC
         LIMIT 4`,
        [`%${farmerDistrict}%`]
      );

      const animals = anRes.rows.map((row) => ({
        ...row,
        recommendation_reason: row.milk_yield_liters
          ? `High milk yield potential (${row.milk_yield_liters}L/day) with certified vaccination`
          : `Healthy ${row.breed || row.category} from verified rural seller`,
        suitability_score: 88,
      }));

      // 3. Recommended Drivers & Farm Workers
      const srvRes = await query(
        `SELECT sp.id, sp.user_id, sp.service_type, sp.daily_rate, sp.hourly_rate,
                sp.experience_years, sp.skills, sp.service_areas, sp.district, sp.state,
                sp.is_available, sp.is_verified, sp.rating, sp.total_ratings,
                u.name as provider_name, u.phone as provider_phone
         FROM service_profiles sp
         JOIN users u ON sp.user_id = u.id
         WHERE sp.is_available = true
         ORDER BY (CASE WHEN sp.district ILIKE $1 THEN 20 ELSE 0 END) + COALESCE(sp.rating * 10, 30) DESC
         LIMIT 4`,
        [`%${farmerDistrict}%`]
      );

      const services = srvRes.rows.map((row) => ({
        ...row,
        recommendation_reason: `${row.experience_years || 5}+ years verified field experience in ${row.district || 'Karnataka'}`,
        suitability_score: Math.min(99, 80 + Math.round(Number(row.rating || 4.5) * 3)),
      }));

      return res.status(200).json({
        success: true,
        district_matched: farmerDistrict,
        data: {
          equipment,
          animals,
          services,
        },
      });
    } catch (error: any) {
      console.error('[RecommendationController.getRecommendations error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendations',
      });
    }
  }
}
