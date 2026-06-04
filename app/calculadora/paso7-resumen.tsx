'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AGRAVANTES, ATENUANTES, EXIMENTES, GRADOS_AUTORIA, GRADOS_EJECUCION, TIPOS_CONCURSO } from '@/lib/catalogos';
import type { DelitoConfig } from '../types';

interface Props {
  configs: DelitoConfig[];
  tipoConcurso: string;
  error: string | null;
  calculating: boolean;
  onCalcular: () => void;
}

export function Paso7Resumen({ configs, tipoConcurso, error, calculating, onCalcular }: Props) {
  return (
    <div>
      <h2 className="font-bold text-base text-text mb-3">Resumen del cálculo</h2>
      {configs.map((c, i) => (
        <Card key={i} padding="md" className="mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">#{i + 1}</span>
            <p className="font-bold text-sm text-text flex-1">{c.delito.nombre}</p>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-text-muted tabular-nums">
            <span>Artículo: {c.delito.articulo}</span>
            <span>Pena: {c.pena_seleccionada === 'prision' ? 'Prisión' : 'Multa'}</span>
            <span>Autoría: {GRADOS_AUTORIA.find(g => g.id === c.grado_autoria)?.nombre}</span>
            <span>Ejecución: {GRADOS_EJECUCION.find(g => g.id === c.grado_ejecucion)?.nombre}</span>
          </div>
          {(c.agravantes.length > 0 || c.atenuantes.length > 0 || c.eximentes.length > 0 || c.eximente_completa) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {c.eximente_completa && (
                <Badge tone="exemption">
                  Eximente: {EXIMENTES.find(e => e.id === c.eximente_completa)?.nombre}
                </Badge>
              )}
              {c.eximentes.map(eid => (
                <Badge key={eid} tone="exemption">
                  Eximente incompleta: {EXIMENTES.find(e => e.id === eid)?.nombre}
                </Badge>
              ))}
              {c.agravantes.map(aid => (
                <Badge key={aid} tone="aggravation">
                  {AGRAVANTES.find(a => a.id === aid)?.nombre}
                </Badge>
              ))}
              {c.atenuantes.map(aid => (
                <Badge key={aid} tone="mitigation">
                  {ATENUANTES.find(a => a.id === aid)?.nombre}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      ))}

      {tipoConcurso !== 'ninguno' && (
        <div className="bg-accent/10 border border-accent/30 rounded-md p-3 mb-3">
          <p className="text-xs font-bold text-primary">
            Concurso: {TIPOS_CONCURSO.find(tc => tc.id === tipoConcurso)?.nombre}
          </p>
        </div>
      )}

      {error && (
        <Card padding="md" tone="danger" className="mb-3 text-center">
          <p className="text-sm font-bold text-danger mb-1">Error al calcular</p>
          <p className="text-xs text-text-secondary mb-3">{error}</p>
          <Button variant="danger" size="sm" onClick={onCalcular}>Reintentar</Button>
        </Card>
      )}

      <Button
        variant="primary"
        fullWidth
        size="lg"
        loading={calculating}
        onClick={onCalcular}
      >
        {calculating ? 'Calculando...' : 'Calcular pena'}
      </Button>
    </div>
  );
}
