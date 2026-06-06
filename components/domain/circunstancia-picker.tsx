'use client';

import { Info, ShieldOff, Minus, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Badge } from '@/components/ui/badge';
import { AGRAVANTES, ATENUANTES, EXIMENTES } from '@/lib/catalogos';
import type { DelitoConfig } from '@/app/types';
import { cn } from '@/lib/ui';

interface Props {
  current: Partial<DelitoConfig>;
  onChange: (patch: Partial<DelitoConfig>) => void;
  onOpenArticle: (ref: string) => void;
}

export function CircunstanciaPicker({ current, onChange, onOpenArticle }: Props) {
  const agravantesCount = current.agravantes?.length || 0;
  const atenuantesCount = current.atenuantes?.length || 0;
  const eximenteCompleta = current.eximente_completa;
  const eximentesIncompletas = current.eximentes?.length || 0;

  const toggleAgravante = (id: string) => {
    onChange({ agravantes: toggle(current.agravantes || [], id) });
  };
  const toggleAtenuante = (id: string) => {
    onChange({ atenuantes: toggle(current.atenuantes || [], id) });
  };
  const toggleEximenteIncompleta = (id: string) => {
    onChange({
      eximentes: toggle(current.eximentes || [], id),
      eximente_completa: null,
    });
  };
  const toggleEximenteCompleta = (id: string) => {
    onChange({
      eximente_completa: eximenteCompleta === id ? null : id,
      eximentes: [],
    });
  };

  return (
    <div className="space-y-3">
      {/* Regla de compensación visible */}
      <Card padding="md" tone="default" className="bg-info-bg border-info/30">
        <div className="flex gap-2">
          <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary leading-5">
            <p className="font-semibold text-text mb-1">Regla de compensación (Art. 30-32 CP)</p>
            <p>
              <span className="font-semibold text-mitigation">Atenuantes</span> reducen la pena (mitad inferior).
              {' '}
              <span className="font-semibold text-aggravation">Agravantes</span> la aumentan (mitad superior).
              {' '}
              {agravantesCount === atenuantesCount
                ? 'Si el número es igual, se compensan y la pena se mantiene en el término medio.'
                : agravantesCount > atenuantesCount
                  ? `Hay ${agravantesCount - atenuantesCount} agravante(s) sin compensar.`
                  : `Hay ${atenuantesCount - agravantesCount} atenuante(s) sin compensar.`}
            </p>
          </div>
        </div>
      </Card>

      {/* Eximentes */}
      <Card padding="md" tone="default" className="border-l-4 border-l-exemption">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShieldOff size={16} className="text-exemption" />
            <h2 className="font-bold text-sm text-text">Eximentes</h2>
            {(eximenteCompleta || eximentesIncompletas > 0) && (
              <Badge tone="exemption">
                {eximenteCompleta ? '1 completa' : `${eximentesIncompletas} incompleta(s)`}
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenArticle('Art. 30 CP')}
            className="text-xxs text-accent-dark underline hover:text-accent font-semibold"
          >
            Art. 30 CP
          </button>
        </div>
        <p className="text-xxs text-text-secondary mb-3 italic">
          Excluyentes: si aplica una eximente completa, no hay pena. Las incompletas atenúan.
        </p>
        <div className="space-y-1.5">
          {EXIMENTES.map(e => {
            const isCompletaSelected = eximenteCompleta === e.id;
            const isIncompletaSelected = current.eximentes?.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => e.completa ? toggleEximenteCompleta(e.id) : toggleEximenteIncompleta(e.id)}
                aria-pressed={isCompletaSelected || isIncompletaSelected}
                className={cn(
                  'w-full text-left p-2.5 rounded-md border transition-all focus-visible:outline-none',
                  isCompletaSelected
                    ? 'border-exemption bg-exemption-bg'
                    : isIncompletaSelected
                      ? 'border-exemption/60 bg-exemption-bg/60'
                      : 'border-border bg-surface hover:border-exemption/50',
                )}
              >
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-text flex-1">{e.nombre}</p>
                  {e.completa ? (
                    <Badge tone="exemption" variant={isCompletaSelected ? 'solid' : 'soft'}>COMPLETA</Badge>
                  ) : (
                    isIncompletaSelected && <Badge tone="exemption">APLICA</Badge>
                  )}
                </div>
                <p className="text-xxs text-text-muted mt-0.5">
                  {e.articulo} · {e.descripcion}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Agravantes */}
      <Card padding="md" tone="default" className="border-l-4 border-l-aggravation">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-aggravation" />
            <h2 className="font-bold text-sm text-text">Agravantes</h2>
            {agravantesCount > 0 && <Badge tone="aggravation">{agravantesCount}</Badge>}
          </div>
          <button
            type="button"
            onClick={() => onOpenArticle('Art. 32 CP')}
            className="text-xxs text-accent-dark underline hover:text-accent font-semibold"
          >
            Art. 32 CP
          </button>
        </div>
        <p className="text-xxs text-text-secondary mb-3 italic">
          Aumentan la pena dentro de la mitad superior del marco penal.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {AGRAVANTES.map(a => (
            <Chip
              key={a.id}
              tone="aggravation"
              selected={current.agravantes?.includes(a.id) || false}
              onClick={() => toggleAgravante(a.id)}
            >
              {a.nombre}
            </Chip>
          ))}
        </div>
      </Card>

      {/* Atenuantes */}
      <Card padding="md" tone="default" className="border-l-4 border-l-mitigation">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Minus size={16} className="text-mitigation" />
            <h2 className="font-bold text-sm text-text">Atenuantes</h2>
            {atenuantesCount > 0 && <Badge tone="mitigation">{atenuantesCount}</Badge>}
          </div>
          <button
            type="button"
            onClick={() => onOpenArticle('Art. 31 CP')}
            className="text-xxs text-accent-dark underline hover:text-accent font-semibold"
          >
            Art. 31 CP
          </button>
        </div>
        <p className="text-xxs text-text-secondary mb-3 italic">
          Reducen la pena dentro de la mitad inferior del marco penal.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ATENUANTES.map(a => (
            <Chip
              key={a.id}
              tone="mitigation"
              selected={current.atenuantes?.includes(a.id) || false}
              onClick={() => toggleAtenuante(a.id)}
            >
              {a.nombre}
            </Chip>
          ))}
        </div>
      </Card>
    </div>
  );
}

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}
