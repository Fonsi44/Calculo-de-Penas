import type { ReactNode } from 'react';
import { cn } from '@/lib/ui';

type IntroEditorialProps = {
  children: ReactNode;
  className?: string;
  background?: 'default' | 'warm' | 'muted';
  /** Callout destacado dentro del bloque editorial */
  highlight?: ReactNode;
  /** CTA opcional al final del bloque */
  cta?: ReactNode;
};

export function IntroEditorial({
  children,
  className,
  background = 'default',
  highlight,
  cta,
}: IntroEditorialProps) {
  const bgMap = {
    default: 'bg-background',
    warm: 'bg-page-warm',
    muted: 'bg-surface-alt',
  };

  return (
    <section className={cn('py-10 md:py-14', bgMap[background])}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div
          className={cn(
            'relative rounded-xl border border-border-light bg-surface p-6 md:p-8',
            'shadow-[0_1px_0_0_rgba(255,255,255,0.70)_inset,0_1px_2px_rgba(15,29,58,0.04),0_6px_16px_-8px_rgba(15,29,58,0.08)]',
            className,
          )}
        >
          {/* Barra lateral dorada sutil */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-accent/60 via-accent/30 to-transparent"
            aria-hidden="true"
          />
          <div className="prose-editorial">{children}</div>

          {highlight && (
            <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-4 md:p-5">
              {highlight}
            </div>
          )}

          {cta && <div className="mt-6">{cta}</div>}
        </div>
      </div>
    </section>
  );
}
