import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[88rem]',
};

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', SIZES[size], className)}>{children}</div>;
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'primary' | 'accent' | 'warm';
  /**
   * FASE 5 — alias semántico de `background` alineado con el design-system.
   * Mapea a los fondos ya existentes:
   *   default  → background='default'  (surface)
   *   subtle   → background='muted'    (bg-surface-alt, pausa visual)
   *   contrast → background='warm'     (bg-page-warm, contraste cálido)
   *   brand    → background='primary'  (navy, identidad de marca)
   *   editorial→ background='default'  (prosa editorial, sin cambio de fondo)
   * Si se pasa `background` explícito, tiene prioridad (compatibilidad).
   */
  variant?: 'default' | 'subtle' | 'contrast' | 'brand' | 'editorial';
  id?: string;
  ariaLabel?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

const BG: Record<NonNullable<SectionProps['background']>, string> = {
  default: 'bg-background',
  muted: 'bg-surface-alt',
  primary: 'bg-primary text-text-inverse',
  accent: 'bg-accent/10',
  warm: 'bg-page-warm',
};

const VARIANT_TO_BG: Record<NonNullable<SectionProps['variant']>, NonNullable<SectionProps['background']>> = {
  default: 'default',
  subtle: 'muted',
  contrast: 'warm',
  brand: 'primary',
  editorial: 'default',
};

const SPACING = {
  sm: 'py-6 md:py-8',
  md: 'py-9 md:py-12',
  lg: 'py-12 md:py-16',
};

export function Section({
  children,
  className,
  containerSize = 'lg',
  background,
  variant,
  id,
  ariaLabel,
  spacing = 'md',
}: SectionProps) {
  // FASE 5: `background` explícito tiene prioridad sobre `variant` (compat).
  const resolvedBg = background ?? (variant ? VARIANT_TO_BG[variant] : 'default');
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(BG[resolvedBg], SPACING[spacing], className)}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string | React.ReactNode;
  title: string;
  subtitle?: string | React.ReactNode;
  align?: 'left' | 'center';
  invert?: boolean;
  className?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, align = 'left', invert = false, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 md:mb-8',
        align === 'center' && 'text-center max-w-3xl mx-auto',
        className,
      )}
    >
      {eyebrow && (
        <div className={cn('eyebrow-rule mb-2.5', invert ? 'text-accent' : 'text-accent-dark')}>
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
          'font-serif font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-balance',
          invert ? 'text-text-inverse' : 'text-primary',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-2.5 text-sm md:text-base leading-relaxed text-pretty max-w-3xl',
            align === 'center' && 'mx-auto',
            invert ? 'text-text-inverse/85' : 'text-text-secondary',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
