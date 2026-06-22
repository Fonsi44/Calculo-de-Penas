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
  aplicarAutoFixesMetadatos,
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
  const estructura = [
    '<p>Según el Art. 1 del Código Civil, la ley es una declaración de la voluntad soberana (Decreto 84-2017, vigente 2024).</p>',
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
    metaTitle: 'Análisis del derecho penal en Honduras: guía práctica',
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

describe('analizarSEO — rutas privadas (R6)', () => {
  it('marca crítico un enlace a /intranet', () => {
    const post = postOk({
      body: '<p>Consulta nuestra <a href="/intranet/herramientas">calculadora interna</a> para más detalles.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const priv = h.find((x) => x.categoria === 'enlaces' && /PRIVADA/.test(x.mensaje));
    expect(priv).toBeDefined();
    expect(priv?.severidad).toBe('critico');
  });

  it('marca crítico un enlace a /admin (añadido en la corrección)', () => {
    const post = postOk({
      body: '<p>Ver <a href="/admin/blog">panel de gestión</a> del blog.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const priv = h.find((x) => x.categoria === 'enlaces' && /\/admin/.test(x.mensaje));
    expect(priv).toBeDefined();
    expect(priv?.severidad).toBe('critico');
  });

  it('no da falso positivo con "/cputados" (no es /cp)', () => {
    const post = postOk({
      body: '<p>El registro <a href="/cputados">cputados</a> es un ejemplo.</p>',
    });
    const h = analizarSEO(post, wordCount(post.body));
    const priv = h.find((x) => x.categoria === 'enlaces' && /PRIVADA/.test(x.mensaje));
    expect(priv).toBeUndefined();
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
    expect(geo?.severidad).toBe('recomendable');
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
  it('detecta un enlace a /admin introducido por la IA', () => {
    const post = postOk();
    const original = post.body;
    const corregido = original + '<p>Ver <a href="/admin/blog">panel</a> del blog.</p>';
    const reg = detectarRegresionesSEO(post, original, corregido);
    expect(reg.some((h) => h.categoria === 'enlaces' && /\/admin/.test(h.mensaje))).toBe(true);
  });

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

describe('analizarSEO — enlaces internos rotos (404 SEO)', () => {
  it('marca un enlace a un post /blog/ inexistente cuando se pasa el set de URLs válidas', () => {
    const post = postOk({
      body: '<p>Ver <a href="/blog/derecho-penal/articulo-inexistente-xyz">artículo relacionado</a>.</p>' + postOk().body,
    });
    const urlsValidas = new Set(['/blog/derecho-penal/otro-slug-real']);
    const h = analizarSEO(post, wordCount(post.body), urlsValidas);
    const roto = h.find((x) => x.categoria === 'enlaces' && /inexistente/i.test(x.mensaje));
    expect(roto).toBeDefined();
  });

  it('no marca un enlace a un post /blog/ que SÍ está en el set de URLs válidas', () => {
    const post = postOk({
      body: '<p>Ver <a href="/blog/derecho-penal/articulo-real">artículo relacionado</a>.</p>' + postOk().body,
    });
    const urlsValidas = new Set(['/blog/derecho-penal/articulo-real']);
    const h = analizarSEO(post, wordCount(post.body), urlsValidas);
    expect(h.find((x) => x.categoria === 'enlaces' && /inexistente/i.test(x.mensaje))).toBeUndefined();
  });

  it('no marca enlaces rotos cuando no se pasa el set de URLs (backward compat)', () => {
    const post = postOk({
      body: '<p>Ver <a href="/blog/derecho-penal/cualquier-slug">enlace</a>.</p>' + postOk().body,
    });
    const h = analizarSEO(post, wordCount(post.body));
    expect(h.find((x) => x.categoria === 'enlaces' && /inexistente/i.test(x.mensaje))).toBeUndefined();
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
    expect(geo?.severidad).toBe('recomendable');
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

describe('construirMapaEnlacesInternos — mapa keyword→URL', () => {
  it('construye entradas desde los titles de los posts', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras: guía completa', category: 'derecho-de-familia' },
      { ...postOk(), slug: 'pensión-alimentaria', title: 'Pensión alimentaria en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    // Debe tener entradas para keywords del título
    expect(mapa.size).toBeGreaterThan(0);
    // El keyword "divorcio" debe apuntar al post correcto
    const entrada = mapa.get('divorcio');
    expect(entrada).toBeDefined();
    expect(entrada!.url).toBe('/blog/derecho-de-familia/divorcio-honduras');
    expect(entrada!.slug).toBe('divorcio-honduras');
  });

  it('incluye áreas jurídicas en el mapa', () => {
    const mapa = construirMapaEnlacesInternos([postOk()]);
    // "derecho penal" es un área jurídica → /derecho-penal
    const entrada = mapa.get('derecho penal');
    expect(entrada).toBeDefined();
    expect(entrada!.url).toBe('/derecho-penal');
    expect(entrada!.fuente).toBe('area');
  });

  it('no sobrescribe entradas existentes (primer post gana)', () => {
    const posts = [
      { ...postOk(), slug: 'post-a', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
      { ...postOk(), slug: 'post-b', title: 'Divorcio y separación', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    // "divorcio" debe apuntar al primer post (post-a)
    expect(mapa.get('divorcio')?.slug).toBe('post-a');
  });
});

describe('detectarMencionesSinEnlace — oportunidades de enlazado', () => {
  it('detecta menciones de keywords del mapa sin enlace en el body', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras: guía completa', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<p>El procedimiento de divorcio requiere requisitos específicos.</p>' + postOk().body;
    const menciones = detectarMencionesSinEnlace(body, mapa, 'otro-slug');
    const divorcio = menciones.find((m) => m.keyword.includes('divorcio'));
    expect(divorcio).toBeDefined();
    expect(divorcio!.url).toBe('/blog/derecho-de-familia/divorcio-honduras');
  });

  it('NO detecta menciones que ya tienen enlace', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<p>El procedimiento de <a href="/blog/derecho-de-familia/divorcio-honduras">divorcio</a> requiere requisitos.</p>' + postOk().body;
    const menciones = detectarMencionesSinEnlace(body, mapa, 'otro-slug');
    // "divorcio" ya está enlazado → no debe aparecer como oportunidad
    expect(menciones.find((m) => m.keyword === 'divorcio')).toBeUndefined();
  });

  it('NO detecta menciones del propio post (no auto-enlace)', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<p>El divorcio es un proceso legal.</p>' + postOk().body;
    const menciones = detectarMencionesSinEnlace(body, mapa, 'divorcio-honduras');
    expect(menciones.find((m) => m.keyword === 'divorcio')).toBeUndefined();
  });

  it('NO detecta menciones dentro de headings', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<h2>Divorcio en Honduras</h2><p>Proceso legal.</p>' + postOk().body;
    const menciones = detectarMencionesSinEnlace(body, mapa, 'otro-slug');
    // "divorcio" en heading no cuenta como oportunidad
    expect(menciones.find((m) => m.keyword === 'divorcio')).toBeUndefined();
  });
});

describe('autoFixEnlacesInternos — inserción automática con guardias', () => {
  it('añade un enlace <a> en una mención sin enlace existente', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    // Usar un body simple sin otras keywords que compitan por el cupo de enlaces
    const body = '<p>El procedimiento de divorcio requiere requisitos específicos en el país. Texto adicional para superar el mínimo de palabras. Más texto jurídico sobre procedimientos y requisitos legales del sistema hondureño. Consideraciones importantes sobre plazos y documentación necesaria ante los tribunales de familia en Honduras.</p>';
    const r = autoFixEnlacesInternos(body, mapa, 'otro-slug', wordCount(body));
    expect(r.enlacesAnadidos).toBeGreaterThan(0);
    expect(r.nuevo).toContain('href="/blog/derecho-de-familia/divorcio-honduras"');
  });

  it('NO enlaza dentro de headings', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<h2>Divorcio en Honduras</h2><p>Texto.</p>' + postOk().body;
    const r = autoFixEnlacesInternos(body, mapa, 'otro-slug', wordCount(body));
    // No debe haber un <a> DENTRO del <h2> (entre <h2> y </h2>)
    expect(r.nuevo).not.toMatch(/<h2[^>]*>[^<]*<a\s/);
    // El "Divorcio en Honduras" del heading NO debe estar enlazado
    expect(r.nuevo).toMatch(/<h2>Divorcio en Honduras<\/h2>/);
  });

  it('NO enlaza dentro de un <a> existente', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
      { ...postOk(), slug: 'pensión-honduras', title: 'Pensión alimentaria Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<p>Ver <a href="/otro">divorcio y pensión</a> para más.</p>' + postOk().body;
    const r = autoFixEnlacesInternos(body, mapa, 'otro-slug', wordCount(body));
    // No debe haber un <a> dentro de otro <a>
    expect(r.nuevo).not.toMatch(/<a[^>]*><a/);
  });

  it('NO auto-enlaza al propio post', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    // Body simple que solo menciona "divorcio" (sin otras keywords del mapa)
    const body = '<p>El divorcio es un proceso legal.</p><p>Requiere atención cuidadosa.</p>';
    const r = autoFixEnlacesInternos(body, mapa, 'divorcio-honduras', wordCount(body));
    // No debe añadir ningún enlace al propio post
    const selfLink = r.nuevo.match(/href="\/blog\/derecho-de-familia\/divorcio-honduras"/g);
    expect(selfLink).toBeNull();
  });

  it('respeta el máximo de enlaces (1 por 250 palabras)', () => {
    const posts = Array.from({ length: 20 }, (_, i) => ({
      ...postOk(),
      slug: `post-${i}`,
      title: `Tema ${i} Honduras`,
      category: 'derecho-penal',
    }));
    const mapa = construirMapaEnlacesInternos(posts);
    const bodyLargo = '<p>' + Array.from({ length: 30 }, (_, i) =>
      `Tema ${i} Honduras requiere análisis jurídico detallado.`,
    ).join(' ') + '</p>';
    const r = autoFixEnlacesInternos(bodyLargo, mapa, 'otro', wordCount(bodyLargo));
    // wordCount ~210 → max(2, floor(210/250)) = 2 enlaces
    expect(r.enlacesAnadidos).toBeLessThanOrEqual(3);
  });

  it('NO enlaza la misma URL más de 1 vez', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<p>El divorcio es un tema. El divorcio requiere abogado. El divorcio cuesta. El divorcio termina.</p>' + postOk().body;
    const r = autoFixEnlacesInternos(body, mapa, 'otro-slug', wordCount(body));
    const matches = r.nuevo.match(/href="\/blog\/derecho-de-familia\/divorcio-honduras"/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(1);
  });

  it('es idempotente: no duplica enlaces ya presentes', () => {
    const posts = [
      { ...postOk(), slug: 'divorcio-honduras', title: 'Divorcio en Honduras', category: 'derecho-de-familia' },
    ];
    const mapa = construirMapaEnlacesInternos(posts);
    const body = '<p>El <a href="/blog/derecho-de-familia/divorcio-honduras">divorcio</a> es un proceso.</p>' + postOk().body;
    const r = autoFixEnlacesInternos(body, mapa, 'otro-slug', wordCount(body));
    // "divorcio" ya enlazado → no debe duplicar
    const matches = r.nuevo.match(/href="\/blog\/derecho-de-familia\/divorcio-honduras"/g) ?? [];
    expect(matches.length).toBe(1); // solo el enlace original
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
    expect(geo?.severidad).toBe('recomendable');
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
