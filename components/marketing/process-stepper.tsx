import type { ReactNode } from 'react';

interface ProcessStep {
  step: number;
  title: string;
  desc: string;
  icon?: ReactNode;
}

interface ProcessStepperProps {
  steps: ProcessStep[];
  /** Mostrar conector horizontal (línea dorada entre pasos en desktop). */
  withConnector?: boolean;
  className?: string;
}

/**
 * Stepper de proceso con jerarquía visual real.
 * - Numeración grande y dorada (acento principal).
 * - Línea conectora sutil en desktop (oculta en móvil/tablet).
 * - Tipografía balanceada y animación sutil en hover.
 */
export function ProcessStepper({ steps, withConnector = true, className }: ProcessStepperProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 ${withConnector ? 'process-connector' : ''} ${className ?? ''}`}
    >
      {steps.map((s) => (
        <div
          key={s.step}
          className="relative rounded-md border border-border-light bg-surface p-5 card-premium group"
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
          <p className="text-xs-plus text-text-secondary leading-relaxed relative z-10 text-pretty">
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
