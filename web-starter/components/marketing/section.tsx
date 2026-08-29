import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
};

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', SIZES[size], className)}>{children}</div>;
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'contrast' | 'brand';
  id?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

const VARIANT_BG: Record<NonNullable<SectionProps['variant']>, string> = {
  default: 'bg-background',
  subtle: 'bg-surface-alt',
  contrast: 'bg-page-warm',
  brand: 'bg-primary text-text-inverse',
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
  variant = 'default',
  id,
  spacing = 'md',
}: SectionProps) {
  return (
    <section id={id} className={cn(VARIANT_BG[variant], SPACING[spacing], className)}>
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  invert?: boolean;
}

export function SectionHeader({ eyebrow, title, subtitle, align = 'left', invert = false }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 md:mb-8', align === 'center' && 'text-center max-w-3xl mx-auto')}>
      {eyebrow && (
        <p className={cn('text-xs font-bold uppercase tracking-widest mb-2', invert ? 'text-accent' : 'text-accent-dark')}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn('font-serif font-bold text-2xl md:text-3xl leading-tight', invert ? 'text-text-inverse' : 'text-primary')}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-2.5 text-sm md:text-base leading-relaxed max-w-3xl', align === 'center' && 'mx-auto', invert ? 'text-text-inverse/85' : 'text-text-secondary')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
