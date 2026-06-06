'use client';

import { ShieldOff, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AGRAVANTES, ATENUANTES, EXIMENTES, GRADOS_AUTORIA, GRADOS_EJECUCION, TIPOS_CONCURSO } from '@/lib/catalogos';
import { cn } from '@/lib/ui';
import type { DelitoConfig } from '../types';

interface Props {
  configs: DelitoConfig[];
  tipoConcurso: string;
  error: string | null;
  calculating: boolean;
  onCalcular: () => void;
}

function calcularMetricas(configs: DelitoConfig[]) {
  let totalAgravantes = 0;
  let totalAtenuantes = 0;
  let totalEximentes = 0;
  let hayComplice = false;
  let hayTentativa = false;

  for (const c of configs) {
    totalAgravantes += c.agravantes.length;
    totalAtenuantes += c.atenuantes.length + c.eximentes.length;
    totalEximentes += c.eximente_completa ? 1 : 0;
    if (c.grado_autoria === 'complice') hayComplice = true;
    if (c.grado_ejecucion === 'tentativa_acabada' || c.grado_ejecucion === 'tentativa_inacabada') hayTentativa = true;
  }
  return { totalAgravantes, totalAtenuantes, totalEximentes, hayComplice, hayTentativa };
}

export function Paso7Resumen({ configs, tipoConcurso, error, calculating, onCalcular }: Props) {
  const m = calcularMetricas(configs);
  const balance = m.totalAgravantes - m.totalAtenuantes;

  return (
    <div>
      <h2 className="font-bold text-base text-text mb-3">Resumen del cálculo</h2>

      {/* Dashboard visual */}
      <Card padding="md" tone="accent" className="mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xxs text-text-secondary uppercase tracking-wider mb-1">Delitos</p>
            <p className="text-xl font-extrabold text-primary">{configs.length}</p>
          </div>
          <div>
            <p className="text-xxs text-text-secondary uppercase tracking-wider mb-1">Agravantes</p>
            <p className={cn('text-xl font-extrabold', m.totalAgravantes > 0 ? 'text-aggravation' : 'text-text-muted')}>
              {m.totalAgravantes}
            </p>
          </div>
          <div>
            <p className="text-xxs text-text-secondary uppercase tracking-wider mb-1">Atenuantes</p>
            <p className={cn('text-xl font-extrabold', m.totalAtenuantes > 0 ? 'text-mitigation' : 'text-text-muted')}>
              {m.totalAtenuantes}
            </p>
          </div>
          <div>
            <p className="text-xxs text-text-secondary uppercase tracking-wider mb-1">Balance</p>
            <p className={cn(
              'text-xl font-extrabold',
              balance > 0 ? 'text-aggravation' : balance < 0 ? 'text-mitigation' : 'text-text-muted',
            )}>
              {balance > 0 ? '+' : ''}{balance}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border-light">
          <p className="text-xxs font-semibold text-text-secondary mb-2">Factores que afectan la pena:</p>
          <div className="flex flex-wrap gap-1.5">
            {m.hayTentativa && (
              <Badge tone="mitigation" variant="outline" size="md">
                <TrendingDown size={12} /> Tentativa
              </Badge>
            )}
            {m.hayComplice && (
              <Badge tone="mitigation" variant="outline" size="md">
                <TrendingDown size={12} /> Cómplice
              </Badge>
            )}
            {m.totalAgravantes > 0 && (
              <Badge tone="aggravation" variant="outline" size="md">
                <TrendingUp size={12} /> +{m.totalAgravantes} agravante{(m.totalAgravantes !== 1 ? 's' : '')}
              </Badge>
            )}
            {m.totalAtenuantes > 0 && (
              <Badge tone="mitigation" variant="outline" size="md">
                <TrendingDown size={12} /> -{m.totalAtenuantes} atenuante{(m.totalAtenuantes !== 1 ? 's' : '')}
              </Badge>
            )}
            {m.totalEximentes > 0 && (
              <Badge tone="exemption" variant="outline" size="md">
                <ShieldOff size={12} /> Eximente
              </Badge>
            )}
            {m.totalAgravantes === 0 && m.totalAtenuantes === 0 && !m.hayTentativa && !m.hayComplice && (
              <span className="text-xxs text-text-muted">Pena base sin modificaciones</span>
            )}
          </div>
        </div>
      </Card>

      {configs.map((c, i) => (
        <Card key={i} padding="md" className="mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xxs font-bold text-primary">#{i + 1}</span>
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
