import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CORPUS_INDEX_PATH = path.join(ROOT, 'data/legal/corpus-index.json');

export interface CorpusEntry {
  id: string;
  title: string;
  type?: string;
  decreto?: string | null;
  pdf_path?: string;
  extracted_txt?: string | null;
  structured_json?: string | null;
  canonical_json?: string | null;
  article_count?: number;
  status?: string;
  extraction_method?: string;
  site_references?: string[];
}

export interface CorpusIndex {
  updated: string;
  stats: Record<string, number>;
  entries: CorpusEntry[];
  missing_from_site_coverage?: Array<{ id: string; title: string; site_refs?: string[] }>;
  missing_recommended?: Array<Record<string, unknown>>;
}

/** Referencia cruzada: no hay ley LPDP autónoma; ARCO vía otras normas. */
const LPDP_REFERENCE: CorpusEntry = {
  id: 'HN-LPDP',
  title: 'Protección de Datos Personales (referencia ARCO)',
  type: 'referencia',
  decreto: null,
  status: 'REFERENCE',
  extracted_txt: null,
  site_references: ['faq/privacidad', 'politica-privacidad'],
};

const LPDP_ALIASES = new Set([
  'hn-lpdp',
  'datos-personales',
  'proteccion-datos',
  'lpdp',
]);

function isLpdpAlias(id: string): boolean {
  return LPDP_ALIASES.has(id.trim().toLowerCase());
}

let cachedIndex: CorpusIndex | null = null;
let cachedMtime = 0;

function readJsonFile<T>(relativePath: string): T | null {
  const abs = path.join(ROOT, relativePath);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function articlesToText(data: unknown[]): string {
  return data
    .map((raw) => {
      const art = raw as { articulo?: string; texto?: string };
      return `${art.articulo ?? ''}\n${art.texto ?? ''}`.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

function readTextFile(relativePath: string): string | null {
  const abs = path.join(ROOT, relativePath);
  if (!fs.existsSync(abs)) return null;
  try {
    return fs.readFileSync(abs, 'utf-8');
  } catch {
    return null;
  }
}

export function loadCorpusIndex(): CorpusIndex {
  const stat = fs.existsSync(CORPUS_INDEX_PATH)
    ? fs.statSync(CORPUS_INDEX_PATH).mtimeMs
    : 0;
  if (cachedIndex && stat === cachedMtime) return cachedIndex;

  if (!fs.existsSync(CORPUS_INDEX_PATH)) {
    cachedIndex = {
      updated: new Date().toISOString().slice(0, 10),
      stats: { total_pdfs: 0 },
      entries: [],
    };
    cachedMtime = stat;
    return cachedIndex;
  }

  cachedIndex = JSON.parse(fs.readFileSync(CORPUS_INDEX_PATH, 'utf-8')) as CorpusIndex;
  cachedMtime = stat;
  return cachedIndex;
}

export function listCorpusEntries(): CorpusEntry[] {
  const index = loadCorpusIndex();
  const hasLpdp = index.entries.some((e) => e.id === 'HN-LPDP');
  return hasLpdp ? index.entries : [...index.entries, LPDP_REFERENCE];
}

export function getCorpusEntryById(id: string): CorpusEntry | null {
  const normalized = id.trim();
  if (isLpdpAlias(normalized)) {
    return buildLpdpReferenceEntry();
  }
  return listCorpusEntries().find((e) => e.id === normalized) ?? null;
}

function buildLpdpReferenceEntry(): CorpusEntry {
  return {
    ...LPDP_REFERENCE,
    article_count: 0,
    extracted_txt: null,
    structured_json: null,
  };
}

export interface CorpusDocument {
  entry: CorpusEntry;
  text: string;
  structured?: unknown;
  meta: {
    source: 'extracted_txt' | 'canonical_json' | 'structured_json' | 'reference';
    char_count: number;
    related_norms?: string[];
  };
}

export function getCorpusDocument(id: string): CorpusDocument | null {
  if (isLpdpAlias(id)) {
    return {
      entry: buildLpdpReferenceEntry(),
      text: [
        'Honduras no cuenta con una ley autónoma de protección de datos personales aprobada (2026).',
        'Los derechos de acceso, rectificación, cancelación y oposición (ARCO) se ejercen principalmente mediante:',
        '- Decreto 170-2006: Ley de Transparencia y Acceso a la Información Pública (HN-LTAIP-170-2006)',
        '- Constitución de la República (HN-CONST-131-1982), artículos sobre privacidad y hábeas data',
        '',
        'Para consultar el texto vigente de esas normas, use GET /api/legal/corpus/HN-LTAIP-170-2006 o HN-CONST-131-1982.',
      ].join('\n'),
      meta: {
        source: 'reference',
        char_count: 0,
        related_norms: ['HN-LTAIP-170-2006', 'HN-CONST-131-1982'],
      },
    };
  }

  const entry = getCorpusEntryById(id);
  if (!entry) return null;

  if (entry.canonical_json) {
    const data = readJsonFile<unknown[]>(entry.canonical_json);
    if (data && Array.isArray(data)) {
      const text = articlesToText(data);
      return {
        entry,
        text,
        structured: data,
        meta: {
          source: 'canonical_json',
          char_count: text.length,
        },
      };
    }
  }

  if (entry.extracted_txt) {
    const text = readTextFile(entry.extracted_txt);
    if (text) {
      let structured: unknown;
      if (entry.structured_json) {
        structured = readJsonFile(entry.structured_json) ?? undefined;
      }
      return {
        entry,
        text,
        structured,
        meta: {
          source: 'extracted_txt',
          char_count: text.length,
        },
      };
    }
  }

  if (entry.structured_json) {
    const structured = readJsonFile<unknown[]>(entry.structured_json);
    if (structured && Array.isArray(structured)) {
      const text = articlesToText(structured);
      return {
        entry,
        text,
        structured,
        meta: {
          source: 'structured_json',
          char_count: text.length,
        },
      };
    }
  }

  return null;
}

export interface SearchHit {
  id: string;
  title: string;
  decreto?: string | null;
  type?: string;
  status?: string;
  score: number;
  excerpts: Array<{ snippet: string; position: number }>;
}

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function scoreText(haystack: string, terms: string[]): number {
  const norm = normalizeForSearch(haystack);
  let score = 0;
  for (const term of terms) {
    const t = normalizeForSearch(term);
    if (!t) continue;
    const idx = norm.indexOf(t);
    if (idx >= 0) {
      score += 10;
      let from = 0;
      while ((from = norm.indexOf(t, from + 1)) >= 0) {
        score += 2;
      }
    }
  }
  return score;
}

function extractSnippets(text: string, terms: string[], max = 3): Array<{ snippet: string; position: number }> {
  const norm = normalizeForSearch(text);
  const snippets: Array<{ snippet: string; position: number }> = [];
  for (const term of terms) {
    const t = normalizeForSearch(term);
    if (!t) continue;
    let from = 0;
    while (snippets.length < max) {
      const idx = norm.indexOf(t, from);
      if (idx < 0) break;
      const start = Math.max(0, idx - 120);
      const end = Math.min(text.length, idx + t.length + 120);
      snippets.push({
        position: idx,
        snippet: text.slice(start, end).replace(/\s+/g, ' ').trim(),
      });
      from = idx + t.length;
    }
  }
  return snippets.slice(0, max);
}

export function searchCorpus(
  query: string,
  options: { limit?: number; ids?: string[] } = {},
): SearchHit[] {
  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return [];

  const limit = Math.min(Math.max(options.limit ?? 10, 1), 30);
  const idFilter = options.ids?.length ? new Set(options.ids) : null;
  const hits: SearchHit[] = [];

  for (const entry of listCorpusEntries()) {
    if (idFilter && !idFilter.has(entry.id)) continue;
    const doc = getCorpusDocument(entry.id);
    if (!doc?.text) continue;

    const titleScore = scoreText(`${entry.title} ${entry.decreto ?? ''} ${entry.id}`, terms) * 2;
    const bodyScore = scoreText(doc.text, terms);
    const total = titleScore + bodyScore;
    if (total <= 0) continue;

    hits.push({
      id: entry.id,
      title: entry.title,
      decreto: entry.decreto,
      type: entry.type,
      status: entry.status,
      score: total,
      excerpts: extractSnippets(doc.text, terms),
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/** Contexto listo para inyectar en un prompt de IA externa (sin embeddings). */
export function buildContextForQuery(
  query: string,
  options: { maxChars?: number; limit?: number } = {},
): {
  query: string;
  hits: SearchHit[];
  context: string;
  total_chars: number;
} {
  const maxChars = options.maxChars ?? 12000;
  const limit = options.limit ?? 8;
  const hits = searchCorpus(query, { limit });
  const parts: string[] = [];
  let used = 0;

  for (const hit of hits) {
    const doc = getCorpusDocument(hit.id);
    if (!doc) continue;
    const header = `## ${hit.title} (${hit.id})${hit.decreto ? ` — ${hit.decreto}` : ''}`;
    const body = hit.excerpts.length
      ? hit.excerpts.map((e) => e.snippet).join(' … ')
      : doc.text.slice(0, 1500);
    const block = `${header}\n${body}\n`;
    if (used + block.length > maxChars) break;
    parts.push(block);
    used += block.length;
  }

  const context = parts.join('\n').trim();
  return {
    query,
    hits,
    context,
    total_chars: context.length,
  };
}

export function getCorpusStats() {
  const index = loadCorpusIndex();
  const entries = listCorpusEntries();
  return {
    updated: index.updated,
    total_norms: entries.length,
    stats: index.stats,
    missing_from_site_coverage: index.missing_from_site_coverage ?? [],
    missing_recommended: index.missing_recommended ?? [],
  };
}
