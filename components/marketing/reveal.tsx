'use client';

import type { ReactNode, ElementType } from 'react';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/ui';

/**
 * Reveal — Wrapper client para aparición progresiva con Intersection Observer.
 *
 * Permite usar reveal en Server Components (que no pueden llamar hooks).
 * Renderiza un elemento (por defecto <div>) con la clase `.reveal` y añade
 * `.is-visible` cuando entra en viewport.
 *
 * Props:
 *   - delay: nivel 1-6 para delays escalonados (0ms, 60ms, 120ms...).
 *   - as: tag a renderizar (div, li, article, etc.).
 *   - className: clases adicionales.
 *
 * Respeta prefers-reduced-motion (gestionado por CSS).
 *
 * Uso en grid:
 *   {items.map((item, i) => (
 *     <Reveal key={item.id} delay={(i % 6) + 1}>
 *       <Card>…</Card>
 *     </Reveal>
 *   ))}
 */
interface RevealProps {
  children: ReactNode;
  delay?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: ElementType;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function Reveal({
  children,
  delay,
  as,
  className,
  threshold = 0.12,
  rootMargin = '0px 0px -8% 0px',
}: RevealProps) {
  const ref = useReveal<HTMLDivElement>({ threshold, rootMargin });
  const Tag = (as ?? 'div') as ElementType;
  const delayCls = delay ? `reveal-delay-${delay}` : '';
  return (
    <Tag ref={ref} className={cn('reveal', delayCls, className)}>
      {children}
    </Tag>
  );
}
