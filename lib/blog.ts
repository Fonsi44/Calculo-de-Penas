import type { Post } from '@/data/blog/types';
import { blogCategories } from '@/data/blog/categories';
import { formatHondurasDate } from '@/lib/datetime';
import type { BlogPost } from '@/lib/schema';
import { getPublishedPosts, getPostBySlug as getPostBySlugDb, getBlogCategories } from '@/lib/blog-db';

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
  return {
    slug: p.slug, title: p.title, description: p.description, body: p.body,
    publishedAt: p.publishedAt.toISOString(), category: p.category,
    tags: p.tags ?? [], author: p.author ?? '', readingTime: p.readingTime ?? '',
    coverImage: p.coverImage ?? undefined,
    featured: p.featured ?? false,
    updatedAt: p.updatedAt?.toISOString(),
  };
}
