import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq, inArray } from 'drizzle-orm';
import 'dotenv/config';

const WRONG_SLUGS = [
  'pineda-asociados-bufete-multidisciplinario-honduras',
  'como-elegir-abogado-honduras',
  'importaciones-san-lorenzo',
  'cobro-deudas-choluteca',
  'costos-honorarios-abogados-como-funcionan-honduras',
  'elegir-bufete-abogados-nacaome',
  'hondurenos-en-espana-guia-legal-completa',
  'defensa-sar-choluteca',
  'como-elegir-buen-abogado-guia-practica-honduras',
  'elegir-bufete-multidisciplinario-ventajas-honduras',
  'demanda-laboral-choluteca',
  'accidente-transito-choluteca',
  'tramites-legales-nacaome',
  'divorcio-choluteca'
];

async function main() {
  // Get current state for backup
  const current = await db.select().from(blogPosts).where(inArray(blogPosts.slug, WRONG_SLUGS));
  console.log(`Found ${current.length} articles to restore`);
  
  // Backup
  const fs = await import('fs');
  fs.writeFileSync('.backups/fase6d-pre-restore-wrong-articles.json', JSON.stringify(current, null, 2));
  console.log('Backup saved to .backups/fase6d-pre-restore-wrong-articles.json');
  
  // Show dry-run
  for (const r of current) {
    console.log(`  ${r.slug}: ai_review_status=${r.aiReviewStatus} (will set to not_started)`);
  }
  
  // Apply restoration
  for (const slug of WRONG_SLUGS) {
    await db.update(blogPosts)
      .set({
        aiReviewStatus: 'not_started',
        aiReviewRequiresHuman: false,
        aiReviewClaimsCount: 0,
        aiReviewConfirmedClaims: 0,
        aiReviewCorrectedClaims: 0,
        aiReviewUnresolvedClaims: 0,
        aiReviewSources: [],
        aiReviewedAt: null,
        aiReviewProvider: null,
        aiReviewModel: null,
        aiReviewVersion: null
      })
      .where(eq(blogPosts.slug, slug));
  }
  
  console.log(`\n✅ Restored AI fields for ${WRONG_SLUGS.length} articles to not_started`);
  console.log('No editorial state was changed.');
}

main();
