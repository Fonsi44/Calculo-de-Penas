import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { inArray } from 'drizzle-orm';
import 'dotenv/config';

const SLUGS = [
  'pension-alimenticia-porcentaje-honduras-2026',
  'pension-alimenticia-honduras-guia-completa',
  'prescripcion-deudas-plazos-honduras',
  'danos-perjuicios-indemnizacion-honduras',
  'poder-legal-honduras-cuando-se-necesita',
  'custodia-hijos-honduras-juez',
  'divorcio-honduras-guia-completa',
];

interface LinkSuggestion {
  fromSlug: string;
  toSlug: string;
  targetUrl: string;
  anchor: string;
  context: string;
}

async function main() {
  const posts = await db.select({
    slug: blogPosts.slug,
    title: blogPosts.title,
    description: blogPosts.description,
    body: blogPosts.body,
    metaTitle: blogPosts.metaTitle,
  }).from(blogPosts).where(inArray(blogPosts.slug, SLUGS));

  console.log('=== AUDITORÍA DE ENLACES INTERNOS (contenido Neon) ===\n');

  for (const post of posts) {
    const body = post.body || '';
    const relativeLinks = body.match(/href="\/(?!\/)[^"]*"/g) || [];
    const serviceLinks = relativeLinks.filter(l => l.includes('/servicios-juridicos/') || l.includes('/derecho-'));
    const blogLinks = relativeLinks.filter(l => l.includes('/blog/'));

    console.log(`--- ${post.slug} ---`);
    console.log(`Título: ${post.title}`);
    console.log(`Cuerpo: ${body.length} caracteres`);
    console.log(`Enlaces a servicios: ${serviceLinks.length}`);
    console.log(`Enlaces a otros posts: ${blogLinks.length}`);
    
    if (blogLinks.length > 0) {
      console.log('Enlaces a blog:');
      for (const link of blogLinks) {
        const url = link.replace(/href="/, '').replace(/"$/, '');
        const targetPost = SLUGS.find(s => url.includes(s));
        console.log(`  → ${url}${targetPost ? ' (DENTRO del grupo prioritario)' : ''}`);
      }
    }
    console.log('');
  }

  // Plan de enlaces
  console.log('=== PLAN DE ENLACES A IMPLEMENTAR ===\n');

  const suggestions: LinkSuggestion[] = [
    {
      fromSlug: 'pension-alimenticia-porcentaje-honduras-2026',
      toSlug: 'pension-alimenticia-honduras-guia-completa',
      targetUrl: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa',
      anchor: 'cómo solicitar y demandar la pensión alimenticia',
      context: 'al explicar el proceso legal para fijar el porcentaje',
    },
    {
      fromSlug: 'pension-alimenticia-porcentaje-honduras-2026',
      toSlug: 'servicio-derecho-familia',
      targetUrl: '/servicios-juridicos/derecho-de-familia',
      anchor: 'servicios de derecho de familia',
      context: 'al mencionar la asesoría legal disponible',
    },
    {
      fromSlug: 'pension-alimenticia-honduras-guia-completa',
      toSlug: 'pension-alimenticia-porcentaje-honduras-2026',
      targetUrl: '/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026',
      anchor: 'porcentajes y cálculo de la pensión alimenticia',
      context: 'al mencionar los montos según el número de hijos',
    },
    {
      fromSlug: 'pension-alimenticia-honduras-guia-completa',
      toSlug: 'servicio-derecho-familia',
      targetUrl: '/servicios-juridicos/derecho-de-familia',
      anchor: 'abogado especialista en derecho de familia',
      context: 'al ofrecer representación legal',
    },
    {
      fromSlug: 'prescripcion-deudas-plazos-honduras',
      toSlug: 'danos-perjuicios-indemnizacion-honduras',
      targetUrl: '/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras',
      anchor: 'daños y perjuicios',
      context: 'al mencionar reclamaciones civiles relacionadas',
    },
    {
      fromSlug: 'prescripcion-deudas-plazos-honduras',
      toSlug: 'servicio-derecho-civil',
      targetUrl: '/servicios-juridicos/derecho-civil-y-notarial',
      anchor: 'servicios de derecho civil y notarial',
      context: 'al ofrecer asesoría legal especializada',
    },
    {
      fromSlug: 'danos-perjuicios-indemnizacion-honduras',
      toSlug: 'prescripcion-deudas-plazos-honduras',
      targetUrl: '/blog/derecho-civil/prescripcion-deudas-plazos-honduras',
      anchor: 'prescripción de deudas',
      context: 'al mencionar plazos legales para reclamar',
    },
    {
      fromSlug: 'danos-perjuicios-indemnizacion-honduras',
      toSlug: 'servicio-derecho-civil',
      targetUrl: '/servicios-juridicos/derecho-civil-y-notarial',
      anchor: 'abogado especialista en derecho civil',
      context: 'al ofrecer representación en demandas civiles',
    },
    {
      fromSlug: 'poder-legal-honduras-cuando-se-necesita',
      toSlug: 'servicio-derecho-civil',
      targetUrl: '/servicios-juridicos/derecho-civil-y-notarial',
      anchor: 'servicios notariales y derecho civil',
      context: 'al explicar los trámites notariales',
    },
    {
      fromSlug: 'custodia-hijos-honduras-juez',
      toSlug: 'divorcio-honduras-guia-completa',
      targetUrl: '/blog/derecho-de-familia/divorcio-honduras-guia-completa',
      anchor: 'proceso de divorcio en Honduras',
      context: 'al mencionar la separación de los padres',
    },
    {
      fromSlug: 'custodia-hijos-honduras-juez',
      toSlug: 'servicio-derecho-familia',
      targetUrl: '/servicios-juridicos/derecho-de-familia',
      anchor: 'abogado de derecho de familia',
      context: 'al ofrecer representación en casos de custodia',
    },
    {
      fromSlug: 'divorcio-honduras-guia-completa',
      toSlug: 'custodia-hijos-honduras-juez',
      targetUrl: '/blog/derecho-de-familia/custodia-hijos-honduras-juez',
      anchor: 'custodia de hijos en Honduras',
      context: 'al mencionar los hijos en el proceso de divorcio',
    },
    {
      fromSlug: 'divorcio-honduras-guia-completa',
      toSlug: 'pension-alimenticia-honduras-guia-completa',
      targetUrl: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa',
      anchor: 'pensión alimenticia',
      context: 'al mencionar obligaciones económicas entre cónyuges o hijos',
    },
    {
      fromSlug: 'divorcio-honduras-guia-completa',
      toSlug: 'servicio-derecho-familia',
      targetUrl: '/servicios-juridicos/derecho-de-familia',
      anchor: 'servicios de derecho de familia',
      context: 'al ofrecer asesoría legal en materia familiar',
    },
  ];

  for (const s of suggestions) {
    const fromPost = posts.find(p => p.slug === s.fromSlug);
    const alreadyHasLink = fromPost?.body?.includes(s.targetUrl);
    console.log(
      `${alreadyHasLink ? 'EXISTE' : 'PENDIENTE'} | ${s.fromSlug} → ${s.toSlug}` +
      ` | anchor: "${s.anchor}"` +
      `${alreadyHasLink ? '' : ' | contexto: ' + s.context}`
    );
  }
}

main().catch(e => { console.error(e); process.exit(1); });
