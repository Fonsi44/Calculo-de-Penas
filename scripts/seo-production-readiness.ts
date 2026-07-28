import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import cutover from '../data/seo/editorial-cutover.json';
import { resolveEditorialIndexingMode } from '../lib/editorial-cutover';
import {
  calculateReadiness,
  type ReadinessBlogRow,
} from '../lib/production-readiness';

async function countCurrentProductionBlogUrls(): Promise<number> {
  try {
    const response = await fetch(cutover.production_sitemap_snapshot.source);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1])
      .filter((url) => {
        try {
          const segments = new URL(url).pathname.split('/').filter(Boolean);
          return segments.length === 3 && segments[0] === 'blog';
        } catch {
          return false;
        }
      }).length;
  } catch {
    return cutover.production_sitemap_snapshot.observed_urls;
  }
}

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    throw new Error('DATABASE_URL no configurada para el readiness editorial.');
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT slug, category, author, body, review_status, reviewed_by, reviewed_at,
           published, noindex, canonical_url
    FROM blog_posts
  ` as ReadinessBlogRow[];
  const currentBlogUrls = await countCurrentProductionBlogUrls();
  const { summary, failures } = calculateReadiness(
    rows,
    currentBlogUrls,
    cutover.approved_removal_urls.length,
  );

  for (const migration of cutover.required_migrations) {
    if (!existsSync(resolve('drizzle/migrations', migration))) {
      failures.push(`Falta la migración editorial requerida: ${migration}.`);
    }
  }
  if (!existsSync(resolve(cutover.required_redirect_register))) {
    failures.push(`Falta el registro de redirects: ${cutover.required_redirect_register}.`);
  }
  if (cutover.state !== 'approved') failures.push('El gate versionado continúa desactivado.');
  const production = (process.env.VERCEL_ENV ?? process.env.APP_ENV) === 'production';
  if (production && resolveEditorialIndexingMode(process.env) !== 'strict-review') {
    failures.push('Production no tiene autorización explícita de cutover.');
  }

  console.log(JSON.stringify(summary, null, 2));
  console.log(`mode: ${resolveEditorialIndexingMode(process.env)}`);
  console.log(`gate: ${failures.length === 0 ? 'READY' : 'BLOCKED'}`);
  for (const failure of failures) console.log(`- ${failure}`);
  if (failures.length > 0) process.exitCode = 1;
}

void main();
