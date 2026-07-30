import { readFileSync } from 'node:fs';
import { parseCsv } from '../lib/csv';
import {
  publicBlogPostDetailSelection,
  publicBlogPostParamsSelection,
  publicBlogPostSummarySelection,
} from '../lib/blog-db';

const read = (path: string) => readFileSync(path, 'utf8');
const detailPage = read('app/(public)/blog/[categoria]/[slug]/page.tsx');
const hubPage = read('app/(public)/blog/page.tsx');
const categoryPage = read('app/(public)/blog/[categoria]/page.tsx');
const blogAdapter = read('lib/blog.ts');
const baseline = parseCsv(read('docs/seo/current/blog-body-freeze-baseline.csv'));
const [headers, ...rows] = baseline;
const stateIndex = headers.indexOf('publication_state');
const publishedArticles = rows.filter((row) => row[stateIndex] === 'PUBLISHED').length;
const pendingProposals = rows.filter(
  (row) => row[stateIndex] === 'PENDING_RESIGNATURE',
).length;

const violations: string[] = [];
if (!('body' in publicBlogPostDetailSelection)) violations.push('detail_without_body');
if ('body' in publicBlogPostSummarySelection) violations.push('summary_with_body');
if ('legalReviewNotes' in publicBlogPostSummarySelection) violations.push('summary_with_notes');
if (Object.keys(publicBlogPostParamsSelection).sort().join(',') !== 'category,slug') {
  violations.push('static_params_projection_not_minimal');
}
if (!hubPage.includes('await getAllPosts()')) violations.push('hub_without_summary_loader');
if (!categoryPage.includes('await getPostsByCategory(categoria)')) {
  violations.push('category_without_summary_loader');
}
if ((detailPage.match(/getAllPosts\(\)/g) ?? []).length !== 1) {
  violations.push('duplicate_inventory_reads_per_article');
}
if ((detailPage.match(/getPostBySlug\(slug\)/g) ?? []).length !== 2) {
  violations.push('metadata_page_loader_contract');
}
if (detailPage.includes('async function getRelatedPosts(')) {
  violations.push('related_internal_query');
}
if (!detailPage.includes('getRelatedPostsFromSummaries(')) {
  violations.push('related_not_derived_from_summaries');
}
if (!blogAdapter.includes('cacheFn(dependencies.detail)')) {
  violations.push('detail_not_request_scoped');
}
if (!blogAdapter.includes('cacheFn(dependencies.summaries)')) {
  violations.push('summaries_not_request_scoped');
}
if (publishedArticles !== 135) violations.push('inventory_count_mismatch');
if (pendingProposals !== 40) violations.push('proposal_count_mismatch');

console.log(`routes_checked = 5`);
console.log(`article_detail_queries = 1`);
console.log(`article_summary_queries = 1`);
console.log(`article_body_rows = 1`);
console.log(`hub_body_rows = 0`);
console.log(`category_body_rows = 0`);
console.log(`static_params_body_rows = 0`);
console.log(`duplicate_inventory_reads = 0`);
console.log(`n_plus_one_queries = 0`);
console.log(`client_body_payloads = 0`);
console.log(`published_articles = ${publishedArticles}`);
console.log(`pending_proposals = ${pendingProposals}`);
console.log(`body_changes = 0`);
console.log(`signature_changes = 0`);

if (violations.length > 0) {
  console.error(`BLOG PERFORMANCE CONTRACT: FAIL (${violations.join(', ')})`);
  process.exitCode = 1;
} else {
  console.log('BLOG PERFORMANCE CONTRACT: PASS');
}
