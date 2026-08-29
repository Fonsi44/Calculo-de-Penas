import { Section } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';
import { site } from '@/lib/site';

interface CtaBlockProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  variant?: 'closing' | 'inline';
}

export function CtaBlock({
  title = '¿Listo para lanzar tu próxima web?',
  subtitle = 'Componemos páginas con bloques reutilizables y temas intercambiables. Sin Figma, sin suscripción.',
  eyebrow = 'Code-first design',
  variant = 'closing',
}: CtaBlockProps) {
  if (variant === 'inline') {
    return (
      <Section variant="subtle" spacing="md">
        <div className="rounded-lg border border-border-light bg-surface px-6 py-8 md:px-10 text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-dark">{eyebrow}</p>
          <h2 className="font-serif font-bold text-xl md:text-2xl text-primary mt-3">{title}</h2>
          <p className="mt-3 text-sm text-text-secondary">{subtitle}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <ButtonLink href={site.cta.primary.href} variant="primary">{site.cta.primary.label}</ButtonLink>
            <ButtonLink href={site.cta.secondary.href} variant="secondary">{site.cta.secondary.label}</ButtonLink>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section variant="subtle" spacing="lg">
      <div className="card-premium max-w-3xl mx-auto px-6 py-10 md:px-12 md:py-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-dark">{eyebrow}</p>
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-primary mt-3">{title}</h2>
        <p className="mt-3 text-sm md:text-base text-text-secondary">{subtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={site.cta.primary.href} variant="accent" size="lg">{site.cta.primary.label}</ButtonLink>
          <ButtonLink href={site.cta.secondary.href} variant="secondary" size="lg">{site.cta.secondary.label}</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
