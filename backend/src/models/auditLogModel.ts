import { query } from '../config/db.js';
import crypto from 'crypto';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreateAuditLogDto {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface AuditLogQueryOptions {
  page?: number;
  limit?: number;
  action?: string;
  entity_type?: string;
  user_id?: string;
  search?: string;
  from?: string;
  to?: string;
}

export class AuditLogModel {
  /**
   * Append-only creation of audit log record.
   */
  static async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const id = crypto.randomUUID();
    const oldValuesJson = dto.old_values ? JSON.stringify(dto.old_values) : JSON.stringify({});
    const newValuesJson = dto.new_values ? JSON.stringify(dto.new_values) : JSON.stringify({});

    const sql = `
      INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const res = await query<AuditLog>(sql, [
      id,
      dto.user_id || null,
      dto.action,
      dto.entity_type,
      dto.entity_id || null,
      oldValuesJson,
      newValuesJson,
      dto.ip_address || null,
      dto.user_agent || null,
    ]);

    return res.rows[0];
  }

  /**
   * Fetch paginated audit logs with search, user and date filters.
   */
  static async findAll(options: AuditLogQueryOptions = {}): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options.action) {
      conditions.push(`a.action = $${paramIndex++}`);
      params.push(options.action);
    }

    if (options.entity_type) {
      conditions.push(`a.entity_type = $${paramIndex++}`);
      params.push(options.entity_type);
    }

    if (options.user_id) {
      conditions.push(`a.user_id = $${paramIndex++}`);
      params.push(options.user_id);
    }

    if (options.from) {
      conditions.push(`a.created_at >= $${paramIndex++}`);
      params.push(new Date(options.from).toISOString());
    }

    if (options.to) {
      conditions.push(`a.created_at <= $${paramIndex++}`);
      params.push(new Date(options.to).toISOString());
    }

    if (options.search) {
      conditions.push(
        `(a.action ILIKE $${paramIndex} OR a.entity_type ILIKE $${paramIndex} OR a.entity_id ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      );
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as count 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
    `;

    const countRes = await query<{ count: string }>(countSql, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const logsSql = `
      SELECT 
        a.id,
        a.user_id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.user_agent,
        a.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const logsRes = await query<AuditLog>(logsSql, [...params, limit, offset]);

    return {
      logs: logsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Find audit log by ID with rich details
   */
  static async findById(id: string): Promise<AuditLog | null> {
    const sql = `
      SELECT 
        a.id,
        a.user_id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.user_agent,
        a.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;
    const res = await query<AuditLog>(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Fetch recent audit activities for dashboard overview
   */
  static async getRecent(limit = 10): Promise<AuditLog[]> {
    const sql = `
      SELECT 
        a.id,
        a.user_id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.user_agent,
        a.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `;
    const res = await query<AuditLog>(sql, [limit]);
    return res.rows;
  }
}
