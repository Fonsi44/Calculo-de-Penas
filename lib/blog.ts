import type { Post } from '@/data/blog/types';
import { blogCategories } from '@/data/blog/categories';
import { formatHondurasDate } from '@/lib/datetime';
import { getPublishedPosts, getPostBySlug as getPostBySlugDb, getBlogCategories } from '@/lib/blog-db';
import phase3Editorial from '@/data/seo/phase3-editorial-overrides.json';

const EDITORIAL_OVERRIDES: Record<string, { title: string; description: string }> = {
  'allanamiento-ilegal-violacion-domicilio-honduras': {
    title: 'Allanamiento en Honduras: Derechos y Qué Hacer',
    description: 'Cuándo puede realizarse un allanamiento en Honduras, qué debe contener la orden judicial y cómo actuar sin obstaculizar a la autoridad.',
  },
  'contratos-franquicia-aspectos': {
    title: 'Contrato de franquicia en Honduras: cláusulas y riesgos',
    description: 'Cláusulas que conviene revisar en un contrato de franquicia en Honduras: territorio, regalías, uso de marca, terminación y solución de conflictos.',
  },
  'guia-aduanera-importaciones-honduras': {
    title: 'Cómo Importar a Honduras: Requisitos y Documentos',
    description: 'Documentos, clasificación arancelaria, tributos y etapas generales del despacho para importar mercancías legalmente en Honduras.',
  },
  'usucapion-prescripcion-adquisitiva-honduras': {
    title: 'Usucapión en Honduras: requisitos y proceso judicial',
    description: 'Qué es la prescripción adquisitiva, qué elementos deben acreditarse y cómo se tramita judicialmente una pretensión de usucapión en Honduras.',
  },
  'abogados-en-nacaome': {
    title: 'Cómo Elegir Abogado en Nacaome: 10 Criterios antes de Contratar',
    description: 'Criterios prácticos para elegir abogado en Nacaome: especialidad, honorarios, comunicación y experiencia antes de contratar servicios jurídicos en Valle.',
  },
  'abogados-en-pespire-choluteca': {
    title: 'Abogados en Pespire, Honduras: orientación legal para su caso',
    description: 'Asesoría jurídica para personas, familias y empresas de Pespire y la zona sur de Honduras, con atención desde Nacaome y presupuesto por escrito.',
  },
  'audiencia-inicial-proceso-penal-honduras': {
    title: 'Audiencia inicial en Honduras: proceso y preparación',
    description: 'Explicación general de la audiencia inicial, la importancia de la defensa técnica y la documentación que conviene organizar con antelación.',
  },
  'cuando-necesito-abogado-penalista-honduras': {
    title: '¿Cuándo necesita un abogado penalista en Honduras?',
    description: 'Situaciones en las que conviene buscar defensa penal temprana, qué información preparar y cómo se desarrolla una primera consulta.',
  },
  'cuando-prescribe-delito-en-honduras': {
    title: 'Prescripción Penal en Honduras: Plazos y Cálculo',
    description: 'Cómo se determina la prescripción penal en Honduras según la pena, el delito y los actos que pueden interrumpir o suspender el cómputo.',
  },
  'custodia-hijos-honduras-juez': {
    title: 'Custodia de Hijos en Honduras: Criterios del Juez',
    description: 'Criterios que el juez evalúa en procesos de custodia en Honduras: interés superior del menor, capacidad parental y régimen de visitas.',
  },
  'danos-perjuicios-indemnizacion-honduras': {
    title: 'Daños y Perjuicios en Honduras: Cómo Reclamar',
    description: 'Requisitos y pasos para reclamar daños y perjuicios en Honduras: tipos de indemnización, plazos, documentos y procedimiento judicial.',
  },
  'defensa-penal-honduras': {
    title: 'Defensa penal en Honduras: guía de las primeras actuaciones',
    description: 'Orientación general ante una detención, citación o investigación penal y sobre la importancia de recibir asesoría jurídica desde el inicio.',
  },
  'despido-laboral-honduras-guia-completa': {
    title: 'Despido Injustificado en Honduras: Prestaciones y Plazos',
    description: 'Prestaciones y plazos ante un despido injustificado en Honduras. Revisión de documentos, cálculo de liquidación y opciones de reclamación laboral.',
  },
  'estafas-fraudes-tipos-penales-honduras': {
    title: 'Estafa en Honduras: Tipos, Denuncia y Defensa',
    description: 'Tipos de estafa según el Código Penal de Honduras, cómo denunciar y cuándo buscar defensa legal ante acusaciones por fraude.',
  },
  'herencias-honduras-fallece-familiar': {
    title: 'Herencias en Honduras: Testamento y Sucesión',
    description: 'Pasos para ordenar una herencia en Honduras: testamentos, sucesión intestada, documentos necesarios y diferencias entre vía notarial y judicial.',
  },
  'testamentos-sucesiones-herencia-honduras': {
    title: 'Herencias en Honduras: Testamento y Sucesión',
    description: 'Cómo se tramita una herencia en Honduras, qué cambia si existe testamento y qué documentos conviene reunir antes de iniciar la sucesión.',
  },
  'jornada-laboral-horas-extra-descansos-honduras': {
    title: 'Jornada Laboral en Honduras: Horas Extra y Recargos',
    description: 'Límites de la jornada laboral en Honduras, horas extra, recargos, descansos obligatorios y derechos del trabajador según el Código de Trabajo.',
  },
  'pension-alimenticia-honduras-guia-completa': {
    title: 'Pensión Alimenticia en Honduras: Requisitos y Pasos',
    description: 'Requisitos y procedimiento para solicitar pensión alimenticia en Honduras. Montos, plazos, documentos y ejecución ante incumplimiento.',
  },
  'poder-legal-honduras-cuando-se-necesita': {
    title: 'Poder notarial en Honduras: tipos, alcance y requisitos',
    description: 'Qué es un poder notarial, para qué trámites puede utilizarse y qué conviene revisar antes de otorgarlo dentro o fuera de Honduras.',
  },
  'proteccion-datos-personales-derechos-arco-honduras': {
    title: 'Derechos ARCO en Honduras: Cómo Ejercerlos',
    description: 'Derechos de acceso, rectificación, cancelación y oposición (ARCO) en Honduras. Cómo solicitar información y proteger sus datos personales.',
  },
  'que-hacer-si-me-detienen-en-honduras': {
    title: '¿Qué hacer si me detienen en Honduras? Guía práctica',
    description: 'Recomendaciones generales para actuar con prudencia ante una detención y solicitar asistencia jurídica sin interferir con la actuación de la autoridad.',
  },
  'union-de-hecho-requisitos-derechos-honduras': {
    title: 'Unión de Hecho en Honduras: Requisitos y Derechos',
    description: 'Requisitos para el reconocimiento de la unión de hecho en Honduras, derechos patrimoniales y sucesorios, y diferencias con el matrimonio.',
  },
};

const COVERS_PENDING_LOCAL_REPLACEMENT = new Set([
  'que-hacer-si-me-detienen-en-honduras',
  'derechos-del-detenido-guia-constitucional-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'medidas-sustitutivas-prision-preventiva-honduras',
]);

function cleanPlaceholderLinks(html: string): string {
  return html.replace(
    /<a\b[^>]*href=["']https?:\/\/(?:www\.)?(?:ejemplo\.com|tuabogado\.com)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    '$1',
  );
}

type Phase3Override = {
  title: string;
  metaDescription: string;
  directAnswer: string;
  body?: string;
  author: string | null;
  sources: Array<{ title: string; url: string; sections: string }>;
  related: Array<{ title: string; href: string }>;
};

function applyDocumentaryReview(html: string, editorial?: Phase3Override): string {
  if (!editorial || html.includes('data-phase3-documentary-review')) return html;
  const sources = editorial.sources.map((source) =>
    `<li><a href="${source.url}" rel="noopener noreferrer">${source.title}</a> — ${source.sections}</li>`,
  ).join('');
  const related = editorial.related.map((item) =>
    `<li><a href="${item.href}">${item.title}</a></li>`,
  ).join('');
  return [
    html.includes('data-phase3-article-specific') ? '' : [
      '<section data-phase3-documentary-review="true">',
      '<h2>Respuesta breve</h2>',
      `<p>${editorial.directAnswer}</p>`,
      '</section>',
    ].join(''),
    html,
    '<section data-phase3-documentary-review="true">',
    '<h2>Fuentes jurídicas consultadas</h2>',
    `<ul>${sources}</ul>`,
    '<h2>Artículos relacionados</h2>',
    `<ul>${related}</ul>`,
    '</section>',
  ].join('');
}

function polishedExcerpt(value: string): string {
  const text = value.trim();
  if (!text || /[.!?…:]$/.test(text)) return text;
  return `${text}…`;
}

function polishedTitle(value: string): string {
  // Plan maestro SEO/GEO §8.2 y §10: prohibido publicar titles incompletos,
  // cortados artificialmente o terminados en preposición con elipsis. Antes
  // este helper añadía "…" a títulos terminados en preposición, generando
  // exactly los titles rotos que el plan denuncia (p. ej.
  // "Abogados en Nacaome, Valle: 15 Años de…"). Ahora se devuelve el título
  // sin alterar: la corrección real vive en EDITORIAL_OVERRIDES y en la
  // reescritura de los artículos (Fase 4, con revisión jurídica humana).
  // No recortar por caracteres (tampoco): se conservaría una frase incompleta.
  return value.trim();
}

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.map(mapToPost);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const post = await getPostBySlugDb(slug);
  return post ? mapToPost(post) : undefined;
}

export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const posts = await getPublishedPosts({ category: categorySlug });
  return posts.map(mapToPost);
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getPublishedPosts({ featured: true });
  return posts.map(mapToPost);
}

export async function getRecentPosts(count?: number): Promise<Post[]> {
  const posts = await getPublishedPosts({ limit: count });
  return posts.map(mapToPost);
}

export async function getAllCategorySlugs(): Promise<string[]> {
  return getBlogCategories();
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getPublishedPosts();
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter(p => (p.tags ?? []).includes(tag)).map(mapToPost);
}

export function getCategoryName(slug: string): string | undefined {
  return blogCategories.find((c) => c.slug === slug)?.nombre;
}

export function getCategoryDescription(slug: string): string | undefined {
  return blogCategories.find((c) => c.slug === slug)?.descripcion;
}

export function formatDate(dateString: string): string {
  return formatHondurasDate(dateString, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  return formatHondurasDate(dateString, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function getPostsByPage(posts: Post[], page: number, perPage: number): Post[] {
  const start = (page - 1) * perPage;
  return posts.slice(start, start + perPage);
}

export function getTotalPages(posts: Post[], perPage: number): number {
  return Math.max(1, Math.ceil(posts.length / perPage));
}

type PublicBlogPost = Awaited<ReturnType<typeof getPublishedPosts>>[number];

function mapToPost(p: PublicBlogPost): Post {
  const editorial = EDITORIAL_OVERRIDES[p.slug];
  const documentary = phase3Editorial.status === 'INVALID_GENERIC_SCAFFOLD_DO_NOT_APPLY'
    ? undefined
    : phase3Editorial.overrides[p.slug as keyof typeof phase3Editorial.overrides] as Phase3Override | undefined;
  const title = documentary?.title ?? editorial?.title ?? polishedTitle(p.title);
  const description = documentary?.metaDescription ?? editorial?.description ?? polishedExcerpt(p.description);
  return {
    slug: p.slug, title, description, body: applyDocumentaryReview(
      cleanPlaceholderLinks(documentary?.body ?? p.body),
      documentary,
    ),
    publishedAt: p.publishedAt.toISOString(), category: p.category,
    tags: p.tags ?? [], author: documentary?.author ?? p.author ?? '', readingTime: p.readingTime ?? '',
    coverImage: COVERS_PENDING_LOCAL_REPLACEMENT.has(p.slug) ? undefined : p.coverImage ?? undefined,
    featured: p.featured ?? false,
    updatedAt: p.updatedAt?.toISOString(),

    metaTitle: documentary?.title ?? editorial?.title ?? p.metaTitle ?? undefined,
    metaDescription: documentary?.metaDescription ?? editorial?.description ?? p.metaDescription ?? undefined,
    ogImage: p.ogImage ?? undefined,
    noindex: p.noindex ?? undefined,
    canonicalUrl: p.slug === 'abogados-en-nacaome'
      ? `/blog/${p.category}/${p.slug}`
      : p.canonicalUrl ?? undefined,
    authorId: p.authorId ?? undefined,
    reviewStatus: p.reviewStatus ?? undefined,
    reviewedBy: p.reviewedBy ?? undefined,
    reviewedAt: p.reviewedAt?.toISOString() ?? undefined,
    legalReviewNotes: p.legalReviewNotes ?? undefined,
    // El workflow IA es operativo y no forma parte del contrato de lectura
    // público. Los avisos verificables se habilitan cuando esos datos se
    // incorporen a una vista estable, no mediante SELECT * sobre la tabla.
    aiReviewStatus: undefined,
    aiReviewedAt: undefined,
    lastReviewedAt: p.lastReviewedAt?.toISOString() ?? undefined,
    nextReviewDueAt: p.nextReviewDueAt?.toISOString() ?? undefined,
  };
}
