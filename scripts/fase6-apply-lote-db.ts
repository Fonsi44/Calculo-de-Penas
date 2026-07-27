import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const args = process.argv.slice(2);
  const loteNumStr = args.find(a => a.startsWith('--lote='))?.split('=')[1];
  if (!loteNumStr) {
    console.error("Missing --lote=N parameter");
    process.exit(1);
  }
  const loteNum = parseInt(loteNumStr);

  const planPath = path.join(__dirname, '../docs/audits/fase6-plan-ejecucion-lotes.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  const lote = plan.lotes.find((l: any) => l.numero === loteNum);
  if (!lote) {
    console.error(`Lote ${loteNum} not found in plan`);
    process.exit(1);
  }

  const loteDir = path.join(__dirname, `../docs/audits/fase6/lote-${loteNum}`);

  console.log(`Applying DB updates for Lote ${loteNum}...`);

  let count = 0;
  for (const slug of lote.slugs) {
    const postDir = path.join(loteDir, slug);
    const decisionPath = path.join(postDir, 'decision-final.json');
    const pasadaAPath = path.join(postDir, 'pasada-a.json');
    const pasadaBPath = path.join(postDir, 'pasada-b.json');

    if (!fs.existsSync(decisionPath) || !fs.existsSync(pasadaAPath)) {
      console.warn(`Skipping ${slug} - decision or pasada-a missing`);
      continue;
    }

    const dec = JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));
    const a = JSON.parse(fs.readFileSync(pasadaAPath, 'utf-8'));
    const b = fs.existsSync(pasadaBPath) ? JSON.parse(fs.readFileSync(pasadaBPath, 'utf-8')) : null;

    // Calculate claims counts
    const claims = a.claims || [];
    const claimsCount = claims.length;

    let confirmedCount = 0;
    let correctedCount = 0;
    
    // Check match outcomes
    const bClaimsList = b ? (b.claimsRevisados || b.claims || []) : [];
    const getClaimKey = (c: any) => (c.claimId || c.id || c.claim || c.textoExacto || '').trim();
    const bClaimsMap = new Map(bClaimsList.map((c: any) => [getClaimKey(c), c]));

    for (const c of claims) {
      const cKey = getClaimKey(c);
      const bRev = bClaimsMap.get(cKey) as any;
      
      const isA_Correction = 
        c.decision === 'corrected' || 
        c.verification_status === 'corrected' || 
        c.verdict === 'incorrecto' || 
        c.verdict === 'parcialmente_correcto';

      const decisionB = bRev ? (bRev.pasadaB_decision || bRev.decisionPasadaB || '') : '';
      const isRejected = decisionB.toLowerCase().includes('rechaz') || (bRev && bRev.acuerdo === false);

      if (isA_Correction && !isRejected && dec.estadoFinal === 'corrected') {
        correctedCount++;
      } else if (!isA_Correction && !isRejected) {
        confirmedCount++;
      }
    }

    const unresolvedCount = claimsCount - confirmedCount - correctedCount;

    // Collect sources
    const sourcesSet = new Set<string>();
    for (const c of claims) {
      if (c.sources) {
        c.sources.forEach((s: any) => {
          if (typeof s === 'string') sourcesSet.add(s);
          else if (s && s.titulo) sourcesSet.add(s.titulo);
        });
      }
      if (c.fuentes) {
        c.fuentes.forEach((s: any) => {
          if (typeof s === 'string') sourcesSet.add(s);
          else if (s && s.titulo) sourcesSet.add(s.titulo);
        });
      }
      if (c.source) {
        sourcesSet.add(typeof c.source === 'string' ? c.source : c.source.titulo || '');
      }
    }
    const sources = Array.from(sourcesSet).filter(Boolean);

    await db.update(blogPosts)
      .set({
        aiReviewStatus: dec.estadoFinal,
        aiReviewRequiresHuman: dec.estadoFinal === 'needs_human_review',
        aiReviewClaimsCount: claimsCount,
        aiReviewConfirmedClaims: confirmedCount,
        aiReviewCorrectedClaims: correctedCount,
        aiReviewUnresolvedClaims: unresolvedCount,
        aiReviewSources: sources,
        aiReviewedAt: new Date(),
        aiReviewProvider: 'google',
        aiReviewModel: 'gemini-3.1-pro',
        aiReviewVersion: '1.0'
      })
      .where(eq(blogPosts.slug, slug));

    count++;
  }

  console.log(`Successfully updated ${count} articles in Neon DB.`);
}

main().catch(console.error);
