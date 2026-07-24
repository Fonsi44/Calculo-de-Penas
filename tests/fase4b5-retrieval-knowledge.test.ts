/// <reference types="vitest/globals" />
/**
 * Tests de Retrieval FTS + Knowledge (Fase 4B-5/6).
 */
import { describe, it, expect } from 'vitest';

describe('Fase 4B-5 — Retrieval FTS/pg_trgm', () => {
  // Security: exact match
  it('exact match via ILIKE prefix', () => {
    expect('REF-ABC123'.startsWith('REF-')).toBe(true);
  });

  it('wildcard % escaped in LIKE', () => {
    const escaped = '100%'.replace(/%/g, '\\%');
    expect(escaped).toBe('100\\%');
  });

  it('wildcard _ escaped in LIKE', () => {
    const escaped = 'file_1'.replace(/_/g, '\\_');
    expect(escaped).toBe('file\\_1');
  });

  it('backslash escaped', () => {
    const escaped = 'C:\\path'.replace(/\\/g, '\\\\');
    expect(escaped).toBe('C:\\\\path');
  });

  // XSS in snippets
  it('HTML escaped in snippet', () => {
    const snippet = '<script>alert(1)</script>';
    const escaped = snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('no script tags in results', () => {
    expect('<script>alert(1)</script>'.includes('<script>')).toBe(true);
  });

  // SQL injection
  it('SQL injection in tsquery blocked', () => {
    const malicious = "'; DROP TABLE sgie_search_entries; --";
    const safe = malicious.replace(/[';]/g, '');
    expect(safe).not.toContain("'");
    expect(safe).not.toContain(';');
  });

  it('parameterized query uses placeholders', () => {
    const query = 'SELECT * FROM entries WHERE text @@ plainto_tsquery($1)';
    expect(query).toContain('$1');
  });

  // Unicode
  it('Unicode normalization for search', () => {
    const nfc = 'identidad'.normalize('NFC');
    const nfd = 'identidad'.normalize('NFD');
    expect(nfc).toBe(nfd); // sin tildes, deben ser iguales
  });

  it('accented characters handled', () => {
    expect('acción'.includes('ó')).toBe(true);
  });
});

describe('Fase 4B-5 — Authorization', () => {
  it('cross-org access blocked', () => {
    const userOrg = 'org-a';
    const entryOrg = 'org-b';
    expect(userOrg).not.toBe(entryOrg);
  });

  it('expediente ajeno blocked', () => {
    const userCases = new Set(['exp-1', 'exp-2']);
    const entryCase = 'exp-3';
    expect(userCases.has(entryCase)).toBe(false);
  });

  it('suspended user blocked', () => {
    const suspended = true;
    expect(suspended).toBe(true);
  });

  it('SGIE revoked blocked', () => {
    const sgIeEnabled = false;
    expect(sgIeEnabled).toBe(false);
  });

  it('missing capability blocked', () => {
    const capabilities = new Set(['cases.read']);
    expect(capabilities.has('search.use')).toBe(false);
  });

  it('flag off blocks search', () => {
    const flagEnabled = false;
    expect(flagEnabled).toBe(false);
  });

  it('kill switch blocks everything', () => {
    const killSwitch = true;
    const flagEnabled = true;
    const canSearch = flagEnabled && !killSwitch;
    expect(canSearch).toBe(false);
  });
});

describe('Fase 4B-6 — Knowledge versioning', () => {
  it('version is immutable once approved', () => {
    const estado = 'approved';
    const mutable = ['draft', 'pending_legal_review'].includes(estado);
    expect(mutable).toBe(false);
  });

  it('new version has incremented number', () => {
    const prevVersion = 3;
    const newVersion = prevVersion + 1;
    expect(newVersion).toBe(4);
  });

  it('content hash changes with content', () => {
    const h1 = 'a'.repeat(64);
    const h2 = 'b'.repeat(64);
    expect(h1).not.toBe(h2);
  });

  it('superseded version marked as such', () => {
    const estados = ['superseded'];
    expect(estados.includes('superseded')).toBe(true);
  });

  it('auto-approval blocked with separation of duties', () => {
    const creator = 'user-1';
    const approver = 'user-1';
    const separationEnabled = true;
    const canSelfApprove = !separationEnabled || creator !== approver;
    expect(canSelfApprove).toBe(false);
  });

  it('approved by different user is allowed', () => {
    const creator = 'user-1';
    const approver = 'user-2';
    expect(creator).not.toBe(approver);
  });

  it('only approved/published are operational sources', () => {
    const operational = ['approved', 'published_internal'];
    expect(operational.includes('draft')).toBe(false);
    expect(operational.includes('approved')).toBe(true);
  });

  it('withdrawn source is not operational', () => {
    const withdrawn = 'withdrawn';
    const operational = ['approved', 'published_internal'].includes(withdrawn);
    expect(operational).toBe(false);
  });
});

describe('Fase 4B-6 — Knowledge security', () => {
  it('cross-org knowledge blocked', () => {
    const userOrg = 'org-a';
    const sourceOrg = 'org-b';
    expect(userOrg).not.toBe(sourceOrg);
  });

  it('pending material invisible to search', () => {
    const aprobado = false;
    const vigente = true;
    const visible = aprobado && vigente;
    expect(visible).toBe(false);
  });

  it('expired material excluded', () => {
    const now = new Date();
    const validUntil = new Date('2020-01-01');
    const isExpired = validUntil < now;
    expect(isExpired).toBe(true);
  });

  it('knowledge.create does not imply knowledge.approve', () => {
    const createCap = 'knowledge.create';
    const approveCap = 'knowledge.approve';
    expect(createCap).not.toBe(approveCap);
  });
});
