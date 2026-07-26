/**
 * Fase 3 — Ejecutor DeepSeek V4 Pro
 *
 * Capa B del proceso. Recibe evidencia de Google Search (Capa A) y
 * analiza claims jurídicos con DeepSeek.
 *
 * Uso:
 *   npx tsx scripts/fase3-ejecutor-deepseek.ts --dry-run
 *   npx tsx scripts/fase3-ejecutor-deepseek.ts --aplicar
 *
 * Requiere:
 *   - data/lote-penal-1.json (artículos exportados)
 *   - docs/audits/fase3-lote1-google-search.json (evidencia de Google Search)
 *
 * Genera:
 *   - docs/audits/fase3-lote1-deepseek.json (resultados del análisis)
 *   - docs/audits/fase3-lote1-claims.json (claims estructurados)
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { reviewArticle, getProviderInfo } from '../lib/ai/deepseek-blog-review';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

const LOTE_PATH = path.resolve(process.cwd(), 'data/lote-penal-1.json');
const EVIDENCE_PATH = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-google-search.json',
);
const OUTPUT_DEEPSEEK = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-deepseek.json',
);
const OUTPUT_CLAIMS = path.resolve(
  process.cwd(),
  'docs/audits/fase3-lote1-claims.json',
);

interface ArticleExport {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
}

interface GoogleEvidenceEntry {
  slug: string;
  extractedClaims: string[];
  searchQueries: string[];
  officialSourcesOpened: Array<{
    institution: string;
    title: string;
    url: string;
    law?: string;
    article?: string;
    publishedAt?: string;
    consultedAt: string;
  }>;
  sourceExcerpts: string;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const aplicar = process.argv.includes('--aplicar');
  const resume = process.argv.includes('--resume');

  if (!dryRun && !aplicar) {
    console.error('Especifica --dry-run o --aplicar');
    process.exit(1);
  }

  console.log('Fase 3 — Ejecutor DeepSeek V4 Pro');
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}`);
  console.log();

  const providerInfo = getProviderInfo();
  console.log(`Proveedor: ${providerInfo.provider}`);
  console.log(`Modelo: ${providerInfo.model}`);
  console.log();

  if (!fs.existsSync(LOTE_PATH)) {
    console.error(`No se encontró ${LOTE_PATH}. Ejecuta primero fase3-exportar-lote.ts`);
    process.exit(1);
  }

  const articles: ArticleExport[] = JSON.parse(fs.readFileSync(LOTE_PATH, 'utf-8'));
  console.log(`Artículos cargados: ${articles.length}`);

  let evidenceMap: Map<string, GoogleEvidenceEntry> = new Map();
  if (fs.existsSync(EVIDENCE_PATH)) {
    const raw = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf-8'));
    const evidenceList: GoogleEvidenceEntry[] = Array.isArray(raw) ? raw : (raw.articles || []);
    for (const e of evidenceList) {
      evidenceMap.set(e.slug, e);
    }
  }
  console.log(
    `Evidencia Google Search cargada: ${evidenceMap.size} artículos con evidencia`,
  );

  const results: any[] = [];
  const allClaims: any[] = [];
  const completedSlugs = new Set<string>();

  if (resume && fs.existsSync(OUTPUT_DEEPSEEK)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_DEEPSEEK, 'utf-8'));
      for (const r of existing) {
        if (!r.error) {
          results.push(r);
          completedSlugs.add(r.slug);
        }
      }
      if (fs.existsSync(OUTPUT_CLAIMS)) {
        const existingClaims = JSON.parse(fs.readFileSync(OUTPUT_CLAIMS, 'utf-8'));
        for (const c of existingClaims) {
          allClaims.push(c);
        }
      }
      console.log(`Resumen: ${completedSlugs.size} artículos ya procesados.`);
    } catch {
      console.log('No se pudo leer resultados existentes. Empezando desde cero.');
    }
  }

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ${article.slug}`);
    
    if (resume && completedSlugs.has(article.slug)) {
      console.log(`  ⏭️ Ya procesado. Saltando.`);
      continue;
    }

    const evidence = evidenceMap.get(article.slug);
    if (!evidence) {
      console.log(`  ⚠️ Sin evidencia Google Search. Saltando.`);
      continue;
    }

    const body = article.body || '';
    const cleanBody = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (dryRun) {
      console.log(`  [DRY-RUN] Se analizaría: ${cleanBody.length} chars, ${evidence.extractedClaims.length} claims, ${evidence.officialSourcesOpened.length} fuentes oficiales`);
      continue;
    }

    try {
      const analysis = await reviewArticle({
        title: article.title,
        body: cleanBody,
        slug: article.slug,
        extractedClaims: evidence.extractedClaims,
        evidence: {
          claims: evidence.extractedClaims,
          searchQueries: evidence.searchQueries,
          officialSourcesOpened: evidence.officialSourcesOpened,
          sourceExcerpts: evidence.sourceExcerpts,
        },
      });

      const confirmed = analysis.claims.filter((c) =>
        c.classification.startsWith('confirmed'),
      ).length;
      const corrected = analysis.claims.filter(
        (c) => c.classification === 'incorrect' || c.classification === 'outdated',
      ).length;
      const unresolved = analysis.claims.filter(
        (c) =>
          c.classification === 'unsupported' ||
          c.classification === 'ambiguous' ||
          c.classification === 'requires_human_judgment',
      ).length;
      const requiresHuman = analysis.claims.filter(
        (c) => c.requiresHumanReview,
      ).length;

      results.push({
        id: article.id,
        slug: article.slug,
        title: article.title,
        analyzedAt: new Date().toISOString(),
        provider: providerInfo.provider,
        model: providerInfo.model,
        claims: analysis.claims,
        summary: analysis.summary,
        overallConfidence: analysis.overallConfidence,
        counts: {
          total: analysis.claims.length,
          confirmed,
          corrected,
          unresolved,
          requiresHuman,
        },
      });

      for (const claim of analysis.claims) {
        allClaims.push({
          articleSlug: article.slug,
          articleTitle: article.title,
          ...claim,
        });
      }

      console.log(
        `  ✅ ${analysis.claims.length} claims: ${confirmed} confirmados, ${corrected} corregidos, ${unresolved} no resueltos, ${requiresHuman} requieren abogado`,
      );

      // Guardado incremental para evitar pérdidas por timeout
      fs.writeFileSync(OUTPUT_DEEPSEEK, JSON.stringify(results, null, 2));
      fs.writeFileSync(OUTPUT_CLAIMS, JSON.stringify(allClaims, null, 2));

      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      results.push({
        id: article.id,
        slug: article.slug,
        error: error.message,
      });
    }
  }

  if (!dryRun) {
    console.log(`\nResultados DeepSeek: ${OUTPUT_DEEPSEEK}`);
    console.log(`Claims estructurados: ${OUTPUT_CLAIMS}`);

    const totalClaims = allClaims.length;
    const confirmed = allClaims.filter((c) =>
      c.classification.startsWith('confirmed'),
    ).length;
    const corrected = allClaims.filter(
      (c) => c.classification === 'incorrect' || c.classification === 'outdated',
    ).length;
    const unresolved = allClaims.filter(
      (c) =>
        c.classification === 'unsupported' ||
        c.classification === 'ambiguous' ||
        c.classification === 'requires_human_judgment',
    ).length;

    console.log(`\n📊 RESUMEN DEL LOTE:`);
    console.log(`   Total claims: ${totalClaims}`);
    console.log(`   Confirmados: ${confirmed}`);
    console.log(`   Corregidos: ${corrected}`);
    console.log(`   No resueltos: ${unresolved}`);
  }
}

main().catch(console.error);
