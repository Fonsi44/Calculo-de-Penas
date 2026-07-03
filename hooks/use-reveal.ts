'use client';

import { useEffect, useRef } from 'react';

/**
 * useReveal — Hook de aparición progresiva con Intersection Observer.
 *
 * Añade la clase `.is-visible` al elemento referenciado cuando entra en el
 * viewport, activando la transición CSS `.reveal` (definida en globals.css).
 *
 * Características:
 *   - Sin dependencias, solo IntersectionObserver nativo.
 *   - Respeta `prefers-reduced-motion`: si el usuario lo activa, el CSS
 *     fuerza `opacity: 1` y el hook no hace nada visible (la transición es 0).
 *   - `once` (default true): revela una sola vez y deja de observar.
 *   - `threshold`: cuánto del elemento debe ser visible (0.12 por defecto).
 *   - `rootMargin`: margen para adelantar el trigger (0px por defecto).
 *
 * Uso:
 *   const ref = useReveal<HTMLDivElement>();
 *   return <div ref={ref} className="reveal">…</div>;
 *
 * Combinar con `.reveal-delay-*` para delays escalonados en grids.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
}) {
  const { once = true, threshold = 0.12, rootMargin = '0px 0px -8% 0px' } = options ?? {};
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: si IntersectionObserver no existe, mostrar directamente.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-visible');
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return ref;
}

/**
 * useRevealGroup — Variant para grids: devuelve un array de refs (uno por
 * hijo) para aplicar reveal escalonado. Cada hijo recibe `.reveal` +
 * `.reveal-delay-{i}` de forma automática vía data-attribute en el render.
 *
 * Más simple: usar `useReveal` por cada item dentro de un map con un index.
 * Este hook existe para casos donde se prefiere una sola fuente de observers.
 */
export function useRevealGroup<T extends HTMLElement = HTMLDivElement>(count: number, options?: {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
}) {
  const { once = true, threshold = 0.10, rootMargin = '0px 0px -8% 0px' } = options ?? {};
  const refs = useRef<Array<T | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      refs.current.forEach((el) => el?.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-visible');
          }
        }
      },
      { threshold, rootMargin },
    );

    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count, once, threshold, rootMargin]);

  const setRef = (index: number) => (el: T | null) => {
    refs.current[index] = el;
  };

  return { setRef, count };
}
