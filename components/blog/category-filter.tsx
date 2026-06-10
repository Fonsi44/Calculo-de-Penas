'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { blogCategories } from '@/data/blog/categories';
import { cn } from '@/lib/ui';

export function CategoryFilter() {
  const pathname = usePathname() ?? '';

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
      <div className="flex gap-2 pb-1 min-w-max">
        <Link
          href="/blog"
          className={cn(
            'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
            pathname === '/blog'
              ? 'bg-primary text-text-inverse'
              : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary border border-border/30',
          )}
        >
          Todos
        </Link>
        {blogCategories.map((cat) => {
          const href = `/blog/${cat.slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={cat.slug}
              href={href}
              className={cn(
                'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary text-text-inverse'
                  : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary border border-border/30',
              )}
            >
              {cat.nombre}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
