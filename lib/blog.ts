import { cache } from 'react';
import type { BlogPostSummary, Post } from '@/data/blog/types';
import { BLOG_METADATA_OVERRIDES } from '@/data/blog/blog-metadata-overrides';
import {
  getPublishedPostDetailBySlug,
  getPublishedPostParams,
  getPublishedPostSummaries,
  getBlogCategories,
} from '@/lib/blog-db';
export {
  formatDate,
  getCategoryName,
} from '@/lib/blog-format';

const COVERS_PENDING_LOCAL_REPLACEMENT = new Set([
  'que-hacer-si-me-detienen-en-honduras',
  'derechos-del-detenido-guia-constitucional-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'medidas-sustitutivas-prision-preventiva-honduras',
]);

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
  // sin alterar: cualquier excepción visible vive en la fuente tipada y
  // exclusiva BLOG_METADATA_OVERRIDES, nunca en el body persistido.
  // No recortar por caracteres (tampoco): se conservaría una frase incompleta.
  return value.trim();
}

async function loadAllPostSummaries(): Promise<BlogPostSummary[]> {
  const posts = await getPublishedPostSummaries();
  return posts.map(mapToSummary);
}

async function loadPostDetail(slug: string): Promise<Post | undefined> {
  const post = await getPublishedPostDetailBySlug(slug);
  return post ? mapToDetail(post) : undefined;
}

type BlogReadDependencies = {
  detail: (slug: string) => Promise<Post | undefined>;
  summaries: () => Promise<BlogPostSummary[]>;
};

/**
 * Fábrica instrumentable del contrato request-scoped. Producción usa
 * `cache()` de React; los tests inyectan un wrapper equivalente y contadores.
 */
export function createBlogReadLoaders(
  cacheFn: typeof cache = cache,
  dependencies: BlogReadDependencies = {
    detail: loadPostDetail,
    summaries: loadAllPostSummaries,
  },
) {
  return {
    getPostBySlug: cacheFn(dependencies.detail),
    getAllPosts: cacheFn(dependencies.summaries),
  };
}

const requestScopedLoaders = createBlogReadLoaders();

/** Inventario summary deduplicado por React dentro del render/build actual. */
export const getAllPosts = requestScopedLoaders.getAllPosts;

/** Metadata y página comparten exactamente este loader request-scoped. */
export const getPostBySlug = requestScopedLoaders.getPostBySlug;

export const getPostsByCategory = cache(async (
  categorySlug: string,
): Promise<BlogPostSummary[]> => {
  const posts = await getPublishedPostSummaries({ category: categorySlug });
  return posts.map(mapToSummary);
});

/** Bloques relacionados en hubs: si la DB no está, la página sigue renderizando. */
export async function getPostsByCategoryOrEmpty(
  categorySlug: string,
): Promise<BlogPostSummary[]> {
  try {
    return await getPostsByCategory(categorySlug);
  } catch (err) {
    console.warn('[blog] getPostsByCategory degradado sin tumbar la página.', {
      categorySlug,
      error: err instanceof Error ? err.message : 'error desconocido',
    });
    return [];
  }
}

export const getFeaturedPosts = cache(async (): Promise<BlogPostSummary[]> => {
  const posts = await getPublishedPostSummaries({ featured: true });
  return posts.map(mapToSummary);
});

export const getRecentPosts = cache(async (
  count?: number,
): Promise<BlogPostSummary[]> => {
  const posts = await getPublishedPostSummaries({ limit: count });
  return posts.map(mapToSummary);
});

export const getAllPostParams = cache(getPublishedPostParams);

export async function getAllCategorySlugs(): Promise<string[]> {
  return getBlogCategories();
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

export async function getPostsByTag(tag: string): Promise<BlogPostSummary[]> {
  const posts = await getAllPosts();
  return posts.filter(p => (p.tags ?? []).includes(tag));
}

export function getPostsByPage<T>(
  posts: readonly T[],
  page: number,
  perPage: number,
): T[] {
  const start = (page - 1) * perPage;
  return posts.slice(start, start + perPage);
}

export function getTotalPages(posts: readonly unknown[], perPage: number): number {
  return Math.max(1, Math.ceil(posts.length / perPage));
}

type PublicBlogPostDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedPostDetailBySlug>>
>;
type PublicBlogPostSummaryRow = Awaited<
  ReturnType<typeof getPublishedPostSummaries>
>[number];

function mapToSummary(p: PublicBlogPostSummaryRow): BlogPostSummary {
  const editorial = BLOG_METADATA_OVERRIDES[p.slug];
  return {
    slug: p.slug,
    title: editorial?.title ?? polishedTitle(p.title),
    description: editorial?.description ?? polishedExcerpt(p.description),
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
    category: p.category,
    tags: p.tags ?? [],
    author: p.author ?? '',
    readingTime: p.readingTime ?? '',
    coverImage: COVERS_PENDING_LOCAL_REPLACEMENT.has(p.slug)
      ? undefined
      : p.coverImage ?? undefined,
    featured: p.featured ?? false,
    noindex: p.noindex ?? undefined,
    canonicalUrl: p.slug === 'abogados-en-nacaome'
      ? `/blog/${p.category}/${p.slug}`
      : p.canonicalUrl ?? undefined,
    editoriallyIndexable: p.editoriallyIndexable,
  };
}

function mapToDetail(p: PublicBlogPostDetail): Post {
  const editorial = BLOG_METADATA_OVERRIDES[p.slug];
  const title = editorial?.title ?? polishedTitle(p.title);
  const description = editorial?.description ?? polishedExcerpt(p.description);
  return {
    slug: p.slug, title, description, body: p.body,
    publishedAt: p.publishedAt.toISOString(), category: p.category,
    tags: p.tags ?? [], author: p.author ?? '', readingTime: p.readingTime ?? '',
    coverImage: COVERS_PENDING_LOCAL_REPLACEMENT.has(p.slug) ? undefined : p.coverImage ?? undefined,
    featured: p.featured ?? false,
    updatedAt: p.updatedAt?.toISOString(),

    metaTitle: editorial?.metaTitle ?? editorial?.title ?? p.metaTitle ?? undefined,
    metaDescription:
      editorial?.metaDescription ?? editorial?.description ?? p.metaDescription ?? undefined,
    ogImage: p.ogImage ?? undefined,
    noindex: p.noindex ?? undefined,
    canonicalUrl: p.slug === 'abogados-en-nacaome'
      ? `/blog/${p.category}/${p.slug}`
      : p.canonicalUrl ?? undefined,
    authorId: p.authorId ?? undefined,
    reviewStatus: p.reviewStatus ?? undefined,
    reviewedBy: p.reviewedBy ?? undefined,
    reviewedAt: p.reviewedAt?.toISOString() ?? undefined,
    reviewOrigin: p.reviewOrigin ?? undefined,
    signatureType: p.signatureType ?? undefined,
    signatureName: p.signatureName ?? undefined,
    signatureCandidate: p.signatureCandidate ?? undefined,
    reviewedContentHash: p.reviewedContentHash ?? undefined,
    signatureValid: p.signatureValid ?? undefined,
    // El workflow IA es operativo y no forma parte del contrato de lectura
    // público. Los avisos verificables se habilitan cuando esos datos se
    // incorporen a una vista estable, no mediante SELECT * sobre la tabla.
    aiReviewStatus: undefined,
    aiReviewedAt: undefined,
    lastReviewedAt: p.lastReviewedAt?.toISOString() ?? undefined,
    nextReviewDueAt: p.nextReviewDueAt?.toISOString() ?? undefined,
  };
}

export function getRelatedPostsFromSummaries(
  summaries: readonly BlogPostSummary[],
  slug: string,
  category: string,
  tags: readonly string[],
  limit = 3,
): BlogPostSummary[] {
  return summaries
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const tagOverlap = post.tags.filter((tag) => tags.includes(tag)).length;
      return {
        post,
        tagOverlap,
        score: (post.category === category ? 3 : 0) + tagOverlap,
      };
    })
    .filter(({ tagOverlap }) => tagOverlap >= 1)
    .sort((a, b) => (
      b.score - a.score
      || new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime()
      || a.post.slug.localeCompare(b.post.slug)
    ))
    .slice(0, limit)
    .map(({ post }) => post);
}
