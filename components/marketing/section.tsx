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
  return <div className={cn('mx-auto px-4 sm:px-6', SIZES[size], className)}>{children}</div>;
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'primary' | 'accent' | 'warm';
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

const SPACING = {
  sm: 'py-6 md:py-8',
  md: 'py-8 md:py-12',
  lg: 'py-12 md:py-16',
};

export function Section({
  children,
  className,
  containerSize = 'lg',
  background = 'default',
  id,
  ariaLabel,
  spacing = 'md',
}: SectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(BG[background], SPACING[spacing], className)}
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
        'mb-8 md:mb-10',
        align === 'center' && 'text-center max-w-3xl mx-auto',
        className,
      )}
    >
      {eyebrow && (
        <div className={cn('eyebrow-rule mb-4', invert ? 'text-accent' : 'text-accent-dark')}>
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
          'font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight text-balance',
          invert ? 'text-text-inverse' : 'text-primary',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-sm md:text-base leading-relaxed text-pretty max-w-3xl',
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
