import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

/**
 * Cuadrícula responsive para tarjetas de blog.
 * - Móvil: 1 columna.
 * - Tablet (sm): 2 columnas.
 * - Desktop (lg): 2 columnas cuando hay sidebar, 3 sin él.
 *
 * Presentacional y client-safe (sin `'use client'`): puede usarse dentro de
 * Server o Client Components.
 */
export function BlogCardGrid({
  children,
  withSidebar = false,
  className,
}: {
  children: ReactNode;
  withSidebar?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-5',
        'grid-cols-1 sm:grid-cols-2',
        withSidebar ? 'lg:grid-cols-2' : 'lg:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
