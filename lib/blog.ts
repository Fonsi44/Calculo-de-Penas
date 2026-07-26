import type { Post } from '@/data/blog/types';
import { blogCategories } from '@/data/blog/categories';
import { formatHondurasDate } from '@/lib/datetime';
import type { BlogPost } from '@/lib/schema';
import { getPublishedPosts, getPostBySlug as getPostBySlugDb, getBlogCategories } from '@/lib/blog-db';

const EDITORIAL_OVERRIDES: Record<string, { title: string; description: string }> = {
  'abogados-en-pespire-choluteca': {
    title: 'Abogados en Pespire, Honduras: orientación legal para su caso',
    description: 'Asesoría jurídica para personas, familias y empresas de Pespire y la zona sur de Honduras, con atención desde Nacaome y presupuesto por escrito.',
  },
  'cuando-necesito-abogado-penalista-honduras': {
    title: '¿Cuándo necesita un abogado penalista en Honduras?',
    description: 'Situaciones en las que conviene buscar defensa penal temprana, qué información preparar y cómo se desarrolla una primera consulta.',
  },
  'audiencia-inicial-proceso-penal-honduras': {
    title: 'Audiencia inicial en Honduras: proceso y preparación',
    description: 'Explicación general de la audiencia inicial, la importancia de la defensa técnica y la documentación que conviene organizar con antelación.',
  },
  'defensa-penal-honduras': {
    title: 'Defensa penal en Honduras: guía de las primeras actuaciones',
    description: 'Orientación general ante una detención, citación o investigación penal y sobre la importancia de recibir asesoría jurídica desde el inicio.',
  },
  'herencias-honduras-fallece-familiar': {
    title: 'Herencias en Honduras: guía paso a paso',
    description: 'Pasos generales para ordenar una sucesión, identificar documentos y determinar si el trámite corresponde a la vía notarial o judicial.',
  },
  'que-hacer-si-me-detienen-en-honduras': {
    title: '¿Qué hacer si me detienen en Honduras? Guía práctica',
    description: 'Recomendaciones generales para actuar con prudencia ante una detención y solicitar asistencia jurídica sin interferir con la actuación de la autoridad.',
  },
  'poder-legal-honduras-cuando-se-necesita': {
    title: 'Poder notarial en Honduras: tipos, alcance y requisitos',
    description: 'Qué es un poder notarial, para qué trámites puede utilizarse y qué conviene revisar antes de otorgarlo dentro o fuera de Honduras.',
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

function polishedExcerpt(value: string): string {
  const text = value.trim();
  if (!text || /[.!?…:]$/.test(text)) return text;
  return `${text}…`;
}

function polishedTitle(value: string): string {
  const text = value.trim();
  return /\b(?:en|de|del|la|las|los|y|para|por)$/i.test(text) ? `${text}…` : text;
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

function mapToPost(p: BlogPost): Post {
  const editorial = EDITORIAL_OVERRIDES[p.slug];
  const title = editorial?.title ?? polishedTitle(p.title);
  const description = editorial?.description ?? polishedExcerpt(p.description);
  return {
    slug: p.slug, title, description, body: cleanPlaceholderLinks(p.body),
    publishedAt: p.publishedAt.toISOString(), category: p.category,
    tags: p.tags ?? [], author: p.author ?? '', readingTime: p.readingTime ?? '',
    coverImage: COVERS_PENDING_LOCAL_REPLACEMENT.has(p.slug) ? undefined : p.coverImage ?? undefined,
    featured: p.featured ?? false,
    updatedAt: p.updatedAt?.toISOString(),

    metaTitle: editorial?.title ?? p.metaTitle ?? undefined,
    metaDescription: editorial?.description ?? p.metaDescription ?? undefined,
    ogImage: p.ogImage ?? undefined,
    noindex: p.noindex ?? undefined,
    canonicalUrl: p.canonicalUrl ?? undefined,
    authorId: p.authorId ?? undefined,
    reviewStatus: p.reviewStatus ?? undefined,
    reviewedBy: p.reviewedBy ?? undefined,
    reviewedAt: p.reviewedAt?.toISOString() ?? undefined,
    legalReviewNotes: p.legalReviewNotes ?? undefined,
    aiReviewStatus: p.aiReviewStatus ?? undefined,
    aiReviewedAt: p.aiReviewedAt,
    lastReviewedAt: p.lastReviewedAt?.toISOString() ?? undefined,
    nextReviewDueAt: p.nextReviewDueAt?.toISOString() ?? undefined,
  };
}
