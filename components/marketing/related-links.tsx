import Link from 'next/link';
import { MapPin, Scale, FolderOpen, BookOpen } from 'lucide-react';
import { semanticLinkProps } from '@/lib/semantic-link';
import {
  getRelatedServices,
  getRelatedCitiesForContent,
  type PracticeArea,
  type CityLink,
} from '@/lib/internal-links';
import { blogCategories } from '@/data/blog/categories';

/**
 * Bloques de enlaces internos contextuales — tela de araña temática.
 *
 * Tres variantes SSR (Server Components, cero JS):
 *   - RelatedServices: "Servicios relacionados" (chips de áreas de práctica)
 *   - RelatedCities: "Atendemos en" (chips de ciudades)
 *   - RelatedCategories: "Otras categorías del blog" (chips de categorías)
 *
 * Estilo: chips `chip-specialty` consistentes con el design system premium.
 * Cada chip es un <Link> SSR → rastreable inmediatamente por Googlebot.
 *
 * Uso en hubs y páginas de detalle para distribuir autoridad interna y
 * construir los clusters temáticos/geográficos del sitio.
 */

interface RelatedServicesProps {
  /** Slug del servicio actual (se excluye de los resultados). */
  currentSlug: string;
  /** Número de servicios a mostrar (default 4). */
  limit?: number;
  /** Eyebrow / título opcional. */
  eyebrow?: string;
}

export function RelatedServices({
  currentSlug,
  limit = 3,
  eyebrow = 'Áreas relacionadas',
}: RelatedServicesProps) {
  const services: PracticeArea[] = getRelatedServices(currentSlug, limit);
  if (services.length === 0) return null;

  return (
    <div>
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
        {eyebrow}
      </p>
      <div className="flex flex-wrap gap-2">
        {services.map((s) => (
          <Link
            key={s.slug}
            href={s.href}
            {...semanticLinkProps(s.href)}
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <Scale size={10} className="text-accent-dark" aria-hidden="true" />
            {s.titulo}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface RelatedCitiesProps {
  /** Slug de ciudad mencionada (se prioriza primera). Opcional. */
  mentionedCitySlug?: string | null;
  /** Número de ciudades a mostrar (default 6). */
  limit?: number;
  /** Eyebrow / título opcional. */
  eyebrow?: string;
}

export function RelatedCities({
  mentionedCitySlug,
  limit = 3,
  eyebrow = 'Atendemos en el sur de Honduras',
}: RelatedCitiesProps) {
  const cities: CityLink[] = getRelatedCitiesForContent(mentionedCitySlug, limit);
  if (cities.length === 0) return null;

  return (
    <div>
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
        {eyebrow}
      </p>
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <Link
            key={c.slug}
            href={c.href}
            {...semanticLinkProps(c.href)}
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <MapPin size={10} className="text-accent-dark" aria-hidden="true" />
            {c.ciudad}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface RelatedCategoriesProps {
  /** Slug de categoría actual (se excluye). */
  current: string;
  /** Número de categorías a mostrar (default 8). */
  limit?: number;
  /** Eyebrow / título opcional. */
  eyebrow?: string;
}

export function RelatedCategories({
  current,
  limit = 4,
  eyebrow = 'Otras categorías del blog',
}: RelatedCategoriesProps) {
  const cats = blogCategories
    .filter((c) => c.slug !== current)
    .slice(0, limit);
  if (cats.length === 0) return null;

  return (
    <div>
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
        {eyebrow}
      </p>
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/blog/${c.slug}`}
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <FolderOpen size={10} className="text-accent-dark" aria-hidden="true" />
            {c.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface RelatedBlogArticlesProps {
  links: { href: string; label: string }[];
  eyebrow?: string;
}

export function RelatedBlogArticles({
  links,
  eyebrow = 'Guías relacionadas',
}: RelatedBlogArticlesProps) {
  if (links.length === 0) return null;

  return (
    <div>
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
        {eyebrow}
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <BookOpen size={10} className="text-accent-dark" aria-hidden="true" />
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
