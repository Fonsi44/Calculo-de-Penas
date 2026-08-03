import { blogCategories } from '@/data/blog/categories';
import { formatHondurasDate } from '@/lib/datetime';

export function getCategoryName(slug: string): string | undefined {
  return blogCategories.find((category) => category.slug === slug)?.nombre;
}

export function formatDate(dateString: string): string {
  return formatHondurasDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
