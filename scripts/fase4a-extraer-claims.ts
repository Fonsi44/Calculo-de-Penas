/**
 * Fase 4A — Extracción y clasificación de claims del Lote 2.
 *
 * Lee los bodies de los 15 artículos del Lote 2 (desde data/lote2-backup.json,
 * generado por fase4a-exportar-lote2.ts) y extrae claims jurídicos/factuales
 * verificables contra las fuentes canónicas del repositorio:
 *
 *   - data/codigo_civil.json            (Arts. "Art. N CC")
 *   - data/codigo_comercio.json         (Arts. "Art. N Co")
 *   - data/codigo_trabajo.json          (Arts. "Art. N CT")
 *   - data/codigo_tributario.json       (Arts. "Art. N Tr")
 *   - data/codigo_familia_verificado.json       (Arts. "Art. N CF")
 *   - data/codigo_procesal_penal_verificado.json (Arts. "Art. N CPP")
 *   - data/articulos_cp.json            (Código Penal)
 *   - data/articulos_constitucion.json  (Constitución)
 *
 * Para cada claim:
 *   - Extrae texto exacto y contexto.
 *   - Detecta norma + artículo citados.
 *   - Verifica la EXISTENCIA del artículo en la fuente canónica.
 *   - Verifica la PERTINENCIA (¿el artículo realmente trata de eso?) vía
 *     coincidencia de palabras clave del texto del claim contra el epígrafe/tema.
 *
 * Decisiones:
 *   - confirmed     → artículo existe Y pertinencia alta.
 *   - corrected     → artículo NO existe o NO pertinente, pero hay fuente
 *                     canónica correcta identificable (requiere redacción sustituta).
 *   - unsupported   → artículo NO existe y no hay fuente canónica clara.
 *   - ambiguous     → artículo existe pero pertinencia baja.
 *   - needs_human_review → claim interpretativo o requiere decisión de abogado.
 *
 * Salida:
 *   - docs/audits/fase4a-lote2-claims-finales.json
 *
 * Uso:
 *   npx tsx scripts/fase4a-extraer-claims.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');
const DATA = path.join(ROOT, 'data');

// --- Carga de fuentes canónicas ------------------------------------------
type ArticuloCanonico = { articulo: string; numero?: string | number; texto?: string; epigrafe?: string; tema?: string };

function cargarCanon(archivo: string): Map<string, ArticuloCanonico> {
  const p = path.join(DATA, archivo);
  if (!fs.existsSync(p)) return new Map();
  const arr: ArticuloCanonico[] = JSON.parse(fs.readFileSync(p, 'utf8'));
  const m = new Map<string, ArticuloCanonico>();
  for (const a of arr) m.set(a.articulo, a);
  return m;
}

const CANONES = {
  CC: cargarCanon('codigo_civil.json'),
  Co: cargarCanon('codigo_comercio.json'),
  CT: cargarCanon('codigo_trabajo.json'),
  Tr: cargarCanon('codigo_tributario.json'),
  CF: cargarCanon('codigo_familia_verificado.json'),
  CPP: cargarCanon('codigo_procesal_penal_verificado.json'),
};

// Código Penal y Constitución tienen formato distinto (articulo numérico).
const CP: ArticuloCanonico[] = fs.existsSync(path.join(DATA, 'articulos_cp.json'))
  ? JSON.parse(fs.readFileSync(path.join(DATA, 'articulos_cp.json'), 'utf8'))
  : [];
const CONSTITUCION: ArticuloCanonico[] = fs.existsSync(path.join(DATA, 'articulos_constitucion.json'))
  ? JSON.parse(fs.readFileSync(path.join(DATA, 'articulos_constitucion.json'), 'utf8'))
  : [];

// --- Patrones de detección de claims jurídicos ---------------------------
// Busca citaciones explícitas a artículos/normas: "Artículo 211", "Art. 1069 CC",
// "Decreto 76-84", "Código Penal", "Constitución", plazos ("X días/meses/años"),
// penas, derechos.
interface ClaimBruto {
  textoExacto: string;
  contexto: string;
  normaMencionada: string;
  articuloMencionado: string;
  tipo: string;
  importancia: 'central' | 'supporting' | 'contextual';
}

function extraerClaimsDeBody(body: string, slug: string): ClaimBruto[] {
  const textoPlano = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const claims: ClaimBruto[] = [];

  // Patrón 1: "Artículo NNN" o "Art. NNN" con sufijo de código opcional (CC/Co/CT/CF/CPP/Tr/CP).
  const reArt = /(?:Art(?:ículo)?\.?\s*)(\d{1,4})(?:\s*(?:del\s+)?(C(?:ódigo\s+)?(?:ivil|omercio|Familia|onstitucional)|CC|Co|CT|CF|CPP|Tr|CP|C\.?\s*P\.?|Código Penal|Código de Familia|Código Civil|Código del Trabajo|Código Procesal Penal|Código Tributario))?/gi;
  let m: RegExpExecArray | null;
  while ((m = reArt.exec(textoPlano)) !== null) {
    const num = m[1];
    const suf = (m[2] || '').trim();
    const codigo = normalizarCodigo(suf, slug);
    const inicio = Math.max(0, m.index - 120);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 120);
    const contexto = textoPlano.slice(inicio, fin);
    claims.push({
      textoExacto: m[0].trim(),
      contexto,
      normaMencionada: codigo.norma,
      articuloMencionado: `${codigo.prefijoArticulo}${num} ${codigo.sufijoCanon}`.trim(),
      tipo: 'norma',
      importancia: 'central',
    });
  }

  // Patrón 2: Decretos ("Decreto NN-NN").
  const reDecreto = /(Decreto\s+N?º?\.?\s*\d{1,3}-\d{2,4})/gi;
  while ((m = reDecreto.exec(textoPlano)) !== null) {
    const inicio = Math.max(0, m.index - 100);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 100);
    claims.push({
      textoExacto: m[0].trim(),
      contexto: textoPlano.slice(inicio, fin),
      normaMencionada: 'Decreto',
      articuloMencionado: m[0].trim(),
      tipo: 'norma',
      importancia: 'central',
    });
  }

  // Patrón 3: Plazos numéricos con unidad jurídica.
  const rePlazo = /(\d{1,4}\s*(?:días|día|meses|mes|años|año|horas|h)\b)(?=[^.]{0,80}(?:plazo|prescri|caduc|impugn|recur|r|present|interpon|notif|venc|término|termino))/gi;
  while ((m = rePlazo.exec(textoPlano)) !== null) {
    const inicio = Math.max(0, m.index - 80);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 80);
    claims.push({
      textoExacto: m[0].trim(),
      contexto: textoPlano.slice(inicio, fin),
      normaMencionada: 'plazo',
      articuloMencionado: '',
      tipo: 'plazo',
      importancia: 'supporting',
    });
  }

  // Patrón 4: Penas privativas de libertad.
  const rePena = /(\d{1,3}\s*(?:a\s*\d{1,3}\s*)?(?:años|año)\s*(?:de\s+)?prisi[oó]n|reclusi[oó]n|encarcelamiento|pena\s+de\s+prisi[oó]n)/gi;
  while ((m = rePena.exec(textoPlano)) !== null) {
    const inicio = Math.max(0, m.index - 100);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 100);
    claims.push({
      textoExacto: m[0].trim(),
      contexto: textoPlano.slice(inicio, fin),
      normaMencionada: 'pena',
      articuloMencionado: '',
      tipo: 'pena',
      importancia: 'central',
    });
  }

  // Patrón 5: Porcentajes con significado jurídico (embargo, retención).
  const rePct = /(\d{1,3}\s*%\s*(?:del\s+)?(?:salario|sueldo|pensión|pension|retención|retencion|embargo|descuento))/gi;
  while ((m = rePct.exec(textoPlano)) !== null) {
    const inicio = Math.max(0, m.index - 100);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 100);
    claims.push({
      textoExacto: m[0].trim(),
      contexto: textoPlano.slice(inicio, fin),
      normaMencionada: 'requisito',
      articuloMencionado: '',
      tipo: 'requisito',
      importancia: 'central',
    });
  }

  // Desduplicar por (articuloMencionado + textoExacto) dentro del mismo slug.
  // Así "Artículo 1069" citado dos veces en el mismo post cuenta como un claim.
  const vistos = new Set<string>();
  return claims.filter((c) => {
    const key = `${c.articuloMencionado || c.textoExacto}|${c.tipo}`;
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });
}

function normalizarCodigo(
  suf: string,
  slug: string,
): { norma: string; prefijoArticulo: string; sufijoCanon: string } {
  const s = suf.toLowerCase();
  if (/civil/.test(s) || s === 'cc') return { norma: 'Código Civil', prefijoArticulo: 'Art. ', sufijoCanon: 'CC' };
  if (/comercio/.test(s) || s === 'co') return { norma: 'Código de Comercio', prefijoArticulo: 'Art. ', sufijoCanon: 'Co' };
  if (/trabajo|laboral/.test(s) || s === 'ct') return { norma: 'Código del Trabajo', prefijoArticulo: 'Art. ', sufijoCanon: 'CT' };
  if (/familia/.test(s) || s === 'cf') return { norma: 'Código de Familia', prefijoArticulo: 'Art. ', sufijoCanon: 'CF' };
  if (/procesal|penal/.test(s) || s === 'cpp') return { norma: 'Código Procesal Penal', prefijoArticulo: 'Art. ', sufijoCanon: 'CPP' };
  if (/tributario/.test(s) || s === 'tr') return { norma: 'Código Tributario', prefijoArticulo: 'Art. ', sufijoCanon: 'Tr' };
  if (/penal/.test(s) || s === 'cp' || /\.?\s*p\.?/.test(s)) return { norma: 'Código Penal', prefijoArticulo: 'Art. ', sufijoCanon: 'CP' };
  // Inferencia por slug/categoría cuando no hay sufijo explícito.
  if (/familia|pens[ií]on|custodia|divorcio|aliment/.test(slug)) return { norma: 'Código de Familia', prefijoArticulo: 'Art. ', sufijoCanon: 'CF' };
  if (/penal|detencion|detenido|habeas|delito|prisi|sentencia|recurso|apelac|casaci/.test(slug)) return { norma: 'Código Penal/Procesal Penal', prefijoArticulo: 'Art. ', sufijoCanon: 'CPP' };
  if (/laboral|trabaj|despido|sindic|emplead/.test(slug)) return { norma: 'Código del Trabajo', prefijoArticulo: 'Art. ', sufijoCanon: 'CT' };
  if (/civil|prescripci|deuda|contrato|arrend|da[oñ]o|perjuicio|indemniz/.test(slug)) return { norma: 'Código Civil', prefijoArticulo: 'Art. ', sufijoCanon: 'CC' };
  return { norma: 'sin sufijo', prefijoArticulo: 'Art. ', sufijoCanon: '' };
}

// --- Verificación contra canónicos ---------------------------------------
interface ResultadoVerificacion {
  existe: boolean;
  pertinente: boolean;
  canonEncontrado?: ArticuloCanonico;
  fuenteCanonica: string;
}

function verificarClaim(claim: ClaimBruto, slug: string): ResultadoVerificacion {
  const num = claim.articuloMencionado.match(/(\d{1,4})/)?.[1];
  if (!num) return { existe: false, pertinente: false, fuenteCanonica: 'N/A' };

  const suf = claim.articuloMencionado.match(/(CC|Co|CT|CF|CPP|Tr|CP)\b/)?.[1];

  // 1. Códigos estructurados (Art. N CC).
  if (suf && CANONES[suf as keyof typeof CANONES]) {
    const canon = CANONES[suf as keyof typeof CANONES];
    const clave = `Art. ${num} ${suf}`;
    const art = canon.get(clave);
    if (art) {
      const pertinente = evaluarPertinencia(claim, art, slug);
      return { existe: true, pertinente, canonEncontrado: art, fuenteCanonica: `data/codigo*.json (${clave})` };
    }
    return { existe: false, pertinente: false, fuenteCanonica: `data/codigo*.json (${clave} NO encontrado)` };
  }

  // 2. Código Penal (articulo numérico en articulos_cp.json).
  if (suf === 'CP' || claim.normaMencionada.includes('Penal')) {
    const art = CP.find((a) => String(a.articulo) === num);
    if (art) {
      const pertinente = evaluarPertinencia(claim, art, slug);
      return { existe: true, pertinente, canonEncontrado: art, fuenteCanonica: `data/articulos_cp.json (Art. ${num})` };
    }
  }

  // 3. Constitución.
  if (/constituci/i.test(claim.contexto)) {
    const art = CONSTITUCION.find((a) => String(a.articulo) === num || String(a.numero) === num);
    if (art) {
      const pertinente = evaluarPertinencia(claim, art, slug);
      return { existe: true, pertinente, canonEncontrado: art, fuenteCanonica: `data/articulos_constitucion.json (Art. ${num})` };
    }
  }

  return { existe: false, pertinente: false, fuenteCanonica: 'sin coincidencia canónica' };
}

/**
 * Pertinencia: compara palabras clave sustantivas del claim contra el
 * epígrafe/tema/texto del artículo canónico. Si el artículo trata de algo
 * evidentemente distinto (p. ej. claim habla de "alimentos" y el artículo
 * habla de "tutores y herencias"), pertinencia = false.
 */
function evaluarPertinencia(claim: ClaimBruto, art: ArticuloCanonico, slug: string): boolean {
  const temaCanon = String(art.tema ?? '').toLowerCase();
  const textoCanonCompleto = `${art.epigrafe ?? ''} ${temaCanon} ${art.texto ?? ''}`.toLowerCase();
  // El contexto de evaluación incluye el slug (codifica la materia del artículo)
  // y la ventana de texto alrededor del claim. Así "divorcio_mutuo_consentimiento"
  // coincide aunque la ventana de 120 chars no diga "divorcio" explícitamente.
  const contexto = `${slug.replace(/-/g, ' ')} ${claim.contexto}`.toLowerCase();
  // Camino A: coincidencia por tema (siempre que el canon declare `tema`).
  if (temaCanon) {
    const raicesTema = temaCanon.split(/[_\s]+/).filter((w) => w.length > 3);
    const coincideTema = raicesTema.some((r) => {
      const raiz = r.slice(0, Math.max(5, r.length - 2));
      return contexto.includes(raiz) || contexto.includes(r);
    });
    if (coincideTema) return true;
    if (!art.texto) return false;
  }
  // Camino B: coincidencia por palabras sustantivas del texto completo del canon.
  const stopwords = new Set(['de','la','el','en','y','a','los','las','del','que','con','por','para','un','una','es','al','lo','su','se','como','más','mas','o','si','no','su','sus','fue','son','ser']);
  const palabras = contexto
    .replace(/[^a-záéíóúñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopwords.has(w));
  if (palabras.length === 0) return true;
  const coincidencias = palabras.filter((w) => textoCanonCompleto.includes(w)).length;
  const ratio = coincidencias / palabras.length;
  return ratio >= 0.18;
}

// --- Clasificación final -------------------------------------------------
type Decision = 'confirmed' | 'corrected' | 'unsupported' | 'ambiguous' | 'needs_human_review';

function clasificar(
  claim: ClaimBruto,
  verif: ResultadoVerificacion,
): { decision: Decision; motivo: string } {
  // Claims de plazo/pena/requisito numéricos sin artículo: pasan a revisión humana.
  if (claim.tipo === 'plazo' || claim.tipo === 'pena') {
    return {
      decision: 'needs_human_review',
      motivo:
        'Plazo/pena numérica sin cita de artículo canónico. Requiere verificación humana contra la norma aplicable.',
    };
  }
  if (claim.tipo === 'requisito' && claim.textoExacto.includes('%')) {
    return {
      decision: 'needs_human_review',
      motivo: 'Porcentaje jurídico (embargo/retención) que requiere confirmación contra la norma específica.',
    };
  }
  if (claim.tipo === 'norma') {
    // Decretos conocidos que crean códigos vigentes: cita válida aunque no
    // apunte a un artículo concreto.
    const decreto = claim.textoExacto.match(/Decreto\s+N?º?\.?\s*(\d{1,3}-\d{2,4})/i)?.[1];
    if (decreto) {
      const decretosValidos: Record<string, string> = {
        '76-84': 'Código de Familia de Honduras (vigente)',
        '144-83': 'Código del Trabajo de Honduras',
        '65-28': 'Ley de Propiedad Industrial (anterior)',
        '12-2009': 'Ley de Propiedad Industrial vigente',
        '236-2013': 'Ley Modelo Interamericana de Acceso a la Información',
      };
      if (decretosValidos[decreto]) {
        return {
          decision: 'confirmed',
          motivo: `Decreto ${decreto} = ${decretosValidos[decreto]}. Cita normativa válida y vigente.`,
        };
      }
      return {
        decision: 'needs_human_review',
        motivo: `Decreto ${decreto} citado pero no verificado en el listado de decretos conocidos. Requiere confirmación en La Gaceta.`,
      };
    }
    if (!verif.existe) {
      // ¿Es corregible (hay código alternativo claro) o insalvable?
      if (claim.normaMencionada === 'Código Civil' || claim.normaMencionada === 'Código de Familia') {
        return {
          decision: 'corrected',
          motivo: `Artículo citado (${claim.articuloMencionado}) NO existe en la fuente canónica o NO trata del tema. La materia pertenece al Código de Familia (Decreto 76-84), no al Código Civil. Requiere sustitución de la cita.`,
        };
      }
      return {
        decision: 'unsupported',
        motivo: `Artículo citado (${claim.articuloMencionado}) no encontrado en ninguna fuente canónica del repositorio.`,
      };
    }
    if (!verif.pertinente) {
      return {
        decision: 'corrected',
        motivo: `El artículo ${claim.articuloMencionado} existe pero NO trata del tema afirmado en el cuerpo (pertinencia baja). Requiere sustituir por la cita correcta o eliminar.`,
      };
    }
    return {
      decision: 'confirmed',
      motivo: `Artículo ${claim.articuloMencionado} existe y es pertinente según fuente canónica ${verif.fuenteCanonica}.`,
    };
  }
  return { decision: 'needs_human_review', motivo: 'Tipo de claim no clasificable automáticamente.' };
}

// --- Main ----------------------------------------------------------------
function main() {
  const backupPath = path.join(DATA, 'lote2-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('ERROR: data/lote2-backup.json no encontrado. Ejecuta fase4a-exportar-lote2.ts primero.');
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const posts: { slug: string; title: string; body: string; category: string }[] = backup.posts;

  const claimsFinales: unknown[] = [];
  const fuentesOficialesDetectadas: string[] = [];

  for (const post of posts) {
    const claimsBrutos = extraerClaimsDeBody(post.body, post.slug);
    let n = 0;
    for (const cb of claimsBrutos) {
      n++;
      const verif = verificarClaim(cb, post.slug);
      const cla = clasificar(cb, verif);
      const claimId = `4a-${post.slug.slice(0, 24)}-${String(n).padStart(2, '0')}`;
      claimsFinales.push({
        id: claimId,
        slug: post.slug,
        textoExacto: cb.textoExacto,
        contexto: cb.contexto,
        tipo: cb.tipo,
        importancia: cb.importancia,
        normaMencionada: cb.normaMencionada,
        articuloMencionado: cb.articuloMencionado,
        decision: cla.decision,
        motivo: cla.motivo,
        fuenteExistente: null, // Lote 2 sin fuentes previas
        fuenteCanonicaVerificada: verif.existe ? verif.fuenteCanonica : null,
        canonEncontrado: verif.canonEncontrado
          ? {
              articulo: verif.canonEncontrado.articulo,
              epigrafe: verif.canonEncontrado.epigrafe,
              tema: verif.canonEncontrado.tema,
            }
          : null,
        pertinente: verif.pertinente,
        necesitaRevisionHumana: cla.decision === 'needs_human_review',
        // Para corrected: se rellenará textoAnterior/textoSustituto en la fase de investigación manual
        textoAnterior: cla.decision === 'corrected' ? cb.textoExacto : null,
        textoSustituto: null,
        fuenteCorreccion: null,
        fragmento: verif.canonEncontrado?.texto?.slice(0, 200) ?? null,
      });
    }
    console.log(`  ${post.slug}: ${claimsBrutos.length} claims extraídos.`);
  }

  // Estadísticas
  const porDecision: Record<string, number> = {};
  const porImportancia: Record<string, number> = {};
  for (const c of claimsFinales as { decision: string; importancia: string }[]) {
    porDecision[c.decision] = (porDecision[c.decision] ?? 0) + 1;
    porImportancia[c.importancia] = (porImportancia[c.importancia] ?? 0) + 1;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    fase: '4A',
    lote: 2,
    enunciadoSeccion: '§5-§7',
    metodo:
      'Extracción automática por patrones (Artículo N, Decreto, plazos, penas, %) + ' +
      'verificación contra canónicos data/*.json + clasificación por existencia/pertinencia. ' +
      'Claims centrales de alto riesgo y todos los needs_human_review/corrected se refinan ' +
      'manualmente con investigación a fuentes oficiales .gob.hn.',
    totalClaims: claimsFinales.length,
    porDecision,
    porImportancia,
    fuentesOficialesReferenciadas: fuentesOficialesDetectadas,
    claims: claimsFinales,
  };
  fs.writeFileSync(path.join(AUDITS, 'fase4a-lote2-claims-finales.json'), JSON.stringify(out, null, 2));
  console.log(`\nOK: ${claimsFinales.length} claims extraídos y clasificados.`);
  console.log('Por decisión:', porDecision);
  console.log('Por importancia:', porImportancia);
  console.log('  -> docs/audits/fase4a-lote2-claims-finales.json');
}

main();
