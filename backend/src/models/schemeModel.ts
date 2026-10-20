import { query } from '../config/db.js';
import crypto from 'crypto';

export type GovernmentLevel = 'CENTRAL' | 'STATE';
export type SchemeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface GovernmentScheme {
  id: string;
  title: string;
  short_description: string;
  full_description: string;
  category: string;
  government_level: GovernmentLevel;
  state: string;
  department: string | null;
  benefits: string | null;
  eligibility: string | null;
  required_documents: string | null;
  application_process: string | null;
  official_url: string | null;
  helpline: string | null;
  image_url: string | null;
  status: SchemeStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  is_saved?: boolean;
}

export interface CreateSchemeInput {
  title: string;
  short_description: string;
  full_description: string;
  category: string;
  government_level: GovernmentLevel;
  state?: string;
  department?: string;
  benefits?: string;
  eligibility?: string;
  required_documents?: string;
  application_process?: string;
  official_url?: string;
  helpline?: string;
  image_url?: string;
  status?: SchemeStatus;
  featured?: boolean;
}

export interface SchemeFilterParams {
  search?: string;
  category?: string;
  government_level?: string;
  state?: string;
  featured?: boolean | string;
  status?: string;
  sort?: 'featured' | 'newest' | 'alphabetical' | string;
}

export const SchemeModel = {
  async findAllPublic(params: SchemeFilterParams = {}, userId?: string): Promise<GovernmentScheme[]> {
    const conditions: string[] = ["gs.status = 'PUBLISHED'"];
    const values: any[] = [];
    let paramIndex = 1;

    let selectIsSaved = 'FALSE as is_saved';
    let joinSaved = '';

    if (userId) {
      values.push(userId);
      selectIsSaved = `CASE WHEN ss.id IS NOT NULL THEN TRUE ELSE FALSE END as is_saved`;
      joinSaved = `LEFT JOIN saved_schemes ss ON ss.scheme_id = gs.id AND ss.user_id = $${paramIndex++}`;
    }

    if (params.category && params.category !== 'ALL') {
      values.push(params.category);
      conditions.push(`LOWER(gs.category) = LOWER($${paramIndex++})`);
    }

    if (params.government_level && params.government_level !== 'ALL') {
      values.push(params.government_level.toUpperCase());
      conditions.push(`gs.government_level = $${paramIndex++}`);
    }

    if (params.state && params.state !== 'ALL') {
      values.push(params.state.toUpperCase());
      conditions.push(`(UPPER(gs.state) = $${paramIndex++} OR gs.government_level = 'CENTRAL')`);
    }

    if (params.featured === true || params.featured === 'true') {
      conditions.push(`gs.featured = TRUE`);
    }

    if (params.search && params.search.trim()) {
      values.push(`%${params.search.trim().toLowerCase()}%`);
      const p = `$${paramIndex++}`;
      conditions.push(`(
        LOWER(gs.title) LIKE ${p} OR 
        LOWER(gs.short_description) LIKE ${p} OR 
        LOWER(gs.full_description) LIKE ${p} OR 
        LOWER(gs.category) LIKE ${p} OR 
        LOWER(COALESCE(gs.department, '')) LIKE ${p} OR
        LOWER(COALESCE(gs.benefits, '')) LIKE ${p} OR
        LOWER(COALESCE(gs.eligibility, '')) LIKE ${p}
      )`);
    }

    let orderBy = 'gs.featured DESC, gs.created_at DESC';
    if (params.sort === 'newest') {
      orderBy = 'gs.created_at DESC';
    } else if (params.sort === 'alphabetical') {
      orderBy = 'gs.title ASC';
    } else if (params.sort === 'featured') {
      orderBy = 'gs.featured DESC, gs.created_at DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT gs.*, ${selectIsSaved}
      FROM government_schemes gs
      ${joinSaved}
      ${whereClause}
      ORDER BY ${orderBy}
    `;

    const res = await query(sql, values);
    return res.rows;
  },

  async findById(id: string, userId?: string): Promise<GovernmentScheme | null> {
    let selectIsSaved = 'FALSE as is_saved';
    let joinSaved = '';
    const values: any[] = [id];

    if (userId) {
      values.push(userId);
      selectIsSaved = `CASE WHEN ss.id IS NOT NULL THEN TRUE ELSE FALSE END as is_saved`;
      joinSaved = `LEFT JOIN saved_schemes ss ON ss.scheme_id = gs.id AND ss.user_id = $2`;
    }

    const sql = `
      SELECT gs.*, ${selectIsSaved}
      FROM government_schemes gs
      ${joinSaved}
      WHERE gs.id = $1
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async findSavedByUserId(userId: string): Promise<GovernmentScheme[]> {
    const sql = `
      SELECT gs.*, TRUE as is_saved, ss.created_at as saved_at
      FROM saved_schemes ss
      JOIN government_schemes gs ON gs.id = ss.scheme_id
      WHERE ss.user_id = $1 AND gs.status = 'PUBLISHED'
      ORDER BY ss.created_at DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  },

  async saveScheme(userId: string, schemeId: string): Promise<{ id: string }> {
    // Check if scheme exists and is published
    const scheme = await query('SELECT id FROM government_schemes WHERE id = $1', [schemeId]);
    if (scheme.rows.length === 0) {
      throw new Error('Scheme not found');
    }

    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO saved_schemes (id, user_id, scheme_id, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, scheme_id) DO NOTHING
      RETURNING id
    `;
    const res = await query(sql, [id, userId, schemeId]);
    if (res.rows.length === 0) {
      // Already saved, retrieve existing id
      const existing = await query('SELECT id FROM saved_schemes WHERE user_id = $1 AND scheme_id = $2', [userId, schemeId]);
      return existing.rows[0];
    }
    return res.rows[0];
  },

  async removeSavedScheme(userId: string, schemeId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM saved_schemes WHERE user_id = $1 AND scheme_id = $2 RETURNING id',
      [userId, schemeId]
    );
    return res.rows.length > 0;
  },

  async isSchemeSaved(userId: string, schemeId: string): Promise<boolean> {
    const res = await query(
      'SELECT id FROM saved_schemes WHERE user_id = $1 AND scheme_id = $2',
      [userId, schemeId]
    );
    return res.rows.length > 0;
  },

  // Admin Scheme Management
  async findAllAdmin(params: SchemeFilterParams = {}): Promise<GovernmentScheme[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status && params.status !== 'ALL') {
      values.push(params.status.toUpperCase());
      conditions.push(`gs.status = $${paramIndex++}`);
    }

    if (params.category && params.category !== 'ALL') {
      values.push(params.category);
      conditions.push(`LOWER(gs.category) = LOWER($${paramIndex++})`);
    }

    if (params.government_level && params.government_level !== 'ALL') {
      values.push(params.government_level.toUpperCase());
      conditions.push(`gs.government_level = $${paramIndex++}`);
    }

    if (params.featured === true || params.featured === 'true') {
      conditions.push(`gs.featured = TRUE`);
    }

    if (params.search && params.search.trim()) {
      values.push(`%${params.search.trim().toLowerCase()}%`);
      const p = `$${paramIndex++}`;
      conditions.push(`(
        LOWER(gs.title) LIKE ${p} OR 
        LOWER(gs.short_description) LIKE ${p} OR 
        LOWER(gs.category) LIKE ${p} OR 
        LOWER(COALESCE(gs.department, '')) LIKE ${p}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT gs.*
      FROM government_schemes gs
      ${whereClause}
      ORDER BY gs.featured DESC, gs.created_at DESC
    `;

    const res = await query(sql, values);
    return res.rows;
  },

  async create(data: CreateSchemeInput): Promise<GovernmentScheme> {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO government_schemes (
        id, title, short_description, full_description, category,
        government_level, state, department, benefits, eligibility,
        required_documents, application_process, official_url, helpline,
        image_url, status, featured, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const values = [
      id,
      data.title.trim(),
      data.short_description.trim(),
      data.full_description.trim(),
      data.category.trim(),
      data.government_level,
      data.state ? data.state.trim() : (data.government_level === 'CENTRAL' ? 'CENTRAL' : 'KARNATAKA'),
      data.department ? data.department.trim() : null,
      data.benefits ? data.benefits.trim() : null,
      data.eligibility ? data.eligibility.trim() : null,
      data.required_documents ? data.required_documents.trim() : null,
      data.application_process ? data.application_process.trim() : null,
      data.official_url ? data.official_url.trim() : null,
      data.helpline ? data.helpline.trim() : null,
      data.image_url ? data.image_url.trim() : null,
      data.status || 'DRAFT',
      Boolean(data.featured)
    ];

    const res = await query(sql, values);
    return res.rows[0];
  },

  async update(id: string, data: Partial<CreateSchemeInput>): Promise<GovernmentScheme | null> {
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [id];
    let paramIndex = 2;

    if (data.title !== undefined) {
      values.push(data.title.trim());
      updates.push(`title = $${paramIndex++}`);
    }
    if (data.short_description !== undefined) {
      values.push(data.short_description.trim());
      updates.push(`short_description = $${paramIndex++}`);
    }
    if (data.full_description !== undefined) {
      values.push(data.full_description.trim());
      updates.push(`full_description = $${paramIndex++}`);
    }
    if (data.category !== undefined) {
      values.push(data.category.trim());
      updates.push(`category = $${paramIndex++}`);
    }
    if (data.government_level !== undefined) {
      values.push(data.government_level);
      updates.push(`government_level = $${paramIndex++}`);
    }
    if (data.state !== undefined) {
      values.push(data.state.trim());
      updates.push(`state = $${paramIndex++}`);
    }
    if (data.department !== undefined) {
      values.push(data.department ? data.department.trim() : null);
      updates.push(`department = $${paramIndex++}`);
    }
    if (data.benefits !== undefined) {
      values.push(data.benefits ? data.benefits.trim() : null);
      updates.push(`benefits = $${paramIndex++}`);
    }
    if (data.eligibility !== undefined) {
      values.push(data.eligibility ? data.eligibility.trim() : null);
      updates.push(`eligibility = $${paramIndex++}`);
    }
    if (data.required_documents !== undefined) {
      values.push(data.required_documents ? data.required_documents.trim() : null);
      updates.push(`required_documents = $${paramIndex++}`);
    }
    if (data.application_process !== undefined) {
      values.push(data.application_process ? data.application_process.trim() : null);
      updates.push(`application_process = $${paramIndex++}`);
    }
    if (data.official_url !== undefined) {
      values.push(data.official_url ? data.official_url.trim() : null);
      updates.push(`official_url = $${paramIndex++}`);
    }
    if (data.helpline !== undefined) {
      values.push(data.helpline ? data.helpline.trim() : null);
      updates.push(`helpline = $${paramIndex++}`);
    }
    if (data.image_url !== undefined) {
      values.push(data.image_url ? data.image_url.trim() : null);
      updates.push(`image_url = $${paramIndex++}`);
    }
    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${paramIndex++}`);
    }
    if (data.featured !== undefined) {
      values.push(Boolean(data.featured));
      updates.push(`featured = $${paramIndex++}`);
    }

    const sql = `
      UPDATE government_schemes
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM government_schemes WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  },

  async setStatus(id: string, status: SchemeStatus): Promise<GovernmentScheme | null> {
    const sql = `
      UPDATE government_schemes
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(sql, [id, status]);
    return res.rows[0] || null;
  },

  async setFeatured(id: string, featured: boolean): Promise<GovernmentScheme | null> {
    const sql = `
      UPDATE government_schemes
      SET featured = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(sql, [id, featured]);
    return res.rows[0] || null;
  },

  async getStats(): Promise<{
    total_schemes: number;
    published_schemes: number;
    draft_schemes: number;
    featured_schemes: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_schemes,
        COUNT(*) FILTER (WHERE status = 'PUBLISHED') as published_schemes,
        COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_schemes,
        COUNT(*) FILTER (WHERE featured = TRUE) as featured_schemes
      FROM government_schemes
    `;
    const res = await query(sql);
    const row = res.rows[0];
    return {
      total_schemes: parseInt(row.total_schemes || '0', 10),
      published_schemes: parseInt(row.published_schemes || '0', 10),
      draft_schemes: parseInt(row.draft_schemes || '0', 10),
      featured_schemes: parseInt(row.featured_schemes || '0', 10),
    };
  }
};
