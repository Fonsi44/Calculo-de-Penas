import 'dotenv/config';
import { existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import cutover from '../data/seo/editorial-cutover.json';
import { resolveEditorialIndexingMode } from '../lib/editorial-cutover';
import {
  editorialSignatureSchemaMode,
  hashEditorialContent,
} from '../lib/editorial-signature';
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
  const schemaMode = editorialSignatureSchemaMode();
  const rows = schemaMode === 'MIGRATED_SIGNATURE_MODE'
    ? await sql`
        SELECT slug, category, author, body, review_status, reviewed_by, reviewed_at,
               review_origin, signature_type, signature_name, signature_candidate,
               reviewed_content_hash, signature_valid, published, noindex, canonical_url
        FROM blog_posts
      ` as ReadinessBlogRow[]
    : await sql`
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

  const pendingResignatures = readdirSync(resolve('data/seo/article-editorial-proposals'))
    .reduce((total, area) => total + readdirSync(resolve('data/seo/article-editorial-proposals', area))
      .filter((file) => file.endsWith('.json')).length, 0);
  const migrationReady = existsSync(resolve('drizzle/migrations/0059_blog_editorial_signatures.sql'));
  const rollbackReady = existsSync(resolve('scripts/rollback-editorial-signatures.ts'));
  const result = {
    safeReleaseReady: failures.length === 0,
    contentProposalReleaseReady: false,
    migrationReady,
    schemaMode,
    institutionalSignatures: summary.firm_reviewed,
    individualSignatures: summary.lawyer_signed,
    pendingResignatures,
    hashMismatches: schemaMode === 'MIGRATED_SIGNATURE_MODE'
      ? rows.filter((row) => (
        row.signature_valid !== true
        || row.reviewed_content_hash !== hashEditorialContent(row.body)
      )).length
      : 0,
    urlsBefore: summary.currently_indexable,
    urlsAfter: summary.indexable_after_cutover,
    urlsRemoved: summary.urls_removed,
    sitemapBefore: summary.currently_indexable,
    sitemapAfter: summary.indexable_after_cutover,
    rollbackReady,
  };
  console.log(JSON.stringify(result, null, 2));
  console.log(`mode: ${resolveEditorialIndexingMode(process.env)}`);
  console.log(`gate: ${failures.length === 0 ? 'READY' : 'BLOCKED'}`);
  for (const failure of failures) console.log(`- ${failure}`);
  if (failures.length > 0) process.exitCode = 1;
}

void main();
