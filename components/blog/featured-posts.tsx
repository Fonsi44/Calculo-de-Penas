import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/marketing/section';
import { BlogCard } from '@/components/blog/blog-card';
import type { BlogCardData } from '@/data/blog/types';

/**
 * Sección "magazine" de artículos destacados del hub.
 *
 * Layout editorial: 1 tarjeta principal grande (col-span 2 en desktop) +
 * hasta 3 secundarias apiladas. El principal usa imagen con overlay y texto
 * inverso; los secundarios son tarjetas horizontales compactas.
 *
 * Server Component. Solo se renderiza en la página 1 sin filtros (para no
 * competir con el listado paginado ni duplicar foco visual en páginas
 * profundas).
 */
export function FeaturedPosts({ posts }: { posts: BlogCardData[] }) {
  if (posts.length === 0) return null;
  const [hero, ...secondary] = posts;

  return (
    <section className="border-b border-border/40">
      <Container size="lg" className="py-10 md:py-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow-rule text-accent-dark mb-2">Selección editorial</p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary">
              Artículos destacados
            </h2>
          </div>
          <Link
            href="#articulos"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <BlogCard post={hero} variant="featured" priority />
          </div>
          {secondary.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {secondary.slice(0, 3).map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
