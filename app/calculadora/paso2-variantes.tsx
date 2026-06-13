'use client';

import type { DelitoConfig } from '../types';
import { cn } from '@/lib/ui';

interface Props {
  current: DelitoConfig | undefined;
  onChange: (patch: Partial<DelitoConfig>) => void;
  onNext: () => void;
}

export function Paso2Variantes({ current, onChange, onNext }: Props) {
  const d = current?.delito;
  const tienePrision = d ? (d.pena_minima_meses > 0 || d.pena_maxima_meses > 0) : false;
  const tieneMulta = d ? (d.pena_alternativa_min > 0 || d.pena_alternativa_max > 0) : false;

  if (!tienePrision && !tieneMulta) {
    return (
      <div>
        <h2 className="font-bold text-base text-text mb-2">Tipo de pena</h2>
        <p className="text-xs text-text-secondary">
          Este delito no tiene penas definidas en el catálogo.
        </p>
      </div>
    );
  }

  if (tienePrision && !tieneMulta) {
    onChange({ pena_seleccionada: 'prision' });
    onNext();
    return null;
  }

  if (!tienePrision && tieneMulta) {
    onChange({ pena_seleccionada: 'multa' });
    onNext();
    return null;
  }

  return (
    <div>
      <h2 className="font-bold text-base text-text mb-2">Tipo de pena</h2>
      <p className="text-xs text-text-secondary mb-3">
        Este delito admite pena alternativa. Seleccione el tipo de pena a calcular.
      </p>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => { onChange({ pena_seleccionada: 'prision' }); onNext(); }}
          className={cn(
            'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
            current?.pena_seleccionada === 'prision'
              ? 'border-accent bg-accent/10'
              : 'border-border bg-surface hover:border-accent/50',
          )}
        >
          <p className="font-semibold text-sm text-text">Prisión</p>
          <p className="text-xs text-text-muted">Pena privativa de libertad</p>
        </button>
        <button
          type="button"
          onClick={() => { onChange({ pena_seleccionada: 'multa' }); onNext(); }}
          className={cn(
            'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
            current?.pena_seleccionada === 'multa'
              ? 'border-accent bg-accent/10'
              : 'border-border bg-surface hover:border-accent/50',
          )}
        >
          <p className="font-semibold text-sm text-text">Multa</p>
          <p className="text-xs text-text-muted">Pena alternativa no privativa</p>
        </button>
      </div>
    </div>
  );
}
