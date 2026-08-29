import type { ReactNode } from 'react';
import { Container } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  align?: 'left' | 'center';
  variant?: 'primary' | 'muted';
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  ctaHref,
  ctaLabel = 'Empezar',
  align = 'left',
  variant = 'primary',
}: PageHeroProps) {
  const isPrimary = variant === 'primary';
  const alignCls = align === 'center' ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl';

  return (
    <section
      className={
        isPrimary
          ? 'relative overflow-hidden bg-hero-gradient text-text-inverse'
          : 'relative overflow-hidden bg-page-warm text-text border-b border-border-light'
      }
    >
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
      <Container size="lg" className="relative py-10 md:py-14 lg:py-16">
        <div className={alignCls}>
          <p className={cnEyebrow(isPrimary)}>{eyebrow}</p>
          <h1 className={cnTitle(isPrimary)}>{title}</h1>
          <div className={cnRule(isPrimary, align)} aria-hidden="true" />
          {subtitle && <p className={cnSubtitle(isPrimary, align)}>{subtitle}</p>}
          {ctaHref && (
            <div className="mt-6">
              <ButtonLink href={ctaHref} variant={isPrimary ? 'accent' : 'primary'} size="lg">
                {ctaLabel}
              </ButtonLink>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function cnEyebrow(primary: boolean) {
  return primary
    ? 'text-xs font-bold uppercase tracking-widest text-accent mb-3'
    : 'text-xs font-bold uppercase tracking-widest text-accent-dark mb-3';
}

function cnTitle(primary: boolean) {
  return primary
    ? 'font-serif font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-balance'
    : 'font-serif font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-primary text-balance';
}

function cnSubtitle(primary: boolean, align: 'left' | 'center') {
  return [
    'mt-4 text-base md:text-lg leading-relaxed max-w-3xl',
    align === 'center' && 'mx-auto',
    primary ? 'text-text-inverse/90' : 'text-text-secondary',
  ]
    .filter(Boolean)
    .join(' ');
}

function cnRule(primary: boolean, align: 'left' | 'center') {
  return [
    'mt-4 h-[3px] w-14 rounded-full',
    align === 'center' && 'mx-auto',
    primary ? 'bg-accent/80' : 'bg-accent',
  ]
    .filter(Boolean)
    .join(' ');
}
