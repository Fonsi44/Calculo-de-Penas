'use client';

import { Search, X, Search as SearchIcon, CheckCircle2 } from 'lucide-react';
import type { Delito, DelitoConfig } from '../types';
import { BannerCalidadDatos } from './banner-calidad-datos';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  filtered: Delito[];
  search: string;
  setSearch: (s: string) => void;
  configs: DelitoConfig[];
  current: DelitoConfig | undefined;
  selectDelito: (d: Delito) => void;
  removeDelito: (i: number) => void;
  pendientesConfirmados: Record<string, boolean>;
  setPendientesConfirmados: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOpenArticle: (ref: string | null) => void;
}

export function Paso1Delito({
  filtered,
  search,
  setSearch,
  configs,
  current,
  selectDelito,
  removeDelito,
  pendientesConfirmados,
  setPendientesConfirmados,
}: Props) {
  return (
    <div>
      <BannerCalidadDatos />
      <div className="relative mb-3">
        <Input
          iconLeft={<Search size={16} />}
          placeholder="Buscar delito por nombre, artículo o conducta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          iconRight={search ? (
            <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
              <X size={16} />
            </button>
          ) : undefined}
        />
      </div>

      {configs.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-text-secondary mb-1.5">Delitos configurados</p>
          <div className="space-y-1.5">
            {configs.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-2 rounded-md">
                <span className="text-xs font-bold text-primary flex-1 truncate">{c.delito.nombre}</span>
                <Badge tone="accent">{c.delito.articulo}</Badge>
                <button
                  type="button"
                  onClick={() => removeDelito(i)}
                  aria-label={`Quitar ${c.delito.nombre}`}
                  className="w-7 h-7 flex items-center justify-center rounded text-danger hover:bg-danger-bg"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={40} />}
          title="Sin resultados"
          description="Modifica la búsqueda."
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => selectDelito(d)}
              className="w-full text-left bg-surface border border-border-light rounded-md p-3 hover:shadow-md transition-shadow focus-visible:outline-none"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {d.estado === 'verificado' && <CheckCircle2 size={14} className="text-mitigation flex-shrink-0" />}
                    <p className="font-semibold text-sm text-text">{d.nombre}</p>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">{d.articulo} · {d.clasificacion}</p>
                </div>
                {d.estado === 'verificado' && (
                  <Badge tone="mitigation">Verificado</Badge>
                )}
                {d.estado === 'pendiente_revision' && (
                  <Badge tone="warning">Revisar</Badge>
                )}
                {d.estado === 'rechazado' && (
                  <Badge tone="danger">No verificado</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {current?.delito && (current.delito.estado === 'pendiente_revision' || current.delito.estado === 'rechazado') && (
        <div className="mt-3 border-2 border-warning rounded-md p-3 bg-warning-bg">
          <p className="text-xs font-bold text-text mb-1">Artículo no verificado contra la fuente oficial</p>
          <p className="text-[11px] text-text-secondary mb-2">
            {current.delito.estado_nota || 'El par (delito, artículo) no superó la validación automática TF-IDF. Verifique manualmente contra el CP (Decreto 130-2017) antes de continuar.'}
          </p>
          {current.delito.estado_articulo_sugerido && (
            <p className="text-[11px] text-text-secondary mb-2">
              Sugerencia del validador: <strong>{current.delito.estado_articulo_sugerido}</strong>
            </p>
          )}
          <label className="flex items-start gap-2 text-xs text-text cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={!!pendientesConfirmados[current.delito.id]}
              onChange={e => setPendientesConfirmados(prev => ({ ...prev, [current.delito.id]: e.target.checked }))}
            />
            <span>Confirmo que verifiqué el artículo <strong>{current.delito.articulo}</strong> contra la fuente oficial y asumo la responsabilidad del uso.</span>
          </label>
        </div>
      )}
    </div>
  );
}
