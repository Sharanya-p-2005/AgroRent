import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DBClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
}

let pgPool: pg.Pool | null = null;
let pgliteInstance: PGlite | null = null;
let activeEngine: 'pg' | 'pglite' = 'pglite';
let pgliteQueue: Promise<any> = Promise.resolve();

function enqueuePGlite<T>(operation: () => Promise<T>): Promise<T> {
  const next = pgliteQueue.then(operation, operation);
  pgliteQueue = next.catch(() => {});
  return next;
}

export async function getDb(): Promise<DBClient> {
  if (pgPool) {
    return pgPool;
  }
  if (pgliteInstance) {
    return {
      query: async <T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> => {
        return enqueuePGlite(async () => {
          const res = await pgliteInstance!.query<T>(sql, params);
          return {
            rows: res.rows || [],
            rowCount: res.rows ? res.rows.length : 0,
          };
        });
      },
    };
  }

  // 1. Check if DATABASE_URL is configured
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !databaseUrl.includes('placeholder') && !databaseUrl.includes('your_')) {
    try {
      console.log('[Database] Connecting to PostgreSQL via DATABASE_URL...');
      const pool = new pg.Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      await pool.query('SELECT 1');
      console.log('[Database] Successfully connected to PostgreSQL server via pg.Pool.');
      pgPool = pool;
      activeEngine = 'pg';
      return pgPool;
    } catch (err: any) {
      console.warn('[Database] External PostgreSQL connection failed:', err.message);
      console.log('[Database] Falling back to embedded PostgreSQL (PGlite engine)...');
    }
  } else {
    console.log('[Database] No external DATABASE_URL provided. Initializing embedded PostgreSQL (PGlite)...');
  }

  // 2. Initialize embedded PostgreSQL engine (PGlite)
  const dataDir = path.join(process.cwd(), 'data', 'agrorent_pg');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Remove stale postmaster lock file if present from prior unclean shutdown
  const lockFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
      console.log('[Database] Cleaned up stale postmaster.pid lock file.');
    } catch (e) {
      // ignore
    }
  }

  pgliteInstance = new PGlite(dataDir);
  await pgliteInstance.waitReady;
  activeEngine = 'pglite';
  console.log('[Database] Embedded PostgreSQL (PGlite) ready and persisted at:', dataDir);

  return {
    query: async <T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> => {
      return enqueuePGlite(async () => {
        const res = await pgliteInstance!.query<T>(sql, params);
        return {
          rows: res.rows || [],
          rowCount: res.rows ? res.rows.length : 0,
        };
      });
    },
  };
}

export async function query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
  const db = await getDb();
  return db.query<T>(sql, params);
}

export function getActiveEngine(): string {
  return activeEngine;
}

export async function withTransaction<T>(
  callback: (tx: { query: <R = any>(sql: string, params?: any[]) => Promise<QueryResult<R>> }) => Promise<T>
): Promise<T> {
  await getDb(); // Ensure initialized
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback({
        query: async <R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> => {
          const res = await client.query(sql, params);
          return { rows: res.rows as unknown as R[], rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0) };
        },
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.warn('[Transaction] Rollback error:', rbErr);
      }
      throw err;
    } finally {
      client.release();
    }
  } else if (pgliteInstance) {
    return enqueuePGlite(async () => {
      try {
        await pgliteInstance!.query('BEGIN');
        const result = await callback({
          query: async <R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> => {
            const res = await pgliteInstance!.query<R>(sql, params);
            return { rows: (res.rows || []) as unknown as R[], rowCount: res.rows ? res.rows.length : 0 };
          },
        });
        await pgliteInstance!.query('COMMIT');
        return result;
      } catch (err) {
        try {
          await pgliteInstance!.query('ROLLBACK');
        } catch (rbErr) {
          console.warn('[Transaction] Rollback error:', rbErr);
        }
        throw err;
      }
    });
  } else {
    await query('BEGIN');
    try {
      const result = await callback({ query });
      await query('COMMIT');
      return result;
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  }
}
