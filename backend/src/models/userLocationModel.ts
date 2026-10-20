import { query, withTransaction } from '../config/db.js';
import crypto from 'crypto';
import { isValidLatitude, isValidLongitude } from '../utils/geoUtils.js';

export type LocationLabel = 'HOME' | 'FARM' | 'OFFICE' | 'OTHER';

export interface UserLocation {
  id: string;
  user_id: string;
  label: LocationLabel;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationInput {
  label: LocationLabel;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
}

export interface UpdateLocationInput {
  label?: LocationLabel;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
}

export class UserLocationModel {
  /**
   * Create a new user location. If is_default is true, unsets any other default location for this user.
   */
  static async create(userId: string, input: CreateLocationInput): Promise<UserLocation> {
    const validLabels: LocationLabel[] = ['HOME', 'FARM', 'OFFICE', 'OTHER'];
    if (!validLabels.includes(input.label)) {
      const err = new Error("Invalid location label. Must be one of 'HOME', 'FARM', 'OFFICE', 'OTHER'");
      (err as any).statusCode = 400;
      throw err;
    }

    if (!input.address?.trim() || !input.city?.trim() || !input.state?.trim() || !input.pincode?.trim()) {
      const err = new Error('Address, city, state, and pincode are required.');
      (err as any).statusCode = 400;
      throw err;
    }

    const lat = input.latitude != null ? parseFloat(input.latitude as any) : null;
    const lon = input.longitude != null ? parseFloat(input.longitude as any) : null;

    if (lat != null && !isValidLatitude(lat)) {
      const err = new Error('Invalid latitude value. Must be between -90 and 90.');
      (err as any).statusCode = 400;
      throw err;
    }

    if (lon != null && !isValidLongitude(lon)) {
      const err = new Error('Invalid longitude value. Must be between -180 and 180.');
      (err as any).statusCode = 400;
      throw err;
    }

    const id = crypto.randomUUID();

    return withTransaction(async (tx) => {
      // Check if user already has this label
      const existingRes = await tx.query(
        'SELECT id FROM user_locations WHERE user_id = $1 AND label = $2',
        [userId, input.label]
      );
      if (existingRes.rows.length > 0) {
        const err = new Error(`You already have a location saved with label '${input.label}'. Please choose a different label or edit the existing one.`);
        (err as any).statusCode = 409;
        throw err;
      }

      // If marked default, or if this is the user's first location, set is_default = true
      const countRes = await tx.query('SELECT COUNT(*) as count FROM user_locations WHERE user_id = $1', [userId]);
      const isFirst = parseInt(countRes.rows[0]?.count || '0', 10) === 0;
      const shouldBeDefault = Boolean(input.is_default) || isFirst;

      if (shouldBeDefault) {
        await tx.query('UPDATE user_locations SET is_default = false WHERE user_id = $1', [userId]);
      }

      const insertRes = await tx.query<UserLocation>(
        `INSERT INTO user_locations (
          id, user_id, label, address, city, state, pincode,
          latitude, longitude, is_default, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *`,
        [
          id,
          userId,
          input.label,
          input.address.trim(),
          input.city.trim(),
          input.state.trim(),
          input.pincode.trim(),
          lat,
          lon,
          shouldBeDefault,
        ]
      );

      return insertRes.rows[0];
    });
  }

  /**
   * Get all locations for a user, with default location first.
   */
  static async getAllByUserId(userId: string): Promise<UserLocation[]> {
    const res = await query<UserLocation>(
      `SELECT * FROM user_locations 
       WHERE user_id = $1 
       ORDER BY is_default DESC, updated_at DESC`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Get location by ID, checking optional ownership.
   */
  static async getById(id: string, userId?: string): Promise<UserLocation | null> {
    const sql = userId
      ? 'SELECT * FROM user_locations WHERE id = $1 AND user_id = $2'
      : 'SELECT * FROM user_locations WHERE id = $1';
    const params = userId ? [id, userId] : [id];
    const res = await query<UserLocation>(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Update location.
   */
  static async update(id: string, userId: string, input: UpdateLocationInput): Promise<UserLocation> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      const err = new Error('Saved location not found or unauthorized.');
      (err as any).statusCode = 404;
      throw err;
    }

    const lat = input.latitude !== undefined
      ? (input.latitude != null ? parseFloat(input.latitude as any) : null)
      : existing.latitude;
    const lon = input.longitude !== undefined
      ? (input.longitude != null ? parseFloat(input.longitude as any) : null)
      : existing.longitude;

    if (lat != null && !isValidLatitude(lat)) {
      const err = new Error('Invalid latitude value. Must be between -90 and 90.');
      (err as any).statusCode = 400;
      throw err;
    }

    if (lon != null && !isValidLongitude(lon)) {
      const err = new Error('Invalid longitude value. Must be between -180 and 180.');
      (err as any).statusCode = 400;
      throw err;
    }

    const label = input.label || existing.label;
    const address = input.address?.trim() || existing.address;
    const city = input.city?.trim() || existing.city;
    const state = input.state?.trim() || existing.state;
    const pincode = input.pincode?.trim() || existing.pincode;

    return withTransaction(async (tx) => {
      // If label is changing, check uniqueness
      if (input.label && input.label !== existing.label) {
        const duplicate = await tx.query(
          'SELECT id FROM user_locations WHERE user_id = $1 AND label = $2 AND id != $3',
          [userId, input.label, id]
        );
        if (duplicate.rows.length > 0) {
          const err = new Error(`You already have a location saved with label '${input.label}'.`);
          (err as any).statusCode = 409;
          throw err;
        }
      }

      if (input.is_default) {
        await tx.query('UPDATE user_locations SET is_default = false WHERE user_id = $1', [userId]);
      }

      const updateRes = await tx.query<UserLocation>(
        `UPDATE user_locations SET
          label = $1,
          address = $2,
          city = $3,
          state = $4,
          pincode = $5,
          latitude = $6,
          longitude = $7,
          is_default = COALESCE($8, is_default),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND user_id = $10
        RETURNING *`,
        [label, address, city, state, pincode, lat, lon, input.is_default, id, userId]
      );

      return updateRes.rows[0];
    });
  }

  /**
   * Delete location. If deleted location was default, sets another one as default if available.
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      const err = new Error('Saved location not found.');
      (err as any).statusCode = 404;
      throw err;
    }

    return withTransaction(async (tx) => {
      await tx.query('DELETE FROM user_locations WHERE id = $1 AND user_id = $2', [id, userId]);

      if (existing.is_default) {
        const remaining = await tx.query(
          'SELECT id FROM user_locations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
          [userId]
        );
        if (remaining.rows.length > 0) {
          await tx.query('UPDATE user_locations SET is_default = true WHERE id = $1', [remaining.rows[0].id]);
        }
      }

      return true;
    });
  }

  /**
   * Set location as default.
   */
  static async setDefault(id: string, userId: string): Promise<UserLocation> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      const err = new Error('Location not found.');
      (err as any).statusCode = 404;
      throw err;
    }

    return withTransaction(async (tx) => {
      await tx.query('UPDATE user_locations SET is_default = false WHERE user_id = $1', [userId]);
      const res = await tx.query<UserLocation>(
        `UPDATE user_locations 
         SET is_default = true, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [id, userId]
      );
      return res.rows[0];
    });
  }

  /**
   * Get default location.
   */
  static async getDefault(userId: string): Promise<UserLocation | null> {
    const res = await query<UserLocation>(
      'SELECT * FROM user_locations WHERE user_id = $1 AND is_default = true LIMIT 1',
      [userId]
    );
    return res.rows[0] || null;
  }
}
