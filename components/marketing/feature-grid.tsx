import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface FeatureItem {
  slug?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  tone?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
  /**
   * Variante de tamaño: SOLO controla el tamaño del icono y de la tipografía.
   * El layout (icono arriba, título y descripción debajo, todo centrado) es
   * SIEMPRE el mismo para que la grid sea visualmente coherente.
   */
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
}

interface FeatureGridProps {
  items: FeatureItem[];
  className?: string;
  /**
   * Si true, la 1ª card se renderiza en `lg` (icono grande) y el resto en
   * `sm` (icono compacto). El layout sigue siendo vertical y consistente.
   * Si false, todas las cards son `sm` y se ven uniformes.
   */
  bento?: boolean;
  /**
   * Columnas en desktop. Default: 4 (ideal para 12-16 cards como las
   * 13 áreas jurídicas). Cada card se estira a la misma altura de fila
   * y la última fila queda centrada horizontalmente.
   */
  cols?: 2 | 3 | 4 | 5;
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

  const iconBox =
    size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-12 h-12' : 'w-11 h-11';
  const iconSize = size === 'lg' ? 28 : size === 'md' ? 24 : 20;
  const titleSize =
    size === 'lg' ? 'text-base md:text-lg' : size === 'md' ? 'text-sm' : 'text-xs';
  const descSize = size === 'lg' ? 'text-sm' : 'text-xs';
  const paddingCls = size === 'sm' ? 'p-4' : 'p-5';
  const gapCls = size === 'sm' ? 'gap-2.5' : 'gap-3';

  // Layout SIEMPRE vertical y centrado:
  //   icono ARRIBA
  //   título ABAJO (bold, centrado)
  //   descripción ABAJO (centrada, text-pretty)
  // Esto garantiza que la grid estire todas las cards a la misma altura
  // con `items-stretch` (default de CSS grid) y que no haya escalones.
  const inner = (
    <div
      className={`h-full w-full rounded-md border border-border-light bg-surface ${paddingCls} card-premium flex flex-col items-center text-center ${gapCls}`}
    >
      <div
        className={`${iconBox} rounded-lg border flex items-center justify-center flex-shrink-0 ${toneCls} group-hover:scale-105 transition-transform`}
      >
        <item.icon size={iconSize} aria-hidden="true" />
      </div>
      <div className="min-w-0 w-full flex-1 flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <h3 className={`font-bold ${titleSize} text-text leading-tight text-balance`}>
            {item.title}
          </h3>
          {item.badge && (
            <span className="text-xxs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-dark border border-accent/30 flex-shrink-0">
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
      <Link href={item.href} className="group block focus-visible:outline-none h-full w-full">
        {inner}
      </Link>
    );
  }
  return <div className="group h-full w-full">{inner}</div>;
}

/**
 * Grid uniforme con cards verticales (icono arriba, texto debajo).
 *
 * Implementado con `flex flex-wrap justify-center` + anchos fijos
 * responsivos. Esto garantiza:
 *  - Todas las cards de la misma fila tienen la misma altura.
 *  - La última fila (cuando hay menos items) queda centrada
 *    horizontalmente, sin huecos a un lado.
 *  - Todas las cards usan el mismo layout vertical.
 *
 * Si `bento=true`:
 *  - La 1ª card es `lg` (icono grande).
 *  - El resto son `sm` (icono compacto).
 *  - La grid sigue siendo uniforme en columnas y alturas.
 */
export function FeatureGrid({
  items,
  className,
  bento = false,
  cols = 4,
}: FeatureGridProps) {
  // Anchos fijos por breakpoint en función de `cols`.
  // Usamos `w-[calc(...)]` para que la última fila quede centrada y las
  // cards mantengan el mismo ancho en cada breakpoint. El `gap-3` (0.75rem)
  // se compensa restando `gap/2` por cada gap lateral posible (n-1).
  // En la práctica usamos `flex-1` con `max-w` para no pelearnos con el
  // cálculo exacto, y dejamos que la grid CSS estire.
  const cardWidths: Record<NonNullable<FeatureGridProps['cols']>, string> = {
    2: 'w-full sm:w-[calc(50%-0.375rem)]',
    3: 'w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]',
    4: 'w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5625rem)]',
    5: 'w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5625rem)] lg:w-[calc(20%-0.6rem)]',
  };

  const featured = items.map((it, i) => ({
    ...it,
    size: (bento && i === 0 ? 'lg' : 'sm') as NonNullable<FeatureItem['size']>,
  }));

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className ?? ''}`}>
      {featured.map((it, i) => (
        <div key={i} className={cardWidths[cols]}>
          <FeatureCard item={it} />
        </div>
      ))}
    </div>
  );
}
