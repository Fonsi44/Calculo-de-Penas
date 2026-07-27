import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function main() {
  const lotes = [12, 13, 14];
  let total = 0;
  
  for (const loteNum of lotes) {
    const loteDir = path.join(__dirname, `../docs/audits/fase6/lote-${loteNum}`);
    if (!fs.existsSync(loteDir)) continue;
    
    let count = 0;
    for (const slug of fs.readdirSync(loteDir)) {
      if (slug.startsWith('.')) continue;
      const dp = path.join(loteDir, slug, 'decision-final.json');
      if (!fs.existsSync(dp)) continue;
      
      const dec = JSON.parse(fs.readFileSync(dp, 'utf-8'));
      const estado = dec.estadoFinal;
      const claims = dec.claims || {};
      
      await db.update(blogPosts)
        .set({
          aiReviewStatus: estado,
          aiReviewRequiresHuman: estado === 'needs_human_review',
          aiReviewClaimsCount: claims.totales || 0,
          aiReviewConfirmedClaims: claims.confirmed || 0,
          aiReviewCorrectedClaims: claims.corrected || 0,
          aiReviewUnresolvedClaims: (claims.needsHumanReview || 0) + (claims.unsupported || 0) + (claims.ambiguous || 0),
          aiReviewSources: [],
          aiReviewedAt: new Date(),
          aiReviewProvider: 'google',
          aiReviewModel: 'gemini-3.1-pro',
          aiReviewVersion: '2.0'
        })
        .where(eq(blogPosts.slug, slug));
      count++;
    }
    console.log(`Lote ${loteNum}: ${count} artículos sincronizados`);
    total += count;
  }
  console.log(`\n✅ Total sincronizado: ${total} artículos`);
}
main();
