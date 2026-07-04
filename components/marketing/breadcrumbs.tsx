import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { site } from '@/lib/site';

export type CrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: CrumbItem[];
  className?: string;
};

/**
 * Breadcrumbs reutilizables con schema.org BreadcrumbList integrado.
 *
 * Uso:
 *   <Breadcrumbs items={[
 *     { label: 'Inicio', href: '/' },
 *     { label: 'Servicios Jurídicos', href: '/servicios-juridicos' },
 *     { label: 'Derecho de Familia' },
 *   ]} />
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${site.url}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1.5 text-xs text-text-muted py-3 ${className}`}
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight size={12} className="flex-shrink-0" />}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-text-secondary truncate" aria-current="page">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
