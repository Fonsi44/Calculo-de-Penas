'use client';

import { Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DelitoConfig } from '@/lib/types';

interface Props {
  configs: DelitoConfig[];
  onAddAnother: () => void;
  onRemove: (idx: number) => void;
  onNext: (step: number) => void;
}

export function Paso5DelitosList({ configs, onAddAnother, onRemove, onNext }: Props) {
  return (
    <div>
      <h2 className="font-bold text-base text-text mb-2">Delitos configurados</h2>
      <div className="space-y-2 mb-4">
        {configs.map((c, i) => (
          <Card key={i} padding="sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text truncate">{c.delito.nombre}</p>
                <p className="text-xxs text-text-muted">{c.delito.articulo}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Quitar ${c.delito.nombre}`}
                className="w-9 h-9 flex items-center justify-center rounded text-danger hover:bg-danger-bg"
              >
                <X size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="secondary" fullWidth size="lg" onClick={onAddAnother} iconLeft={<Plus size={16} />}>
        Añadir otro delito
      </Button>

      {configs.length > 0 && (
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="mt-3"
          onClick={() => onNext(configs.length > 1 ? 6 : 7)}
        >
          {configs.length > 1 ? 'Configurar concurso' : 'Ver resumen'}
        </Button>
      )}
    </div>
  );
}
