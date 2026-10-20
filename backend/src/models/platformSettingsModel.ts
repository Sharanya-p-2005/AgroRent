import { query } from '../config/db.js';

export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export class PlatformSettingsModel {
  static async getAll(): Promise<Record<string, string>> {
    const res = await query<PlatformSetting>('SELECT setting_key, setting_value FROM platform_settings');
    const settings: Record<string, string> = {
      platform_name: 'AgroRent',
      default_currency: 'INR',
      default_language: 'en',
      ai_enabled: 'true',
      maintenance_mode: 'false',
      notification_email_enabled: 'true',
    };
    for (const row of res.rows) {
      settings[row.setting_key] = row.setting_value;
    }
    return settings;
  }

  static async get(key: string, defaultValue = ''): Promise<string> {
    const res = await query<PlatformSetting>('SELECT setting_value FROM platform_settings WHERE setting_key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].setting_value;
    }
    return defaultValue;
  }

  static async update(key: string, value: string, userId?: string): Promise<void> {
    await query(
      `INSERT INTO platform_settings (id, setting_key, setting_value, updated_by, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
      [key, value, userId || null]
    );
  }

  static async updateBulk(settings: Record<string, string>, userId?: string): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(settings)) {
      await this.update(key, String(value), userId);
    }
    return this.getAll();
  }
}
