'use client';

import type { DelitoConfig } from '../types';
import { cn } from '@/lib/ui';

interface Props {
  current: DelitoConfig | undefined;
  onChange: (patch: Partial<DelitoConfig>) => void;
  onNext: () => void;
}

export function Paso2Variantes({ current, onChange, onNext }: Props) {
  return (
    <div>
      <h2 className="font-bold text-base text-text mb-2">Tipo de pena</h2>
      <p className="text-xs text-text-secondary mb-3">
        Este delito admite pena alternativa. Seleccione el tipo de pena a calcular.
      </p>
      <div className="space-y-2">
        {[
          { id: 'prision' as const, label: 'Prisión', desc: 'Pena privativa de libertad' },
          { id: 'multa' as const, label: 'Multa', desc: 'Pena alternativa no privativa' },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => { onChange({ pena_seleccionada: opt.id }); onNext(); }}
            className={cn(
              'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
              current?.pena_seleccionada === opt.id
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface hover:border-accent/50',
            )}
          >
            <p className="font-semibold text-sm text-text">{opt.label}</p>
            <p className="text-xs text-text-muted">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
