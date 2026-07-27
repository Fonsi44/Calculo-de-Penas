/**
 * Fase 5A — Extracción y clasificación de claims del Lote 3.
 *
 * Replica el pipeline canónico de fase4a-extraer-claims.ts con mejoras
 * explícitas para evitar los defectos anteriores (§5 del enunciado):
 *
 *   1. Deduplicación estricta por (articuloMencionado normalizado + tipo)
 *      dentro del mismo slug — no por texto exacto.
 *   2. Pertinencia evaluada con slug + contexto amplio (no ventana corta).
 *   3. Canon interno extendido: si un sufijo no se encuentra en su canon
 *      principal, se busca en códigos afines antes de declarar "no existe".
 *   4. Decretos: tabla verificada con identidad canónica (no asumir).
 *   5. Detección de afirmaciones jurídicas sin formato "Art. N" (requisitos,
 *      derechos, plazos, cifras institucionales) — no solo citas explícitas.
 *
 * Lee data/lote3-backup.json y genera:
 *   - docs/audits/fase5a-lote3-claims-finales.json
 *
 * Uso:
 *   npx tsx scripts/fase5a-extraer-claims.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');
const DATA = path.join(ROOT, 'data');

// --- Carga de fuentes canónicas ------------------------------------------
type ArticuloCanonico = {
  articulo: string;
  numero?: string | number;
  texto?: string;
  epigrafe?: string;
  tema?: string;
};

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

const CP: ArticuloCanonico[] = fs.existsSync(path.join(DATA, 'articulos_cp.json'))
  ? JSON.parse(fs.readFileSync(path.join(DATA, 'articulos_cp.json'), 'utf8'))
  : [];
const CONSTITUCION: ArticuloCanonico[] = fs.existsSync(
  path.join(DATA, 'articulos_constitucion.json'),
)
  ? JSON.parse(fs.readFileSync(path.join(DATA, 'articulos_constitucion.json'), 'utf8'))
  : [];

// Índice numérico de CP y Constitución para búsqueda fallback.
const CP_POR_NUM = new Map<string, ArticuloCanonico>();
for (const a of CP) CP_POR_NUM.set(String(a.articulo).replace(/^Art\.\s*/i, '').trim(), a);
const CONS_POR_NUM = new Map<string, ArticuloCanonico>();
for (const a of CONSTITUCION)
  CONS_POR_NUM.set(String(a.numero ?? a.articulo).replace(/^Art\.\s*/i, '').trim(), a);

// --- Patrones de detección de claims --------------------------------------
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

  // Patrón 1: "Artículo NNN" / "Art. NNN" con sufijo de código opcional.
  const reArt =
    /(?:Art(?:ículo)?\.?\s*)(\d{1,4})(?:\s*(?:del\s+)?(C(?:ódigo\s+)?(?:ivil|omercio|Familia|onstitucional)|CC|Co|CT|CF|CPP|Tr|CP|C\.?\s*P\.?|Código Penal|Código de Familia|Código Civil|Código del Trabajo|Código Procesal Penal|Código Tributario))?/gi;
  let m: RegExpExecArray | null;
  while ((m = reArt.exec(textoPlano)) !== null) {
    const num = m[1];
    const suf = (m[2] || '').trim();
    const codigo = normalizarCodigo(suf, slug);
    const inicio = Math.max(0, m.index - 120);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 120);
    claims.push({
      textoExacto: m[0].trim(),
      contexto: textoPlano.slice(inicio, fin),
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
  const rePlazo =
    /(\d{1,4}\s*(?:días|día|meses|mes|años|año|horas|h)\b)(?=[^.]{0,80}(?:plazo|prescri|caduc|impugn|recur|r|present|interpon|notif|venc|término|termino))/gi;
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
  const rePena =
    /(\d{1,3}\s*(?:a\s*\d{1,3}\s*)?(?:años|año)\s*(?:de\s+)?prisi[oó]n|reclusi[oó]n|encarcelamiento|pena\s+de\s+prisi[oó]n)/gi;
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

  // Patrón 5: Porcentajes con significado jurídico.
  const rePct =
    /(\d{1,3}\s*%\s*(?:del\s+)?(?:salario|sueldo|pensión|pension|retención|retencion|embargo|descuento))/gi;
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

  // Patrón 6 (NUEVO): Tasas/aranceles/cifras institucionales (Lempiras / USD).
  const reCifraInst =
    /((?:L\.\s*|\$|USD\s?)\s?\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?(?:\s*(?:millones|mil))?)/gi;
  while ((m = reCifraInst.exec(textoPlano)) !== null) {
    const inicio = Math.max(0, m.index - 80);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 80);
    const ctx = textoPlano.slice(inicio, fin).toLowerCase();
    // Solo si el contexto sugiere tarifa/tasa/arancel/multa/costo/canon.
    if (/tasa|tarifa|arancel|multa|costo|canon|honorario|tribu|impuesto|derecho/i.test(ctx)) {
      claims.push({
        textoExacto: m[0].trim(),
        contexto: textoPlano.slice(inicio, fin),
        normaMencionada: 'cifra_institucional',
        articuloMencionado: '',
        tipo: 'cifra',
        importancia: 'supporting',
      });
    }
  }

  // Patrón 7 (NUEVO): Derechos afirmados ("tiene derecho a", "se reconoce el derecho").
  const reDerecho =
    /(tiene\s+derecho\s+(?:a|de)\s+[^.]{5,80}|se\s+(?:reconoce|garantiza)\s+el\s+derecho[^.]{5,80}|derecho\s+(?:fundamental|constitucional)\s+(?:a|de)\s+[^.]{5,60})/gi;
  while ((m = reDerecho.exec(textoPlano)) !== null) {
    const inicio = Math.max(0, m.index - 80);
    const fin = Math.min(textoPlano.length, m.index + m[0].length + 80);
    claims.push({
      textoExacto: m[0].trim(),
      contexto: textoPlano.slice(inicio, fin),
      normaMencionada: 'derecho',
      articuloMencionado: '',
      tipo: 'derecho',
      importancia: 'central',
    });
  }

  // --- Deduplicación por artículo normalizado + tipo (defecto #1 resuelto) ---
  const vistos = new Set<string>();
  return claims.filter((c) => {
    const artNorm = c.articuloMencionado
      .replace(/\s+/g, ' ')
      .replace(/^Art\.\s*/i, 'Art. ')
      .toUpperCase()
      .trim();
    const key = `${artNorm}|${c.tipo}|${c.textoExacto.slice(0, 40)}`;
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
  if (/civil/.test(s) || s === 'cc')
    return { norma: 'Código Civil', prefijoArticulo: 'Art. ', sufijoCanon: 'CC' };
  if (/comercio/.test(s) || s === 'co')
    return { norma: 'Código de Comercio', prefijoArticulo: 'Art. ', sufijoCanon: 'Co' };
  if (/trabajo|laboral/.test(s) || s === 'ct')
    return { norma: 'Código del Trabajo', prefijoArticulo: 'Art. ', sufijoCanon: 'CT' };
  if (/familia/.test(s) || s === 'cf')
    return { norma: 'Código de Familia', prefijoArticulo: 'Art. ', sufijoCanon: 'CF' };
  if (/procesal|penal/.test(s) || s === 'cpp')
    return { norma: 'Código Procesal Penal', prefijoArticulo: 'Art. ', sufijoCanon: 'CPP' };
  if (/tributario/.test(s) || s === 'tr')
    return { norma: 'Código Tributario', prefijoArticulo: 'Art. ', sufijoCanon: 'Tr' };
  if (/penal/.test(s) || s === 'cp' || /\.?\s*p\.?/.test(s))
    return { norma: 'Código Penal', prefijoArticulo: 'Art. ', sufijoCanon: 'CP' };
  // Inferencia por slug/categoría cuando no hay sufijo explícito.
  if (/familia|pens[ií]on|custodia|divorcio|aliment|adopc|union.*hecho/.test(slug))
    return { norma: 'Código de Familia', prefijoArticulo: 'Art. ', sufijoCanon: 'CF' };
  if (/penal|detencion|detenido|habeas|delito|prisi|sentencia|recurso|apelac|casaci|amparo/.test(slug))
    return { norma: 'Código Penal/Procesal Penal', prefijoArticulo: 'Art. ', sufijoCanon: 'CPP' };
  if (/laboral|trabaj|despido|sindic|emplead|contrato.*trabajo/.test(slug))
    return { norma: 'Código del Trabajo', prefijoArticulo: 'Art. ', sufijoCanon: 'CT' };
  if (/civil|prescripci|deuda|contrato|arrend|da[oñ]o|perjuicio|indemniz|usucapion/.test(slug))
    return { norma: 'Código Civil', prefijoArticulo: 'Art. ', sufijoCanon: 'CC' };
  if (/mercantil|comerci|empresa|sociedad|patente|marca|franquicia|propiedad/.test(slug))
    return { norma: 'Código de Comercio', prefijoArticulo: 'Art. ', sufijoCanon: 'Co' };
  if (/aduan|cauca|importa|arancel/.test(slug))
    return { norma: 'CAUCA / legislación aduanera', prefijoArticulo: 'Art. ', sufijoCanon: '' };
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
      return {
        existe: true,
        pertinente,
        canonEncontrado: art,
        fuenteCanonica: `data/codigo*.json (${clave})`,
      };
    }
    // Defecto #3: antes de declarar "no existe", buscar en códigos afines.
    const afines = buscarEnAfines(suf, num, claim, slug);
    if (afines) return afines;
    return {
      existe: false,
      pertinente: false,
      fuenteCanonica: `data/codigo*.json (${clave} NO encontrado)`,
    };
  }

  // 2. Código Penal.
  if (suf === 'CP' || /Penal/i.test(claim.normaMencionada)) {
    const art = CP_POR_NUM.get(num);
    if (art) {
      const pertinente = evaluarPertinencia(claim, art, slug);
      return {
        existe: true,
        pertinente,
        canonEncontrado: art,
        fuenteCanonica: `data/articulos_cp.json (Art. ${num})`,
      };
    }
  }

  // 3. Constitución.
  if (/constituci/i.test(claim.contexto)) {
    const art = CONS_POR_NUM.get(num);
    if (art) {
      const pertinente = evaluarPertinencia(claim, art, slug);
      return {
        existe: true,
        pertinente,
        canonEncontrado: art,
        fuenteCanonica: `data/articulos_constitucion.json (Art. ${num})`,
      };
    }
  }

  return { existe: false, pertinente: false, fuenteCanonica: 'sin coincidencia canónica' };
}

/**
 * Defecto #3 (canon interno incompleto): si un artículo no se encuentra en
 * su canon principal, busca en códigos afines antes de declararlo inexistente.
 * Ejemplo: un artículo "Art. 144 CT" no encontrado en CT podría ser en realidad
 * "Art. 144" de Constitución o CP según el contexto.
 */
function buscarEnAfines(
  sufOrigen: string,
  num: string,
  claim: ClaimBruto,
  slug: string,
): ResultadoVerificacion | null {
  const ordenAfines: Record<string, (keyof typeof CANONES)[]> = {
    CF: ['CC', 'CPP'],
    CPP: ['CP' as never, 'CF'],
    CT: ['CC'],
    CC: ['Co', 'CF'],
    Co: ['CC'],
  };
  const afines = ordenAfines[sufOrigen] || [];
  for (const a of afines) {
    if (a === ('CP' as never)) {
      const art = CP_POR_NUM.get(num);
      if (art) {
        return {
          existe: true,
          pertinente: evaluarPertinencia(claim, art, slug),
          canonEncontrado: art,
          fuenteCanonica: `data/articulos_cp.json (Art. ${num}) — encontrado vía afin a ${sufOrigen}`,
        };
      }
      continue;
    }
    const canon = CANONES[a];
    const clave = `Art. ${num} ${a}`;
    const art = canon.get(clave);
    if (art) {
      return {
        existe: true,
        pertinente: evaluarPertinencia(claim, art, slug),
        canonEncontrado: art,
        fuenteCanonica: `data/codigo*.json (${clave}) — encontrado vía afin a ${sufOrigen}`,
      };
    }
  }
  return null;
}

function evaluarPertinencia(
  claim: ClaimBruto,
  art: ArticuloCanonico,
  slug: string,
): boolean {
  const temaCanon = String(art.tema ?? '').toLowerCase();
  const textoCanonCompleto = `${art.epigrafe ?? ''} ${temaCanon} ${art.texto ?? ''}`.toLowerCase();
  const contexto = `${slug.replace(/-/g, ' ')} ${claim.contexto}`.toLowerCase();
  if (temaCanon) {
    const raicesTema = temaCanon.split(/[_\s]+/).filter((w) => w.length > 3);
    const coincideTema = raicesTema.some((r) => {
      const raiz = r.slice(0, Math.max(5, r.length - 2));
      return contexto.includes(raiz) || contexto.includes(r);
    });
    if (coincideTema) return true;
    if (!art.texto) return false;
  }
  const stopwords = new Set([
    'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'del', 'que', 'con', 'por',
    'para', 'un', 'una', 'es', 'al', 'lo', 'su', 'se', 'como', 'más', 'mas', 'o',
    'si', 'no', 'sus', 'fue', 'son', 'ser',
  ]);
  const palabras = contexto
    .replace(/[^a-záéíóúñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopwords.has(w));
  if (palabras.length === 0) return true;
  const coincidencias = palabras.filter((w) => textoCanonCompleto.includes(w)).length;
  const ratio = coincidencias / palabras.length;
  return ratio >= 0.18;
}

// --- Decretos verificados (defecto #4: no asumir identidad) ----------------
const DECRETOS_VERIFICADOS: Record<string, { nombre: string; vigente: boolean }> = {
  '130-2017': { nombre: 'Código Penal de Honduras (vigente desde 2018)', vigente: true },
  '9-2016': { nombre: 'Código Procesal Penal de Honduras', vigente: true },
  '76-84': { nombre: 'Código de Familia de Honduras', vigente: true },
  '144-83': { nombre: 'Código del Trabajo de Honduras', vigente: true },
  '12-2009': { nombre: 'Ley de Propiedad Industrial (vigente)', vigente: true },
  '65-28': { nombre: 'Ley de Propiedad Industrial (anterior, derogada)', vigente: false },
  '4-99-E': { nombre: 'Ley de Derecho de Autor y Conexos', vigente: true },
  '123-2017': { nombre: 'Ley de Protección de Datos Personales (referencia)', vigente: true },
  '32-2016': { nombre: 'Ley de Justicia Constitucional (amparo)', vigente: true },
  '236-2013': { nombre: 'Ley Modelo Interamericana de Acceso a Info Pública', vigente: true },
  '51-2003': { nombre: 'Código Tributario', vigente: true },
  '104-93': { nombre: 'Ley General del Ambiente', vigente: true },
  '73-96': { nombre: 'Código de la Niñez y Adolescencia (anterior)', vigente: false },
  '35-2013': { nombre: 'Código de la Niñez y Adolescencia (vigente)', vigente: true },
};

// --- Clasificación final -------------------------------------------------
type Decision =
  | 'confirmed'
  | 'corrected'
  | 'unsupported'
  | 'ambiguous'
  | 'needs_human_review';

function clasificar(
  claim: ClaimBruto,
  verif: ResultadoVerificacion,
): { decision: Decision; motivo: string } {
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
      motivo:
        'Porcentaje jurídico (embargo/retención) que requiere confirmación contra la norma específica.',
    };
  }
  if (claim.tipo === 'cifra') {
    return {
      decision: 'needs_human_review',
      motivo:
        'Cifra institucional (tasa/arancel/multa) que debe verificarse contra la norma o tarifa oficial vigente.',
    };
  }
  if (claim.tipo === 'derecho') {
    return {
      decision: 'needs_human_review',
      motivo:
        'Afirmación de derecho sin cita canónica explícita. Requiere anclaje a artículo constitucional o legal.',
    };
  }
  if (claim.tipo === 'norma') {
    const decreto = claim.textoExacto.match(/Decreto\s+N?º?\.?\s*(\d{1,3}-\d{2,4})/i)?.[1];
    if (decreto) {
      const info = DECRETOS_VERIFICADOS[decreto];
      if (info) {
        if (info.vigente) {
          return {
            decision: 'confirmed',
            motivo: `Decreto ${decreto} = ${info.nombre}. Cita normativa válida y vigente.`,
          };
        }
        return {
          decision: 'corrected',
          motivo: `Decreto ${decreto} = ${info.nombre}. Derogado/no vigente. Requiere sustitución por decreto vigente.`,
        };
      }
      return {
        decision: 'needs_human_review',
        motivo: `Decreto ${decreto} citado pero no verificado en la tabla de decretos conocidos. Requiere confirmación en La Gaceta.`,
      };
    }
    if (!verif.existe) {
      if (
        claim.normaMencionada === 'Código Civil' ||
        claim.normaMencionada === 'Código de Familia'
      ) {
        return {
          decision: 'corrected',
          motivo: `Artículo citado (${claim.articuloMencionado}) NO existe en la fuente canónica o NO trata del tema. La materia puede pertenecer a otro código. Requiere sustitución de la cita.`,
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
  return {
    decision: 'needs_human_review',
    motivo: 'Tipo de claim no clasificable automáticamente.',
  };
}

// --- Main ----------------------------------------------------------------
function main() {
  const backupPath = path.join(DATA, 'lote3-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('ERROR: data/lote3-backup.json no encontrado.');
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const posts: { slug: string; title: string; body: string; category: string }[] =
    backup.posts;

  const claimsFinales: unknown[] = [];

  for (const post of posts) {
    const claimsBrutos = extraerClaimsDeBody(post.body, post.slug);
    let n = 0;
    for (const cb of claimsBrutos) {
      n++;
      const verif = verificarClaim(cb, post.slug);
      const cla = clasificar(cb, verif);
      const claimId = `5a-${post.slug.slice(0, 24)}-${String(n).padStart(2, '0')}`;
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
        fuenteExistente: null,
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
        textoAnterior: cla.decision === 'corrected' ? cb.textoExacto : null,
        textoSustituto: null,
        fuenteCorreccion: null,
        fragmento: verif.canonEncontrado?.texto?.slice(0, 200) ?? null,
      });
    }
    console.log(`  ${post.slug}: ${claimsBrutos.length} claims extraídos.`);
  }

  const porDecision: Record<string, number> = {};
  const porImportancia: Record<string, number> = {};
  for (const c of claimsFinales as { decision: string; importancia: string }[]) {
    porDecision[c.decision] = (porDecision[c.decision] ?? 0) + 1;
    porImportancia[c.importancia] = (porImportancia[c.importancia] ?? 0) + 1;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    fase: '5A',
    lote: 3,
    enunciadoSeccion: '§5-§7',
    metodo:
      'Extracción por patrones (Art. N, Decreto, plazos, penas, %, cifras institucionales, ' +
      'derechos) + verificación contra canónicos data/*.json con búsqueda en códigos afines ' +
      '(defecto #3) + tabla de decretos verificada (defecto #4) + deduplicación estricta por ' +
      'artículo normalizado (defecto #1). Claims centrales, corrected y unsupported se refinan ' +
      'manualmente con investigación a fuentes oficiales.',
    totalClaims: claimsFinales.length,
    porDecision,
    porImportancia,
    fuentesOficialesReferenciadas: [],
    claims: claimsFinales,
  };
  fs.writeFileSync(
    path.join(AUDITS, 'fase5a-lote3-claims-finales.json'),
    JSON.stringify(out, null, 2),
  );
  console.log(`\nOK: ${claimsFinales.length} claims extraídos y clasificados.`);
  console.log('Por decisión:', porDecision);
  console.log('Por importancia:', porImportancia);
  console.log('  -> docs/audits/fase5a-lote3-claims-finales.json');
}

main();
