import type { ReactNode } from 'react';

interface ProcessStep {
  step: number;
  title: string;
  desc: string;
  icon?: ReactNode;
}

interface ProcessStepperProps {
  steps: ProcessStep[];
  /**
   * Variante de layout (Hito 7.3 — FASE 5):
   *  - 'steps' (default): grid horizontal 4-col con números dorados + conector.
   *    Pensado para landings (HOME, /despacho) donde los pasos son breves.
   *  - 'timeline': lista vertical numerada (`<ol>` semántica) para páginas de
   *    detalle (/derecho-penal, /servicios-juridicos/[slug]) donde los pasos
   *    llevan descripciones más largas y un orden implícito.
   *  - 'compact': variante densa para destacar el progreso en poco espacio.
   */
  variant?: 'steps' | 'timeline' | 'compact';
  /** Mostrar conector horizontal (solo variante 'steps'). */
  withConnector?: boolean;
  className?: string;
}

/**
 * Stepper de proceso unificado (Hito 7.3 — FASE 5).
 *
 * Antes existían dos componentes separados: `ProcessStepper` (grid horizontal
 * con números dorados, sin `<ol>`) y `ProcessList` (lista vertical con `<Card>`
 * y `<ol>` semántica). Ambos representaban el mismo concepto (pasos numerados
 * de un proceso) con layouts distintos según el contexto.
 *
 * Ahora `ProcessStepper` ofrece tres variantes que cubren ambos casos. El
 * wrapper `ProcessList` se conserva para no romper las páginas que lo usan
 * (inyecta `<Section>` + `<SectionHeader>` + nota jurídica), pero su render
 * interno delega en este componente con `variant='timeline'`.
 *
 * Conserva: numeración, títulos, descripciones, orden, semántica de lista
 * (variant 'timeline' usa `<ol>`), responsive y nota jurídica.
 */
export function ProcessStepper({
  steps,
  variant = 'steps',
  withConnector = true,
  className,
}: ProcessStepperProps) {
  if (variant === 'timeline') {
    return (
      <ol className={`space-y-4 max-w-3xl list-none p-0 m-0 ${className ?? ''}`}>
        {steps.map((s) => (
          <li key={s.step} className="card-premium p-4 md:p-5 flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-text-inverse flex items-center justify-center font-bold text-sm tabular-nums">
              {s.step}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm md:text-base text-primary leading-snug">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed text-pretty">
                {s.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (variant === 'compact') {
    return (
      <ol className={`space-y-3 max-w-3xl list-none p-0 m-0 ${className ?? ''}`}>
        {steps.map((s) => (
          <li key={s.step} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 text-primary border border-primary/15 flex items-center justify-center font-bold text-xs tabular-nums">
              {s.step}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-text leading-snug">{s.title}</p>
              <p className="text-xs text-text-secondary leading-relaxed text-pretty">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  // Variante 'steps' (default): grid horizontal con conector dorado.
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 ${withConnector ? 'process-connector' : ''} ${className ?? ''}`}
    >
      {steps.map((s) => (
        <div
          key={s.step}
          className="relative rounded-lg p-5 card-premium group"
        >
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="relative w-10 h-10 rounded-md bg-primary text-text-inverse flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-sm group-hover:bg-primary-light transition-colors">
              <span className="tabular-nums">{s.step}</span>
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-surface"
              />
            </div>
            <h3 className="font-bold text-sm text-text leading-tight text-balance">
              {s.title}
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed relative z-10 text-pretty">
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
