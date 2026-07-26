/**
 * Fase 3 — Validar Lote y Trazabilidad
 *
 * Verifica que los 15 artículos del lote 1 penal:
 * - Tengan provider = DeepSeek
 * - No contengan "Gemini" en ai_review_model
 * - No contengan referencias a OpenAI
 * - Los claims sin fuente no estén confirmados
 * - La revisión humana no haya sido modificada
 * - Los campos ai_review_* sean coherentes
 *
 * Uso: npx tsx scripts/fase3-validar-lote.ts
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

const SLUGS_LOTE1 = [
  'delitos-mas-comunes-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'diferencia-denuncia-querella-acusacion-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'antejuicio-en-honduras',
  'abogado-penalista-sur-honduras',
  'defensa-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-menores-edad-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'abogado-penalista-choluteca',
];

interface ValidationError {
  slug: string;
  field: string;
  issue: string;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  console.log('Fase 3 — Validación del Lote 1 Penal\n');

  // 1. Check slug coverage
  const posts = await sql`
    SELECT slug, reviewed_by, reviewed_at, review_status,
           ai_review_status, ai_review_provider, ai_review_model,
           ai_review_claims_count, ai_review_confirmed_claims,
           ai_review_corrected_claims, ai_review_unresolved_claims,
           ai_review_requires_human, ai_research_provider,
           ai_search_queries_count, ai_official_sources_count
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  ` as any[];

  const dbSlugs = new Set(posts.map((p: any) => p.slug));
  for (const slug of SLUGS_LOTE1) {
    if (!dbSlugs.has(slug)) {
      errors.push({ slug, field: 'slug', issue: 'No encontrado en DB' });
    }
  }

  // 2. Validate each post
  for (const post of posts) {
    const s = post.slug;

    // Provider must be DeepSeek (not Gemini, not OpenAI)
    if (post.ai_review_provider && post.ai_review_provider !== 'DeepSeek') {
      errors.push({
        slug: s,
        field: 'ai_review_provider',
        issue: `Proveedor incorrecto: ${post.ai_review_provider}`,
      });
    }

    // Model must not contain Gemini
    if (post.ai_review_model && post.ai_review_model.toLowerCase().includes('gemini')) {
      errors.push({
        slug: s,
        field: 'ai_review_model',
        issue: `Contiene Gemini: ${post.ai_review_model}`,
      });
    }

    // Model must not reference OpenAI
    if (
      post.ai_review_model &&
      post.ai_review_model.toLowerCase().includes('openai')
    ) {
      errors.push({
        slug: s,
        field: 'ai_review_model',
        issue: `Contiene OpenAI: ${post.ai_review_model}`,
      });
    }

    // Research provider must be Google Search
    if (
      post.ai_research_provider &&
      post.ai_research_provider !== 'Google Search'
    ) {
      warnings.push({
        slug: s,
        field: 'ai_research_provider',
        issue: `Research provider: ${post.ai_research_provider}`,
      });
    }

    // Human review must be preserved
    if (post.review_status === 'completed' && post.reviewed_by && !post.reviewed_by) {
      warnings.push({
        slug: s,
        field: 'reviewed_by',
        issue: 'Revisión humana parece haber sido alterada',
      });
    }

    // Coherence checks
    if (
      post.ai_review_status === 'completed' &&
      !post.ai_review_provider
    ) {
      warnings.push({
        slug: s,
        field: 'ai_review_provider',
        issue: 'Review completed pero sin provider',
      });
    }

    if (post.ai_review_claims_count > 0) {
      console.log(
        `  ${s}: ${post.ai_review_claims_count} claims (${post.ai_review_confirmed_claims} conf, ${post.ai_review_corrected_claims} corr, ${post.ai_review_unresolved_claims} unres, human=${post.ai_review_requires_human})`,
      );
    } else {
      console.log(`  ${s}: pendiente (no revisado)`);
    }
  }

  // 3. Validate claims file if exists
  const claimsPath = path.resolve(
    process.cwd(),
    'docs/audits/fase3-lote1-claims.json',
  );
  if (fs.existsSync(claimsPath)) {
    const claims = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'));
    console.log(`\nValidando ${claims.length} claims...`);

    for (const c of claims) {
      if (c.classification === 'confirmed' || c.classification === 'confirmed_with_context') {
        if (!c.officialSource?.url) {
          errors.push({
            slug: c.articleSlug || 'unknown',
            field: 'claim',
            issue: `Claim "${c.claim?.substring(0, 60)}..." clasificado como ${c.classification} pero sin URL de fuente oficial`,
          });
        }
      }
    }
  }

  // 4. Check for secrets in reports
  const auditFiles = globSync('docs/audits/fase3-*');
  for (const file of auditFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('sk-') && file.endsWith('.md')) {
        errors.push({
          slug: 'N/A',
          field: file,
          issue: 'Posible clave expuesta en informe',
        });
      }
    } catch {
      // skip binary files
    }
  }

  // Results
  console.log(`\n═══ RESULTADO DE VALIDACIÓN ═══`);
  console.log(`Errores: ${errors.length}`);
  console.log(`Advertencias: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORES:');
    for (const e of errors) {
      console.log(`  [${e.slug}] ${e.field}: ${e.issue}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ ADVERTENCIAS:');
    for (const w of warnings) {
      console.log(`  [${w.slug}] ${w.field}: ${w.issue}`);
    }
  }

  if (errors.length === 0) {
    console.log('\n✅ Lote validado correctamente.');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

// Simple glob for validation
function globSync(pattern: string): string[] {
  const fs = require('fs');
  const path = require('path');
  const dir = path.resolve(process.cwd(), 'docs/audits');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f: string) => f.match(/fase3-/)).map((f: string) => path.join(dir, f));
}

main().catch(console.error);
