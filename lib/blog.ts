import type { Post } from '@/data/blog/types';
import { BLOG_METADATA_OVERRIDES } from '@/data/blog/blog-metadata-overrides';
import { getPublishedPosts, getPostBySlug as getPostBySlugDb, getBlogCategories } from '@/lib/blog-db';
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

export function getPostsByPage(posts: Post[], page: number, perPage: number): Post[] {
  const start = (page - 1) * perPage;
  return posts.slice(start, start + perPage);
}

export function getTotalPages(posts: Post[], perPage: number): number {
  return Math.max(1, Math.ceil(posts.length / perPage));
}

type PublicBlogPost = Awaited<ReturnType<typeof getPublishedPosts>>[number];

function mapToPost(p: PublicBlogPost): Post {
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
    legalReviewNotes: p.legalReviewNotes ?? undefined,
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
