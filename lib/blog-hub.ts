import { blogCategories } from '@/data/blog/categories';
import type { Post, BlogCardData, BlogCategoryWithCount, BlogArchiveMonth } from '@/data/blog/types';

/**
 * Lógica de datos del "content hub" del blog (/blog).
 *
 * Todas las funciones son PURAS: reciben un array de posts ya cargado por el
 * servidor (una sola consulta a `blog_posts` vía `getAllPosts()`) y derivan
 * subconjuntos sin volver a tocar la DB. Así el hub ejecuta una única query
 * por revalidación (ISR 1h) y el resto es cómputo en memoria.
 *
 * Separación de responsabilidades (R7 + requisito del rediseño):
 *   - Datos/DB            → lib/blog-db.ts
 *   - Adaptador legacy     → lib/blog.ts
 *   - Lógica del hub       → este archivo (derivaciones, búsqueda, orden)
 *   - Componentes visuales → components/blog/*
 *   - Layout               → app/(public)/blog/page.tsx
 *
 * Nada de esto inventa datos (R4): "popular" usa un heurístico determinista
 * (featured + nº de etiquetas + recencia) y se etiqueta como "Lecturas
 * recomendadas", nunca como "más vistos" (no hay métricas de vistas reales).
 */

export type SortMode = 'recent' | 'relevant';

/** Convierte un Post completo en el payload ligero BlogCardData (sin body). */
export function toCardData(post: Post): BlogCardData {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    category: post.category,
    tags: post.tags ?? [],
    author: post.author,
    readingTime: post.readingTime,
    coverImage: post.coverImage,
    featured: post.featured,
  };
}

/**
 * Conjunto de "destacados" para el hero magazine del hub.
 *
 * Estrategia (fallback resiliente, porque solo ~1 post tiene flag
 * `featured` en DB): empieza con los posts marcados como destacados; si hay
 * menos de `limit`, completa con los más recientes garantizando diversidad de
 * categoría (sin repetir categoría salvo que sea inevitable). El primer
 * elemento es el "destacado principal" (tarjeta grande).
 */
export function deriveFeaturedPosts(posts: Post[], limit = 4): Post[] {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const featured = sorted.filter((p) => p.featured);
  const result: Post[] = [];
  const usedSlugs = new Set<string>();
  const usedCats = new Set<string>();

  for (const p of featured) {
    if (result.length >= limit) break;
    result.push(p);
    usedSlugs.add(p.slug);
    usedCats.add(p.category);
  }

  for (const p of sorted) {
    if (result.length >= limit) break;
    if (usedSlugs.has(p.slug)) continue;
    if (usedCats.has(p.category)) continue;
    result.push(p);
    usedSlugs.add(p.slug);
    usedCats.add(p.category);
  }

  // Si aún faltan (pocas categorías), rellenar con los más recientes restantes.
  for (const p of sorted) {
    if (result.length >= limit) break;
    if (usedSlugs.has(p.slug)) continue;
    result.push(p);
    usedSlugs.add(p.slug);
  }

  return result;
}

/**
 * Categorías con conteo de posts, ordenadas por volumen desc (las más activas
 * primero). Sirve para priorizar la navegación: las categorías con más
 * contenido aparecen como chips principales y el resto va al desplegable
 * "Más categorías".
 */
export function deriveCategoryCounts(posts: Post[]): BlogCategoryWithCount[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return blogCategories
    .map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.nombre.localeCompare(b.nombre));
}

/**
 * "Lecturas recomendadas" — heurístico determinista y honesto (R4: no inventar
 * métricas). Ordena por: (1) featured, (2) más etiquetas (mayor cobertura
 * temática), (3) más reciente. Devuelve los primeros `limit`.
 */
export function derivePopularPosts(posts: Post[], limit = 5): Post[] {
  return [...posts]
    .sort((a, b) => {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      const tagDiff = (b.tags?.length ?? 0) - (a.tags?.length ?? 0);
      if (tagDiff !== 0) return tagDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, limit);
}

/** Posts más recientes (para el widget "Artículos recientes" del sidebar). */
export function deriveRecentPosts(posts: Post[], limit = 5): Post[] {
  return [...posts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

/** Etiquetas únicas ordenadas alfabéticamente (widget de etiquetas). */
export function deriveAllTags(posts: Post[]): string[] {
  const tags = new Set<string>();
  for (const p of posts) for (const t of p.tags ?? []) tags.add(t);
  return Array.from(tags).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Archivo por meses (YYYY-MM). Devuelve los últimos `limit` meses con posts,
 * del más reciente al más antiguo. `label` usa formato es-HN legible
 * ("mayo 2026"). Pensado para un widget de archivo tipo WordPress.
 */
export function deriveArchiveMonths(posts: Post[], limit = 8): BlogArchiveMonth[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    const d = new Date(p.publishedAt);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return Array.from(counts.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, limit)
    .map(([value, count]) => {
      const [y, m] = value.split('-');
      return { value, label: `${meses[parseInt(m, 10) - 1]} ${y}`, count };
    });
}

/**
 * Filtra posts por texto libre (búsqueda instantánea cliente). Busca en
 * título, descripción y etiquetas. Insensible a mayúsculas/tildes para
 * tolerancia tipográfica básica (normaliza sin acentos).
 */
export function searchPosts(posts: BlogCardData[], query: string): BlogCardData[] {
  const q = normalize(query.trim());
  if (!q) return posts;
  return posts.filter((p) =>
    normalize(p.title).includes(q) ||
    normalize(p.description).includes(q) ||
    (p.tags ?? []).some((t) => normalize(t).includes(q)),
  );
}

/** Filtra por categoría (filtro rápido cliente, sin cambiar la URL). */
export function filterByCategory(posts: BlogCardData[], category: string | null): BlogCardData[] {
  if (!category) return posts;
  return posts.filter((p) => p.category === category);
}

/** Ordena un conjunto de posts según el modo elegido. */
export function sortPosts(posts: BlogCardData[], mode: SortMode): BlogCardData[] {
  const arr = [...posts];
  if (mode === 'relevant') {
    arr.sort((a, b) => {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      const tagDiff = (b.tags?.length ?? 0) - (a.tags?.length ?? 0);
      if (tagDiff !== 0) return tagDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  } else {
    arr.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }
  return arr;
}

/** Normaliza texto: minúsculas y sin acentos/diacríticos. */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
