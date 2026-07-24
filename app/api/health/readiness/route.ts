import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { isEmailConfigured } from '@/lib/email';
import { getEnvironmentName } from '@/lib/staging-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReadinessCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unready';
  details?: string;
}

export async function GET() {
  const checks: ReadinessCheck[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unready' = 'healthy';
  const env = getEnvironmentName();

  // DB check
  try {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    checks.push({ name: 'database', status: 'healthy' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    checks.push({ name: 'database', status: 'unready', details: msg });
    overallStatus = 'unready';
  }

  // Migrations check
  try {
    const result = await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM drizzle.__drizzle_migrations`,
    );
    const count = (result.rows?.[0] as { count?: number })?.count ?? 0;
    checks.push({ name: 'migrations', status: count >= 55 ? 'healthy' : 'degraded', details: `${count} migraciones` });
  } catch {
    checks.push({ name: 'migrations', status: 'unready', details: 'no_accetable' });
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  // Blob token check
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    checks.push({ name: 'blob_storage', status: 'healthy' });
  } else {
    checks.push({ name: 'blob_storage', status: 'degraded', details: 'no token configurado' });
  }

  // Cron secret check
  if (process.env.CRON_SECRET) {
    checks.push({ name: 'cron', status: 'healthy' });
  } else {
    checks.push({ name: 'cron', status: 'degraded', details: 'no cron secret configurado' });
  }

  // Email check (optional)
  if (isEmailConfigured()) {
    checks.push({ name: 'email', status: 'healthy' });
  } else {
    checks.push({ name: 'email', status: 'degraded', details: 'email no configurado (modo degradado)' });
  }

  // IA check (optional)
  if (process.env.IA_DOCUMENTAL_API_KEY || process.env.DEEPSEEK_API_KEY) {
    checks.push({ name: 'ai_provider', status: 'healthy' });
  } else {
    checks.push({ name: 'ai_provider', status: 'degraded', details: 'IA no configurada (modo heuristic)' });
  }

  return NextResponse.json(
    {
      status: overallStatus,
      environment: env,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: overallStatus === 'unready' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
