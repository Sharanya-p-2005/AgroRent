import { query } from '../config/db.js';
import crypto from 'crypto';

export type ResourceType = 'ARTICLE' | 'GUIDE' | 'VIDEO' | 'DOCUMENT' | 'WEBSITE' | 'HELPLINE';
export type ResourceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FarmerResource {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  resource_type: ResourceType;
  image_url: string | null;
  official_url: string | null;
  status: ResourceStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceInput {
  title: string;
  description: string;
  category: string;
  content: string;
  resource_type: ResourceType;
  image_url?: string;
  official_url?: string;
  status?: ResourceStatus;
}

export interface ResourceFilterParams {
  search?: string;
  category?: string;
  resource_type?: string;
  status?: string;
}

export const ResourceModel = {
  async findAllPublic(params: ResourceFilterParams = {}): Promise<FarmerResource[]> {
    const conditions: string[] = ["status = 'PUBLISHED'"];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.category && params.category !== 'ALL') {
      values.push(params.category);
      conditions.push(`LOWER(category) = LOWER($${paramIndex++})`);
    }

    if (params.resource_type && params.resource_type !== 'ALL') {
      values.push(params.resource_type.toUpperCase());
      conditions.push(`resource_type = $${paramIndex++}`);
    }

    if (params.search && params.search.trim()) {
      values.push(`%${params.search.trim().toLowerCase()}%`);
      const p = `$${paramIndex++}`;
      conditions.push(`(
        LOWER(title) LIKE ${p} OR 
        LOWER(description) LIKE ${p} OR 
        LOWER(category) LIKE ${p} OR 
        LOWER(content) LIKE ${p}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT *
      FROM farmer_resources
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const res = await query(sql, values);
    return res.rows;
  },

  async findById(id: string): Promise<FarmerResource | null> {
    const sql = `SELECT * FROM farmer_resources WHERE id = $1`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async findAllAdmin(params: ResourceFilterParams = {}): Promise<FarmerResource[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status && params.status !== 'ALL') {
      values.push(params.status.toUpperCase());
      conditions.push(`status = $${paramIndex++}`);
    }

    if (params.category && params.category !== 'ALL') {
      values.push(params.category);
      conditions.push(`LOWER(category) = LOWER($${paramIndex++})`);
    }

    if (params.resource_type && params.resource_type !== 'ALL') {
      values.push(params.resource_type.toUpperCase());
      conditions.push(`resource_type = $${paramIndex++}`);
    }

    if (params.search && params.search.trim()) {
      values.push(`%${params.search.trim().toLowerCase()}%`);
      const p = `$${paramIndex++}`;
      conditions.push(`(
        LOWER(title) LIKE ${p} OR 
        LOWER(description) LIKE ${p} OR 
        LOWER(category) LIKE ${p}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT *
      FROM farmer_resources
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const res = await query(sql, values);
    return res.rows;
  },

  async create(data: CreateResourceInput): Promise<FarmerResource> {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO farmer_resources (
        id, title, description, category, content, resource_type,
        image_url, official_url, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const values = [
      id,
      data.title.trim(),
      data.description.trim(),
      data.category.trim(),
      data.content.trim(),
      data.resource_type,
      data.image_url ? data.image_url.trim() : null,
      data.official_url ? data.official_url.trim() : null,
      data.status || 'DRAFT',
    ];

    const res = await query(sql, values);
    return res.rows[0];
  },

  async update(id: string, data: Partial<CreateResourceInput>): Promise<FarmerResource | null> {
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [id];
    let paramIndex = 2;

    if (data.title !== undefined) {
      values.push(data.title.trim());
      updates.push(`title = $${paramIndex++}`);
    }
    if (data.description !== undefined) {
      values.push(data.description.trim());
      updates.push(`description = $${paramIndex++}`);
    }
    if (data.category !== undefined) {
      values.push(data.category.trim());
      updates.push(`category = $${paramIndex++}`);
    }
    if (data.content !== undefined) {
      values.push(data.content.trim());
      updates.push(`content = $${paramIndex++}`);
    }
    if (data.resource_type !== undefined) {
      values.push(data.resource_type);
      updates.push(`resource_type = $${paramIndex++}`);
    }
    if (data.image_url !== undefined) {
      values.push(data.image_url ? data.image_url.trim() : null);
      updates.push(`image_url = $${paramIndex++}`);
    }
    if (data.official_url !== undefined) {
      values.push(data.official_url ? data.official_url.trim() : null);
      updates.push(`official_url = $${paramIndex++}`);
    }
    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${paramIndex++}`);
    }

    const sql = `
      UPDATE farmer_resources
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM farmer_resources WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  },

  async setStatus(id: string, status: ResourceStatus): Promise<FarmerResource | null> {
    const sql = `
      UPDATE farmer_resources
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(sql, [id, status]);
    return res.rows[0] || null;
  },

  async getStats(): Promise<{
    total_resources: number;
    published_resources: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_resources,
        COUNT(*) FILTER (WHERE status = 'PUBLISHED') as published_resources
      FROM farmer_resources
    `;
    const res = await query(sql);
    const row = res.rows[0];
    return {
      total_resources: parseInt(row.total_resources || '0', 10),
      published_resources: parseInt(row.published_resources || '0', 10),
    };
  }
};
