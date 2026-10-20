import fs from 'fs';
import path from 'path';
import { query } from '../config/db.js';
import { runSeeds } from '../../seeds/seed.js';

let migrationPromise: Promise<void> | null = null;
let isReady = false;

export function waitForMigrations(): Promise<void> {
  if (isReady) return Promise.resolve();
  if (!migrationPromise) return Promise.resolve();
  return migrationPromise;
}

export function isMigrationReady(): boolean {
  return isReady;
}

export async function runMigrationsAndSeeds() {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    console.log('[Migration] Running database migrations...');

    const migrationsDir = path.join(process.cwd(), 'backend', 'migrations');
    let migrationFiles = ['001_initial_schema.sql', '002_equipment_schema.sql', '003_animal_schema.sql', '004_service_profiles_schema.sql'];

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      if (files.length > 0) {
        migrationFiles = files;
      }
    }

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) continue;

      console.log(`[Migration] Executing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Remove single-line comments (-- ...) and block comments (/* ... */)
      const cleanSql = sql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, '');

      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await query(statement);
        } catch (err: any) {
          if (statement.toUpperCase().includes('EXTENSION')) {
            console.warn(`[Migration] Extension statement skipped in ${file}:`, err.message);
          } else {
            console.error(`[Migration] Failed statement in ${file}:`, statement, err.message);
            throw err;
          }
        }
      }
    }

    console.log('[Migration] All database tables and indexes migrated successfully.');

    // Run seed data
    await runSeeds();
    isReady = true;
  })();

  return migrationPromise;
}
