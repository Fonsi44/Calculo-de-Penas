// FASE 2 + 4: Añadir CTAs locales y enlaces internos a posts existentes
// Ejecutar: npx tsx scripts/fase2-ctas-enlaces-locales.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL no configurada'); process.exit(1); }

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const CTAs: Record<string, { cta: string; link: string }> = {
  'derecho-penal': {
    cta: `<p>Si enfrenta un proceso penal en Choluteca o la zona sur de Honduras, la defensa temprana marca la diferencia. <a href="/abogado-penalista-choluteca">Contrate defensa penal con presencia local en Choluteca</a> o <a href="/solicitar-consulta">solicite una evaluación inicial de su caso</a>.</p>`,
    link: '/abogado-penalista-choluteca'
  },
  'derecho-de-familia': {
    cta: `<p>Si necesita tramitar un divorcio, fijar una pensión alimenticia o resolver una custodia en Choluteca, San Lorenzo o la zona sur, <a href="/abogado-familia-choluteca">contáctenos para una evaluación inicial de su caso</a>. También puede <a href="/solicitar-consulta">solicitar una consulta</a>.</p>`,
    link: '/abogado-familia-choluteca'
  },
  'derecho-laboral': {
    cta: `<p>Si le despidieron en Choluteca o la zona sur, podemos calcular su liquidación y gestionar su reclamo laboral. El plazo para reclamar es de 2 meses. <a href="/abogado-laboral-choluteca">Consulte a un abogado laboral en Choluteca</a> o <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogado-laboral-choluteca'
  },
  'derecho-civil': {
    cta: `<p>¿Problemas con contratos, herencias, propiedades o deudas en la zona sur? <a href="/abogado-civil-choluteca">Contrate a un abogado civil en Choluteca</a> o <a href="/solicitar-consulta">solicite una evaluación inicial de su caso</a>.</p>`,
    link: '/abogado-civil-choluteca'
  },
  'derecho-bancario': {
    cta: `<p>Si su banco le está cobrando cargos indebidos o lo reportó indebidamente en la Central de Riesgos, podemos ayudarle. <a href="/abogados-en-choluteca">Abogados bancarios en Choluteca</a> — <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogados-en-choluteca'
  },
  'derecho-mercantil': {
    cta: `<p>Si su empresa en San Lorenzo o Choluteca necesita contratos, constitución o defensa legal, asesoramos negocios en toda la zona sur. <a href="/abogado-empresas-san-lorenzo">Abogado para empresas en San Lorenzo</a> — <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogado-empresas-san-lorenzo'
  },
  'tributario': {
    cta: `<p>Si el SAR le notificó una fiscalización en Choluteca o San Lorenzo, necesitará asesoría urgente. <a href="/defensa-sar-choluteca">Defensa ante fiscalización del SAR en Choluteca</a> — <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/defensa-sar-choluteca'
  },
  'derecho-aduanero': {
    cta: `<p>Si importa mercancías por el puerto de San Lorenzo o necesita regularizar su situación aduanera, <a href="/abogado-aduanero-san-lorenzo">contrate un abogado aduanero en San Lorenzo</a> o <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogado-aduanero-san-lorenzo'
  },
  'derecho-administrativo': {
    cta: `<p>Si recibió una sanción administrativa o una notificación de expropiación en Choluteca, podemos impugnarla antes de que sea firme. <a href="/abogados-en-choluteca">Abogados en Choluteca</a> — <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogados-en-choluteca'
  },
  'derecho-ambiental': {
    cta: `<p>Si necesita una licencia ambiental o enfrenta un procedimiento sancionador ambiental en la zona sur, <a href="/abogados-en-choluteca">contáctenos</a> o <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogados-en-choluteca'
  },
  'conciliacion-arbitraje': {
    cta: `<p>Si su contrato tiene cláusula arbitral y necesita resolver un conflicto en la zona sur, <a href="/abogados-en-choluteca">podemos ayudarle</a> — <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/abogados-en-choluteca'
  },
  'regulacion-sanitaria': {
    cta: `<p>Si necesita registrar un producto en la ARSA o gestionar una habilitación sanitaria en Choluteca, <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/solicitar-consulta'
  },
  'derecho-notarial': {
    cta: `<p>Si necesita un poder notarial, escritura o cualquier trámite notarial en la zona sur, <a href="/tramites-legales-nacaome">visite nuestro bufete en Nacaome</a> o <a href="/solicitar-consulta">solicite una evaluación inicial</a>.</p>`,
    link: '/tramites-legales-nacaome'
  },
};

const POSTS_POR_CATEGORIA: Record<string, string[]> = {
  'derecho-penal': ['defensa-penal-honduras', 'delitos-mas-comunes-honduras', 'que-hacer-si-me-detienen-en-honduras', 'audiencia-inicial-proceso-penal-honduras', 'medidas-sustitutivas-prision-preventiva-honduras', 'derechos-detenido-honduras-guia-constitucional', 'violencia-domestica-ruta-legal-honduras', 'allanamiento-ilegal-violacion-domicilio-honduras', 'fianza-medidas-cautelares-proceso-penal-honduras', 'estafas-fraudes-tipos-penales-honduras', 'cuando-necesito-abogado-penalista-honduras', 'defensa-penal-menores-edad-honduras', 'antejuicio-en-honduras', 'diferencia-denuncia-querella-acusacion-honduras', 'cuando-prescribe-delito-en-honduras'],
  'derecho-de-familia': ['divorcio-honduras-guia-completa', 'pension-alimenticia-honduras-guia-completa', 'pension-alimenticia-honduras-como-solicitarla', 'custodia-hijos-honduras-juez', 'guarda-custodia-menores-tipos-honduras', 'union-de-hecho-requisitos-derechos-honduras', 'adopcion-requisitos-proceso-honduras', 'divorcio-honduras-pasos-requisitos'],
  'derecho-laboral': ['despido-laboral-honduras-guia-completa', 'derechos-laborales-basicos-honduras', 'calcular-prestaciones-laborales-honduras', 'jornada-laboral-horas-extra-descansos-honduras', 'riesgos-profesionales-accidentes-laborales-honduras', 'acoso-laboral-mobbing-honduras', 'derechos-trabajadora-embarazada-honduras', 'contratos-trabajo-tipos-clausulas-honduras', 'contratos-empleadas-domesticas-obligaciones-honduras', 'despido-injustificado-honduras-derechos-trabajador', 'empleador-no-paga-salario-honduras'],
  'derecho-civil': ['compraventa-inmuebles-aspectos-legales-honduras', 'errores-contratos-civiles-honduras', 'usucapion-prescripcion-adquisitiva-honduras', 'danos-perjuicios-indemnizacion-honduras', 'testamentos-sucesiones-herencia-honduras', 'prescripcion-deudas-plazos-honduras', 'reclamar-deuda-legalmente-honduras', 'clausulas-abusivas-contratos-como-detectar-honduras', 'contratos-arrendamiento-derechos-obligaciones-honduras', 'herencias-honduras-fallece-familiar'],
  'derecho-bancario': ['central-riesgos-honduras-consultar-impugnar', 'derechos-consumidor-financiero-honduras-cnbs', 'ejecucion-hipotecaria-honduras-que-hacer', 'tarjetas-credito-intereses-cargos-defensa-honduras', 'creditos-reestructuracion-deudas-bancarias-honduras', 'banco-demanda-deuda-defensa-opciones-honduras'],
  'derecho-mercantil': ['tipos-sociedad-mercantil-honduras', 'contratos-mercantiles-esenciales-empresas-honduras', 'contratos-mercantiles-proteger-negocio', 'competencia-desleal-como-denunciar-honduras', 'incumplimiento-contrato-comercial-honduras', 'contratos-franquicia-aspectos-legales-honduras', 'constitucion-empresas-honduras-pasos-legales', 'titulos-valores-cheques-sin-fondo-honduras'],
  'tributario': ['impuesto-renta-personas-fisicas-honduras', 'impuesto-renta-guia-personas-fisicas-honduras', 'facturacion-electronica-obligaciones-requisitos-sar-honduras', 'isv-impuesto-venta-tasas-obligaciones-honduras', 'impuestos-pequenas-empresas-guia-basica-honduras', 'devolucion-impuestos-como-solicitarla-honduras'],
  'derecho-aduanero': ['importar-mercancias-guia-legal-aduanera-honduras', 'codigo-aduanero-centroamericano-basico-honduras', 'importar-desde-china-guia-legal-aduanera-honduras', 'zonas-libres-zoli-beneficios-fiscales-honduras'],
  'derecho-administrativo': ['recurso-de-amparo-honduras-guia-completa', 'despido-empleados-publicos-honduras', 'contratacion-publica-licitaciones-empresas-honduras'],
  'conciliacion-arbitraje': ['arbitraje-honduras-guia-completa', 'mediacion-vs-juicio-que-conviene-mas-honduras'],
  'derecho-ambiental': ['evaluacion-impacto-ambiental-honduras', 'licencia-ambiental-categorias-plazos-honduras', 'delitos-ambientales-como-denunciarlos-honduras', 'derechos-indigenas-consulta-previa-honduras'],
};

const CATEGORY_LABELS: Record<string, string> = {
  'derecho-penal': 'Derecho Penal',
  'derecho-de-familia': 'Derecho de Familia',
  'derecho-laboral': 'Derecho Laboral',
  'derecho-civil': 'Derecho Civil',
  'derecho-bancario': 'Derecho Bancario',
  'derecho-mercantil': 'Derecho Mercantil',
  'tributario': 'Derecho Tributario',
  'derecho-aduanero': 'Derecho Aduanero',
  'derecho-administrativo': 'Derecho Administrativo',
  'conciliacion-arbitraje': 'Conciliación y Arbitraje',
  'derecho-ambiental': 'Derecho Ambiental',
  'derecho-notarial': 'Derecho Notarial',
  'regulacion-sanitaria': 'Regulación Sanitaria',
};

async function main() {
  console.log('=== Añadiendo CTAs locales y enlaces internos ===\n');
  let totalOk = 0;
  let totalErrors = 0;

  for (const [category, slugs] of Object.entries(POSTS_POR_CATEGORIA)) {
    const ctaInfo = CTAs[category];
    if (!ctaInfo) { console.log(`  ⚠ Sin CTA definido para ${category}, se usa genérico`); continue; }

    const label = CATEGORY_LABELS[category] ?? category;
    console.log(`\n📂 ${label} (${slugs.length} posts):`);

    for (const slug of slugs) {
      try {
        const [post] = await db.select({ id: blogPosts.id, body: blogPosts.body, title: blogPosts.title })
          .from(blogPosts).where(eq(blogPosts.slug, slug));

        if (!post) { console.log(`  ⚠ No encontrado: ${slug}`); continue; }

        // Avoid double-adding CTAs
        if (post.body.includes('zona sur') || post.body.includes('Choluteca') || post.body.includes('San Lorenzo') || post.body.includes('Nacaome')) {
          console.log(`  - ${slug} (ya tiene referencias locales)`);
          continue;
        }

        const ctaBlock = `<div style="margin-top:2em;padding:1.5em;border:1px solid #d4af37;border-radius:8px;background:#f9f8f5;"><p style="font-weight:700;font-size:1.1em;margin-bottom:0.5em;">¿Necesita ayuda legal en la zona sur de Honduras?</p>${ctaInfo.cta}</div>`;
        const newBody = post.body + '\n' + ctaBlock;

        await db.update(blogPosts).set({ body: newBody, updatedAt: new Date() }).where(eq(blogPosts.id, post.id));
        console.log(`  ✓ ${slug}`);
        totalOk++;
      } catch (err: any) {
        console.error(`  ✗ ${slug}: ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n=== FINAL ===`);
  console.log(`Posts actualizados: ${totalOk}`);
  console.log(`Errores: ${totalErrors}`);
}

main().catch(console.error);
