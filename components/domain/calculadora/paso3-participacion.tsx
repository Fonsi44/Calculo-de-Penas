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
          <CardHeader title="Reducción por tentativa" />
          <div className="flex gap-2">
            {[1, 2].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ reduccion_tentativa: n })}
                className={cn(
                  'flex-1 h-10 rounded-md border font-semibold text-sm transition-all focus-visible:outline-none',
                  current?.reduccion_tentativa === n
                    ? 'border-accent bg-accent/10 text-accent-dark'
                    : 'border-border bg-surface text-text hover:border-accent/50',
                )}
              >
                {n} grado{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
