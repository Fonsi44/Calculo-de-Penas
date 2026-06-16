'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/ui';
import { meses_a_texto } from '@/lib/utils';
import { useSupuestosPenales, type SupuestoPenalUI, type AgravanteEspecificaUI } from './hooks';
import { AlertTriangle, Layers, Plus, X } from 'lucide-react';

interface Props {
  delitoId: string;
  supuestoPenalId: string | null | undefined;
  agravantesEspecificasIds: string[] | undefined;
  onChange: (patch: { supuesto_penal_id?: string | null; agravantes_especificas_ids?: string[] }) => void;
}

/**
 * Fase 5 — Selector de supuesto penal (modalidad específica del tipo).
 *
 * Se muestra cuando el delito seleccionado tiene modalidades específicas
 * cargadas desde `supuestos_penales`. Permite al usuario:
 *  - Elegir una modalidad concreta (refina la pena base).
 *  - Marcar agravantes específicas del tipo (amplían el marco legal).
 *
 * Si el delito no tiene modalidades, el componente no renderiza nada
 * (la calculadora usa la pena base genérica).
 */
export function SelectorSupuestoPenal({
  delitoId,
  supuestoPenalId,
  agravantesEspecificasIds,
  onChange,
}: Props) {
  const { supuestos, loading, error } = useSupuestosPenales(delitoId);

  if (loading) {
    return (
      <div className="p-3 bg-surface border border-border rounded-md">
        <p className="text-xs text-text-muted">Cargando modalidades del delito…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 p-3 bg-warning-bg border border-warning/30 rounded-md">
        <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">{error}</p>
      </div>
    );
  }

  // Si no hay modalidades específicas, no renderizar nada.
  if (supuestos.length === 0) return null;

  const supuestoSeleccionado = supuestos.find(s => s.id === supuestoPenalId) ?? null;
  const idsSeleccionados = agravantesEspecificasIds ?? [];

  const toggleAgravante = (id: string) => {
    const next = idsSeleccionados.includes(id)
      ? idsSeleccionados.filter(x => x !== id)
      : [...idsSeleccionados, id];
    onChange({ agravantes_especificas_ids: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-accent" />
        <h3 className="font-bold text-sm text-text">Modalidad del delito</h3>
      </div>
      <p className="text-xs text-text-secondary">
        Este delito tiene modalidades específicas con penas diferenciadas. Selecciona la que aplica al caso.
      </p>

      {/* Selector de modalidad */}
      <div className="space-y-2">
        {supuestos.map((s: SupuestoPenalUI) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange({ supuesto_penal_id: s.id })}
            className={cn(
              'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
              supuestoPenalId === s.id
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface hover:border-accent/50',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text">
                  {s.numeral ? `Numeral ${s.numeral}` : 'Modalidad única'}
                  {s.texto_modalidad ? ` — ${s.texto_modalidad}` : ''}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Pena: {meses_a_texto(s.pena_min_meses)} a {meses_a_texto(s.pena_max_meses)} · {s.tipo_pena === 'perpetuidad' ? 'Prisión perpetuidad' : s.tipo_pena === 'multa' ? 'Multa' : 'Prisión'}
                </p>
                {s.observaciones && (
                  <p className="text-xs text-text-secondary mt-1 italic">{s.observaciones}</p>
                )}
              </div>
              {s.tiene_agravantes_especificas && (
                <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warning/15 text-warning">
                  + Agravantes
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Agravantes específicas de la modalidad seleccionada */}
      {supuestoSeleccionado && supuestoSeleccionado.agravantes_especificas.length > 0 && (
        <Fragment>
          <div className="pt-2 border-t border-border">
            <h4 className="font-semibold text-xs text-text mb-1">
              Agravantes específicas del tipo (Art. {supuestoSeleccionado.agravantes_especificas[0]?.articulo_cp} CP)
            </h4>
            <p className="text-xs text-text-secondary mb-2">
              Estas agravantes amplían el marco legal de la pena. Márcalas si concurren en el caso.
            </p>
            <div className="space-y-1.5">
              {supuestoSeleccionado.agravantes_especificas.map((a: AgravanteEspecificaUI) => {
                const seleccionada = idsSeleccionados.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAgravante(a.id)}
                    className={cn(
                      'w-full text-left p-2 rounded-md border transition-all flex items-start gap-2 focus-visible:outline-none',
                      seleccionada
                        ? 'border-danger bg-danger/5'
                        : 'border-border bg-surface hover:border-danger/40',
                    )}
                  >
                    <span className={cn(
                      'shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center',
                      seleccionada ? 'bg-danger border-danger text-white' : 'border-border',
                    )}>
                      {seleccionada ? <Plus size={10} /> : <X size={10} className="opacity-0" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-text">{a.texto_agravante}</span>
                      <span className="block text-[10px] text-text-muted mt-0.5">
                        {a.numeral ? `Numeral ${a.numeral} · ` : ''}Aumento: +{a.fraccion_aumento}
                        {a.obligatoria ? ' · Obligatoria' : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}
