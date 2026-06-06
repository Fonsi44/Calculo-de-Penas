import type { Post } from '@/data/blog/types';
import { blogCategories } from '@/data/blog/categories';
import { posts as allPosts } from '@/data/blog/posts';
import { formatHondurasDate } from '@/lib/datetime';

export function getAllPosts(): Post[] {
  return allPosts;
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByCategory(categorySlug: string): Post[] {
  return getAllPosts().filter((p) => p.category === categorySlug);
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getFeaturedPosts(): Post[] {
  return getAllPosts().filter((p) => p.featured);
}

export function getRecentPosts(count?: number): Post[] {
  const posts = getAllPosts();
  return posts.slice(0, count ?? posts.length);
}

export function getCategoryName(slug: string): string | undefined {
  return blogCategories.find((c) => c.slug === slug)?.nombre;
}

export function getCategoryDescription(slug: string): string | undefined {
  return blogCategories.find((c) => c.slug === slug)?.descripcion;
}

export function getAllCategorySlugs(): string[] {
  return blogCategories.map((c) => c.slug);
}

export function formatDate(dateString: string): string {
  return formatHondurasDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  return formatHondurasDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

export function getPostsByPage(posts: Post[], page: number, perPage: number): Post[] {
  const start = (page - 1) * perPage;
  return posts.slice(start, start + perPage);
}

export function getTotalPages(posts: Post[], perPage: number): number {
  return Math.max(1, Math.ceil(posts.length / perPage));
}
