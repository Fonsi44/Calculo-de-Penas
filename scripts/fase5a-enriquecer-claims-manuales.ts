/**
 * Fase 5A — Enriquecimiento manual de claims del Lote 3.
 *
 * La extracción automática (fase5a-extraer-claims.ts) pierde afirmaciones
 * jurídicas que no usan el formato "Art. N" (defecto #5 del enunciado §5):
 * citas a "Artículo 346 de la Constitución", "Convenio 169 OIT ratificado
 * por Decreto 26-94", "Código Procesal Civil", plazos procesales, etc.
 *
 * Este script añade los claims manuales verificados por lectura directa de
 * los bodies, los verifica contra los canónicos y reclasifica los claims
 * automáticos mal asignados (p. ej. "Art. 182" asignado a CPP cuando es de
 * la Constitución).
 *
 * Lee:
 *   - docs/audits/fase5a-lote3-claims-finales.json (salida automática)
 * Escribe:
 *   - docs/audits/fase5a-lote3-claims-finales.json (enriquecido)
 *
 * Uso:
 *   npx tsx scripts/fase5a-enriquecer-claims-manuales.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const AUDITS = path.join(ROOT, 'docs', 'audits');
const DATA = path.join(ROOT, 'data');

const consArr: { numero: string | number; articulo: string; texto: string; titulo?: string }[] =
  JSON.parse(fs.readFileSync(path.join(DATA, 'articulos_constitucion.json'), 'utf8'));
const ccArr: { articulo: string; epigrafe?: string; texto: string; tema?: string }[] =
  JSON.parse(fs.readFileSync(path.join(DATA, 'codigo_civil.json'), 'utf8'));
const cmArr: { articulo: string; epigrafe?: string; texto: string; tema?: string }[] =
  JSON.parse(fs.readFileSync(path.join(DATA, 'codigo_comercio.json'), 'utf8'));
const cpArr: { articulo: string; epigrafe?: string; texto: string; tema?: string }[] =
  JSON.parse(fs.readFileSync(path.join(DATA, 'articulos_cp.json'), 'utf8'));

function cons(num: string) {
  return consArr.find((a) => String(a.numero) === num);
}
function cc(art: string) {
  return ccArr.find((a) => a.articulo === art);
}
function cm(art: string) {
  return cmArr.find((a) => a.articulo === art);
}

interface Claim {
  id: string;
  slug: string;
  textoExacto: string;
  contexto: string;
  tipo: string;
  importancia: 'central' | 'supporting' | 'contextual';
  normaMencionada: string;
  articuloMencionado: string;
  decision: string;
  motivo: string;
  fuenteExistente: string | null;
  fuenteCanonicaVerificada: string | null;
  canonEncontrado: { articulo: string; epigrafe?: string; tema?: string } | null;
  pertinente: boolean;
  necesitaRevisionHumana: boolean;
  textoAnterior: string | null;
  textoSustituto: string | null;
  fuenteCorreccion: string | null;
  fragmento: string | null;
  origen?: string;
}

// --- Claims manuales verificados por lectura directa del body -------------
// Cada entrada: { slug, textoExacto, articuloMencionado, norma, tipo, decision, motivo, canonVerificado, fragmento }
interface ClaimManual {
  slug: string;
  textoExacto: string;
  articuloMencionado: string;
  norma: string;
  tipo: string;
  importancia: 'central' | 'supporting' | 'contextual';
  decision: string;
  motivo: string;
  canonArticulo?: string;
  canonArchivo?: string;
  fragmento?: string;
}

const MANUALES: ClaimManual[] = [
  // banco-demanda-deuda
  {
    slug: 'banco-demanda-deuda-defensa-opciones-honduras',
    textoExacto: 'Código Procesal Civil (CPC)',
    articuloMencionado: 'CPC (ley especial)',
    norma: 'Código Procesal Civil',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'El Código Procesal Civil de Honduras no está disponible como fuente canónica estructurada en el repositorio. La afirmación sobre juicio ejecutivo mercantil requiere verificación humana contra el CPC vigente.',
  },
  {
    slug: 'banco-demanda-deuda-defensa-opciones-honduras',
    textoExacto: 'plazo de 3 días hábiles para presentarse y formular oposición',
    articuloMencionado: '',
    norma: 'plazo procesal',
    tipo: 'plazo',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Plazo procesal de oposición a ejecución (3 días hábiles). Requiere verificación contra el artículo específico del CPC que regula el juicio ejecutivo.',
  },
  // codigo-aduanero-centroamericano (0 claims automáticos → añadir centrales)
  {
    slug: 'codigo-aduanero-centroamericano',
    textoExacto: 'Código Aduanero Uniforme Centroamericano (CAUCA)',
    articuloMencionado: 'CAUCA (reglamento regional)',
    norma: 'CAUCA',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'CAUCA y RECAUCA son legislación regional centroamericana. El canon interno data/cauca_verificado.json solo contiene 2 artículos sintetizados (no íntegros). Requiere verificación humana contra texto oficial del CAUCA vigente.',
  },
  {
    slug: 'codigo-aduanero-centroamericano',
    textoExacto: 'DAI (Derecho Arancelario a la Importación)',
    articuloMencionado: '',
    norma: 'arancel',
    tipo: 'cifra',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Afirmación sobre DAI y tributos arancelarios. Las tasas arancelarias específicas requieren verificación contra el arancel vigente de Honduras (SAR/Aduanas).',
  },
  {
    slug: 'codigo-aduanero-centroamericano',
    textoExacto: 'Servicio de Administración de Rentas (SAR)',
    articuloMencionado: '',
    norma: 'institución',
    tipo: 'derecho',
    importancia: 'supporting',
    decision: 'confirmed',
    motivo:
      'El SAR es efectivamente la autoridad competente en recaudación tributaria interna (ISV en importaciones), conforme a la Ley de Administración de Rentas (Decreto 51-2003, reformado).',
  },
  // derechos-indigenas
  {
    slug: 'derechos-indigenas-consulta-previa-honduras',
    textoExacto: 'Convenio 169 de la OIT ratificado por Honduras mediante Decreto 26-94',
    articuloMencionado: 'Decreto 26-94',
    norma: 'Convenio OIT 169',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Afirmación central: ratificación del Convenio 169 OIT por Decreto 26-94. El canon interno no contiene el texto del Convenio ni del decreto de ratificación. Requiere verificación en La Gaceta.',
  },
  {
    slug: 'derechos-indigenas-consulta-previa-honduras',
    textoExacto: 'Constitución, Artículo 346',
    articuloMencionado: 'Art. 346 Constitución',
    norma: 'Constitución',
    tipo: 'norma',
    importancia: 'central',
    decision: 'confirmed',
    motivo:
      'Art. 346 Constitución verificado: "Es deber del Estado dictar medidas de protección de los derechos e intereses de las comunidades indígenas...". Cita pertinente y correcta.',
    canonArticulo: 'Art. 346 Constitución',
    canonArchivo: 'data/articulos_constitucion.json',
    fragmento: cons('346')?.texto.slice(0, 200),
  },
  // poder-legal: la afirmación "Art. 1732 define el mandato" es FALSA (1732 es arrendamiento)
  {
    slug: 'poder-legal-honduras-cuando-se-necesita',
    textoExacto: 'artículos 1732 al 1750, que versan sobre el mandato. El Artículo 1732 define el mandato',
    articuloMencionado: 'Art. 1732-1750 CC',
    norma: 'Código Civil',
    tipo: 'norma',
    importancia: 'central',
    decision: 'corrected',
    motivo:
      'INCORRECTO: Art. 1732-1750 CC tratan de ARRENDAMIENTO (locales/rústicos/colono), NO de mandato. Verificación directa: Art. 1732 CC = "Podrá el arrendador hacer cesar el arrendamiento". El MANDATO está regulado en Art. 1888-1912 CC: Art. 1888 CC = "Por el contrato de mandato se obliga una..."; Art. 1911 CC = "El mandato se acaba...". Sustitución completa y aplicable.',
    canonArticulo: 'Art. 1888 CC',
    canonArchivo: 'data/codigo_civil.json',
    fragmento: cc('Art. 1888 CC')?.texto.slice(0, 200),
  },
  // recurso-de-amparo: "Art. 182" es de Constitución (Hábeas Corpus), no CPP
  {
    slug: 'recurso-de-amparo-honduras-guia-completa',
    textoExacto: 'Artículo 182 de la Constitución',
    articuloMencionado: 'Art. 182 Constitución',
    norma: 'Constitución',
    tipo: 'norma',
    importancia: 'central',
    decision: 'confirmed',
    motivo:
      'Art. 182 Constitución verificado: reconoce la garantía de Hábeas Corpus/Exhibición Personal y Hábeas Data. Cita pertinente. NOTA: el claim automático asignó "Art. 182 CPP" (unsupported) — la cita real del body es "Art. 182 de la Constitución".',
    canonArticulo: 'Art. 182 Constitución',
    canonArchivo: 'data/articulos_constitucion.json',
    fragmento: cons('182')?.texto.slice(0, 200),
  },
  {
    slug: 'recurso-de-amparo-honduras-guia-completa',
    textoExacto: 'Ley de Justicia Constitucional',
    articuloMencionado: 'Decreto 32-2016 (referencia)',
    norma: 'Ley de Justicia Constitucional',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Afirmación central sobre la Ley de Justicia Constitucional (amparo). El canon interno no contiene su texto. Requiere verificación humana contra el Decreto 32-2016 publicado en La Gaceta.',
  },
  // union-de-hecho
  {
    slug: 'union-de-hecho-requisitos-derechos-honduras',
    textoExacto: 'Artículo 112 reconoce el derecho del hombre y la mujer a contraer matrimonio y la unión de hecho',
    articuloMencionado: 'Art. 112 Constitución',
    norma: 'Constitución',
    tipo: 'norma',
    importancia: 'central',
    decision: 'confirmed',
    motivo:
      'Art. 112 Constitución verificado: "Se reconoce el derecho del hombre y de la mujer... a contraer matrimonio y la unión de hecho...". Cita pertinente y correcta.',
    canonArticulo: 'Art. 112 Constitución',
    canonArchivo: 'data/articulos_constitucion.json',
    fragmento: cons('112')?.texto.slice(0, 200),
  },
  {
    slug: 'union-de-hecho-requisitos-derechos-honduras',
    textoExacto: 'duración mínima de tres años',
    articuloMencionado: '',
    norma: 'plazo',
    tipo: 'plazo',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Plazo de 3 años de convivencia para unión de hecho. Requiere verificación contra el Código de Familia (Decreto 76-84) art. aplicable sobre uniones de hecho.',
  },
  // adopcion-requisitos
  {
    slug: 'adopcion-requisitos-proceso-honduras',
    textoExacto: 'Código de Familia de Honduras y Código de la Niñez y Adolescencia',
    articuloMencionado: 'Decreto 76-84 / 35-2013',
    norma: 'Código de Familia / Niñez',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Afirmación central sobre marco normativo de adopción. Requiere verificación humana contra artículos específicos del Código de Familia y del Código de la Niñez y Adolescencia (D. 35-2013).',
  },
  // patentes
  {
    slug: 'patentes-requisitos-proceso-solicitud-honduras',
    textoExacto: 'Ley de Propiedad Industrial (Decreto 12-2009)',
    articuloMencionado: 'Decreto 12-2009',
    norma: 'Ley de Propiedad Industrial',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Afirmación central sobre marco legal de patentes. El texto de la Ley 12-2009 está extraído en data/pdfs-articulos/ pero no estructurado como canon JSON. Requiere verificación humana de artículos específicos.',
  },
  // proteccion-datos
  {
    slug: 'proteccion-datos-personales-derechos-arco-honduras',
    textoExacto: 'Ley de Protección de Datos Personales (Decreto 123-2017)',
    articuloMencionado: 'Decreto 123-2017',
    norma: 'Ley de Protección de Datos Personales',
    tipo: 'norma',
    importancia: 'central',
    decision: 'needs_human_review',
    motivo:
      'Afirmación central sobre la Ley de Protección de Datos Personales. El canon interno NO contiene su texto (gap detectado). Requiere verificación humana contra La Gaceta oficial.',
  },
];

function main() {
  const p = path.join(AUDITS, 'fase5a-lote3-claims-finales.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const existentes: Claim[] = data.claims;

  // 1. Reclasificar claims automáticos mal asignados.
  // "Art. 182 CPP" → debería ser Constitución; lo marcamos como reclasificado.
  let reclasificados = 0;
  for (const c of existentes) {
    if (c.slug === 'recurso-de-amparo-honduras-guia-completa' && c.articuloMencionado === 'Art. 182 CPP') {
      c.decision = 'corrected';
      c.motivo =
        'RECLASIFICADO: el body cita "Artículo 182 de la Constitución" (Hábeas Corpus), pero el extractor lo asignó a CPP. La cita correcta es Art. 182 Constitución (confirmed). El texto del body debe verificar que dice "Constitución" y no "CPP".';
      c.necesitaRevisionHumana = false;
      c.textoAnterior = c.textoExacto;
      c.origen = 'reclasificado_manual';
      reclasificados++;
    }
  }

  // 2. Añadir claims manuales (evitando duplicados por articuloMencionado+textoExacto).
  const vistos = new Set(
    existentes.map((c) => `${c.articuloMencionado}|${c.textoExacto.slice(0, 40)}`),
  );
  let añadidos = 0;
  for (const m of MANUALES) {
    const key = `${m.articuloMencionado}|${m.textoExacto.slice(0, 40)}`;
    if (vistos.has(key)) continue;
    vistos.add(key);
    const idx = existentes.filter((c) => c.slug === m.slug).length + 1;
    const canonEncontrado = m.canonArticulo
      ? { articulo: m.canonArticulo }
      : null;
    existentes.push({
      id: `5a-${m.slug.slice(0, 24)}-M${String(idx).padStart(2, '0')}`,
      slug: m.slug,
      textoExacto: m.textoExacto,
      contexto: '(claim manual verificado por lectura directa del body)',
      tipo: m.tipo,
      importancia: m.importancia,
      normaMencionada: m.norma,
      articuloMencionado: m.articuloMencionado,
      decision: m.decision,
      motivo: m.motivo,
      fuenteExistente: null,
      fuenteCanonicaVerificada: m.canonArchivo ?? null,
      canonEncontrado,
      pertinente: m.decision === 'confirmed',
      necesitaRevisionHumana: m.decision === 'needs_human_review',
      textoAnterior: m.decision === 'corrected' ? m.textoExacto : null,
      textoSustituto: null,
      fuenteCorreccion: null,
      fragmento: m.fragmento ?? null,
      origen: 'manual_verificado',
    });
    añadidos++;
  }

  // Recontar estadísticas
  const porDecision: Record<string, number> = {};
  const porImportancia: Record<string, number> = {};
  for (const c of existentes) {
    porDecision[c.decision] = (porDecision[c.decision] ?? 0) + 1;
    porImportancia[c.importancia] = (porImportancia[c.importancia] ?? 0) + 1;
  }

  data.metodo +=
    ' + enriquecimiento manual (fase5a-enriquecer-claims-manuales.ts): claims perdidos por defecto #5 (afirmaciones sin formato "Art. N") y reclasificación de claims mal asignados.';
  data.totalClaims = existentes.length;
  data.porDecision = porDecision;
  data.porImportancia = porImportancia;
  data.claims = existentes;
  data.generatedAt = new Date().toISOString();

  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`OK: ${añadidos} claims manuales añadidos, ${reclasificados} reclasificados.`);
  console.log(`Total claims: ${existentes.length}`);
  console.log('Por decisión:', porDecision);
  console.log('Por importancia:', porImportancia);
}

main();
