import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, Container } from '@/components/marketing/section';
import { cn } from '@/lib/ui';

interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
  version: string;
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Plantilla unificada para los 5 documentos legales públicos
 * (aviso-legal, politica-privacidad, politica-cookies, terminos, disclaimer).
 *
 * Aplica la estética "Premium Corporate Luxury" del bufete:
 *  - Hero navy con eyebrow dorado y badge superior
 *  - Banner destacado indicando que el texto es plantilla guía
 *  - Secciones numeradas con tipografía serif en titulares
 *  - Pie de página con versión y fecha de actualización
 *
 * NOTA IMPORTANTE: Todos los textos son plantilla de referencia.
 * La versión definitiva debe ser revisada y aprobada por un abogado
 * colegiado en Honduras antes de su publicación oficial (Art. 230 CP
 * sobre ejercicio ilegal y normativa del Colegio de Abogados de Honduras).
 */
export function LegalDocument({
  eyebrow,
  title,
  subtitle,
  badge = 'Documento legal',
  version,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        badge={badge}
      />
      <Section background="muted" spacing="md">
        <Container size="md">
          <div
            role="note"
            className="rounded-lg border border-warning/30 bg-warning/[0.06] p-4 md:p-5 mb-10 flex gap-3 items-start"
          >
            <AlertTriangle
              size={20}
              className="text-warning flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-xs-plus leading-relaxed text-text">
              <p className="font-bold text-primary mb-1">
                Plantilla de referencia — pendiente de revisión por abogado colegiado
              </p>
              <p className="text-text-secondary">
                Este texto es una guía base adaptada a la legislación hondureña
                (Constitución Arts. 76-80, Código Penal Decreto 130-2017 y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024),
                Código Civil, Código de Comercio y normativa del Colegio de
                Abogados de Honduras). La versión definitiva debe ser revisada
                y aprobada por un abogado colegiado antes de su publicación
                oficial.
              </p>
            </div>
          </div>

          <article className="text-text">{children}</article>

          <div className="mt-12 pt-6 border-t border-border-light text-xs text-text-muted flex flex-wrap items-center justify-between gap-2">
            <span>Versión: {version}</span>
            <span>Última actualización: {lastUpdated}</span>
          </div>
        </Container>
      </Section>
    </>
  );
}

interface LegalSectionProps {
  number: string;
  title: string;
  children: ReactNode;
  id?: string;
}

export function LegalSection({ number, title, children, id }: LegalSectionProps) {
  return (
    <section id={id} className="mb-9 last:mb-0">
      <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary mb-3 flex items-baseline gap-2.5 scroll-mt-32">
        <span className="text-accent text-body md:text-base font-bold tabular-nums">
          {number}.
        </span>
        <span>{title}</span>
      </h2>
      <div className="text-body leading-comfortable text-text space-y-3">
        {children}
      </div>
    </section>
  );
}

export function LegalSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-sans font-bold text-body text-primary mb-2">
        {title}
      </h3>
      <div className="text-body leading-comfortable text-text space-y-3">
        {children}
      </div>
    </div>
  );
}

interface LegalListProps {
  items: ReactNode[];
  ordered?: boolean;
  className?: string;
}

export function LegalList({ items, ordered = false, className }: LegalListProps) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag
      className={cn(
        'text-body leading-comfortable pl-5 space-y-1.5 marker:text-accent',
        ordered ? 'list-decimal' : 'list-disc',
        className,
      )}
    >
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

export function LegalCallout({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'warning' | 'danger';
  children: ReactNode;
}) {
  const styles = {
    info: 'border-primary/20 bg-primary/[0.04] text-text',
    warning: 'border-warning/30 bg-warning/[0.06] text-text',
    danger: 'border-danger/30 bg-danger/[0.06] text-text',
  } as const;
  return (
    <div
      role="note"
      className={cn(
        'rounded-md border px-4 py-3 my-4 text-sm leading-comfortable',
        styles[variant],
      )}
    >
      {children}
    </div>
  );
}
