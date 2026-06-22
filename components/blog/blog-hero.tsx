import { Container } from '@/components/marketing/section';

/**
 * Hero del content hub del blog. Server Component con el H1 de la página
 * (un solo <h1> para SEO). Muestra título, subtítulo y estadísticas del
 * archivo (nº de artículos y categorías) para situar al usuario de inmediato.
 *
 * El buscador vive en BlogExplorer (cliente) justo debajo, para que el estado
 * de búsqueda controle la cuadrícula sin recargar.
 */
export function BlogHero({
  title,
  subtitle,
  postCount,
  categoryCount,
}: {
  title: string;
  subtitle: string;
  postCount: number;
  categoryCount: number;
}) {
  return (
    <section className="relative bg-hero-gradient text-text-inverse overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-grid opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none bg-radial-accent" aria-hidden="true" />
      <Container size="lg" className="relative py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="eyebrow-rule text-accent">Blog Jurídico</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider bg-accent/15 border border-accent/30 text-accent">
              Artículos y guías
            </span>
          </div>
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight text-text-inverse text-balance">
            {title}
          </h1>
          <p className="mt-5 text-base md:text-lg text-text-inverse/90 leading-relaxed max-w-3xl text-pretty">
            {subtitle}
          </p>
          {(postCount > 0 || categoryCount > 0) && (
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {postCount > 0 && (
                <div className="flex items-baseline gap-2">
                  <dt className="text-text-inverse/60 uppercase tracking-wider text-xxs font-bold">Artículos</dt>
                  <dd className="font-serif font-bold text-xl text-accent">{postCount}</dd>
                </div>
              )}
              {categoryCount > 0 && (
                <div className="flex items-baseline gap-2">
                  <dt className="text-text-inverse/60 uppercase tracking-wider text-xxs font-bold">Categorías</dt>
                  <dd className="font-serif font-bold text-xl text-accent">{categoryCount}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </Container>
    </section>
  );
}
