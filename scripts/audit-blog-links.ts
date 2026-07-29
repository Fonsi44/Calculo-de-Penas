import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import {
  normalizeBlogLinksForRender,
  type BlogLinkIssue,
  type BlogLinkIssueClassification,
} from '@/lib/blog-link-normalizer';

type BlogRow = {
  slug: string;
  category: string;
  body: string;
  published: boolean;
  reviewed_content_hash: string | null;
  signature_valid: boolean | null;
};

type ReportRow = {
  slug: string;
  fragment: string;
  href: string;
  classification: BlogLinkIssueClassification | 'internal_404';
  proposed_target: string;
  resolution: BlogLinkIssue['resolution'] | 'redirect';
  blocking: boolean;
  signature_hash_risk: BlogLinkIssue['signatureRisk'] | 'body_change_would_invalidate_hash';
};

const REPORT_PATH = resolve('docs/seo/current/blog-links-audit.csv');
const PUBLIC_BASE = 'https://www.pinedayasociadoshn.com';
const BODY_PLACEHOLDERS = /(?:\bTODO\b|\bPENDIENTE\b|\bREEMPLAZAR\b|\{\{[^}]+\}\}|\[\.\.\.\]|\bURL_AQUI\b|\bENLACE_AQUI\b)/g;
const HREF_PATTERN = /<a\b[^>]*\bhref\s*=\s*(["'])([^"']*)\1/gi;

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function fragment(body: string, needle: string): string {
  const index = Math.max(0, body.indexOf(needle));
  return body
    .slice(Math.max(0, index - 70), Math.min(body.length, index + needle.length + 70))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHrefs(body: string): string[] {
  const hrefs: string[] = [];
  HREF_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HREF_PATTERN.exec(body)) !== null) hrefs.push(match[2]);
  return hrefs;
}

async function inspectInternalRoutes(
  rows: BlogRow[],
  report: ReportRow[],
): Promise<void> {
  const occurrences = new Map<string, Set<string>>();
  for (const row of rows) {
    for (const href of extractHrefs(row.body)) {
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const path = href.split('#')[0].split('?')[0];
      if (!path) continue;
      const slugs = occurrences.get(path) ?? new Set<string>();
      slugs.add(row.slug);
      occurrences.set(path, slugs);
    }
  }

  const paths = [...occurrences.keys()];
  for (let index = 0; index < paths.length; index += 12) {
    const batch = paths.slice(index, index + 12);
    const responses = await Promise.all(batch.map(async (path) => {
      try {
        return await fetch(`${PUBLIC_BASE}${path}`, { redirect: 'manual' });
      } catch {
        return null;
      }
    }));
    batch.forEach((path, offset) => {
      const response = responses[offset];
      if (!response) return;
      const redirectTarget = response.headers.get('location') ?? '';
      if (response.status >= 300 && response.status < 400 && redirectTarget) {
        for (const slug of occurrences.get(path) ?? []) {
          report.push({
            slug,
            fragment: path,
            href: path,
            classification: 'internal_redirect_origin',
            proposed_target: redirectTarget,
            resolution: 'redirect',
            blocking: false,
            signature_hash_risk: 'body_change_would_invalidate_hash',
          });
        }
      } else if (response.status === 404) {
        for (const slug of occurrences.get(path) ?? []) {
          report.push({
            slug,
            fragment: path,
            href: path,
            classification: 'internal_404',
            proposed_target: '',
            resolution: 'body_change_requires_review',
            blocking: true,
            signature_hash_risk: 'body_change_would_invalidate_hash',
          });
        }
      }
    });
  }
}

async function main(): Promise<void> {
  const previewEnv = existsSync('.env.e2e.local')
    ? config({ path: '.env.e2e.local', quiet: true }).parsed ?? {}
    : {};
  const databaseUrl = process.env.PREVIEW_DATABASE_URL ?? previewEnv.DATABASE_URL;
  const environment = process.env.E2E_ENVIRONMENT ?? previewEnv.E2E_ENVIRONMENT;
  const productionBranchId = process.env.NEON_PRODUCTION_BRANCH_ID
    ?? previewEnv.NEON_PRODUCTION_BRANCH_ID;
  if (!databaseUrl || environment !== 'staging') {
    throw new Error('La auditoría exige la rama Preview/staging aislada.');
  }

  const sql = neon(databaseUrl);
  const branch = await sql`SELECT current_setting('neon.branch_id', true) AS branch_id`;
  const branchId = String(branch[0]?.branch_id ?? '');
  if (!branchId || branchId === productionBranchId) {
    throw new Error('La auditoría rechazó una conexión no aislada de Production.');
  }

  const rows = await sql`
    SELECT slug, category, body, published, reviewed_content_hash, signature_valid
    FROM blog_posts
    WHERE published = true
    ORDER BY slug
  ` as unknown as BlogRow[];
  if (rows.length !== 135) {
    throw new Error(`Inventario Preview inesperado: ${rows.length}/135.`);
  }

  const report: ReportRow[] = [];
  for (const row of rows) {
    const analysis = normalizeBlogLinksForRender(row.body);
    for (const finding of analysis.issues) {
      report.push({
        slug: row.slug,
        fragment: fragment(row.body, finding.href),
        href: finding.href,
        classification: finding.classification,
        proposed_target: finding.proposedTarget,
        resolution: finding.resolution,
        blocking: finding.blocking,
        signature_hash_risk: finding.signatureRisk,
      });
    }
    for (const match of row.body.matchAll(BODY_PLACEHOLDERS)) {
      const value = match[0];
      if (report.some((finding) => finding.slug === row.slug && finding.href.includes(value))) continue;
      report.push({
        slug: row.slug,
        fragment: fragment(row.body, value),
        href: '',
        classification: 'explicit_placeholder',
        proposed_target: '',
        resolution: 'body_change_requires_review',
        blocking: true,
        signature_hash_risk: 'body_change_would_invalidate_hash',
      });
    }
  }
  await inspectInternalRoutes(rows, report);

  const headers: Array<keyof ReportRow> = [
    'slug',
    'fragment',
    'href',
    'classification',
    'proposed_target',
    'resolution',
    'blocking',
    'signature_hash_risk',
  ];
  writeFileSync(
    REPORT_PATH,
    [
      headers.map(csvCell).join(','),
      ...report.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
    ].join('\n') + '\n',
  );

  const counts = report.reduce<Record<string, number>>((result, finding) => {
    result[finding.classification] = (result[finding.classification] ?? 0) + 1;
    return result;
  }, {});
  const blocking = report.filter((finding) => finding.blocking);
  console.log(JSON.stringify({
    inspectedArticles: rows.length,
    signedArticles: rows.filter((row) => row.signature_valid && row.reviewed_content_hash).length,
    findings: report.length,
    blocking: blocking.length,
    counts,
    productionWrites: 0,
    report: REPORT_PATH,
  }, null, 2));
  if (blocking.length) {
    console.error(`BLOG LINKS AUDIT: FAIL (${blocking.length} incidencias bloqueantes)`);
    process.exitCode = 1;
  } else {
    console.log('BLOG LINKS AUDIT: PASS');
  }
}

void main();
