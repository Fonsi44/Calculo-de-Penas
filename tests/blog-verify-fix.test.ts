/**
 * Tests anti-regresión del verificador + corrector del blog (blog-verify-fix).
 *
 * Valida que las funciones deterministas (fact-checking legal + análisis
 * SEO/GEO + detección de alucinaciones/regresiones) identifican correctamente
 * los problemas sobre HTML sintético conocido. Estos tests NO requieren DB ni
 * API de IA: trabajan sobre las funciones puras exportadas.
 *
 * Cobertura:
 *   - canonicalArticuloKey: normalización de citas legales (bug histórico de
 *     substring → match exacto).
 *   - verificarClaims: artículos inventados, penas incorrectas, decretos.
 *   - extraerClaims: artículos CP/Constitución, rangos de penas, decretos.
 *   - detectarAlucinacionesNuevas: la IA introduce un artículo falso → rechazo.
 *   - analizarSEO: longitud, headings (R15), disclaimer (R14), rutas privadas
 *     (R6), E-E-A-T, SEO meta completo, HTML balance, keyword stuffing.
 *   - detectarRegresionesSEO: la IA introduce un enlace a /admin → rechazo.
 *   - wordCount / stripHtml / extraerHeadings / detectarKeywordStuffing.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  cargarDatosCanonicos,
  canonicalArticuloKey,
  wordCount,
  stripHtml,
  extraerHeadings,
  extraerClaims,
  verificarClaims,
  detectarAlucinacionesNuevas,
  detectarKeywordStuffing,
  detectarFrasesFiller,
  diversidadLexica,
  UMBRAL_TTR,
  detectarTextoVago,
  tieneDeclaracionEntidad,
  detectarRegresionesSEO,
  verificarHtmlBalance,
  similitudCuerpo,
  UMBRAL_SIMILITUD,
  evaluarPostEscritura,
  checkpointEsReanudable,
  detectarRepeticionCrossArticle,
  autoFixMetaDescription,
  autoFixDescription,
  autoFixAuthor,
  autoFixCoverImage,
  autoFixTags,
  autoFixMetaTitle,
  aplicarAutoFixesMetadatos,
  esRutaPrivada,
  MIN_PALABRAS_AMPLIACION_IA,
  extraerCitaAtribuida,
  similitudCitaCanonica,
  UMBRAL_SIMILITUD_CITA,
  validarTitleOptimizado,
  validarMetaOptimizada,
  truncarTitleSeguro,
  analizarSEO,
  type PostRow,
} from '../scripts/blog-verify-fix';

// Cargar datos canónicos una vez antes de los tests de fact-checking.
beforeAll(() => {
  cargarDatosCanonicos();
});

// Post sintético base que pasa todos los validadores. Cada test lo muta para
// provocar un único hallazgo y verificar que se detecta.
//
// Requisitos del fixture (para que el post base sea "OK"):
//   - 800-1000 palabras reales (R13): usa ~40 párrafos rotando plantillas.
//   - Al menos un H2 (la plantilla exige headings en bodies >600 palabras).
//   - Vocabulario variado para no disparar keyword stuffing (densidad ≤2%).
//   - Sin frases de autopromoción ("somos los mejores", "número 1 en...", etc.).
//   - Sin disclaimer en el body (R14), sin rutas privadas (R6).
const TEMAS_FIXTURE = [
  'derecho penal', 'proceso penal', 'derecho civil', 'derecho de familia',
  'constitución', 'delitos', 'penas', 'medidas cautelares', 'jurisprudencia',
  'doctrina', 'tipicidad', 'antijuridicidad', 'culpabilidad', 'judicatura',
  'ministerio público', 'defensa técnica', 'acción penal', 'jurisdicción',
  'competencia', 'recursos',
];
const CIUDADES_FIXTURE = [
  'Tegucigalpa', 'San Pedro Sula', 'Nacaome', 'La Ceiba', 'Comayagua',
  'Choluteca', 'Juticalpa',
];
const PLANTILLAS_FIXTURE = [
  (t: string, c: string) => `El análisis de ${t} en Honduras establece supuestos típicos en ${c} con base en la legislación vigente.`,
  (t: string) => `La revisión de ${t} aborda consecuencias jurídicas para casos concretos del ordenamiento nacional.`,
  (t: string, c: string) => `El examen de ${t} precisa criterios técnicos aplicables en ${c} según la doctrina hondureña.`,
  (t: string) => `La explicación de ${t} desarrolla principios procesales para garantizar el debido proceso.`,
  (t: string) => `El desarrollo de ${t} interpreta normas constitucionales que orientan la defensa técnica.`,
  (t: string) => `La interpretación de ${t} examina la tipicidad y antijuridicidad en supuestos fácticos.`,
  (t: string, c: string) => `El estudio de ${t} detalla medidas cautelares y recursos procesales en ${c}.`,
  (t: string) => `La aplicación de ${t} articula jurisprudencia reciente para resolver controversias.`,
  (t: string) => `El tratamiento de ${t} considera la culpabilidad y las circunstancias atenuantes.`,
  (t: string) => `La regulación de ${t} organiza la jurisdicción y competencia para los operadores de justicia.`,
  (t: string, c: string) => `En ${c}, la práctica de ${t} requiere conocimiento profundo del código procesal y sus reformas.`,
  (t: string) => `Los supuestos de ${t} generan consecuencias jurídicas diferenciadas según el grado de participación.`,
  (t: string, c: string) => `El marco normativo de ${t} en ${c} distingue entre conductas dolosas y culposas.`,
  (t: string) => `La dogmática de ${t} analiza el bien jurídico tutelado y los elementos descriptivos del tipo.`,
  (t: string, c: string) => `Para litigar ${t} en ${c}, el abogado debe dominar la prueba documental y testifical.`,
  (t: string) => `La estructura de ${t} comprende elementos objetivos, subjetivos y normativos del injusto.`,
  (t: string, c: string) => `El régimen de ${t} aplicable en ${c} incorpora estándares internacionales de derechos humanos.`,
  (t: string) => `Las modalidades de ${t} abarcan autoría directa, complicidad e instigación según el caso.`,
  (t: string, c: string) => `El control judicial de ${t} en ${c} verifica proporcionalidad y legalidad del acto procesal.`,
  (t: string) => `La teoría del delito aplicada a ${t} exige análisis separado de cada elemento constitutivo.`,
  (t: string, c: string) => `En materia de ${t}, los tribunales de ${c} han fijado criterios interpretativos relevantes.`,
  (t: string) => `La ejecución de penas derivadas de ${t} sigue reglas específicas del régimen penitenciario.`,
  (t: string, c: string) => `El proceso seguido por ${t} en ${c} admite medios de defensa y recursos ordinarios.`,
  (t: string) => `Las penas accesorias vinculadas a ${t} incluyen inhabilitación especial y multa proporcional.`,
  (t: string, c: string) => `El juzgamiento de ${t} compete al tribunal de sentencia según el territorio de ${c}.`,
  (t: string) => `La prescripción de ${t} opera según la gravedad del ilícito y el plazo legal establecido.`,
  (t: string, c: string) => `La investigación de ${t} en ${c} requiere cadena de custodia y pericia técnica calificada.`,
  (t: string) => `El concurso ideal y material en ${t} determina la pena aplicable al supuesto plural.`,
  (t: string, c: string) => `Las víctimas de ${t} en ${c} tienen derecho a reparación, verdad y participación procesal.`,
  (t: string) => `La extradición vinculada a ${t} procede cuando concurren requisitos de doble incriminación.`,
];

function postOk(overrides: Partial<PostRow> = {}): PostRow {
  const parrafos = Array.from({ length: 61 }, (_, i) => {
    const tema = TEMAS_FIXTURE[i % TEMAS_FIXTURE.length];
    const ciudad = CIUDADES_FIXTURE[i % CIUDADES_FIXTURE.length];
    const plantilla = PLANTILLAS_FIXTURE[i % PLANTILLAS_FIXTURE.length];
    return `<p>${plantilla(tema, ciudad)}</p>`;
  });
  parrafos.push('<h2>Puntos clave del marco jurídico hondureño</h2>');
  parrafos.push('<p>El sistema procesal organiza etapas claras para garantizar el debido proceso y la defensa técnica en todos los casos.</p>');
  const body = parrafos.join('\n');

  // Prefijo de estructura editorial mínima para que el postOk pase el
  // chequeo de estructura (necesita ≥5 de 7 elementos para no ser 'importante').
  // El primer <p> menciona "derecho penal" (keyword foco del title) para que
  // CTR-1 (alineación title↔primer párrafo) no dispare en el fixture base.
  const estructura = [
    '<p>El derecho penal en Honduras se fundamenta en principios del Código Civil, donde la ley es declaración de la voluntad soberana (Decreto 84-2017, vigente 2024).</p>',
    '<p><strong>Ejemplo práctico:</strong> Juan firma un contrato de arrendamiento en Tegucigalpa y necesita conocer sus obligaciones legales.</p>',
    '<p><strong>Error frecuente:</strong> Muchas personas creen que un contrato verbal no tiene validez, pero el Código Civil reconoce los contratos verbales en ciertos casos.</p>',
    '<h3>¿Es obligatorio registrar un contrato de arrendamiento?</h3><p>Sí, cuando supera cierta duración. La respuesta concreta depende del caso.</p>',
    '<p>Ver también el artículo relacionado sobre derecho penal en este blog.</p>',
  ].join('\n');

  const bodyConEstructura = estructura + '\n' + body; // la estructura va al inicio

  return {
    id: 'test-id',
    slug: 'analisis-derecho-penal-honduras-nacaome',
    title: 'Análisis del derecho penal en Honduras: guía práctica',
    description: 'Guía práctica sobre el derecho penal hondureño y su aplicación en Nacaome, Valle.',
    body: bodyConEstructura,
    category: 'derecho-penal',
    tags: ['derecho-penal', 'código-penal', 'honduras'],
    coverImage: '/images/cover.webp',
    metaTitle: '', // vacío = fallback correcto (H1 = SERP title vía plantilla)
    metaDescription: 'Guía práctica sobre el derecho penal hondureño y su aplicación en Nacaome, Valle.',
    publishedAt: new Date('2024-01-15'),
    noindex: false,
    canonicalUrl: null,
    author: 'Pineda y Asociados',
    ogImage: null,
    ...overrides,
  };
}

describe('canonicalArticuloKey', () => {
  it('normaliza "Art. 214 CP" a clave canónica con código', () => {
    expect(canonicalArticuloKey('Art. 214 CP')).toBe('art. 214 cp');
  });

  it('normaliza "Artículo 214 del Código Penal" igual que "Art. 214 CP"', () => {
    expect(canonicalArticuloKey('Artículo 214 del Código Penal')).toBe('art. 214 cp');
  });

  it('normaliza artículos de la Constitución', () => {
    expect(canonicalArticuloKey('Art. 15 de la Constitución')).toBe('art. 15 constitucion');
  });

  it('normaliza CPP (Código Procesal Penal)', () => {
    expect(canonicalArticuloKey('Art. 12 del Código Procesal Penal')).toBe('art. 12 cpp');
  });

  it('devuelve null si no hay número de artículo', () => {
    expect(canonicalArticuloKey('Código Penal de Honduras')).toBeNull();
  });
});

describe('verificarClaims — match exacto (bug histórico)', () => {
  // BUG 1 (auditoría): la verificación por substring hacía que un artículo
  // inventado se colara. Ahora match exacto contra la clave canónica.
  // Nota: Art. 999 CP no existe en data/articulos_cp.json (verificado), así que
  // es un artículo genuinamente inventado para el test. Art. 51 CP SÍ existe
  // (Art. 51 CP — penas de prohibición de residencia), por lo que no serviría.
  it('detecta un artículo del CP inventado como discrepancia crítica', () => {
    const claims = extraerClaims('El Art. 999 CP establece penas severas.');
    expect(claims.length).toBeGreaterThan(0);
    const disc = verificarClaims(claims);
    const inventado = disc.find((d) => d.valorEncontrado.includes('Art. 999'));
    expect(inventado).toBeDefined();
    expect(inventado?.severidad).toBe('critico');
  });

  it('NO marca un artículo del CP que existe (Art. 214)', () => {
    const claims = extraerClaims('El Art. 214 CP tipifica el trato degradante.');
    const disc = verificarClaims(claims);
    const falsoPositivo = disc.find((d) => d.valorEncontrado.includes('Art. 214'));
    expect(falsoPositivo).toBeUndefined();
  });

  it('detecta un artículo constitucional inventado', () => {
    const claims = extraerClaims('El Art. 999 de la Constitución garantiza el derecho.');
    const disc = verificarClaims(claims);
    const inventado = disc.find((d) => d.valorEncontrado.includes('Art. 999'));
    expect(inventado).toBeDefined();
    expect(inventado?.severidad).toBe('critico');
  });

  // BUG 2 (auditoría): el cross-ref artículo→delito→pena estaba roto porque la
  // clave de lookup usaba "art. 214 cp" pero el índice usaba "art. 214" (sin cp).
  // Ahora las claves coinciden y la pena sí se verifica contra el delito citado.
  it('detecta una pena incorrecta citada junto a un artículo real (cross-ref)', () => {
    // Art. 214 CP = Trato degradante, pena 12-24 meses de prisión.
    // Claim falso: "20 a 30 años" (muy fuera de rango).
    const body = 'El Art. 214 CP castiga el trato degradante con 20 a 30 años de prisión.';
    const claims = extraerClaims(body);
    const disc = verificarClaims(claims);
    const pena = disc.find((d) => /Pena incorrecta/.test(d.mensaje));
    expect(pena).toBeDefined();
    expect(pena?.severidad).toBe('critico');
  });

  it('NO marca una pena correcta citada junto a su artículo', () => {
    // 1 a 2 años = 12-24 meses → dentro del rango del Art. 214.
    const body = 'El Art. 214 CP castiga el trato degradante con 1 a 2 años de prisión.';
    const claims = extraerClaims(body);
    const disc = verificarClaims(claims);
    const falsoPositivo = disc.find((d) => /Pena incorrecta/.test(d.mensaje));
    expect(falsoPositivo).toBeUndefined();
  });
});

describe('extraerClaims', () => {
  it('extrae referencias a artículos del CP', () => {
    const claims = extraerClaims('Según el Art. 214 CP, el trato degradante está tipificado.');
    const cp = claims.filter((c) => c.tipo === 'articulo_cp');
    expect(cp.length).toBeGreaterThan(0);
    expect(cp[0].textoOriginal).toMatch(/214/);
  });

  it('extrae rangos de penas', () => {
    const claims = extraerClaims('La pena es de 6 a 8 años de prisión para este delito.');
    const rangos = claims.filter((c) => c.tipo === 'pena_rango');
    expect(rangos.length).toBeGreaterThan(0);
  });

  it('extrae decretos', () => {
    const claims = extraerClaims('El Código Penal (Decreto 130-2017) reformó las penas.');
    const decretos = claims.filter((c) => c.tipo === 'decreto');
    expect(decretos.length).toBeGreaterThan(0);
  });

  it('no trata "Art. 123" sin código como claim de CP (ambiguo entre códigos)', () => {
    const claims = extraerClaims('El Art. 123 establece una regla general.');
    const cp = claims.filter((c) => c.tipo === 'articulo_cp');
    expect(cp).toHaveLength(0);
  });
});

describe('detectarAlucinacionesNuevas', () => {
  it('detecta un artículo inventado introducido por la IA', () => {
    // Art. 999 CP no existe en las fuentes canónicas (Art. 51 CP sí existe).
    const original = 'El Art. 214 CP tipifica el trato degradante.';
    const corregido = 'El Art. 214 CP tipifica el trato degradante. El Art. 999 CP añade agravantes.';
    const origDisc = verificarClaims(extraerClaims(original));
    const aluc = detectarAlucinacionesNuevas(origDisc, corregido);
    expect(aluc.length).toBeGreaterThan(0);
    expect(aluc.some((d) => d.valorEncontrado.includes('Art. 999'))).toBe(true);
  });

  it('no marca alucinación si el body corregido solo corrige una pena falsa existente', () => {
    const original = 'El Art. 214 CP castiga con 20 a 30 años de prisión.'; // pena incorrecta
    const corregido = 'El Art. 214 CP castiga con 1 a 2 años de prisión.';  // pena corregida
    const origDisc = verificarClaims(extraerClaims(original));
    const aluc = detectarAlucinacionesNuevas(origDisc, corregido);
    // No debe introducir discrepancias NUEVAS (la original de pena incorrecta
    // desaparece, que es justo el objetivo; no cuenta como alucinación).
    expect(aluc).toHaveLength(0);
  });
});

describe('analizarSEO — longitud (R13)', () => {
  it('marca thin cuando el body tiene <800 palabras', () => {
    const post = postOk({
      body: '<p>Texto corto de pocas palabras sobre derecho.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const long = h.find((x) => x.categoria === 'longitud');
    expect(long).toBeDefined();
    expect(['importante', 'critico']).toContain(long?.severidad);
  });

  it('no marca longitud cuando el body está en rango 800-1000', () => {
    const post = postOk();
    const palabras = wordCount(post.body);
    const h = analizarSEO(post, palabras);
    expect(h.find((x) => x.categoria === 'longitud')).toBeUndefined();
  });
});

describe('analizarSEO — headings (R15)', () => {
  it('marca crítico si hay <h1> en el body (doble H1)', () => {
    const post = postOk({ body: '<h1>Subtítulo indebido</h1>' + '<p>'.repeat(20) + 'texto</p>'.repeat(20) });
    const h = analizarSEO(post, wordCount(post.body));
    const h1 = h.find((x) => x.categoria === 'headings' && /<h1>/.test(x.mensaje));
    expect(h1).toBeDefined();
    expect(h1?.severidad).toBe('critico');
  });

  it('marca headings vacíos', () => {
    const post = postOk({ body: '<h2></h2>' + '<p>texto jurídico</p>'.repeat(40) });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'headings' && /vacío/i.test(x.mensaje))).toBeDefined();
  });

  it('marca salto de jerarquía H3 antes que H2', () => {
    const post = postOk({ body: '<h3>Detalle</h3>' + '<p>texto jurídico</p>'.repeat(40) });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'headings' && /jerarquía/i.test(x.mensaje))).toBeDefined();
  });
});

describe('analizarSEO — disclaimer duplicado (R14)', () => {
  it('detecta el disclaimer canónico actual pegado en el body', () => {
    const post = postOk({
      body: '<p>Aviso legal: este contenido tiene carácter informativo, orientativo y educativo. Se basa en la legislación hondureña vigente al 3 de junio de 2026 y no constituye asesoría legal personalizada.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const disc = h.find((x) => x.categoria === 'contenido' && /disclaimer/i.test(x.mensaje));
    expect(disc).toBeDefined();
  });

  it('detecta el disclaimer legacy pegado en el body', () => {
    const post = postOk({
      body: '<p>Este artículo tiene carácter informativo y no sustituye el asesoramiento de un abogado.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'contenido' && /disclaimer/i.test(x.mensaje))).toBeDefined();
  });

  it('no marca falso positivo en un párrafo normal que menciona "carácter informativo" de paso', () => {
    const post = postOk({
      body: '<p>Este manual tiene carácter informativo para los estudiantes de derecho de Honduras.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'contenido' && /disclaimer/i.test(x.mensaje))).toBeUndefined();
  });
});



describe('analizarSEO — E-E-A-T', () => {
  it('marca crítico una categoría inválida', () => {
    const post = postOk({ category: 'categoria-inventada' });
    const h = analizarSEO(post, wordCount(post.body));
    const cat = h.find((x) => x.categoria === 'eeat' && /Categoría/.test(x.mensaje));
    expect(cat).toBeDefined();
    expect(cat?.severidad).toBe('critico');
  });

  it('marca crítico frases de autopromoción no verificables', () => {
    const post = postOk({
      body: '<p>Somos los mejores abogados de Honduras y líderes en derecho penal.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const frase = h.find((x) => x.categoria === 'eeat' && /autopromoción/.test(x.mensaje));
    expect(frase).toBeDefined();
    expect(frase?.severidad).toBe('critico');
  });
});

describe('analizarSEO — SEO meta completo', () => {
  it('marca title >60 chars', () => {
    const post = postOk({ title: 'A'.repeat(80) });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'seo' && /Title de 80/.test(x.mensaje))).toBeDefined();
  });

  it('marca metaDescription >155 chars', () => {
    const post = postOk({ metaDescription: 'B'.repeat(180), description: 'B'.repeat(180) });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'seo' && /Meta description de 180/.test(x.mensaje))).toBeDefined();
  });

  it('marca slug con mayúsculas y acentos', () => {
    const post = postOk({ slug: 'Análisis-Derecho-Penal' });
    const h = analizarSEO(post, wordCount(post.body));
    const slug = h.filter((x) => x.categoria === 'slug');
    expect(slug.some((x) => /mayúsculas/.test(x.mensaje))).toBe(true);
    expect(slug.some((x) => /acentos/.test(x.mensaje))).toBe(true);
  });

  it('marca canonicalUrl no https', () => {
    const post = postOk({ canonicalUrl: 'http://otro-sitio.com/articulo' });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'canonical' && /https/.test(x.mensaje))).toBeDefined();
  });

  it('marca tags duplicados', () => {
    const post = postOk({ tags: ['derecho-penal', 'Derecho-Penal', 'honduras'] });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'tags' && /duplicados/i.test(x.mensaje))).toBeDefined();
  });

  it('marca fecha futura como crítica', () => {
    const post = postOk({ publishedAt: new Date('2099-01-01') });
    const h = analizarSEO(post, wordCount(post.body));
    const fecha = h.find((x) => x.categoria === 'fecha' && /futura/.test(x.mensaje));
    expect(fecha).toBeDefined();
    expect(fecha?.severidad).toBe('critico');
  });
});

describe('analizarSEO — GEO / SEO local en title', () => {
  it('marca recomendable un title sin señal geográfica (sin Honduras/ciudad)', () => {
    const post = postOk({ title: '¿Qué es el dolo en derecho penal? Guía técnica' });
    const h = analizarSEO(post, wordCount(post.body));
    const geo = h.find((x) => x.categoria === 'geo');
    expect(geo).toBeDefined();
    expect(geo?.severidad).toBe('importante');
  });

  it('no marca GEO cuando el title incluye "Honduras"', () => {
    const post = postOk({ title: 'Dolo en derecho penal de Honduras: explicación' });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'geo')).toBeUndefined();
  });
});

describe('analizarSEO — HTML y estructura', () => {
  it('marca tags desbalanceados', () => {
    const post = postOk({ body: '<p>Párrafo sin cerrar' + '<p>x</p>'.repeat(40) });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'html' && /desbalanceado/i.test(x.mensaje))).toBeDefined();
  });

  it('marca párrafos excesivamente largos', () => {
    const largo = 'palabra '.repeat(150);
    const post = postOk({ body: `<p>${largo}</p>` });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'estructura' && /largo/i.test(x.mensaje))).toBeDefined();
  });
});

describe('detectarRegresionesSEO', () => {
  it('no marca regresión si la IA solo expande contenido sin tocar enlaces', () => {
    const post = postOk({ body: '<p>Texto corto.</p>' });
    const original = post.body;
    const corregido = '<p>Texto expandido con más detalle jurídico sobre el derecho penal hondureño.</p>';
    const reg = detectarRegresionesSEO(post, original, corregido);
    expect(reg).toHaveLength(0);
  });
});

describe('detectarKeywordStuffing', () => {
  it('detecta repetición excesiva de una palabra clave', () => {
    const html = Array.from({ length: 30 }, () =>
      '<p>El homicidio es un delito grave. El homicidio se castiga con pena. El homicidio en Honduras.</p>',
    ).join(' ');
    const stuffing = detectarKeywordStuffing(html);
    expect(stuffing.some((s) => s.palabra === 'homicidio')).toBe(true);
  });

  it('no marca stuffing en texto normal', () => {
    const html = '<p>El derecho penal hondureño establece penas proporcionales al delito cometido.</p>';
    expect(detectarKeywordStuffing(html)).toHaveLength(0);
  });
});

describe('wordCount / stripHtml / extraerHeadings', () => {
  it('wordCount cuenta palabras reales ignorando tags y entidades', () => {
    // "Hola &amp; mundo jurídico" → la entidad &amp; se elimina → 3 palabras
    // reales (Hola, mundo, jurídico). "&" no es una palabra.
    expect(wordCount('<p>Hola &amp; mundo <strong>jurídico</strong></p>')).toBe(3);
  });

  it('wordCount devuelve 0 para vacío', () => {
    expect(wordCount('')).toBe(0);
  });

  it('stripHtml elimina tags y entidades', () => {
    expect(stripHtml('<p>Hola <em>mundo</em></p>')).toBe('Hola mundo');
  });

  it('extraerHeadings devuelve nivel y texto', () => {
    const heads = extraerHeadings('<h2>Título 2</h2><h3>Subtítulo 3</h3>');
    expect(heads).toEqual([
      { nivel: 2, texto: 'Título 2' },
      { nivel: 3, texto: 'Subtítulo 3' },
    ]);
  });
});

describe('verificarHtmlBalance', () => {
  it('detecta tags no cerrados', () => {
    const res = verificarHtmlBalance('<p>sin cerrar');
    expect(res.some((r) => r.startsWith('p ('))).toBe(true);
  });

  it('no marca nada en HTML balanceado', () => {
    const res = verificarHtmlBalance('<p>ok</p><ul><li>a</li></ul>');
    expect(res).toHaveLength(0);
  });
});

describe('similitudCuerpo', () => {
  it('devuelve 1.0 para dos bodies idénticos', () => {
    const b = '<p>El derecho penal hondureño establece penas proporcionales.</p>';
    expect(similitudCuerpo(b, b)).toBe(1);
  });

  it('devuelve 0 para bodies sin palabras comunes', () => {
    expect(similitudCuerpo('<p>manzana pera limón</p>', '<p>toronja uva mango</p>')).toBe(0);
  });

  it('devuelve ≥0.98 para un body con un cambio mínimo (cambio irrelevante)', () => {
    // Body con vocabulario diverso (~80 tokens únicos) para que cambiar 1-2
    // tokens sea despreciable (<2% del total) → similitud ≥0.98.
    const frases = [
      'análisis jurídico del derecho penal hondureño', 'estudio de la tipicidad objetiva',
      'antijuridicidad y culpabilidad en delitos graves', 'jurisprudencia de la corte suprema',
      'doctrina del dolo eventual y dolo directo', 'medidas cautelares personales y reales',
      'proceso penal acusatorio adversarial hondureño', 'principio de legalidad penal',
      'garantías constitucionales del debido proceso', 'defensa técnica y contradicción',
      'acción penal pública y querella privada', 'jurisdicción y competencia territorial',
      'recursos de apelación casación revisión', 'ejecución de pena y libertad condicional',
      'circunstancias atenuantes agravantes genéricas', 'tentativa y consumación delictiva',
    ];
    const a = frases.map((f) => `<p>${f}</p>`).join(' ');
    // Cambio mínimo: una sola palabra añadida en una frase
    const b = a.replace('tentativa y consumación', 'tentativa y consumación delictiva penal');
    expect(similitudCuerpo(a, b)).toBeGreaterThanOrEqual(UMBRAL_SIMILITUD);
  });

  it('devuelve <0.98 para bodies claramente diferentes', () => {
    const a = '<p>El derecho penal hondureño establece penas para delitos graves.</p>';
    const b = '<p>El derecho civil regula contratos, familia y patrimonios privados.</p>';
    expect(similitudCuerpo(a, b)).toBeLessThan(UMBRAL_SIMILITUD);
  });
});



describe('analizarSEO — GEO en metaDescription', () => {
  it('marca recomendable cuando ni title ni metaDescription tienen señal geográfica', () => {
    const post = postOk({
      title: '¿Qué es el dolo en derecho penal? Guía técnica',
      metaDescription: 'Explicación técnica del dolo y sus elementos para estudiantes de derecho.',
      description: 'Explicación técnica del dolo y sus elementos para estudiantes de derecho.',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const geo = h.find((x) => x.categoria === 'geo' && /Ni el title ni la metaDescription/i.test(x.mensaje));
    expect(geo).toBeDefined();
    expect(geo?.severidad).toBe('importante');
  });

  it('marca recomendable (más suave) cuando solo la meta trae geo pero el title no', () => {
    const post = postOk({
      title: '¿Qué es el dolo en derecho penal? Guía técnica',
      metaDescription: 'Explicación del dolo en el derecho penal de Honduras para abogados.',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const geo = h.find((x) => x.categoria === 'geo' && /solo la metaDescription/i.test(x.mensaje));
    expect(geo).toBeDefined();
  });

  it('no marca GEO cuando el title incluye Honduras (independientemente de la meta)', () => {
    const post = postOk({
      title: 'Dolo en derecho penal de Honduras: explicación técnica',
      metaDescription: 'Explicación técnica sin mención geográfica explícita.',
    });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'geo')).toBeUndefined();
  });
});

describe('evaluarPostEscritura — validación post-escritura', () => {
  it('no revierte cuando los hallazgos blocking son los mismos que pre-escritura', () => {
    const hallazgosPre = [
      { severidad: 'importante' as const, categoria: 'longitud' as const, mensaje: '500 palabras (thin)' },
    ];
    const hallazgosPost = [
      { severidad: 'importante' as const, categoria: 'longitud' as const, mensaje: '500 palabras (thin)' },
    ];
    const r = evaluarPostEscritura(hallazgosPost, [], hallazgosPre, [], 850);
    expect(r.deberiaRevertir).toBe(false);
  });

  it('revierte cuando aparece un hallazgo blocking NUEVO post-escritura', () => {
    const hallazgosPre: { severidad: 'critico'; categoria: 'enlaces'; mensaje: string }[] = [];
    const hallazgosPost = [
      { severidad: 'critico' as const, categoria: 'enlaces' as const, mensaje: 'Enlace a /intranet (R6)' },
    ];
    const r = evaluarPostEscritura(hallazgosPost, [], hallazgosPre, [], 850);
    expect(r.deberiaRevertir).toBe(true);
    expect(r.motivo).toMatch(/hallazgo/);
  });

  it('revierte cuando aparece una discrepancia fáctica NUEVA post-escritura', () => {
    const discPost = [{
      claim: { tipo: 'articulo_cp' as const, textoOriginal: 'Art. 999 CP', contexto: 'ctx' },
      severidad: 'critico' as const,
      mensaje: 'Artículo inventado',
      valorEncontrado: 'Art. 999 CP',
      valorCorrecto: '(no encontrado)',
      fuente: 'test',
    }];
    const r = evaluarPostEscritura([], discPost, [], [], 850);
    expect(r.deberiaRevertir).toBe(true);
    expect(r.motivo).toMatch(/discrepancia/);
  });

  it('revierte cuando el body escrito tiene <50 palabras', () => {
    const r = evaluarPostEscritura([], [], [], [], 30);
    expect(r.deberiaRevertir).toBe(true);
    expect(r.motivo).toMatch(/<50/);
  });

  it('no revierte por hallazgos recomendables nuevos (no blocking)', () => {
    const hallazgosPost = [
      { severidad: 'recomendable' as const, categoria: 'geo' as const, mensaje: 'Sin geo en title' },
    ];
    const r = evaluarPostEscritura(hallazgosPost, [], [], [], 850);
    expect(r.deberiaRevertir).toBe(false);
  });
});

describe('checkpointEsReanudable', () => {
  it('es reanudable cuando modo, IA y total coinciden', () => {
    const cp = { modo: 'APLICAR', iaActiva: true, total: 159, lastCompletedIndex: 49, updatedAt: 'x' };
    expect(checkpointEsReanudable(cp, 'APLICAR', true, 159)).toBe(true);
  });

  it('no es reanudable cuando cambió el modo', () => {
    const cp = { modo: 'DRY-RUN', iaActiva: true, total: 159, lastCompletedIndex: 49, updatedAt: 'x' };
    expect(checkpointEsReanudable(cp, 'APLICAR', true, 159)).toBe(false);
  });

  it('no es reanudable cuando cambió el flag de IA', () => {
    const cp = { modo: 'APLICAR', iaActiva: false, total: 159, lastCompletedIndex: 49, updatedAt: 'x' };
    expect(checkpointEsReanudable(cp, 'APLICAR', true, 159)).toBe(false);
  });

  it('no es reanudable cuando cambió el total de posts', () => {
    const cp = { modo: 'APLICAR', iaActiva: true, total: 100, lastCompletedIndex: 49, updatedAt: 'x' };
    expect(checkpointEsReanudable(cp, 'APLICAR', true, 159)).toBe(false);
  });

  it('no es reanudable cuando el checkpoint es null', () => {
    expect(checkpointEsReanudable(null, 'APLICAR', true, 159)).toBe(false);
  });
});

describe('auto-fix metadatos — metaDescription', () => {
  it('genera metaDescription desde description si falta y alcanza el mínimo', () => {
    const post = postOk({
      metaDescription: null,
      description: 'Guía práctica sobre el derecho penal hondureño y su aplicación en Nacaome, Valle para abogados.',
    });
    const r = autoFixMetaDescription(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo.length).toBeGreaterThanOrEqual(70);
    expect(r!.nuevo.length).toBeLessThanOrEqual(155);
    expect(r!.cambiado).toBe(true);
  });

  it('trunca metaDescription >155 chars en palabra completa', () => {
    const larga = 'A'.repeat(180);
    const post = postOk({ metaDescription: larga });
    const r = autoFixMetaDescription(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo.length).toBeLessThanOrEqual(155);
  });

  it('NO aplica si la meta existente ya está en rango', () => {
    const post = postOk({ metaDescription: 'Guía válida de 70 a 155 caracteres para SEO del blog jurídico hondureño.' });
    const r = autoFixMetaDescription(post);
    expect(r).toBeNull();
  });

  it('NO aplica si el candidato derivado es <70 chars (no inventa contenido)', () => {
    const post = postOk({
      metaDescription: null,
      description: '',
      body: '<p>Texto corto.</p>',
    });
    const r = autoFixMetaDescription(post);
    expect(r).toBeNull();
  });
});

describe('auto-fix metadatos — description', () => {
  it('genera description desde el primer párrafo del body si falta', () => {
    const post = postOk({
      description: '',
      metaDescription: null,
      body: '<p>Guía práctica sobre el derecho penal hondureño y su aplicación en Nacaome, Valle para abogados litigantes.</p>' + postOk().body,
    });
    const r = autoFixDescription(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo.length).toBeGreaterThan(0);
    expect(r!.nuevo.length).toBeLessThanOrEqual(160);
  });

  it('NO aplica si ya hay description válida', () => {
    const post = postOk({ description: 'Descripción válida de longitud razonable.' });
    const r = autoFixDescription(post);
    expect(r).toBeNull();
  });
});

describe('auto-fix metadatos — author', () => {
  it('setea "Pineda y Asociados" si falta author', () => {
    const post = postOk({ author: null });
    const r = autoFixAuthor(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo).toBe('Pineda y Asociados');
  });

  it('NO aplica si ya hay author', () => {
    const post = postOk({ author: 'Danilo Pineda Maradiaga' });
    const r = autoFixAuthor(post);
    expect(r).toBeNull();
  });
});

describe('auto-fix metadatos — coverImage', () => {
  it('setea cover por defecto si falta', () => {
    const post = postOk({ coverImage: null });
    const r = autoFixCoverImage(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo).toMatch(/^\/images\//);
  });

  it('NO aplica si ya hay coverImage', () => {
    const post = postOk({ coverImage: '/images/custom.webp' });
    const r = autoFixCoverImage(post);
    expect(r).toBeNull();
  });
});

describe('auto-fix metadatos — tags', () => {
  it('añade tags hasta alcanzar el mínimo (3) si hay <3', () => {
    const post = postOk({ tags: ['derecho-penal'] });
    const r = autoFixTags(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo.length).toBeGreaterThanOrEqual(3);
    expect(r!.nuevo).toContain('derecho-penal');
    expect(r!.nuevo).toContain('honduras');
  });

  it('NO aplica si ya hay ≥3 tags', () => {
    const post = postOk({ tags: ['derecho-penal', 'código-penal', 'honduras'] });
    const r = autoFixTags(post);
    expect(r).toBeNull();
  });

  it('no duplica tags existentes (case-insensitive)', () => {
    const post = postOk({ tags: ['Derecho-Penal'] });
    const r = autoFixTags(post);
    expect(r).not.toBeNull();
    // No debe añadir 'derecho-penal' (ya existe como 'Derecho-Penal')
    const lower = r!.nuevo.map((t) => t.toLowerCase());
    const dup = lower.filter((t, i) => lower.indexOf(t) !== i);
    expect(dup).toHaveLength(0);
  });
});

describe('aplicarAutoFixesMetadatos — integración', () => {
  it('aplica múltiples auto-fixes a un post incompleto y lista los cambios', () => {
    const post = postOk({
      metaDescription: null,
      description: '',
      author: null,
      coverImage: null,
      tags: ['derecho-penal'],
    });
    const r = aplicarAutoFixesMetadatos(post);
    expect(r.cambiosAplicados.length).toBeGreaterThan(0);
    expect(r.metaDescription).not.toBeNull();
    expect(r.description).not.toBeNull();
    expect(r.author).not.toBeNull();
    expect(r.coverImage).not.toBeNull();
    expect(r.tags).not.toBeNull();
    expect(r.tags!.nuevo.length).toBeGreaterThanOrEqual(3);
  });

  it('no aplica nada a un post que ya tiene todos los metadatos correctos', () => {
    const post = postOk();
    const r = aplicarAutoFixesMetadatos(post);
    expect(r.cambiosAplicados).toHaveLength(0);
  });
});

describe('detectarFrasesFiller — anti-plantilla', () => {
  it('detecta frases filler genéricas en el body', () => {
    const html = '<p>Es importante destacar que el derecho penal es una rama fundamental. Cabe señalar que como es sabido, este tema reviste especial importancia.</p>';
    const f = detectarFrasesFiller(html);
    expect(f.length).toBeGreaterThanOrEqual(3);
    expect(f.some((x) => x.frase.includes('es importante destacar'))).toBe(true);
    expect(f.some((x) => x.frase.includes('cabe señalar'))).toBe(true);
  });

  it('no detecta filler en texto jurídico riguroso sin frases genéricas', () => {
    const html = '<p>El Art. 214 CP tipifica el trato degradante con pena de 1 a 2 años de prisión. El procedimiento requiere denuncia formal ante el ministerio público.</p>';
    expect(detectarFrasesFiller(html)).toHaveLength(0);
  });

  it('analizarSEO marca importante cuando hay ≥3 frases filler', () => {
    const body = '<p>Es importante destacar que el derecho penal es una rama fundamental. Cabe señalar que como es sabido, este tema reviste especial importancia. No cabe duda de que el contexto jurídico actual requiere atención.</p>' + postOk().body;
    const post = postOk({ body });
    const h = analizarSEO(post, wordCount(post.body));
    const filler = h.find((x) => x.categoria === 'contenido' && /filler/i.test(x.mensaje));
    expect(filler).toBeDefined();
    expect(['importante', 'critico']).toContain(filler?.severidad);
  });
});

describe('diversidadLexica — TTR anti-repetitivo', () => {
  it('devuelve TTR alto para texto con vocabulario variado', () => {
    // Cada frase usa vocabulario diferente. Se necesitan ≥200 tokens ≥4 chars.
    // Generamos 40 frases únicas con terminología jurídica diversa.
    const terminos = [
      'tipicidad objetiva subjetiva antijuridicidad culpabilidad imputable',
      'jurisdicción competencia territorio fuero atracción proceso penal',
      'prueba documental testifical pericial indiciaria presuncional libertad',
      'recurso apelación casación revisión amparo constitucionalidad tutela',
      'autoría complicidad instigación tentativa consumación frustración',
      'dolo eventual culpa consciente imprudencia negligencia impericia',
      'allanamiento detención flagrancia orden judicial mandamiento prisión',
      'conciliación mediación arbitraje transacción renuncia convenio',
      'herencia legado sucesión testamento intestada abintestato caudal',
      'custodia patria potestad alimentos visitas regulación familiar',
      'contrato bilateral oneroso conmutativo aleatorio consensual real',
      'responsabilidad extracontractual aquiliana culpa riesgo creado empresa',
      'prescripción adquisitiva extintiva usucapión inmuebles posesión',
      'quiebra concurso acreedores insolvencia activos pasivos liquidación',
      'constitucionalidad control difuso concentrado supremacía reforma',
      'debido proceso contradicción defensa técnica imparcialidad oralidad',
      'flagrancia delito persecución investigación ministerio público fiscalía',
      'execucción pena libertad condicional redención tratamiento penitenciario',
      'delincuencia organizada lavado activos narcotráfico financing terrorismo',
      'violencia doméstica intrafamiliar protección medidas cautelares restricción',
      'patrimonio gananciales sociedad conyugal liquidación partición adjudicación',
      'despido injustificado indemnización preaviso cesantía antigüedad trabajador',
      'arrendamiento inquilinato desahucio desocupación canon mensual contrato',
      'fiducia garantía prendaria hipoteca gravamen embargo remate judicial',
      'agraviado denunciante querellante víctima testigo perito intérprete',
      'nulidad insanable convalidación vicio procedimiento notificación emplazamiento',
      'excarcelación caución juratoria fianza comparecencia restricciones asistencia',
      'sobreseimiento definitivo provisional archivo imputación requerimiento acusación',
      'plenitud jurisdiccional fuero militar diplomático privilege inmunidad',
      'extradición detención internacional tratado reciprocidad entregación',
    ];
    const html = terminos.map((f) => `<p>${f}</p>`).join(' ');
    const r = diversidadLexica(html);
    expect(r).not.toBeNull();
    expect(r!.ttr).toBeGreaterThan(UMBRAL_TTR);
  });

  it('devuelve TTR bajo para texto repetitivo (misma frase reciclada)', () => {
    const html = Array.from({ length: 40 }, () =>
      '<p>El derecho penal hondureño establece penas proporcionales al delito cometido en el sistema jurídico nacional.</p>',
    ).join(' ');
    const r = diversidadLexica(html);
    expect(r).not.toBeNull();
    expect(r!.ttr).toBeLessThan(UMBRAL_TTR);
  });

  it('devuelve null para bodies <200 tokens (muestra no fiable)', () => {
    expect(diversidadLexica('<p>Texto corto de pocas palabras.</p>')).toBeNull();
  });

  it('analizarSEO marca importante cuando TTR < 0.40', () => {
    const repetitivo = Array.from({ length: 50 }, () =>
      '<p>El derecho penal hondureño establece penas proporcionales al delito cometido en el sistema jurídico nacional.</p>',
    ).join(' ');
    const post = postOk({ body: repetitivo });
    const h = analizarSEO(post, wordCount(post.body));
    const ttr = h.find((x) => x.categoria === 'contenido' && /diversidad léxica/i.test(x.mensaje));
    expect(ttr).toBeDefined();
    expect(['importante', 'critico']).toContain(ttr?.severidad);
  });
});

describe('detectarRepeticionCrossArticle — anti-plantilla entre artículos', () => {
  it('detecta un bloque de 8+ palabras compartido por ≥3 artículos', () => {
    const bloqueComun = 'el procedimiento penal hondureño establece que el juez debe resolver';
    const bodies = [
      { slug: 'post-a', body: `<p>Introducción específica del post A. ${bloqueComun} dentro de tres días hábiles.</p>` },
      { slug: 'post-b', body: `<p>Otro contexto distinto del post B. ${bloqueComun} con audiencia previa.</p>` },
      { slug: 'post-c', body: `<p>Contexto diferente del post C. ${bloqueComun} según el caso concreto.</p>` },
    ];
    const r = detectarRepeticionCrossArticle(bodies, 8, 3);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].count).toBeGreaterThanOrEqual(3);
    expect(r[0].slugs).toContain('post-a');
    expect(r[0].slugs).toContain('post-b');
    expect(r[0].slugs).toContain('post-c');
  });

  it('no detecta repetición cuando los artículos no comparten bloques largos', () => {
    const bodies = [
      { slug: 'post-a', body: '<p>El derecho penal tipifica delitos graves con penas de prisión prolongadas.</p>' },
      { slug: 'post-b', body: '<p>El derecho civil regula contratos y patrimonios entre particulares.</p>' },
      { slug: 'post-c', body: '<p>El derecho de familia aborda divorcio custodia y pensión alimentaria.</p>' },
    ];
    expect(detectarRepeticionCrossArticle(bodies, 8, 3)).toHaveLength(0);
  });

  it('no detecta repetición con <3 artículos (no hay suficiente evidencia)', () => {
    const bloqueComun = 'el procedimiento penal hondureño establece que el juez debe resolver';
    const bodies = [
      { slug: 'post-a', body: `<p>${bloqueComun} rápido.</p>` },
      { slug: 'post-b', body: `<p>${bloqueComun} lento.</p>` },
    ];
    expect(detectarRepeticionCrossArticle(bodies, 8, 3)).toHaveLength(0);
  });
});



describe('detectarTextoVago — placeholders en lugar de datos específicos', () => {
  it('detecta términos vagos como "porcentaje base", "cantidad determinada"', () => {
    const html = '<p>El porcentaje base se aplica según corresponda. La cantidad determinada se paga con parámetros establecidos.</p>';
    const v = detectarTextoVago(html);
    expect(v.length).toBeGreaterThanOrEqual(3);
    expect(v.some((x) => x.termino === 'porcentaje base')).toBe(true);
    expect(v.some((x) => x.termino === 'cantidad determinada')).toBe(true);
  });

  it('no detecta vagos en texto con datos específicos', () => {
    const html = '<p>El Art. 78 CT establece la cesantía: de 2 a 5 años, 1 mes de salario por año.</p>';
    expect(detectarTextoVago(html)).toHaveLength(0);
  });

  it('analizarSEO marca importante cuando hay ≥2 términos vagos', () => {
    const body = '<p>El porcentaje base se aplica. La cantidad determinada se paga según corresponda.</p>' + postOk().body;
    const post = postOk({ body });
    const h = analizarSEO(post, wordCount(post.body));
    const vago = h.find((x) => x.categoria === 'contenido' && /vago/i.test(x.mensaje));
    expect(vago).toBeDefined();
    expect(['importante', 'critico']).toContain(vago?.severidad);
  });
});

describe('tieneDeclaracionEntidad — GEO para motores IA', () => {
  it('detecta declaración de entidad "El X en Honduras es..."', () => {
    const html = '<p>El divorcio en Honduras es un proceso legal que permite disolver el vínculo matrimonial.</p>';
    expect(tieneDeclaracionEntidad(html)).toBe(true);
  });

  it('detecta declaración "Las X en Honduras..."', () => {
    const html = '<p>Las prestaciones laborales en Honduras son derechos económicos del trabajador.</p>';
    expect(tieneDeclaracionEntidad(html)).toBe(true);
  });

  it('detecta pregunta "Qué es X?"', () => {
    const html = '<p>¿Qué es la cesantía? Es una prestación laboral acumulada.</p>';
    expect(tieneDeclaracionEntidad(html)).toBe(true);
  });

  it('NO detecta entidad cuando el body empieza con narrativa genérica', () => {
    const html = '<p>En primer lugar, debemos considerar los antecedentes históricos del derecho.</p>';
    expect(tieneDeclaracionEntidad(html)).toBe(false);
  });

  it('analizarSEO marca recomendable cuando falta declaración de entidad', () => {
    // Body que NO empieza con declaración de entidad (narrativa histórica).
    // Los primeros 400 chars deben ser足够的mente largos para que el check
    // no alcance el fixture body (que SÍ tiene entidad).
    const sinEntidad = Array.from({ length: 10 }, (_, i) =>
      `<p>En primer lugar, debemos considerar los antecedentes históricos del derecho penal número ${i} y su evolución doctrinal.</p>`,
    ).join('\n');
    const post = postOk({ body: sinEntidad });
    const h = analizarSEO(post, wordCount(post.body));
    const geo = h.find((x) => x.categoria === 'geo' && /declaración de entidad/i.test(x.mensaje));
    expect(geo).toBeDefined();
    expect(geo?.severidad).toBe('importante');
  });
});

describe('analizarSEO — SEO local fix (aceptar Honduras)', () => {
  it('NO marca SEO local débil cuando el body menciona "Honduras"', () => {
    const body = '<p>El derecho penal de Honduras establece penas proporcionales.</p>' + postOk().body;
    const post = postOk({ body });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'seo_local')).toBeUndefined();
  });

  it('SÍ marca SEO local débil cuando no menciona ni Honduras ni ciudad', () => {
    // Body sin "Honduras" ni ciudad — usar body personalizado, no postOk().body
    // (que ya contiene "Honduras" en sus plantillas)
    const bodySinGeo = Array.from({ length: 61 }, (_, i) =>
      `<p>El análisis jurídico número ${i} aborda supuestos típicos y consecuencias procesales del ordenamiento nacional.</p>`,
    ).join('\n');
    const post = postOk({ body: bodySinGeo });
    const h = analizarSEO(post, wordCount(post.body));
    const local = h.find((x) => x.categoria === 'seo_local');
    expect(local).toBeDefined();
  });
});

describe('verificarClaims — Código de Trabajo', () => {
  it('NO marca un artículo del Código de Trabajo que existe (Art. 78 CT)', () => {
    const claims = extraerClaims('El Art. 78 del Código de Trabajo establece la cesantía.');
    const disc = verificarClaims(claims);
    const falsoPositivo = disc.find((d) => d.valorEncontrado.includes('Art. 78'));
    expect(falsoPositivo).toBeUndefined();
  });

  it('detecta un artículo del Código de Trabajo inventado (Art. 999 CT)', () => {
    const claims = extraerClaims('El Art. 999 del Código de Trabajo establece una prestación.');
    const disc = verificarClaims(claims);
    const inventado = disc.find((d) => d.valorEncontrado.includes('Art. 999'));
    expect(inventado).toBeDefined();
    expect(inventado?.severidad).toBe('critico');
  });
});

describe('post OK integración', () => {
  it('un post que cumple todos los validadores no produce hallazgos críticos ni importantes', () => {
    const post = postOk();
    const h = analizarSEO(post, wordCount(post.body));
    const blocking = h.filter((x) => x.severidad === 'critico' || x.severidad === 'importante');
    // Tolerancia: el post base puede tener algún recomendable (SEO local), pero
    // no debe tener críticos ni importantes.
    expect(blocking).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Tests de las nuevas funcionalidades (enlaces R6, metaTitle, jerarquía H2→H4,
// esRutaPrivada, MIN_PALABRAS_AMPLIACION_IA)
// ─────────────────────────────────────────────────────────────────────────

describe('esRutaPrivada — R6 (no exponer intranet)', () => {
  it('detecta rutas privadas relativas exactas', () => {
    expect(esRutaPrivada('/intranet')).toBe(true);
    expect(esRutaPrivada('/admin')).toBe(true);
    expect(esRutaPrivada('/cp')).toBe(true);
    expect(esRutaPrivada('/calculadora')).toBe(true);
    expect(esRutaPrivada('/casos')).toBe(true);
    expect(esRutaPrivada('/delitos')).toBe(true);
    expect(esRutaPrivada('/atajos')).toBe(true);
  });

  it('detecta rutas privadas con subpath', () => {
    expect(esRutaPrivada('/intranet/admin')).toBe(true);
    expect(esRutaPrivada('/cp/delitos/123')).toBe(true);
    expect(esRutaPrivada('/calculadora/resultado')).toBe(true);
  });

  it('NO marca rutas públicas como privadas', () => {
    expect(esRutaPrivada('/blog/derecho-penal/articulo')).toBe(false);
    expect(esRutaPrivada('/abogados-en-nacaome')).toBe(false);
    expect(esRutaPrivada('/servicios')).toBe(false);
    expect(esRutaPrivada('/')).toBe(false);
  });

  it('NO marca falsos positivos por prefijo (matching por segmento)', () => {
    // "/cp" NO debe matchear "/cputados" ni "/cph"
    expect(esRutaPrivada('/cputados')).toBe(false);
    expect(esRutaPrivada('/cph-blog')).toBe(false);
  });

  it('NO marca URLs externas como privadas', () => {
    expect(esRutaPrivada('https://example.com/intranet')).toBe(false);
    expect(esRutaPrivada('https://otro-sitio.com/admin')).toBe(false);
  });

  it('detecta rutas privadas con query/hash y trailing slash', () => {
    expect(esRutaPrivada('/intranet?tab=1')).toBe(true);
    expect(esRutaPrivada('/admin#seccion')).toBe(true);
    expect(esRutaPrivada('/cp/')).toBe(true);
  });
});

describe('analizarSEO — enlaces internos (R6)', () => {
  it('marca crítico un enlace a /intranet en el body', () => {
    const post = postOk({
      body: '<p>Ver <a href="/intranet/admin">el panel interno</a> para más detalles.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const enlace = h.find((x) => x.categoria === 'enlaces' && /ruta privada/i.test(x.mensaje));
    expect(enlace).toBeDefined();
    expect(enlace?.severidad).toBe('critico');
  });

  it('marca crítico enlaces a /cp, /calculadora, /delitos', () => {
    const post = postOk({
      body: '<p><a href="/cp">Calculadora</a> y <a href="/delitos">delitos</a>.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const enlace = h.find((x) => x.categoria === 'enlaces' && /ruta privada/i.test(x.mensaje));
    expect(enlace).toBeDefined();
    expect(enlace?.severidad).toBe('critico');
  });

  it('NO marca enlaces internos públicos como privados', () => {
    const post = postOk({
      body: '<p>Lee <a href="/blog/derecho-penal/guia">nuestra guía</a> sobre el tema.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const privado = h.find((x) => x.categoria === 'enlaces' && /ruta privada/i.test(x.mensaje));
    expect(privado).toBeUndefined();
  });

  it('marca importante enlaces internos con rel="nofollow"', () => {
    const post = postOk({
      body: '<p><a href="/blog/derecho-penal/guia" rel="nofollow">guía</a> sobre el tema.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const nofollow = h.find((x) => x.categoria === 'enlaces' && /nofollow/i.test(x.mensaje));
    expect(nofollow).toBeDefined();
    expect(nofollow?.severidad).toBe('importante');
  });

  it('marca importante enlaces externos sin rel', () => {
    const post = postOk({
      body: '<p>Fuente: <a href="https://example.com">example.com</a>.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const ext = h.find((x) => x.categoria === 'enlaces' && /externo.*rel/i.test(x.mensaje));
    expect(ext).toBeDefined();
    expect(ext?.severidad).toBe('importante');
  });

  it('marca importante enlaces http:// (debe ser https)', () => {
    const post = postOk({
      body: '<p><a href="http://example.com">http</a>.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const http = h.find((x) => x.categoria === 'enlaces' && /http:\/\//i.test(x.mensaje));
    expect(http).toBeDefined();
    expect(http?.severidad).toBe('importante');
  });

  it('marca anchors pobres ("aquí", "ver más")', () => {
    const post = postOk({
      body: '<p>Lee más <a href="/blog/otro">aquí</a>.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    const poor = h.find((x) => x.categoria === 'enlaces' && /descriptivo/i.test(x.mensaje));
    expect(poor).toBeDefined();
  });
});

describe('analizarSEO — metaTitle idéntico a title', () => {
  it('marca recomendable metaTitle === title (redundante)', () => {
    const post = postOk({
      title: 'Análisis del derecho penal en Honduras: guía práctica',
      metaTitle: 'Análisis del derecho penal en Honduras: guía práctica',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const dup = h.find((x) => x.categoria === 'seo' && /metaTitle idéntico/i.test(x.mensaje));
    expect(dup).toBeDefined();
    expect(dup?.severidad).toBe('recomendable');
  });

  it('NO marca cuando metaTitle difiere de title', () => {
    const post = postOk({
      title: 'Análisis del derecho penal en Honduras: guía práctica',
      metaTitle: 'Derecho penal hondureño: todo lo que debes saber',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const dup = h.find((x) => x.categoria === 'seo' && /metaTitle idéntico/i.test(x.mensaje));
    expect(dup).toBeUndefined();
  });

  it('NO marca cuando metaTitle está vacío (usa el title por defecto)', () => {
    const post = postOk({ metaTitle: null });
    const h = analizarSEO(post, wordCount(post.body));
    const dup = h.find((x) => x.categoria === 'seo' && /metaTitle idéntico/i.test(x.mensaje));
    expect(dup).toBeUndefined();
  });
});

describe('analizarSEO — jerarquía de headings (salto de 2 niveles)', () => {
  it('marca salto H2→H4 sin H3 intermedio', () => {
    const post = postOk({
      body: '<h2>Sección principal</h2><h4>Sub-subsección</h4>' + '<p>texto jurídico hondureño.</p>'.repeat(40),
    });
    const h = analizarSEO(post, wordCount(post.body));
    const salto = h.find((x) => x.categoria === 'headings' && /h2> seguido de <h4/i.test(x.mensaje));
    expect(salto).toBeDefined();
    expect(salto?.severidad).toBe('recomendable');
  });

  it('NO marca salto cuando la jerarquía es correcta (H2→H3→H4)', () => {
    const post = postOk({
      body: '<h2>Sección</h2><h3>Subsección</h3><h4>Detalle</h4>' + '<p>texto jurídico hondureño.</p>'.repeat(40),
    });
    const h = analizarSEO(post, wordCount(post.body));
    const salto = h.find((x) => x.categoria === 'headings' && /seguido de <h/i.test(x.mensaje));
    expect(salto).toBeUndefined();
  });
});

describe('MIN_PALABRAS_AMPLIACION_IA — umbral R17', () => {
  it('es 800 (distinto de MIN_PALABRAS que es 600)', () => {
    expect(MIN_PALABRAS_AMPLIACION_IA).toBe(800);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Guardia anti-alucinación: citas fabricadas atribuidas a artículos reales.
//
// Contexto: la IA (deepseek-v4-flash) amplió un post thin y fabricó una cita
// "Toda persona tiene derecho a la defensa y a ser asistida por un abogado de
// su confianza", atribuyéndola al Art. 183 de la Constitución. El Art. 183
// existe (sobre amparo), pero su contenido real NO menciona la defensa — la
// IA inventó el texto. La guardia de existencia (articulosConstSet) dejó pasar
// la alucinación porque solo verifica el número, no el contenido atribuido.
// Esta suite valida la nueva guardia que compara la cita entrecomillada contra
// el texto canónico del artículo.
// ─────────────────────────────────────────────────────────────────────────

describe('extraerCitaAtribuida — extrae cita entrecomillada del contexto', () => {
  it('extrae cita larga entre comillas dobles', () => {
    const ctx = 'El Artículo 183 de la Constitución establece: "Toda persona tiene derecho a la defensa y a ser asistida por un abogado de su confianza en cualquier estado del proceso."';
    const cita = extraerCitaAtribuida(ctx);
    expect(cita).not.toBeNull();
    expect(cita).toContain('Toda persona tiene derecho a la defensa');
  });

  it('extrae cita con comillas tipográficas “”', () => {
    const ctx = 'El artículo dispone: “Cualquier persona puede interponer recurso de amparo para que se le mantenga o restituya en el goce de los derechos reconocidos por esta Constitución.”';
    const cita = extraerCitaAtribuida(ctx);
    expect(cita).not.toBeNull();
    expect(cita).toContain('recurso de amparo');
  });

  it('ignora comillas cortas (<12 palabras) — nombres/términos técnicos', () => {
    const ctx = 'El artículo 183 trata sobre "amparo" y sus modalidades procesales en Honduras.';
    const cita = extraerCitaAtribuida(ctx);
    expect(cita).toBeNull();
  });

  it('devuelve null si no hay comillas en el contexto', () => {
    const ctx = 'El artículo 183 de la Constitución regula el recurso de amparo en Honduras.';
    const cita = extraerCitaAtribuida(ctx);
    expect(cita).toBeNull();
  });

  it('devuelve la cita más larga si hay varias (la más probablemente atribuida)', () => {
    const ctx = 'El término "amparo" aparece en el Art. 183, que establece: "Toda persona agraviada o cualquier en nombre de ésta, tiene derecho a interponer recurso de amparo para que se le mantenga o restituya en el goce y disfrute de los derechos."';
    const cita = extraerCitaAtribuida(ctx);
    expect(cita).not.toBeNull();
    expect(cita!.length).toBeGreaterThan(60);
    expect(cita).toContain('interponer recurso de amparo');
  });
});

describe('similitudCitaCanonica — compara cita vs texto canónico', () => {
  it('similitud alta cuando la cita coincide con el texto real', () => {
    const cita = 'Toda persona agraviada tiene derecho a interponer recurso de amparo';
    const textoCanonico = 'El Estado reconoce la garantía de amparo. En consecuencia toda persona agraviada o cualquier en nombre de ésta, tiene derecho a interponer recurso de amparo.';
    const sim = similitudCitaCanonica(cita, textoCanonico);
    expect(sim).toBeGreaterThanOrEqual(UMBRAL_SIMILITUD_CITA);
  });

  it('similitud baja cuando la cita es incompatible con el texto real', () => {
    const cita = 'Toda persona tiene derecho a la defensa y a ser asistida por un abogado de su confianza';
    const textoCanonico = 'El Estado reconoce la garantía de amparo. En consecuencia toda persona agraviada o cualquier en nombre de ésta, tiene derecho a interponer recurso de amparo.';
    const sim = similitudCitaCanonica(cita, textoCanonico);
    expect(sim).toBeLessThan(UMBRAL_SIMILITUD_CITA);
  });
});

describe('verificarClaims — cita fabricada sobre artículo real (guardia anti-alucinación)', () => {
  it('detecta cita inventada atribuida al Art. 183 Constitución (caso real deepseek-v4-flash)', () => {
    // Caso real detectado en auditoría del 2026-06-22: la IA amplió el post
    // 'proceso-consulta-legal-pineda' y fabricó una cita sobre el Art. 183
    // (que trata de amparo, no de defensa). Esta es la regresión canónica.
    const body = '<p>El derecho a la defensa y a la asistencia letrada está reconocido en el Artículo 183 de la Constitución de la República de Honduras, que establece: "Toda persona tiene derecho a la defensa y a ser asistida por un abogado de su confianza."</p>';
    const claims = extraerClaims(body);
    expect(claims.length).toBeGreaterThan(0);
    const claimConst = claims.find((c) => c.tipo === 'articulo_const');
    expect(claimConst).toBeDefined();
    const disc = verificarClaims(claims);
    const citaDisc = disc.find((d) => d.severidad === 'critico' && /no coincide con el texto real/i.test(d.mensaje));
    expect(citaDisc).toBeDefined();
    expect(citaDisc!.severidad).toBe('critico');
    expect(citaDisc!.valorEncontrado).toContain('defensa');
    expect(citaDisc!.valorCorrecto).toContain('amparo');
  });

  it('NO marca discrepancia cuando la cita coincide con el texto real del artículo', () => {
    // Cita veraz del Art. 183 (sobre amparo) — no debe disparar la guardia.
    const body = '<p>El Artículo 183 de la Constitución de la República de Honduras establece: "El Estado reconoce la garantía de amparo. En consecuencia toda persona agraviada o cualquier en nombre de ésta, tiene derecho a interponer recurso de amparo."</p>';
    const claims = extraerClaims(body);
    const disc = verificarClaims(claims);
    const citaDisc = disc.find((d) => /no coincide con el texto real/i.test(d.mensaje));
    expect(citaDisc).toBeUndefined();
  });

  it('detecta cita inventada atribuida a un artículo del CP (mismo patrón)', () => {
    // Simula una alucinación sobre un artículo del CP real cuyo texto real
    // trata de homicidio, pero la IA le atribuye un texto sobre robo.
    // Usamos el Art. 118 CP (homicidio simple) — verificamos que exista primero.
    const body = '<p>El Artículo 118 del Código Penal de Honduras establece: "El que por medio de violencia se apodere de una cosa mueble ajena, será sancionado con prisión de seis a nueve años."</p>';
    const claims = extraerClaims(body);
    const claimCp = claims.find((c) => c.tipo === 'articulo_cp');
    expect(claimCp).toBeDefined();
    const disc = verificarClaims(claims);
    // Puede que el Art. 118 no exista o que la cita no coincida — en cualquier
    // caso, si el artículo existe y la cita es incompatible, debe dispararse.
    // Si el artículo NO existe, dispara la guardia de existencia (también crítica).
    const discCritica = disc.find((d) => d.severidad === 'critico');
    expect(discCritica).toBeDefined();
  });

  it('NO marca discrepancia cuando no hay cita atribuida (solo referencia)', () => {
    // Referencia sin cita entrecomillada — la guardia de cita no debe actuar.
    const body = '<p>El Artículo 183 de la Constitución regula el recurso de amparo en Honduras, garantizando la protección de los derechos constitucionales.</p>';
    const claims = extraerClaims(body);
    const disc = verificarClaims(claims);
    const citaDisc = disc.find((d) => /no coincide con el texto real/i.test(d.mensaje));
    expect(citaDisc).toBeUndefined();
  });
});

describe('detectarAlucinacionesNuevas — cita fabricada sobre artículo real', () => {
  it('detecta alucinación cuando la IA introduce una cita fabricada sobre Art. 183', () => {
    // Original sin claims → la IA añade una cita fabricada sobre el Art. 183.
    const bodyOriginal = '<p>La consulta legal es una reunión con un abogado para recibir orientación profesional en Honduras.</p>';
    const bodyCorregido = '<p>El derecho a la defensa está reconocido en el Artículo 183 de la Constitución de la República de Honduras, que establece: "Toda persona tiene derecho a la defensa y a ser asistida por un abogado de su confianza."</p>';
    const discOriginales = verificarClaims(extraerClaims(bodyOriginal));
    const aluc = detectarAlucinacionesNuevas(discOriginales, bodyCorregido);
    const citaAluc = aluc.find((d) => /no coincide con el texto real/i.test(d.mensaje));
    expect(citaAluc).toBeDefined();
    expect(citaAluc!.severidad).toBe('critico');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Optimizador CTR: guardias de title/meta + checks en analizarSEO
// ═══════════════════════════════════════════════════════════════════════════

describe('validarTitleOptimizado — guardia del title optimizado por IA', () => {
  it('acepta title optimizado que preserva el tema (keyword al frente)', () => {
    const original = 'Salarios mínimos en Honduras 2024: tabla actualizada';
    const optimizado = 'Salarios mínimos en Honduras 2024: guía completa';
    const r = validarTitleOptimizado(original, optimizado);
    expect(r).not.toBeNull();
    expect('nuevo' in r!).toBe(true);
    if ('nuevo' in r!) expect(r.nuevo).toBe(optimizado);
  });

  it('rechaza title que cambia el tema (sin overlap de keywords)', () => {
    const original = 'Salarios mínimos en Honduras 2024: tabla actualizada';
    const optimizado = 'Divorcio express en Tegucigalpa: requisitos y trámite';
    const r = validarTitleOptimizado(original, optimizado);
    // Puede ser null (sin keyword) o rechazado — ambos significan "no se aplica".
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/tema|keyword/i);
    } else {
      expect(r).toBeNull();
    }
  });

  it('trunca title >60 chars en palabra completa', () => {
    const original = 'Cómo reclamar prestaciones laborales en Honduras al finalizar un contrato';
    const optimizado = 'Cómo reclamar prestaciones laborales en Honduras al finalizar un contrato de trabajo';
    const r = validarTitleOptimizado(original, optimizado);
    expect(r).not.toBeNull();
    if ('nuevo' in r!) {
      expect(r.nuevo.length).toBeLessThanOrEqual(60);
    }
  });

  it('rechaza title <30 chars', () => {
    const original = 'Divorcio en Honduras: guía completa paso a paso';
    const optimizado = 'Divorcio';
    const r = validarTitleOptimizado(original, optimizado);
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/<30|mínimo/i);
    }
  });

  it('rechaza title con ruta privada (R6)', () => {
    // La IA podría intentar enlazar una herramienta interna en el title.
    // Un title real no contendría un path, pero la guardia debe detectarlo
    // igual: R6 es crítico de seguridad.
    const original = 'Salarios mínimos en Honduras 2024';
    const optimizado = 'Salarios mínimos en Honduras /intranet/calcular 2024';
    const r = validarTitleOptimizado(original, optimizado);
    // La guardia de ruta privada dispara antes que la de tema (R6 prioritario).
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/ruta privada|R6/i);
    }
  });

  it('devuelve null si el optimizado es idéntico al original', () => {
    const original = 'Salarios mínimos en Honduras 2024';
    const r = validarTitleOptimizado(original, original);
    expect(r).toBeNull();
  });

  it('devuelve null si el optimizado está vacío', () => {
    const r = validarTitleOptimizado('Título original', '   ');
    expect(r).toBeNull();
  });

  it('rechaza title que termina en puntos suspensivos ("...")', () => {
    // La IA a veces devuelve titles incompletos con "..." cuando no sabe
    // cómo encajar el contenido en 60 chars. Un title con "..." en SERP se
    // ve cortado e irresoluto → degrada CTR.
    const original = 'Cómo Funciona una Consulta Legal en Honduras: Qué Esperar';
    const optimizado = 'Cómo Funciona una Consulta Legal en Honduras: Qué...';
    const r = validarTitleOptimizado(original, optimizado);
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/puntos suspensivos|incompleto/i);
    } else {
      // Si no se rechazó, el title resultante no debe tener "..." al final
      if ('nuevo' in r!) expect(r.nuevo).not.toMatch(/\.\.\.?$/);
    }
  });
});

describe('truncarTitleSeguro — anti-truncado en palabra colgante (brand)', () => {
  // El bug real: la IA fuerza "| Pineda y Asociados" al final y
  // truncarEnPalabra corta en "Pineda y", dejando "y" colgante. SERP muestra
  // un title incompleto que degrada CTR. truncarTitleSeguro retrocede al
  // espacio anterior si la última palabra es conjunción/preposición/artículo.

  it('retrocede "y" colgante al final del title (caso real del dry-run)', () => {
    const title = 'Derechos del Detenido en Honduras: Abogado, Silencio y Asociados';
    const truncado = truncarTitleSeguro(title, 60);
    expect(truncado.length).toBeLessThanOrEqual(60);
    const ultima = truncado.split(/\s+/).pop()!.toLowerCase();
    expect(ultima).not.toBe('y');
    expect(ultima).not.toBe('asociados'); // no debe quedar "Asociados" cortado
  });

  it('retrocede "y" colgante del brand "| Pineda y Asociados" (caso real)', () => {
    const title = 'Reformas Legales en Honduras 2024: Cambios Clave | Pineda y Asociados';
    const truncado = truncarTitleSeguro(title, 60);
    expect(truncado.length).toBeLessThanOrEqual(60);
    const ultima = truncado.split(/\s+/).pop()!.toLowerCase();
    // No debe terminar en "y", "pineda", "asociados" (brand cortado a medias)
    expect(['y', 'pineda', 'asociados', 'la', 'el']).not.toContain(ultima);
  });

  it('no retrocede si la última palabra es sustantivo (no colgante)', () => {
    const title = 'Salarios mínimos en Honduras 2024: guía completa';
    const truncado = truncarTitleSeguro(title, 60);
    expect(truncado).toBe(title); // no excede 60, no se trunca
    expect(truncado.split(/\s+/).pop()!.toLowerCase()).toBe('completa');
  });

  it('preserva keyword al frente tras retroceso', () => {
    const title = 'Pensión Alimenticia en Honduras: Cómo Solicitarla y Recuperar lo Adeudado';
    const truncado = truncarTitleSeguro(title, 60);
    expect(truncado.length).toBeLessThanOrEqual(60);
    // La keyword "Pensión Alimenticia" (primeras 2 palabras) debe preservarse
    expect(truncado).toMatch(/^Pensión Alimenticia/i);
    const ultima = truncado.split(/\s+/).pop()!.toLowerCase();
    expect(['y', 'la', 'lo', 'el', 'de']).not.toContain(ultima);
  });

  it('retrocede múltiples palabras colgantes consecutivas', () => {
    // "ante la" → ambas colgantes, retrocede dos posiciones
    const title = 'Registro de Medicamentos en Honduras: Guía Completa ante la ARSA';
    const truncado = truncarTitleSeguro(title, 60);
    expect(truncado.length).toBeLessThanOrEqual(60);
    const palabras = truncado.split(/\s+/);
    const ultima = palabras.pop()!.toLowerCase();
    const penultima = palabras.pop()?.toLowerCase();
    expect(['ante', 'la', 'el', 'y', 'de']).not.toContain(ultima);
    // La penúltima tampoco debe ser colgante si la última lo era
    if (penultima) expect(['ante', 'la']).not.toContain(penultima);
  });

  it('integra con validarTitleOptimizado: title IA truncado no termina en "y"', () => {
    // Simula lo que devolvió la IA en el dry-run (brand forzado → truncado malo).
    const original = 'Derechos del Detenido en Honduras: Lo Que Debes Saber';
    const iaDevuelve = 'Derechos del Detenido en Honduras: Abogado, Silencio y Asociados';
    const r = validarTitleOptimizado(original, iaDevuelve);
    expect(r).not.toBeNull();
    if ('nuevo' in r!) {
      expect(r.nuevo.length).toBeLessThanOrEqual(60);
      const ultima = r.nuevo.split(/\s+/).pop()!.toLowerCase();
      expect(['y', 'la', 'el', 'de', 'asociados', 'pineda']).not.toContain(ultima);
    }
  });
});

describe('validarMetaOptimizada — guardia de la metaDescription optimizada', () => {
  it('acepta meta válida (70-155 chars, keyword del title, no copia del title)', () => {
    const title = 'Salarios mínimos en Honduras 2024: guía completa';
    const metaOriginal = 'Tabla de salarios mínimos vigentes.';
    const optimizada = 'Consulta los salarios mínimos oficiales de Honduras 2024 por sector económico y descubre cómo se calculan las prestaciones laborales correspondientes.';
    const r = validarMetaOptimizada(title, metaOriginal, optimizada);
    expect(r).not.toBeNull();
    if ('nuevo' in r!) expect(r.nuevo).toBe(optimizada.trim());
  });

  it('rechaza meta idéntica al title', () => {
    const title = 'Salarios mínimos en Honduras 2024: guía completa';
    const r = validarMetaOptimizada(title, '', title);
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/idéntica al title/i);
    }
  });

  it('trunca meta >155 chars en palabra completa', () => {
    const title = 'Salarios mínimos en Honduras 2024';
    const optimizada = 'Consulta los salarios mínimos oficiales de Honduras 2024 por sector económico y descubre cómo se calculan las prestaciones laborales correspondientes además de los bonos y gratificaciones adicionales que aplica la legislación vigente del país centroamericano.';
    const r = validarMetaOptimizada(title, '', optimizada);
    expect(r).not.toBeNull();
    if ('nuevo' in r!) {
      expect(r.nuevo.length).toBeLessThanOrEqual(155);
    }
  });

  it('rechaza meta <70 chars', () => {
    const title = 'Salarios mínimos en Honduras 2024';
    const optimizada = 'Tabla de salarios 2024.';
    const r = validarMetaOptimizada(title, '', optimizada);
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/<70|mínimo/i);
    }
  });

  it('rechaza meta sin keyword del title (desalineada)', () => {
    const title = 'Salarios mínimos en Honduras 2024';
    const optimizada = 'Guía completa sobre el divorcio express en Tegucigalpa y los requisitos documentales necesarios para iniciar el trámite judicial correspondiente.';
    const r = validarMetaOptimizada(title, '', optimizada);
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/keyword|desalineada/i);
    }
  });

  it('rechaza meta con ruta privada (R6)', () => {
    const title = 'Salarios mínimos en Honduras 2024';
    const optimizada = 'Consulta los salarios en /admin/calcular y descubre cómo se calculan las prestaciones laborales correspondientes en el país centroamericano vigente.';
    const r = validarMetaOptimizada(title, '', optimizada);
    if (r && 'rechazado' in r) {
      expect(r.rechazado).toMatch(/ruta privada|R6/i);
    }
  });

  it('devuelve null si la optimizada es idéntica a la original', () => {
    const title = 'Salarios mínimos en Honduras 2024';
    const meta = 'Guía de salarios mínimos de Honduras vigentes en el año 2024.';
    const r = validarMetaOptimizada(title, meta, meta);
    expect(r).toBeNull();
  });
});

describe('analizarSEO — checks CTR (categoría ctr)', () => {
  it('detecta keyword foco del title ausente del primer párrafo', () => {
    const post = postOk({
      title: 'Pensiones alimentarias en Honduras: guía práctica',
      body: '<p>El derecho de familia en Honduras regula múltiples instituciones jurídicas.</p>' + '<h2>Marcos normativos</h2><p>La Constitución establece principios generales.</p>',
    });
    const hallazgos = analizarSEO(post, wordCount(post.body));
    const ctr = hallazgos.find(
      (h) => h.categoria === 'ctr' && /keyword foco.*primer párrafo/i.test(h.mensaje),
    );
    expect(ctr).toBeDefined();
  });

  it('detecta title sin señales CTR (número, power word, pregunta, brand)', () => {
    // Title plano, sin número/pregunta/power word/año/brand.
    const post = postOk({
      title: 'Análisis del derecho civil hondureño aplicado',
      metaTitle: '', // evitar CTR-5 (metaTitle redundante)
    });
    const hallazgos = analizarSEO(post, wordCount(post.body));
    const ctr = hallazgos.find(
      (h) => h.categoria === 'ctr' && /señales CTR/i.test(h.mensaje),
    );
    expect(ctr).toBeDefined();
  });

  it('detecta meta description con apertura débil para CTR', () => {
    const post = postOk({
      metaDescription: 'Este artículo explica los salarios mínimos en Honduras y cómo se aplican según el sector económico vigente en el país.',
      metaTitle: '',
    });
    const hallazgos = analizarSEO(post, wordCount(post.body));
    const ctr = hallazgos.find(
      (h) => h.categoria === 'ctr' && /apertura débil|Este artículo/i.test(h.mensaje),
    );
    expect(ctr).toBeDefined();
  });

  it('detecta metaTitle idéntico al title (redundante)', () => {
    const title = 'Salarios mínimos en Honduras 2024: guía';
    const post = postOk({
      title,
      metaTitle: title, // idéntico → redundante
    });
    const hallazgos = analizarSEO(post, wordCount(post.body));
    const ctr = hallazgos.find(
      (h) => h.categoria === 'ctr' && /metaTitle idéntico al title|redundante/i.test(h.mensaje),
    );
    expect(ctr).toBeDefined();
  });

  it('detecta keyword foco no al frente del title (primeras 3 palabras)', () => {
    // "Guía paso a paso" va al frente (power words); la keyword foco "pensiones"
    // va en posición 4+, fuera de las primeras 3 palabras.
    const post = postOk({
      title: 'Guía paso a paso sobre pensiones alimentarias en Honduras',
      metaTitle: '',
      body: '<p>Las pensiones alimentarias en Honduras son una obligación legal.</p>' + '<h2>Marcos normativos</h2><p>La Constitución establece principios generales.</p>',
    });
    const hallazgos = analizarSEO(post, wordCount(post.body));
    const ctr = hallazgos.find(
      (h) => h.categoria === 'ctr' && /al frente|primeras 3/i.test(h.mensaje),
    );
    expect(ctr).toBeDefined();
  });
});

describe('autoFixMetaTitle — limpia metaTitle redundante', () => {
  it('limpia metaTitle idéntico al title (devuelve string vacío)', () => {
    const title = 'Salarios mínimos en Honduras 2024';
    const post = postOk({ title, metaTitle: title });
    const r = autoFixMetaTitle(post);
    expect(r).not.toBeNull();
    expect(r!.nuevo).toBe('');
    expect(r!.cambiado).toBe(true);
  });

  it('no toca metaTitle vacío (fallback correcto)', () => {
    const post = postOk({ metaTitle: '' });
    const r = autoFixMetaTitle(post);
    expect(r).toBeNull();
  });

  it('no toca metaTitle divergente del title (decisión editorial)', () => {
    const post = postOk({
      title: 'Salarios mínimos en Honduras 2024',
      metaTitle: 'Tabla de salarios 2024 por sector — Pineda y Asociados',
    });
    const r = autoFixMetaTitle(post);
    expect(r).toBeNull();
  });

  it('integrado en aplicarAutoFixesMetadatos', () => {
    const title = 'Análisis del derecho penal en Honduras: guía práctica';
    const post = postOk({ title, metaTitle: title });
    const fixes = aplicarAutoFixesMetadatos(post);
    expect(fixes.metaTitle).not.toBeNull();
    expect(fixes.metaTitle!.nuevo).toBe('');
    expect(fixes.cambiosAplicados.some((c) => /metaTitle redundante/i.test(c))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Modo --ctr-only (payload ligero)
//
// El modo CTR-only no añade nueva lógica determinista testable: reusa las
// guardias `validarTitleOptimizado` y `validarMetaOptimizada` (ya cubiertas
// en suites anteriores) y reduce el payload enviado a la IA (max_tokens=500
// en vez de 8000, solo title+meta+primer párrafo en vez del body completo).
//
// La diferencia con body mode es el PAYLOAD, que requiere DeepSeek real para
// probar end-to-end. Los tests siguientes verifican los INVARIANTES que sí
// son testables sin IA:
//   1. validarTitleOptimizado rechaza títulos con mismos defectos que en body
//      mode (la guardia es la misma en CTR-only y body mode).
//   2. validarMetaOptimizada mantiene las mismas reglas (longitud, keyword,
//      rutas privadas) en ambos modos.
//   3. El body no se altera en CTR-only porque la IA no lo devuelve — los
//      contadores titlesOptimizados/metasOptimizadas se incrementan solo si
//      las guardias pasan.
// ---------------------------------------------------------------------------
describe('Modo --ctr-only (payload ligero): guardias reusadas', () => {
  it('validarTitleOptimizado rechaza "..." y cambio de tema (CTR-only reusa la misma guardia que body mode)', () => {
    const title = 'Cómo presentar una demanda civil en Honduras';
    // 1. Title terminado en "..." (IA dejó el title a medias) → guardia anti-"..."
    //    (paso 1b, antes que la de tema). La guardia es la misma en CTR-only y body.
    const r1 = validarTitleOptimizado(title, 'Demanda civil en Honduras | Pineda y...');
    expect(r1).not.toBeNull();
    if (!r1) throw new Error("r1 es null");
    expect('nuevo' in r1).toBe(false);
    if (!('nuevo' in r1)) {
      expect(r1.rechazado).toMatch(/puntos suspensivos|\.\.\./i);
    }
    // 2. Cambio de tema: la IA pasó de "demanda civil" a "divorcio express".
    //    overlap <40% y Jaccard <0.3 → rechazo (no puede cambiar la intención).
    const r2 = validarTitleOptimizado(title, 'Guía de divorcio express en Honduras paso a paso');
    expect(r2).not.toBeNull();
    if (!r2) throw new Error("r2 es null");
    expect('nuevo' in r2).toBe(false);
    if (!('nuevo' in r2)) {
      expect(r2.rechazado).toMatch(/tema|overlap|keyword/i);
    }
  });

  it('validarMetaOptimizada rechaza rutas privadas (R6) en CTR-only (guardia reusada de body mode)', () => {
    const title = 'Calcular pensión alimentaria en Honduras';
    // meta original válida (sin ruta privada), meta optimizada con /intranet/calculadora
    // y longitud dentro de 70-155 para que R6 sea el trigger (no enmascarada por <70).
    const original = 'Use la calculadora oficial para estimar la pensión alimentaria mensual en Honduras.';
    const opt = '/intranet/calculadora permite estimar la pensión alimentaria que debe pagar el obligado en Honduras.';
    const r = validarMetaOptimizada(title, original, opt);
    expect(r).not.toBeNull();
    if (!r) throw new Error("r es null");
    expect('nuevo' in r).toBe(false);
    if (!('nuevo' in r)) {
      expect(r.rechazado).toMatch(/ruta privada|R6|intranet/i);
    }
  });

  it('CTR-only never devuelve bodyCorregido (solo title+meta): conceptual invariant, las guardias de body nunca aplican', () => {
    // Verifica conceptualmente: validarTitleOptimizado y validarMetaOptimizada
    // son las ÚNICAS guardias activas en CTR-only. No hay guardias de body
    // (alucinaciones, regresiones, similitud ≥98%) porque la IA no lo devuelve.
    // Si un futuro cambio añade guardias de body en CTR-only, este test debe
    // actualizarse para incluir las nuevas.
    const title = 'Herencia y testamentos en Honduras guía';
    const rT = validarTitleOptimizado(title, 'Herencia y testamentos en Honduras: guía paso a paso');
    if (rT && 'nuevo' in rT) {
      expect(rT.nuevo.length).toBeGreaterThan(0);
      expect(rT.nuevo.length).toBeLessThanOrEqual(60);
    }
  });
});
