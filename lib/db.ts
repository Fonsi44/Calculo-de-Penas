import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

let _sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<Record<string, never>> | null = null;

function getDb() {
  if (_db) return _db;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required at runtime');
  }
  _sql = neon(dbUrl);
  _db = drizzle(_sql);
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<Record<string, never>>, {
  get(_target, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
