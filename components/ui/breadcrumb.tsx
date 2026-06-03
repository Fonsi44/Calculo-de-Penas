import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Migas de pan" className={className}>
      <ol className="flex items-center gap-1 text-xs">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={i}>
              {i === 0 && item.label === 'Inicio' ? (
                <li className="flex items-center">
                  {item.href ? (
                    <Link href={item.href} className="text-text-secondary hover:text-text inline-flex items-center gap-1">
                      <Home size={12} />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  ) : (
                    <Home size={12} className="text-text-muted" />
                  )}
                </li>
              ) : (
                <li className="flex items-center gap-1">
                  {item.href && !last ? (
                    <Link href={item.href} className="text-text-secondary hover:text-text">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={last ? 'text-text font-semibold' : 'text-text-secondary'}>
                      {item.label}
                    </span>
                  )}
                </li>
              )}
              {!last && <ChevronRight size={12} className="text-text-muted flex-shrink-0" />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
