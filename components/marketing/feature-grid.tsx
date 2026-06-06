import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface FeatureItem {
  slug?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  tone?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
  /** Para bento: celda grande (1fr x 1fr) o mediana (auto). */
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
}

interface FeatureGridProps {
  items: FeatureItem[];
  className?: string;
  /**
   * Si true, organiza las 4 primeras items en layout bento (1 grande + 3 medianas)
   * y el resto en grid uniforme. Si false, todo va al grid uniforme.
   */
  bento?: boolean;
}

const TONE_CLASSES: Record<NonNullable<FeatureItem['tone']>, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/15 text-accent-dark border-accent/30',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  muted: 'bg-border-light/60 text-text-secondary border-border-light',
};

function FeatureCard({ item }: { item: FeatureItem }) {
  const tone = item.tone ?? 'primary';
  const toneCls = TONE_CLASSES[tone];
  const size = item.size ?? 'sm';

  // Tamaño del icono y tipografía según size.
  const iconBox =
    size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-12 h-12' : 'w-11 h-11';
  const iconSize = size === 'lg' ? 26 : size === 'md' ? 22 : 20;
  const titleSize =
    size === 'lg' ? 'text-base md:text-lg' : size === 'md' ? 'text-[15px]' : 'text-[13px]';
  const descSize = size === 'lg' ? 'text-[14px]' : 'text-[12px]';
  const paddingCls = size === 'sm' ? 'p-4' : 'p-5';
  const layoutCls = size === 'sm' ? 'flex-col items-center text-center' : 'items-start gap-4';

  const inner = (
    <div
      className={`h-full rounded-md border border-border-light bg-surface ${paddingCls} card-premium flex ${layoutCls}`}
    >
      <div
        className={`${iconBox} rounded-lg border flex items-center justify-center flex-shrink-0 ${toneCls} group-hover:scale-105 transition-transform`}
      >
        <item.icon size={iconSize} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={size === 'sm' ? 'flex flex-col items-center gap-1' : 'flex items-center gap-2'}>
          <h3 className={`font-bold ${titleSize} text-text leading-tight text-balance`}>
            {item.title}
          </h3>
          {item.badge && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-dark border border-accent/30 flex-shrink-0">
              {item.badge}
            </span>
          )}
        </div>
        {item.description && (
          <p className={`${descSize} text-text-secondary mt-1.5 leading-relaxed text-pretty`}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="group block focus-visible:outline-none h-full">
        {inner}
      </Link>
    );
  }
  return <div className="group h-full">{inner}</div>;
}

/**
 * Grid bento real (no uniforme) para 13 áreas o para bloques de "ventajas".
 *
 * Si `bento=true`:
 *  - item[0] = LG (ocupa 2 cols en desktop)
 *  - items[1..3] = MD (1 col)
 *  - resto = SM en grid uniforme
 *
 * Mobile: 2 cols compactas (sm). Tablet: 3 cols. Desktop: 4 cols con la 1ª expandida.
 */
export function FeatureGrid({ items, className, bento = false }: FeatureGridProps) {
  if (!bento) {
    return (
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 ${className ?? ''}`}
      >
        {items.map((it, i) => (
          <FeatureCard key={i} item={{ ...it, size: it.size ?? 'sm' }} />
        ))}
      </div>
    );
  }

  // Modo bento: separa destacadas del resto.
  const featured = items.slice(0, 4).map((it, i) => ({
    ...it,
    size: i === 0 ? ('lg' as const) : ('md' as const),
  }));
  const rest = items.slice(4).map((it) => ({ ...it, size: 'sm' as const }));

  return (
    <div className={className}>
      {/* Bento destacado: 1 grande + 3 medianas. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {featured.map((it, i) => (
          <div
            key={`f-${i}`}
            className={i === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-1' : ''}
          >
            <FeatureCard item={it} />
          </div>
        ))}
      </div>
      {/* Resto en grid uniforme. */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3 md:mt-4">
          {rest.map((it, i) => (
            <FeatureCard key={`r-${i}`} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
