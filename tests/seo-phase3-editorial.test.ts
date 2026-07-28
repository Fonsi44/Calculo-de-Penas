import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsv } from '@/lib/csv';

const csv = (path: string) => {
  const rows = parseCsv(
    readFileSync(path, 'utf8').split('\n').filter((line) => !line.startsWith('#')).join('\n'),
  );
  const [header, ...data] = rows;
  return data.filter((row) => row.some(Boolean)).map((row) =>
    Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])),
  );
};

describe('Fase 3 — contratos editoriales y documentales', () => {
  it('asigna la intención Nacaome sin dos URLs comerciales primarias', () => {
    const rows = csv('docs/seo/current/query-url-map.csv');
    const contracts = rows.filter((row) => row.data_source === 'ARCHITECTURE_CONTRACT');
    expect(contracts).toEqual(expect.arrayContaining([
      expect.objectContaining({ page: 'https://www.pinedayasociadoshn.com/', intent_role: 'PRIMARY_COMMERCIAL' }),
      expect.objectContaining({ page: 'https://www.pinedayasociadoshn.com/abogados-en-nacaome', intent_role: 'SECONDARY_OPERATIONAL' }),
      expect.objectContaining({ page: 'https://www.pinedayasociadoshn.com/blog/practica-legal/abogados-en-nacaome', intent_role: 'PRIMARY_INFORMATIONAL' }),
    ]));
    expect(contracts.filter((row) => row.intent_role === 'PRIMARY_COMMERCIAL')).toHaveLength(1);
  });

  it('clasifica los 175 artículos con una acción principal permitida', () => {
    const allowed = new Set([
      'KEEP', 'METADATA_UPDATE', 'INTRO_UPDATE', 'CONTENT_UPDATE', 'FULL_REWRITE',
      'MERGE_CANDIDATE', 'REDIRECT_CANDIDATE', 'NOINDEX_PENDING_REVIEW',
      'OUTDATED', 'REMOVE_CANDIDATE', 'HUMAN_ASSIGNMENT_REQUIRED',
      'READY_FOR_LAWYER_REVIEW',
    ]);
    const rows = csv('docs/seo/current/content-action-matrix.csv');
    expect(rows).toHaveLength(175);
    expect(new Set(rows.map((row) => row.slug)).size).toBe(175);
    expect(rows.every((row) => allowed.has(row.action))).toBe(true);
    expect(new Set(rows.map((row) => row.action)).size).toBeGreaterThanOrEqual(5);
  });

  it('prepara cinco lotes y 40 patches idempotentes sin revisión falsa', () => {
    const files = readdirSync('docs/seo/patches/phase3').filter((file) => file.endsWith('.json'));
    expect(files).toHaveLength(5);
    const patches = files.flatMap((file) =>
      JSON.parse(readFileSync(`docs/seo/patches/phase3/${file}`, 'utf8')).patches,
    );
    expect(patches).toHaveLength(40);
    for (const patch of patches) {
      expect(patch.expected.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(patch.expected.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(patch.expected.reviewStatus).toBeTruthy();
      expect(patch.proposed.title).toBeTruthy();
      expect(patch.proposed.metaDescription).toBeTruthy();
      expect(patch.proposed.directAnswer).toBeTruthy();
      expect(patch.proposed.sourceIds.length).toBeGreaterThan(0);
      expect(patch.proposed.legalReviewStatus).toBe('documentary_review');
      expect(patch.safeguards).toEqual(expect.objectContaining({
        dryRunDefault: true,
        transactionRequired: true,
        driftCheckRequired: true,
        productionWriteAllowed: false,
        doesNotSetLawyerVerified: true,
      }));
    }
  });

  it('registra documentos oficiales abiertos y separa ambigüedad de verificación', () => {
    const rows = csv('docs/seo/current/legal-source-registry.csv');
    expect(rows.length).toBeGreaterThanOrEqual(70);
    expect(rows.some((row) => row.status === 'OFFICIAL_DOCUMENT_VERIFIED')).toBe(true);
    expect(rows.some((row) => row.status === 'OFFICIAL_DOCUMENT_AMBIGUOUS')).toBe(true);
    expect(rows.every((row) => row.exact_url.startsWith('https://'))).toBe(true);
    expect(rows.every((row) => row.article_or_section && row.verification_notes)).toBe(true);
  });

  it('documenta exactamente los 53 clusters sin objetivo público seguro', () => {
    const rows = csv('docs/seo/current/internal-link-audit.csv');
    expect(rows.filter((row) => row.cluster_resolution === 'NO_SAFE_CLUSTER_TARGET')).toHaveLength(53);
    expect(rows.filter((row) => row.cluster_resolution === 'NO_SAFE_CLUSTER_TARGET')
      .every((row) => row.resolution_reason.includes('lawyer_review_pending'))).toBe(true);
  });

  it('mantiene toda la cola pendiente y no atribuye reviewedBy propuesto', () => {
    const queue = csv('docs/seo/current/lawyer-review-queue.csv');
    expect(queue).toHaveLength(40);
    expect(queue.every((row) => row.status === 'lawyer_review_pending')).toBe(true);
    expect(queue.every((row) => row.review_packet && row.author_proposed)).toBe(true);
    expect(readFileSync('scripts/generate-phase3-editorial.ts', 'utf8')).not.toContain(
      "legalReviewStatus: 'lawyer_verified'",
    );
  });
});
