import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { isEmailConfigured } from '@/lib/email';
import { getEnvironmentName } from '@/lib/staging-guard';
import drizzleJournal from '@/drizzle/migrations/meta/_journal.json';
import manualMigrationManifest from '@/tools/db/manual-migrations.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface ReadinessCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unready';
  details?: string;
}

export function summarizeReadiness(checks: ReadinessCheck[]) {
  if (checks.some(({ status }) => status === 'unready')) return 'unready' as const;
  if (checks.some(({ status }) => status === 'degraded')) return 'degraded' as const;
  return 'healthy' as const;
}

export async function GET() {
  const checks: ReadinessCheck[] = [];
  const env = getEnvironmentName();

  // DB check
  try {
    await db.execute(sql`SELECT 1 AS ok`);
    checks.push({ name: 'database', status: 'healthy' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    checks.push({ name: 'database', status: 'unready', details: msg });
  }

  // Migrations check
  try {
    const result = await db.execute(
      sql`SELECT
        (SELECT COUNT(*)::int FROM drizzle.__drizzle_migrations) AS drizzle_count,
        (SELECT COUNT(*)::int FROM sgie_schema_migrations) AS manual_count`,
    );
    const row = result.rows?.[0] as { drizzle_count?: number; manual_count?: number } | undefined;
    const drizzleCount = row?.drizzle_count ?? 0;
    const manualCount = row?.manual_count ?? 0;
    const expectedDrizzle = drizzleJournal.entries.length;
    const expectedManual = manualMigrationManifest.entries.length;
    const migrationsHealthy = drizzleCount >= expectedDrizzle && manualCount >= expectedManual;
    checks.push({
      name: 'migrations',
      status: migrationsHealthy ? 'healthy' : 'degraded',
      details: `${drizzleCount}/${expectedDrizzle} Drizzle, ${manualCount}/${expectedManual} manuales`,
    });
  } catch {
    checks.push({ name: 'migrations', status: 'unready', details: 'no_accetable' });
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

  const overallStatus = summarizeReadiness(checks);
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
