import { Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';

let _pool: Pool | null = null;
let _db: NeonDatabase<Record<string, never>> | null = null;

function getDb() {
  if (_db) return _db;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required at runtime');
  }
  _pool = new Pool({ connectionString: dbUrl });
  _db = drizzle(_pool);
  return _db;
}

export const db = new Proxy({} as NeonDatabase<Record<string, never>>, {
  get(_target, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function closeDb(): Promise<void> {
  if (_pool) await _pool.end();
  _pool = null;
  _db = null;
}
