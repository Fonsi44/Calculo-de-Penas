import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { semanticLinkProps } from '@/lib/semantic-link';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/marketing/icon-badge';
import { getAllPosts } from '@/lib/blog';
import { formatDate } from '@/lib/blog';
import { cn } from '@/lib/ui';

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
 * layout (Fase 2.2 transformación coherente):
 *  - 'cards'  (default): grid 1/2/3 columnas con tarjetas. El histórico.
 *  - 'list':         lista vertical compacta (fecha + título + descripción).
 *                    Útil en landings para diferenciarse de /derecho-penal.
 *  - 'minimal':      franja de enlaces rápidos sin tarjetas. Para hubs saturados.
 *
 * Uso:
 *   <BlogHighlights />                              // default: 9 posts destacados
 *   <BlogHighlights slugs={['slug-1', 'slug-2']} /> // selección manual
 *   <BlogHighlights layout="list" />
 *   <BlogHighlights
 *     eyebrow="Artículos de derecho penal"
 *     title="Guías de defensa penal"
 *     subtitle="..."
 *   />
 */
interface BlogHighlightsProps {
  /** Slugs priorizados a mostrar (sin ruta, solo el slug). Si vacío, usa featured/recent. */
  slugs?: string[];
  /** Número de posts a mostrar si no hay slugs. Default: 9. */
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
  /** Composición visual. Default 'cards'. */
  layout?: 'cards' | 'list' | 'minimal';
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
  // Añadidos para reducir page depth de depth-3 a depth-1 (Jun 2026)
  'facturacion-electronica-requisitos-sar',
  'incumplimiento-contrato-comercial-honduras',
  'contratacion-publica-licitaciones',
];

export async function BlogHighlights({
  slugs,
  count = 9,
  eyebrow = 'Guías jurídicas destacadas',
  title = 'Recursos legales para tomar decisiones',
  subtitle = 'Guías prácticas y análisis escritos por nuestro equipo sobre las consultas más frecuentes de nuestros clientes.',
  ctaLabel,
  ctaHref,
  className,
  spacing = 'md',
  background = 'default',
  layout = 'cards',
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
      {layout === 'cards' && (
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
                <IconBadge icon={BookOpen} variant="accent" className="mb-3" />
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
      )}
      {layout === 'list' && (
        <ul className="divide-y divide-border-light max-w-3xl">
          {selected.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.category}/${post.slug}`}
                className="group flex items-start gap-4 py-3.5 focus-visible:outline-none"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent-dark flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xxs font-medium uppercase tracking-wider text-text-tertiary">
                    {formatDate(post.publishedAt)}
                  </p>
                  <h3 className="font-semibold text-sm text-text leading-snug mt-0.5 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">{post.description}</p>
                  )}
                </div>
                <ArrowRight
                  size={14}
                  className="text-text-tertiary group-hover:text-accent-dark group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {layout === 'minimal' && (
        <div className={cn('flex flex-wrap gap-x-5 gap-y-2', selected.length > 4 && 'max-w-3xl')}>
          {selected.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.category}/${post.slug}`}
              className="group inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors py-1"
            >
              <BookOpen size={14} className="text-accent-dark/70 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">{post.title}</span>
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
      {ctaLabel && ctaHref && (
        <div className="text-center mt-6">
          <Link
            href={ctaHref}
            {...semanticLinkProps(ctaHref.split('#')[0])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            {ctaLabel} <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </Section>
  );
}
