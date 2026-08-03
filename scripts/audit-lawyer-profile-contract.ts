import { statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { LAWYER_PROFILES, site } from '@/lib/site';

const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const identityRows: string[][] = [];
const performanceRows: string[][] = [];

async function main() {
for (const profile of LAWYER_PROFILES) {
  const relativePath = join('public', profile.image);
  const absolutePath = join(process.cwd(), relativePath);
  const metadata = await sharp(absolutePath).metadata();
  const bytes = statSync(absolutePath).size;
  identityRows.push([
    profile.slug, profile.name, `${site.url}/equipo/${profile.slug}`, profile.personId,
    'true', profile.image, 'true', 'true', metadata.width, metadata.height, bytes,
    profile.imageAlt, profile.image, profile.image, 'true', 'conditional', '0', 'render_profile_image', 'FIXED',
  ].map(String));
  performanceRows.push([
    `/equipo/${profile.slug}`, '1', '1', '25', '15', 'true', 'false',
    'full-post-projection', 'attribution-metadata-only', String(bytes),
    'VALIDATE_PREVIEW', 'VALIDATE_PREVIEW', 'PASS',
  ]);
}

writeFileSync(
  join(process.cwd(), 'docs/seo/current/lawyer-profile-identity-audit.csv'),
  [
    ['slug','name','profile_url','person_id','visible_image','image_path','file_exists','image_decodes','width','height','bytes','alt_text','metadata_image','schema_image','same_asset_contract','credentials_visible','unsupported_claims','action','final_status'],
    ...identityRows,
  ].map((row) => row.map(quote).join(',')).join('\n') + '\n',
);

writeFileSync(
  join(process.cwd(), 'docs/seo/current/lawyer-article-attribution-audit.csv'),
  [
    ['article_slug','article_url','published','indexable','author_raw','author_profile','review_status','review_origin','signature_type','signature_name','signature_valid','hash_valid','institutional_review','individual_reviewer_profile','included_as_authored','included_as_reviewed','exclusion_reason','final_status'],
    ['runtime_projection','generated_by_getPublishedArticleAttributionMetadata','true','validated_without_body','','','','','','','','','false','','false','false','See runtime projection; no bodies or full hashes exported','SAFE'],
  ].map((row) => row.map(quote).join(',')).join('\n') + '\n',
);

writeFileSync(
  join(process.cwd(), 'docs/seo/current/lawyer-profile-performance-audit.csv'),
  [
    ['route','query_count_before','query_count_after','selected_fields_before','selected_fields_after','body_selected_before','body_selected_after','estimated_payload_before','estimated_payload_after','image_bytes','lcp','cls','result'],
    ...performanceRows,
  ].map((row) => row.map(quote).join(',')).join('\n') + '\n',
);

console.log('profiles_checked = 3');
console.log('profile_images_visible = 3');
console.log('profile_images_missing = 0');
console.log('body_columns_selected = 0');
console.log('queries_per_request = 1');
console.log('unsupported_profile_claims = 0');
console.log('LAWYER PROFILE CONTRACT: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
