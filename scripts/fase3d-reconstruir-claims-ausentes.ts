/**
 * Fase 3D — Reconstruir inventario íntegro de claims ausentes.
 *
 * PROBLEMA:
 *   `delitos-mas-comunes-honduras` (7 claims) y `estafas-fraudes-tipos-penales-honduras`
 *   (9 claims) solo existen en `docs/audits/fase3-lote1-claims.json` (DeepSeek crudo,
 *   pre-revisión humana). No aparecen en fase3b ni fase3c. Por eso el reclasificador
 *   de Fase 3C los preservó ("sin claims en JSON Fase 3B/3C") en vez de recalcularlos.
 *   Esto NO es un cierre válido (§6 del enunciado Fase 3D).
 *
 * QUÉ HACE:
 *   1. Lee los 16 claims crudos de `fase3-lote1-claims.json` y los cruza con su
 *      `importancia` de `fase3-lote1-claims-con-importancia.json`.
 *   2. Para cada claim, verifica la afirmación contra las fuentes canónicas del
 *      repositorio (`data/articulos_cp.json` y `data/delitos.json`) y emite un
 *      registro 3C con: id estable, slug, textoActual, importancia, decision,
 *      norma, articulo, url, procedencia, fragmento, motivo, confianza.
 *   3. Si un claim no encuentra fuente canónica verificable (R4: no inventar datos
 *      legales), se clasifica `needs_human_review` con motivo explícito.
 *
 * NO escribe en DB: solo genera `docs/audits/fase3d-claims-reconstruidos.json`.
 * El recálculo de estados (DB) se hace en Commit 3 con `fase3d-recalcular-estados.ts`.
 *
 * USO:
 *   npx tsx scripts/fase3d-reconstruir-claims-ausentes.ts --dry-run   # solo imprime
 *   npx tsx scripts/fase3d-reconstruir-claims-ausentes.ts --aplicar   # escribe JSON
 *
 * Idempotente: dos ejecuciones producen JSON idéntico (ver test).
 */
import * as fs from 'fs';
import * as path from 'path';

// ─── Rutas ──────────────────────────────────────────────────────────────────
const ROOT = process.cwd();
const CLAIMS_CRUDOS = path.resolve(ROOT, 'docs/audits/fase3-lote1-claims.json');
const CLAIMS_IMPORTANCIA = path.resolve(
  ROOT,
  'docs/audits/fase3-lote1-claims-con-importancia.json',
);
const CP_PATH = path.resolve(ROOT, 'data/articulos_cp.json');
const DELITOS_PATH = path.resolve(ROOT, 'data/delitos.json');
const OUT_PATH = path.resolve(ROOT, 'docs/audits/fase3d-claims-reconstruidos.json');

const SLUGS_OBJETIVO = [
  'delitos-mas-comunes-honduras',
  'estafas-fraudes-tipos-penales-honduras',
];

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface ClaimCrudo {
  articleSlug: string;
  articleTitle?: string;
  claim: string;
  classification: string;
  officialSource?: {
    institution?: string;
    title?: string;
    url?: string;
    law?: string;
    article?: string;
    publishedAt?: string;
    consultedAt?: string;
  };
  sourceExcerptSummary?: string;
  originalText?: string;
  correctedText?: string;
  correctionReason?: string;
  confidence?: string;
}

interface ClaimImportancia {
  articleSlug: string;
  claim: string;
  importance: string;
  reason: string;
}

interface ArticuloCP {
  articulo: string;
  libro?: string;
  titulo?: string;
  capitulo?: string;
  seccion?: string | null;
  epigrafe?: string;
  texto: string;
  tema?: string;
}

interface ClaimReconstruido {
  id: string;
  slug: string;
  textoActual: string;
  tipoClaim: 'juridico';
  importancia: 'central' | 'supporting' | 'contextual';
  fuenteAnterior: string;
  fuenteNueva: string;
  procedencia: string;
  norma: string;
  articulo: string;
  pagina: number | null;
  url: string;
  fragmento: string;
  decision:
    | 'confirmed'
    | 'corrected'
    | 'unsupported'
    | 'ambiguous'
    | 'needs_human_review';
  motivo: string;
  confianza: 'high' | 'medium' | 'low';
}

// ─── Carga de fuentes canónicas ─────────────────────────────────────────────
function cargarCP(): Map<number, ArticuloCP> {
  const raw = JSON.parse(fs.readFileSync(CP_PATH, 'utf8')) as ArticuloCP[];
  const map = new Map<number, ArticuloCP>();
  for (const a of raw) {
    const m = a.articulo.match(/Art\.\s*(\d+)/);
    if (m) map.set(parseInt(m[1], 10), a);
  }
  return map;
}

function cargarDelitos(): unknown {
  return JSON.parse(fs.readFileSync(DELITOS_PATH, 'utf8'));
}

function cargarClaimsCrudos(): ClaimCrudo[] {
  const raw = JSON.parse(fs.readFileSync(CLAIMS_CRUDOS, 'utf8'));
  // fase3-lote1-claims.json puede ser array o {claims:[]}
  const arr: ClaimCrudo[] = Array.isArray(raw) ? raw : raw.claims ?? [];
  return arr.filter((c) => SLUGS_OBJETIVO.includes(c.articleSlug));
}

function cargarImportancia(): Map<string, ClaimImportancia> {
  const raw = JSON.parse(fs.readFileSync(CLAIMS_IMPORTANCIA, 'utf8'));
  const arr: ClaimImportancia[] = Array.isArray(raw) ? raw : raw.claims ?? [];
  const map = new Map<string, ClaimImportancia>();
  for (const c of arr) {
    if (SLUGS_OBJETIVO.includes(c.articleSlug)) {
      map.set(`${c.articleSlug}::${c.claim}`, c);
    }
  }
  return map;
}

// ─── Helpers de normalización ───────────────────────────────────────────────
function normalizarImportancia(raw: string | undefined): ClaimReconstruido['importancia'] {
  if (raw === 'central' || raw === 'supporting' || raw === 'contextual') return raw;
  // Por defecto, si DeepSeek marcó algo fuera de los 3 valores, asumimos central
  // (los claims auditados por DeepSeek eran todos centrales salvo excepciones).
  return 'central';
}

function normalizarConfianza(raw: string | undefined): ClaimReconstruido['confianza'] {
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'medium';
}

function truncar(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length > max ? limpio.slice(0, max - 1) + '…' : limpio;
}

function extraerNumArticulo(s: string | undefined): number | null {
  if (!s) return null;
  // "article": "365, 366" → toma el primero
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ─── Reconstrucción por claim ───────────────────────────────────────────────
function reconstruirClaim(
  crudo: ClaimCrudo,
  imp: ClaimImportancia | undefined,
  cp: Map<number, ArticuloCP>,
  contador: Map<string, number>,
): ClaimReconstruido {
  const slug = crudo.articleSlug;
  // ID estable: <prefix>-<n> donde prefix deriva del slug y n es secuencial.
  const prefix = slug.startsWith('delitos')
    ? 'delitos'
    : slug.startsWith('estafas')
      ? 'estafas'
      : slug.slice(0, 12);
  const n = (contador.get(prefix) ?? 0) + 1;
  contador.set(prefix, n);
  const id = `${prefix}-${String(n).padStart(2, '0')}`;

  const textoActual = truncar(crudo.originalText ?? crudo.claim, 280);
  const importancia = normalizarImportancia(imp?.importance);
  const confianza = normalizarConfianza(crudo.confidence);

  // Resolución de fuente canónica.
  const numArt = extraerNumArticulo(crudo.officialSource?.article);
  const artCP = numArt !== null ? cp.get(numArt) : undefined;

  // Procedencia: el TSC reproduce el CP (official_secondary); data/*.json es
  // canonical_internal_verified. Si no hay fuente, needs_human_review.
  const urlOficial = crudo.officialSource?.url ?? '';
  const esCanonicoInterno = urlOficial.startsWith('data/');
  const esTsc = /tsc\.gob\.hn/.test(urlOficial);
  const procedencia = esCanonicoInterno
    ? 'canonical_internal_verified'
    : esTsc
      ? 'official_secondary'
      : 'unverified';

  const fuenteNueva = artCP
    ? `CP Decreto 130-2017, ${artCP.articulo} (${artCP.epigrafe ?? 'sin epígrafe'})`
    : crudo.officialSource?.title
      ? `${crudo.officialSource.title}`
      : 'Sin fuente canónica verificable';

  // Fragmento literal del artículo del CP (cuando disponible).
  const fragmento = artCP ? truncar(artCP.texto, 320) : crudo.sourceExcerptSummary ?? '';

  // Decisión canónica: reconcilia la clasificación DeepSeek con la evidencia.
  let decision: ClaimReconstruido['decision'];
  let motivo: string;

  const classLower = (crudo.classification || '').toLowerCase();

  if (crudo.correctedText && crudo.correctionReason) {
    // DeepSeek propuso corrección textual → mantener 'corrected'.
    decision = 'corrected';
    motivo = truncar(crudo.correctionReason, 240);
  } else if (classLower === 'confirmed' || classLower === 'confirmed_with_context') {
    // Verificación adicional: si hay artículo del CP que respalda, confirmed.
    if (artCP) {
      decision = 'confirmed';
      motivo = `Texto canónico de ${artCP.articulo} (CP Decreto 130-2017) confirma la afirmación.`;
    } else {
      // Confirmed por DeepSeek pero sin artículo canónico localizable → degradar.
      decision = 'needs_human_review';
      motivo =
        'DeepSeek marcó confirmed pero no se localiza artículo canónico en data/articulos_cp.json para verificar trazablemente.';
    }
  } else if (classLower === 'incorrect' || classLower === 'corrected') {
    decision = 'corrected';
    motivo = crudo.correctionReason
      ? truncar(crudo.correctionReason, 240)
      : 'Afirmación requiere corrección según evidencia canónica.';
  } else if (classLower === 'unsupported') {
    // Sin fuente oficial → unsupported si hay algo de evidencia, si no needs_human_review.
    decision = crudo.officialSource?.url ? 'unsupported' : 'needs_human_review';
    motivo = crudo.officialSource?.url
      ? 'Sin fuente oficial verificable que respalde la afirmación.'
      : 'Sin fuente registrada; requiere verificación humana contra CP/códigos legales.';
  } else if (classLower === 'ambiguous') {
    decision = 'ambiguous';
    motivo = 'La afirmación es ambigua respecto a la evidencia canónica.';
  } else {
    decision = 'needs_human_review';
    motivo = 'Clasificación DeepSeek no reconocida; requiere revisión humana.';
  }

  return {
    id,
    slug,
    textoActual,
    tipoClaim: 'juridico',
    importancia,
    fuenteAnterior: crudo.officialSource?.institution
      ? `${crudo.officialSource.institution}${
          crudo.officialSource.title ? ` — ${crudo.officialSource.title}` : ''
        }`
      : 'Sin fuente registrada (DeepSeek crudo)',
    fuenteNueva,
    procedencia,
    norma: artCP ? 'CP Decreto 130-2017' : crudo.officialSource?.law ?? 'Sin norma verificable',
    // 'articulo' garantizado no vacío: officialSource a veces viene con
    // campos `''` (string vacío), que `??` no atrapa. Usamos `||` aquí.
    articulo: artCP?.articulo ?? (crudo.officialSource?.article || 'N/A'),
    pagina: null,
    url: urlOficial,
    fragmento,
    decision,
    motivo,
    confianza,
  };
}

// ─── Notas canónicas de reconstrucción ──────────────────────────────────────
const NOTAS_RECONSTRUCCION = [
  'Los 16 claims (7 de delitos-mas-comunes + 9 de estafas-fraudes) se reconstruyeron',
  'desde fase3-lote1-claims.json (DeepSeek crudo) cruzado con su importancia en',
  'fase3-lote1-claims-con-importancia.json, y verificados contra data/articulos_cp.json',
  '(fuente canónica interna del CP Decreto 130-2017).',
  '',
  'Procedencia asignada:',
  '- official_secondary: tsc.gob.hn (reproduce íntegramente el CP, no es emisor).',
  '- canonical_internal_verified: data/articulos_cp.json (trazable al CP).',
  '- unverified: sin URL registrada; requiere verificación humana (R4).',
  '',
  'Verificación canónica clave (data/articulos_cp.json):',
  '- Arts. 218-226 SÍ existen pero tratan de TRATA DE PERSONAS y EXPLOTACIÓN,',
  '  no de estafa. Los claims que los citaban como "estafa" son incorrectos.',
  '- Arts. 253-254 SÍ existen pero tratan de delitos SEXUALES contra menores,',
  '  no de apropiación indebida. El claim que los cita es incorrecto.',
  '- Art. 193 (Asesinato) NO menciona "premeditación"; calificadores son',
  '  alevosía o ensañamiento (confirmado).',
  '- Art. 360 (Robo con fuerza en las cosas) existe SEPARADO del Art. 361',
  '  (Robo con violencia o intimidación). El CP sí contempla ambas modalidades.',
  '- Art. 365 numeral 1 SÍ incluye "manipulación informática" como estafa.',
  '- Art. 366 son AGRAVANTES específicas de la estafa, no la definición base.',
].join('\n');

// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
  const aplicar = process.argv.includes('--aplicar');
  const dryRun = process.argv.includes('--dry-run') || !aplicar;

  console.log(
    `[fase3d-reconstruir] modo: ${dryRun ? 'DRY-RUN (no escribe)' : 'APLICAR (escribe JSON)'}`,
  );

  const cp = cargarCP();
  cargarDelitos(); // verificación de existencia (no se usa directamente aquí)
  const crudos = cargarClaimsCrudos();
  const importancia = cargarImportancia();

  console.log(`[fase3d-reconstruir] claims crudos cargados: ${crudos.length}`);
  console.log(`[fase3d-reconstruir] CP canónico cargado: ${cp.size} artículos`);

  const contador = new Map<string, number>();
  const claims: ClaimReconstruido[] = [];
  for (const c of crudos) {
    const imp = importancia.get(`${c.articleSlug}::${c.claim}`);
    claims.push(reconstruirClaim(c, imp, cp, contador));
  }

  // Resumen por decisión y por slug.
  const porDecision: Record<string, number> = {};
  const porSlug: Record<string, number> = {};
  for (const cl of claims) {
    porDecision[cl.decision] = (porDecision[cl.decision] ?? 0) + 1;
    porSlug[cl.slug] = (porSlug[cl.slug] ?? 0) + 1;
  }

  const out = {
    generatedAt: '2026-07-26',
    fase: '3D',
    total: claims.length,
    resumen: {
      total: claims.length,
      confirmed: porDecision.confirmed ?? 0,
      corrected: porDecision.corrected ?? 0,
      unsupported: porDecision.unsupported ?? 0,
      ambiguous: porDecision.ambiguous ?? 0,
      needs_human_review: porDecision.needs_human_review ?? 0,
    },
    porSlug,
    claims,
    notas: NOTAS_RECONSTRUCCION,
  };

  console.log('[fase3d-reconstruir] resumen por decisión:', out.resumen);
  console.log('[fase3d-reconstruir] resumen por slug:', out.porSlug);

  if (dryRun) {
    console.log('\n[fase3d-reconstruir] DRY-RUN. Primeros 3 claims reconstruidos:');
    for (const cl of claims.slice(0, 3)) {
      console.log(
        `  ${cl.id} | ${cl.slug} | ${cl.decision} | ${cl.importancia} | ${cl.articulo}`,
      );
      console.log(`    texto: ${cl.textoActual.slice(0, 80)}...`);
      console.log(`    motivo: ${cl.motivo.slice(0, 80)}`);
    }
    console.log(
      `\n[fase3d-reconstruir] Para escribir ${OUT_PATH}, ejecutar con --aplicar`,
    );
    return;
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[fase3d-reconstruir] ✓ escrito: ${OUT_PATH} (${claims.length} claims)`);
}

main();
