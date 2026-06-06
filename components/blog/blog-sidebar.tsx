import Link from 'next/link';
import { blogCategories } from '@/data/blog/categories';
import { getAllTags, getRecentPosts, formatDateShort } from '@/lib/blog';

export function BlogSidebar() {
  const recentPosts = getRecentPosts(5);
  const allTags = getAllTags();

  return (
    <aside className="space-y-8">
      <div>
        <h3 className="font-bold text-body text-text mb-4">Categorías</h3>
        <ul className="space-y-1">
          {blogCategories.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/blog/categoria/${cat.slug}`}
                className="block px-3 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-alt hover:text-primary transition-colors"
              >
                {cat.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {recentPosts.length > 0 && (
        <div>
          <h3 className="font-bold text-body text-text mb-4">Artículos recientes</h3>
          <ul className="space-y-3">
            {recentPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block group"
                >
                  <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors leading-snug">
                    {p.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDateShort(p.publishedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allTags.length > 0 && (
        <div>
          <h3 className="font-bold text-body text-text mb-4">Etiquetas</h3>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2.5 py-1 rounded-full bg-surface-alt text-xs text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
