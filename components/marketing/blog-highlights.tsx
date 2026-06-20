import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { getAllPosts } from '@/lib/blog';
import { formatDate } from '@/lib/blog';

/**
 * Sección reutilizable que muestra enlaces contextuales a posts del blog.
 *
 * Creada para resolver el gap de enlazado interno detectado en el diagnóstico
 * de indexación (docs/indexacion-plan-decision.md): la home tenía 0 enlaces
 * a posts del blog, lo que dificultaba el crawl path de Google.
 *
 * Es un Server Component (0 JS). Recibe una lista de slugs priorizados y los
 * resuelve contra la DB; si un slug no existe o no está publicado, se omite
 * silenciosamente (graceful degradation).
 *
 * Uso:
 *   <BlogHighlights />                              // default: 6 posts destacados
 *   <BlogHighlights slugs={['slug-1', 'slug-2']} /> // selección manual
 *   <BlogHighlights
 *     eyebrow="Artículos de derecho penal"
 *     title="Guías de defensa penal"
 *     subtitle="..."
 *   />
 */
interface BlogHighlightsProps {
  /** Slugs priorizados a mostrar (sin ruta, solo el slug). Si vacío, usa featured/recent. */
  slugs?: string[];
  /** Número de posts a mostrar si no hay slugs. Default: 6. */
  count?: number;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Texto del CTA inferior. Si vacío, no se muestra. */
  ctaLabel?: string;
  /** Href del CTA inferior. */
  ctaHref?: string;
  /** className extra para el Section. */
  className?: string;
  /** Espaciado del Section. */
  spacing?: 'sm' | 'md' | 'lg';
  /** Fondo del Section. */
  background?: 'default' | 'muted' | 'primary' | 'accent' | 'warm';
}

const DEFAULT_SLUGS = [
  // Posts estratégicos de alto valor comercial y calidad editorial verificada.
  // Seleccionados en docs/indexacion-plan-decision.md §6.
  'cuando-necesito-abogado-penalista-honduras',
  'que-hacer-si-me-detienen-en-honduras',
  'delitos-mas-comunes-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'jornada-laboral-horas-extra-descansos-honduras',
  'poder-legal-honduras-cuando-se-necesita',
];

export async function BlogHighlights({
  slugs,
  count = 6,
  eyebrow = 'Guías jurídicas destacadas',
  title = 'Recursos legales para tomar decisiones',
  subtitle = 'Guías prácticas y análisis escritos por nuestro equipo sobre las consultas más frecuentes de nuestros clientes.',
  ctaLabel,
  ctaHref,
  className,
  spacing = 'md',
  background = 'default',
}: BlogHighlightsProps) {
  const wantedSlugs = slugs && slugs.length > 0 ? slugs : DEFAULT_SLUGS;

  // Resolvemos slugs contra posts publicados. Si la DB no es alcanzable,
  // getAllPosts() retorna [] y la sección no renderiza nada (graceful).
  let allPosts: Awaited<ReturnType<typeof getAllPosts>> = [];
  try {
    allPosts = await getAllPosts();
  } catch {
    allPosts = [];
  }

  // Mapear slug -> post preservando el orden de wantedSlugs (prioridad manual).
  const postsBySlug = new Map(allPosts.map((p) => [p.slug, p]));
  const selected = wantedSlugs
    .map((s) => postsBySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, count);

  // Si no encontramos ninguno de los slugs manuales, fallback a recent.
  if (selected.length === 0) {
    return null;
  }

  return (
    <Section spacing={spacing} background={background} ariaLabel="Guías destacadas" className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {selected.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.category}/${post.slug}`}
            className="group block focus-visible:outline-none"
          >
            <Card
              padding="md"
              className="h-full group-hover:border-accent group-hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-lg bg-accent/15 border border-accent/30 text-accent-dark flex items-center justify-center mb-3 flex-shrink-0">
                <BookOpen size={20} aria-hidden="true" />
              </div>
              <p className="text-xxs font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                {formatDate(post.publishedAt)}
              </p>
              <h3 className="font-bold text-sm text-text leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              {post.description && (
                <p className="text-sm text-text-secondary mt-2 leading-relaxed line-clamp-2">
                  {post.description}
                </p>
              )}
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                Leer artículo <ArrowRight size={12} />
              </span>
            </Card>
          </Link>
        ))}
      </div>
      {ctaLabel && ctaHref && (
        <div className="text-center mt-6">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            {ctaLabel} <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </Section>
  );
}
