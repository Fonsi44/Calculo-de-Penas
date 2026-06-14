import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/ui';
import { getServiceImage, getPenalImage } from '@/data/images';
import {
  PlaceholderPhoto,
  type PlaceholderAspect,
  type PlaceholderTone,
} from './placeholder-photo';

interface ServiceCardProps {
  href: string;
  title: string;
  description?: string;
  /** Slug del area. Se resuelve contra el catalogo local de imagenes. */
  slug?: string;
  /** Forzar una imagen por ruta absoluta (/images/...). Gana sobre `slug`. */
  imageSrc?: string;
  /** Categoria de la imagen: define que catalogo consultar primero. */
  category?: 'services' | 'penal';
  tone?: PlaceholderTone;
  aspect?: PlaceholderAspect;
  label?: string;
  eyebrow?: string;
  className?: string;
  /** Si true, no renderiza el enlace (uso en grids estaticas). */
  static?: boolean;
  /** Texto del CTA. Por defecto: "Conocer servicios de [título]" */
  ctaLabel?: string;
  /** Prioridad de carga (LCP). Solo para la imagen visible inicialmente. */
  priority?: boolean;
}

const ASPECT_CLASS: Record<PlaceholderAspect, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '1/1': 'aspect-square',
  '21/9': 'aspect-[21/9]',
  '5/4': 'aspect-[5/4]',
  '3/4': 'aspect-[3/4]',
};

function resolveImage(
  imageSrc: string | undefined,
  slug: string | undefined,
  category: 'services' | 'penal' | undefined,
): string | undefined {
  if (imageSrc) return imageSrc;
  if (!slug) return undefined;
  if (category === 'penal') {
    return getPenalImage(slug) ?? getServiceImage(slug);
  }
  return getServiceImage(slug) ?? getPenalImage(slug);
}

export function ServiceCard({
  href,
  title,
  description,
  slug,
  imageSrc,
  category,
  tone = 'primary',
  aspect = '4/3',
  label,
  eyebrow,
  className,
  static: isStatic = false,
  ctaLabel,
  priority = false,
}: ServiceCardProps) {
  const resolvedImage = resolveImage(imageSrc, slug, category);
  const ctaText = ctaLabel ?? `Conocer servicios de ${title.toLowerCase()}`;

  const inner = (
    <>
      <div className="relative overflow-hidden">
        {resolvedImage ? (
          <div className={cn('relative w-full overflow-hidden', ASPECT_CLASS[aspect])}>
            <Image
              src={resolvedImage}
              alt={label ?? title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              priority={priority}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent"
            />
          </div>
        ) : (
          <PlaceholderPhoto
            tone={tone}
            aspect={aspect}
            rounded="none"
            label={label}
          />
        )}
        {eyebrow && (
          <span className="eyebrow-rule absolute left-4 top-4 z-10 bg-surface/85 px-3 py-1.5 backdrop-blur-sm">
            {eyebrow}
          </span>
        )}
      </div>
      <div className="p-5 md:p-6">
        <h3 className="font-serif text-lg md:text-xl font-bold text-primary leading-snug group-hover:text-primary-light transition-colors">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary line-clamp-3">
            {description}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-dark group-hover:gap-2.5 transition-all">
          {ctaText}
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </>
  );

  const baseClasses = cn(
    'group premium-bar card-premium relative flex flex-col overflow-hidden rounded-xl border border-border-light bg-surface hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
    className,
  );

  if (isStatic) {
    return <article className={baseClasses}>{inner}</article>;
  }

  return (
    <Link href={href} className={baseClasses} data-testid="service-card">
      {inner}
    </Link>
  );
}
