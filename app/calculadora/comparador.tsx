'use client';

import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { meses_a_texto } from '@/lib/utils';
import type { DelitoConfig } from '../types';
import type { ResultadoCalculo } from '@/lib/calculo';

interface Escenario {
  id: string;
  nombre: string;
  configs: DelitoConfig[];
  tipoConcurso: string;
  resultado: ResultadoCalculo | null;
}

interface Props {
  escenarios: Escenario[];
  escenarioActivo: string | null;
  onSeleccionar: (id: string) => void;
  onDuplicar: () => void;
  onEliminar: (id: string) => void;
  onVolver: () => void;
}

export function ComparadorView({ escenarios, escenarioActivo, onSeleccionar, onDuplicar, onEliminar, onVolver }: Props) {
  const activo = escenarios.find(e => e.id === escenarioActivo);
  const otros = escenarios.filter(e => e.id !== escenarioActivo);

  return (
    <div className="space-y-3">
      <Card padding="md" tone="accent" className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base text-text">Comparación de escenarios</h2>
          <p className="text-xs text-text-secondary">{escenarios.length} escenario{escenarios.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onDuplicar} iconLeft={<Plus size={14} />}>
            Duplicar
          </Button>
          <Button variant="ghost" size="sm" onClick={onVolver}>
            Volver
          </Button>
        </div>
      </Card>

      {escenarios.length === 0 ? (
        <Card padding="md" className="text-center">
          <p className="text-sm text-text-secondary">Duplica un escenario para comparar variantes.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-2">
          {activo && (
            <EscenarioCard escenario={activo} activo onSelect={() => {}} onDelete={() => onEliminar(activo.id)} />
          )}
          {otros.map(e => (
            <EscenarioCard
              key={e.id}
              escenario={e}
              activo={false}
              onSelect={() => onSeleccionar(e.id)}
              onDelete={() => onEliminar(e.id)}
            />
          ))}
        </div>
      )}

      {escenarios.length >= 2 && (
        <Card padding="md" tone="default" className="bg-surface-alt">
          <h3 className="font-bold text-sm text-text mb-2">Diferencias entre escenarios</h3>
          <ComparacionDirecta escenarios={escenarios} />
        </Card>
      )}
    </div>
  );
}

function EscenarioCard({ escenario, activo, onSelect, onDelete }: { escenario: Escenario; activo: boolean; onSelect: () => void; onDelete: () => void }) {
  const r = escenario.resultado;
  return (
    <Card padding="md" className={activo ? 'border-accent border-2' : ''}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {!activo && (
            <button type="button" onClick={onSelect} className="p-1 hover:bg-surface-alt rounded">
              <ArrowRight size={14} className="text-accent" />
            </button>
          )}
          <p className="font-bold text-sm text-text">{escenario.nombre}</p>
        </div>
        <button type="button" onClick={onDelete} className="p-1 hover:bg-danger-bg rounded" aria-label="Eliminar escenario">
          <Trash2 size={14} className="text-danger" />
        </button>
      </div>
      {r ? (
        <div className="space-y-1">
          <p className="text-lg font-extrabold text-primary font-serif">{r.pena_principal}</p>
          <p className="text-xs text-text-secondary">
            Penalidad individual: {r.delitos_analizados.length} delito{r.delitos_analizados.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {r.delitos_analizados.map((d, i) => (
              <Badge key={i} tone="primary">{d.nombre.slice(0, 20)}</Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted italic">Sin calcular</p>
      )}
    </Card>
  );
}

function ComparacionDirecta({ escenarios }: { escenarios: Escenario[] }) {
  const penasMin = escenarios.map(e => e.resultado?.pena_principal_minimo_meses ?? 0);
  const penasMax = escenarios.map(e => e.resultado?.pena_principal_maximo_meses ?? 0);
  const minGlobal = Math.min(...penasMin);
  const maxGlobal = Math.max(...penasMax);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-secondary w-32">Rango global:</span>
        <span className="font-bold text-primary">{meses_a_texto(minGlobal)} a {meses_a_texto(maxGlobal)}</span>
      </div>
      {escenarios.map((e, i) => {
        const r = e.resultado;
        if (!r) return null;
        const diffMin = r.pena_principal_minimo_meses - minGlobal;
        return (
          <div key={i} className="flex items-center gap-2 pl-4 border-l-2 border-border">
            <span className="font-semibold text-text-secondary w-32">{e.nombre}:</span>
            <span className="text-text">{meses_a_texto(r.pena_principal_minimo_meses)} a {meses_a_texto(r.pena_principal_maximo_meses)}</span>
            {diffMin !== 0 && (
              <Badge tone={diffMin < 0 ? 'mitigation' : 'aggravation'}>
                {diffMin < 0 ? '-' : '+'}{Math.abs(diffMin)} meses
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
