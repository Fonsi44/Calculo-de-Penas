/**
 * Ajustes residuales tras la auditoría SEO de los 11 artículos críticos.
 * Dry-run por defecto; usar --aplicar para escribir.
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import path from 'node:path';

dotenvConfig({ path: path.resolve(process.cwd(), '.env.local'), override: true });
const APLICAR = process.argv.includes('--aplicar');
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL no configurada.');
const sql = neon(DATABASE_URL);

type Cambio = { slug: string; reglas: Array<[RegExp, string]>; title?: string; meta?: string };
const cambios: Cambio[] = [
  {
    slug: 'allanamiento-ilegal-violacion-domicilio-honduras',
    meta: 'Horario, orden judicial, urgencia y derechos ante un registro o allanamiento ilegal de una vivienda en Honduras.',
    reglas: [
      [
        /<p>El horario legal establecido/,
        '<p>El allanamiento de una vivienda en Honduras es un registro sujeto a límites constitucionales y procesales. El horario legal establecido',
      ],
      [/¿A qué hora es legal un allanamiento en Honduras\?/g, '¿A qué hora es legal un registro domiciliario en Honduras?'],
      [/¿Qué es un allanamiento de morada y cuándo es ilegal\?/g, '¿Qué es un registro domiciliario y cuándo es ilegal?'],
      [/Requisitos para un allanamiento legal en Honduras/g, 'Requisitos para un registro legal en Honduras'],
      [/Excepciones a la orden de allanamiento judicial/g, 'Excepciones a la orden judicial de registro'],
      [/¿Qué hacer ante un allanamiento en su domicilio\?/g, '¿Qué hacer ante un registro en su domicilio?'],
      [/Consecuencias legales de un allanamiento ilegal/g, 'Consecuencias legales de un registro ilegal'],
    ],
  },
  {
    slug: 'diferencia-denuncia-querella-acusacion-honduras',
    title: 'Denuncia vs querella y acusación en Honduras',
    meta: 'Quién puede informar un delito, cómo participa la víctima y cuándo formaliza la acusación el Ministerio Público en Honduras.',
    reglas: [],
  },
  {
    slug: 'derechos-detenido-honduras-guia-constitucional',
    title: 'Derechos del detenido en Honduras: explicación práctica',
    reglas: [],
  },
  {
    slug: 'abogados-en-san-marcos-de-colon-choluteca',
    reglas: [
      [
        /Los abogados en San Marcos de Colón, Honduras, ofrecen/,
        'Los servicios de abogados en San Marcos de Colón, Honduras, son una vía de orientación y representación jurídica adaptada a la zona. Estos profesionales ofrecen',
      ],
      [
        /Los servicios de abogados en San Marcos de Colón, Honduras, son una vía de orientación y representación jurídica adaptada a la zona\./,
        'Una asesoría jurídica es una vía para recibir orientación y representación profesional. En San Marcos de Colón, Honduras, este servicio se adapta a las necesidades de la zona.',
      ],
      [/Estos profesionales ofrecen/, 'Los abogados ofrecen'],
    ],
  },
  {
    slug: 'audiencia-inicial-proceso-penal-honduras',
    reglas: [[/Artículo 294<\/strong> del Código Procesal Penal/, 'Artículo 294 del Código Procesal Penal']],
  },
  {
    slug: 'sobreseimiento-definitivo-provisional',
    meta: 'Cuándo una resolución cierra definitivamente el proceso y cuándo permite reapertura si aparecen nuevas pruebas dentro del plazo legal.',
    reglas: [
      [/Diferencias clave entre sobreseimiento definitivo y provisional/g, 'Diferencias clave entre ambas resoluciones'],
      [/Causales para solicitar el sobreseimiento definitivo/g, 'Causales para solicitar el cierre definitivo'],
      [/¿Cuándo se puede dictar un sobreseimiento provisional\?/g, '¿Cuándo se puede dictar la modalidad provisional?'],
      [/Ejemplo práctico de sobreseimiento en Honduras/g, 'Ejemplo práctico en Honduras'],
      [/Errores comunes sobre el sobreseimiento/g, 'Errores comunes'],
      [/Procedimiento para solicitar el sobreseimiento/g, 'Procedimiento para solicitar esta resolución'],
      [/Preguntas frecuentes sobre el sobreseimiento/g, 'Preguntas frecuentes'],
      [/¿Es apelable una resolución de sobreseimiento\?/g, '¿Es apelable esta resolución?'],
      [/¿Cuál es la duración de un sobreseimiento provisional\?/g, '¿Cuál es la duración de la modalidad provisional?'],
      [
        /El <strong>Código Procesal Penal<\/strong> establece un plazo máximo de suspensión para el sobreseimiento provisional, que generalmente no excede el año\. Transcurrido este periodo sin que aparezcan nuevas pruebas, el juez debe pronunciarse sobre su conversión a sobreseimiento definitivo\./,
        'El proceso puede reabrirse si aparecen nuevas pruebas dentro de los cinco años previstos legalmente. Vencido ese plazo sin reapertura, deben aplicarse los efectos establecidos por el Código Procesal Penal.',
      ],
      [/¿Qué sucede si aparecen pruebas tras un sobreseimiento definitivo\?/g, '¿Qué sucede si aparecen pruebas después del cierre definitivo?'],
    ],
  },
];

async function main() {
  for (const cambio of cambios) {
    const [post] = await sql`
      SELECT title, meta_description, body
      FROM blog_posts
      WHERE slug = ${cambio.slug}
    `;
    if (!post) throw new Error(`No encontrado: ${cambio.slug}`);
    let body = String(post.body);
    for (const [buscar, reemplazar] of cambio.reglas) {
      const antes = body;
      body = body.replace(buscar, reemplazar);
      if (body === antes) continue;
    }
    console.log(`- ${cambio.slug}: ${cambio.reglas.length} ajustes`);
    if (APLICAR) {
      await sql`
        UPDATE blog_posts
        SET title = ${cambio.title ?? String(post.title)},
            meta_description = ${cambio.meta ?? String(post.meta_description)},
            body = ${body},
            updated_at = NOW()
        WHERE slug = ${cambio.slug}
      `;
    }
  }
  console.log(APLICAR ? 'Ajustes aplicados.' : 'Dry-run correcto.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
