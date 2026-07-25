/**
 * Optimización SEO/GEO de los 11 artículos jurídicamente verificados.
 * Protege las referencias legales comparando todas las menciones de artículos
 * y decretos antes y después de cada transformación.
 *
 * Dry-run: npx tsx scripts/optimizar-seo-articulos-criticos.ts
 * Aplicar: npx tsx scripts/optimizar-seo-articulos-criticos.ts --aplicar
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

dotenvConfig({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const APLICAR = process.argv.includes('--aplicar');
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('placeholder')) {
  throw new Error('DATABASE_URL no configurada.');
}

type Optimizacion = {
  title?: string;
  metaDescription: string;
  reemplazos?: Array<[RegExp, string]>;
  insertarTrasPrimerParrafo?: string;
  insertarAntesDelCierre?: string;
};

const relacionados =
  '<h2>Temas relacionados</h2><p>También puede interesarle nuestra información sobre <a href="/servicios-juridicos">servicios jurídicos en Honduras</a> y sobre <a href="/solicitar-consulta">cómo solicitar una consulta legal</a>.</p>';

const optimizaciones: Record<string, Optimizacion> = {
  'abogados-en-san-marcos-de-colon-choluteca': {
    title: 'Abogados en San Marcos de Colón, Honduras',
    metaDescription:
      'Asesoría penal, familiar, laboral, civil y aduanera en San Marcos de Colón. Atención jurídica local y consultas para residentes en Honduras.',
    reemplazos: [
      [
        /<p>En San Marcos de Colón,/,
        '<p>Los abogados en San Marcos de Colón, Honduras, ofrecen orientación y representación jurídica adaptada a las necesidades de esta zona fronteriza. En San Marcos de Colón,',
      ],
    ],
  },
  'allanamiento-ilegal-violacion-domicilio-honduras': {
    metaDescription:
      'Conozca el horario constitucional, la orden judicial y las excepciones aplicables a un registro domiciliario en Honduras, además de cómo proteger sus derechos.',
    reemplazos: [
      [
        /Artículo 99 de la Constitución del Código Procesal Penal \(CPP\)<\/strong> vigente/,
        'Artículo 99 de la Constitución de la República</strong>',
      ],
    ],
    insertarAntesDelCierre: relacionados,
  },
  'audiencia-inicial-proceso-penal-honduras': {
    title: 'Audiencia inicial en Honduras: proceso y decisiones',
    metaDescription:
      'Qué ocurre en la audiencia inicial penal, quiénes participan y qué resoluciones puede adoptar el juez después de examinar el caso.',
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, esta audiencia permite al juez revisar la situación procesal de la persona imputada y decidir cómo continúa el caso.</p>',
    insertarAntesDelCierre: relacionados,
  },
  'defensa-penal-honduras': {
    title: 'Defensa penal en Honduras: primeras 24 horas',
    metaDescription:
      'Derechos durante una detención, actuación de la defensa, audiencia inicial y plazos de recursos en el proceso penal hondureño.',
    reemplazos: [
      [
        /<p>Tras una captura,/,
        '<p>La defensa penal en Honduras debe comenzar desde las primeras actuaciones de la detención. Tras una captura,',
      ],
    ],
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, una actuación temprana permite revisar la legalidad de la detención, proteger el derecho al silencio y preparar pruebas de descargo.</p><h2>Ejemplo práctico</h2><p>Si una persona es detenida y recibe preguntas sin haber hablado con su defensor, puede manifestar que guardará silencio hasta contar con asistencia técnica y dejar constancia de cualquier irregularidad.</p>',
  },
  'derechos-detenido-honduras-guia-constitucional': {
    title: 'Derechos del detenido en Honduras: guía práctica',
    metaDescription:
      'Abogado defensor, derecho al silencio, información sobre la detención, plazos y hábeas corpus explicados de forma práctica.',
    reemplazos: [
      [
        /<p>La <strong>Constitución de la República de Honduras/,
        '<p>Los derechos de una persona detenida en Honduras protegen su libertad, defensa y dignidad desde el primer contacto con la autoridad. La <strong>Constitución de la República de Honduras',
      ],
      [/según el los Artículos 288 y 289/, 'según los Artículos 288 y 289'],
    ],
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, la detención no elimina los derechos de la persona: debe conocer el motivo, acceder a defensa y recibir un trato respetuoso.</p>',
    insertarAntesDelCierre: relacionados,
  },
  'diferencia-denuncia-querella-acusacion-honduras': {
    title: 'Denuncia, querella y acusación en Honduras: diferencias',
    metaDescription:
      'Compare quién presenta la denuncia, cómo participa la víctima mediante acusación privada y cuándo formaliza la acusación el Ministerio Público.',
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, denunciar es informar un posible delito; intervenir como parte exige requisitos adicionales; y acusar formalmente busca llevar el caso a juicio.</p><h2>Ejemplo práctico</h2><p>Por ejemplo, una víctima puede denunciar primero ante la autoridad y después solicitar asesoría para participar activamente durante el proceso.</p>',
    insertarAntesDelCierre: relacionados,
  },
  'divorcio-honduras-guia-completa': {
    title: 'Divorcio en Honduras: 3 vías, requisitos y plazos',
    metaDescription:
      'Conozca las vías de divorcio en Honduras, sus requisitos generales, documentación, plazos y aspectos familiares que deben resolverse.',
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, la vía adecuada depende de si existe acuerdo entre los cónyuges y de las circunstancias familiares que deban resolverse.</p>',
    insertarAntesDelCierre: relacionados,
  },
  'guia-aduanera-importaciones-honduras': {
    title: 'Importaciones en Honduras: guía aduanera',
    metaDescription:
      'Requisitos, documentos, clasificación arancelaria, impuestos y etapas del despacho para importar mercancías legalmente a Honduras.',
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, importar exige identificar correctamente la mercancía, acreditar su valor, cumplir los permisos y pagar los tributos aplicables.</p>',
  },
  'juicio-oral-etapas-que-esperar-honduras': {
    title: 'Juicio oral en Honduras: etapas y preparación',
    metaDescription:
      'Conozca la apertura, presentación de pruebas, conclusiones, deliberación y sentencia en un juicio oral penal en Honduras.',
    reemplazos: [
      [
        /específicamente en los <strong>principalmente en los Artículos 304 al 346/,
        '<strong>principalmente en los Artículos 304 al 346',
      ],
    ],
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, el juicio oral es el momento en que acusación y defensa presentan sus pruebas y argumentos directamente ante el tribunal.</p>',
    insertarAntesDelCierre: relacionados,
  },
  'pension-alimenticia-honduras-guia-completa': {
    title: 'Pensión alimenticia en Honduras: requisitos y pasos',
    metaDescription:
      'Documentos, solicitud judicial, determinación de la cuota, embargo por incumplimiento y modificación de la pensión alimenticia.',
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, la cuota busca cubrir necesidades acreditadas según la capacidad económica de quien debe proporcionarla.</p><h2>Ejemplo práctico</h2><p>Por ejemplo, al preparar una solicitud conviene ordenar comprobantes de educación, salud, vivienda y alimentación, junto con la información disponible sobre los ingresos de la persona obligada.</p>',
    insertarAntesDelCierre:
      '<h2>Fuente oficial y temas relacionados</h2><p>La normativa aplicable es el Código de Familia de Honduras vigente. También puede interesarle nuestra información sobre <a href="/servicios-juridicos/derecho-de-familia">servicios de derecho de familia</a>.</p>',
  },
  'sobreseimiento-definitivo-provisional': {
    title: 'Sobreseimiento definitivo y provisional en Honduras',
    metaDescription:
      'Diferencias, efectos y posibilidades de reapertura del sobreseimiento definitivo y provisional dentro del proceso penal hondureño.',
    insertarTrasPrimerParrafo:
      '<h2>Explicación en lenguaje claro</h2><p>En términos sencillos, el definitivo cierra el proceso con efectos permanentes, mientras el provisional permite una eventual reapertura bajo las condiciones legales.</p>',
    insertarAntesDelCierre: relacionados,
  },
};

function referenciasLegales(html: string): string[] {
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return [
    ...texto.matchAll(
      /\b(?:Art(?:ículo)?s?\.?\s*\d+(?:\s*(?:a|al|y)\s*\d+)?|Decreto\s+(?:No\.\s*)?\d+(?:-\w+)?)/gi,
    ),
  ]
    .map((match) => match[0].trim().toLowerCase())
    .sort();
}

function insertarTrasPrimerParrafo(body: string, bloque: string): string {
  const cierre = body.indexOf('</p>');
  if (cierre < 0) throw new Error('No se encontró el primer párrafo.');
  return `${body.slice(0, cierre + 4)}${bloque}${body.slice(cierre + 4)}`;
}

function insertarAntesDelCierre(body: string, bloque: string): string {
  const marcadores = [
    '<h2>¿Necesita asesoría',
    '<h2>¿Necesita ayuda',
    '<h2>Conclusión',
    '<aside',
  ];
  const posiciones = marcadores.map((m) => body.lastIndexOf(m)).filter((i) => i >= 0);
  const posicion = posiciones.length ? Math.max(...posiciones) : body.length;
  return `${body.slice(0, posicion)}${bloque}${body.slice(posicion)}`;
}

async function main() {
  const sql = neon(DATABASE_URL!);
  const slugs = Object.keys(optimizaciones);
  const posts = await sql`
    SELECT slug, title, meta_title, meta_description, body, updated_at
    FROM blog_posts
    WHERE slug = ANY(${slugs})
    ORDER BY slug
  `;
  if (posts.length !== slugs.length) throw new Error('No se encontraron los 11 artículos.');

  const resultados = posts.map((post) => {
    const config = optimizaciones[String(post.slug)];
    let body = String(post.body);
    for (const [buscar, reemplazar] of config.reemplazos ?? []) {
      const anterior = body;
      body = body.replace(buscar, reemplazar);
      if (body === anterior) throw new Error(`No coincidió una corrección requerida en ${post.slug}: ${buscar}`);
    }
    if (config.insertarTrasPrimerParrafo) {
      body = insertarTrasPrimerParrafo(body, config.insertarTrasPrimerParrafo);
    }
    if (config.insertarAntesDelCierre) {
      body = insertarAntesDelCierre(body, config.insertarAntesDelCierre);
    }

    const referenciasAntes = referenciasLegales(String(post.body));
    const referenciasDespues = referenciasLegales(body);
    if (JSON.stringify(referenciasAntes) !== JSON.stringify(referenciasDespues)) {
      throw new Error(`La optimización alteró referencias legales en ${post.slug}.`);
    }
    return {
      slug: String(post.slug),
      titleAntes: String(post.title),
      titleDespues: config.title ?? String(post.title),
      metaTitleAntes: post.meta_title,
      metaDescriptionAntes: post.meta_description,
      metaDescriptionDespues: config.metaDescription,
      bodyAntes: String(post.body),
      bodyDespues: body,
      updatedAtAntes: post.updated_at,
    };
  });

  console.log(`Modo: ${APLICAR ? 'APLICAR' : 'DRY-RUN'}`);
  for (const r of resultados) {
    console.log(
      `- ${r.slug}: title ${r.titleAntes === r.titleDespues ? 'conservado' : 'optimizado'}, metaTitle eliminado, body ${r.bodyAntes === r.bodyDespues ? 'conservado' : 'mejorado'}`,
    );
  }

  if (!APLICAR) return;

  const backupDir = path.resolve(process.cwd(), 'auditoria-blog', 'backups');
  mkdirSync(backupDir, { recursive: true });
  const sello = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `seo-articulos-criticos-${sello}.json`);
  writeFileSync(backupPath, JSON.stringify(resultados, null, 2), 'utf8');

  for (const r of resultados) {
    await sql`
      UPDATE blog_posts
      SET title = ${r.titleDespues},
          meta_title = NULL,
          meta_description = ${r.metaDescriptionDespues},
          body = ${r.bodyDespues},
          updated_at = NOW()
      WHERE slug = ${r.slug}
    `;
  }
  console.log(`Actualizados ${resultados.length} artículos. Backup: ${path.relative(process.cwd(), backupPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
