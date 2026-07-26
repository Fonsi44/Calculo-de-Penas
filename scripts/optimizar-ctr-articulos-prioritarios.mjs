/**
 * Optimiza el snippet SERP de artículos con impresiones y CTR bajo.
 *
 * No modifica el título visible, el cuerpo ni referencias jurídicas.
 * Dry-run: node scripts/optimizar-ctr-articulos-prioritarios.mjs
 * Aplicar: node scripts/optimizar-ctr-articulos-prioritarios.mjs --aplicar
 */
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

const optimizaciones = {
  'central-riesgos-honduras-consultar-impugnar': {
    metaTitle: 'Central de Riesgos Honduras: cómo consultar e impugnar',
    metaDescription:
      'Consulte su historial en la Central de Riesgos de Honduras, detecte errores y conozca el proceso para impugnar información incorrecta.',
  },
  'como-obtener-rtn-personas-empresas-honduras': {
    metaTitle: 'RTN en Honduras: requisitos y cómo obtenerlo',
    metaDescription:
      'Requisitos y pasos para obtener el RTN de una persona natural o jurídica ante el SAR de Honduras, con documentos y obligaciones principales.',
  },
  'contratos-arrendamiento-derechos-obligaciones-honduras': {
    metaTitle: 'Arrendamiento en Honduras: derechos y obligaciones',
    metaDescription:
      'Conozca los derechos y obligaciones de inquilinos y propietarios en Honduras: contrato, depósito, reparaciones, mora y desalojo.',
  },
  'custodia-hijos-honduras-juez': {
    metaTitle: 'Custodia de hijos en Honduras: criterios del juez',
    metaDescription:
      'Conozca los tipos de custodia y los criterios que evalúa un juez en Honduras para proteger el interés superior de niñas, niños y adolescentes.',
  },
  'divorcio-honduras-guia-completa': {
    metaTitle: 'Divorcio en Honduras: vías, requisitos y plazos',
    metaDescription:
      'Compare las vías de divorcio en Honduras, sus requisitos, documentos, plazos y las decisiones sobre hijos, alimentos y patrimonio.',
  },
  'estafas-fraudes-tipos-penales-honduras': {
    metaTitle: 'Estafas en Honduras: tipos, penas y denuncia',
    metaDescription:
      'Conozca los principales tipos de estafa y fraude en Honduras, sus posibles consecuencias y qué considerar al denunciar o preparar una defensa.',
  },
  'facturacion-electronica-requisitos-sar': {
    metaTitle: 'Facturación electrónica Honduras: requisitos SAR',
    metaDescription:
      'Conozca los requisitos, obligados, modalidades y controles del SAR relacionados con la facturación electrónica en Honduras.',
  },
  'isv-impuesto-venta-tasas-obligaciones-honduras': {
    metaTitle: 'ISV en Honduras: tasas, declaración y obligaciones',
    metaDescription:
      'Guía sobre tasas, crédito y débito fiscal, exenciones y obligaciones de declaración del Impuesto Sobre Ventas ante el SAR de Honduras.',
  },
  'jornada-laboral-horas-extra-descansos-honduras': {
    metaTitle: 'Jornada laboral Honduras: horas extra y descansos',
    metaDescription:
      'Revise los límites de jornada, descansos y recargos por horas extra en Honduras, además de la documentación útil para un reclamo laboral.',
  },
  'pension-alimenticia-honduras-guia-completa': {
    metaTitle: 'Pensión alimenticia Honduras: requisitos y pasos',
    metaDescription:
      'Conozca los documentos, pasos y criterios para solicitar, modificar o exigir el cumplimiento de una pensión alimenticia en Honduras.',
  },
  'poder-legal-honduras-cuando-se-necesita': {
    metaTitle: 'Poder notarial Honduras: tipos, requisitos y duración',
    metaDescription:
      'Conozca cuándo necesita un poder notarial en Honduras, qué tipos existen, cómo se otorgan y qué debe revisar antes de firmar.',
  },
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras': {
    metaTitle: 'Registro sanitario ARSA Honduras: requisitos y pasos',
    metaDescription:
      'Revise los requisitos y pasos para tramitar ante ARSA el registro sanitario de alimentos procesados en Honduras.',
  },
};

function validarSnippet(slug, config) {
  if (config.metaTitle.length > 60) throw new Error(`Meta title mayor de 60 caracteres en ${slug}.`);
  if (config.metaDescription.length > 155) {
    throw new Error(`Meta description mayor de 155 caracteres en ${slug}.`);
  }
}

async function main() {
  const sql = neon(DATABASE_URL);
  const slugs = Object.keys(optimizaciones);
  Object.entries(optimizaciones).forEach(([slug, config]) => validarSnippet(slug, config));

  const posts = await sql`
    SELECT slug, title, meta_title, meta_description, updated_at
    FROM blog_posts
    WHERE slug = ANY(${slugs})
    ORDER BY slug
  `;
  const encontrados = new Set(posts.map((post) => String(post.slug)));
  const ausentes = slugs.filter((slug) => !encontrados.has(slug));
  if (ausentes.length) throw new Error(`No se encontraron artículos: ${ausentes.join(', ')}`);

  const resultados = posts.map((post) => {
    const config = optimizaciones[String(post.slug)];
    return {
      slug: String(post.slug),
      titleVisibleConservado: String(post.title),
      metaTitleAntes: post.meta_title,
      metaTitleDespues: config.metaTitle,
      metaDescriptionAntes: post.meta_description,
      metaDescriptionDespues: config.metaDescription,
      updatedAtAntes: post.updated_at,
    };
  });

  console.log(`Modo: ${APLICAR ? 'APLICAR' : 'DRY-RUN'}`);
  for (const resultado of resultados) {
    console.log(
      `- ${resultado.slug}: title visible y body conservados; meta title ${resultado.metaTitleDespues.length} caracteres; description ${resultado.metaDescriptionDespues.length}`,
    );
  }
  if (!APLICAR) return;

  const backupDir = path.resolve(process.cwd(), 'auditoria-blog', 'backups');
  mkdirSync(backupDir, { recursive: true });
  const sello = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `ctr-articulos-prioritarios-${sello}.json`);
  writeFileSync(backupPath, JSON.stringify(resultados, null, 2), 'utf8');

  for (const resultado of resultados) {
    await sql`
      UPDATE blog_posts
      SET meta_title = ${resultado.metaTitleDespues},
          meta_description = ${resultado.metaDescriptionDespues},
          updated_at = NOW()
      WHERE slug = ${resultado.slug}
    `;
  }
  console.log(
    `Actualizados ${resultados.length} artículos. Backup: ${path.relative(process.cwd(), backupPath)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
