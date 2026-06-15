'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { GRADOS_AUTORIA, GRADOS_EJECUCION } from '@/lib/catalogos';
import { cn } from '@/lib/ui';
import type { DelitoConfig } from '@/lib/types';

interface Props {
  current: DelitoConfig | undefined;
  onChange: (patch: Partial<DelitoConfig>) => void;
}

export function Paso3Participacion({ current, onChange }: Props) {
  return (
    <div>
      <Card padding="md" className="mb-3">
        <CardHeader title="Grado de autoría" />
        <div className="space-y-1.5">
          {GRADOS_AUTORIA.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange({ grado_autoria: g.id })}
              className={cn(
                'w-full text-left p-2.5 rounded-md border transition-all focus-visible:outline-none',
                current?.grado_autoria === g.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50',
              )}
            >
              <p className="font-semibold text-sm text-text">{g.nombre}</p>
              <p className="text-xxs text-text-muted">{g.descripcion} ({g.articulo})</p>
            </button>
          ))}
        </div>
      </Card>

      <Card padding="md" className="mb-3">
        <CardHeader title="Grado de ejecución" />
        <div className="space-y-1.5">
          {GRADOS_EJECUCION.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange({ grado_ejecucion: g.id })}
              className={cn(
                'w-full text-left p-2.5 rounded-md border transition-all focus-visible:outline-none',
                current?.grado_ejecucion === g.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50',
              )}
            >
              <p className="font-semibold text-sm text-text">{g.nombre}</p>
              <p className="text-xxs text-text-muted">{g.descripcion} ({g.articulo})</p>
            </button>
          ))}
        </div>
      </Card>

      {(current?.grado_ejecucion === 'tentativa_acabada' || current?.grado_ejecucion === 'tentativa_inacabada') && (
        <Card padding="md">
          <CardHeader title="Reducción por tentativa (Art. 62 CP)" />
          <div className="flex gap-2 items-center p-2.5 rounded-md border border-info/30 bg-info-bg">
            <p className="text-xs text-text-secondary leading-5">
              La reducción es <span className="font-semibold text-text">única y automática</span> según el tipo de tentativa:
              {current?.grado_ejecucion === 'tentativa_acabada'
                ? ' acabada → pena inferior en 1/4.'
                : ' inacabada → pena inferior en 1/3.'}
              El CP hondureño no contempla un segundo grado de reducción.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
