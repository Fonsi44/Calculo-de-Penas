'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, FileText, ArrowRight, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { useDebounce } from '@/hooks/use-debounce';
import { pluralizar } from '@/lib/ui';

interface ArticuloCP {
  id: number;
  articulo: string;
  libro: string | null;
  titulo: string | null;
  capitulo: string | null;
  seccion: string | null;
  epigrafe: string | null;
  texto: string;
  tema: string | null;
}

interface ArticuloResponse {
  data: ArticuloCP[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const TEMA_LABELS: Record<string, string> = {
  delitos: 'Delitos',
  garantias_penales: 'Garantías penales',
  circunstancias: 'Circunstancias',
  consecuencias_juridicas: 'Consecuencias jurídicas',
  hecho_penal: 'Hecho penal',
  autoria_participacion: 'Autoría y participación',
  parte_general: 'Parte general',
  penas: 'Penas',
  ejecucion_medidas: 'Ejecución',
  responsabilidad_civil: 'Resp. civil',
  prescripcion: 'Prescripción',
  ejecucion: 'Ejecución',
  autoria: 'Autoría',
};

function ubicacion(a: ArticuloCP): string {
  const partes = [a.libro, a.titulo, a.capitulo, a.seccion].filter(Boolean);
  return partes.join(' › ') || '';
}

const PAGE_SIZE = 30;

export default function BibliotecaCP() {
  const [articulos, setArticulos] = useState<ArticuloCP[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tema, setTema] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0); // eslint-disable-line react-hooks/set-state-in-effect -- reset page on filter change
  }, [debouncedSearch, tema]);

  useEffect(() => {
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- fetch hydration
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('busqueda', debouncedSearch);
    if (tema) params.set('tema', tema);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    fetch(`/api/cp?${params.toString()}`)
      .then(r => r.json())
      .then((data: ArticuloResponse | ArticuloCP[]) => {
        if (Array.isArray(data)) {
          setArticulos(data);
          setTotal(data.length);
        } else {
          setArticulos(data.data);
          setTotal(data.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tema, debouncedSearch, page]);

  useEffect(() => {
    fetch('/api/cp?count=1')
      .then(r => r.json())
      .then(d => {
        if (typeof d.total === 'number') setTotal(prev => prev || d.total);
      })
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell
      title="Código Penal de Honduras"
      subtitle={`Decreto 130-2017 y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024) · ${pluralizar(total, 'artículo', 'artículos')}`}
    >
      <div className="p-3 max-w-5xl mx-auto">
        <div className="relative mb-3">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por artículo, epígrafe o texto..."
            iconLeft={<Search size={16} />}
            iconRight={search ? (
              <button type="button" onClick={() => setSearch('')} aria-label="Limpiar">
                <X size={16} />
              </button>
            ) : undefined}
          />
        </div>

        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setTema(null)}
            className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              !tema ? 'bg-accent border-accent text-primary' : 'bg-surface border-border text-text-secondary hover:border-accent'
            }`}
          >
            Todos
            <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
              !tema ? 'bg-primary text-accent' : 'bg-surface-alt text-text-secondary'
            }`}>{total}</span>
          </button>
          {Object.entries(TEMA_LABELS).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTema(tema === id ? null : id)}
              className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                tema === id ? 'bg-accent border-accent text-primary' : 'bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <CenteredSpinner label="Buscando artículos..." />
        ) : articulos.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={48} />}
            title="Sin resultados"
            description="Modifica la búsqueda o selecciona otro tema."
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-2">
              {articulos.map(a => (
                <Card key={a.id} padding="none" className="hover:shadow-md transition-shadow">
                  <Link href={`/cp/${a.id}`} className="block p-3 focus-visible:outline-none">
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-text mb-1">{a.articulo}</h3>
                        {a.epigrafe && (
                          <p className="font-semibold text-xs text-text-secondary leading-4">{a.epigrafe}</p>
                        )}
                      </div>
                      <ArrowRight size={16} className="text-text-muted flex-shrink-0 mt-1" />
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-3 leading-5 mb-2 font-serif">
                      {a.texto}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <FileText size={14} className="text-accent flex-shrink-0" />
                      {a.tema && <Badge tone="primary">{TEMA_LABELS[a.tema] || a.tema}</Badge>}
                    </div>

                    {ubicacion(a) && (
                      <p className="text-text-muted text-[11px] italic truncate">{ubicacion(a)}</p>
                    )}
                  </Link>

                  <div className="flex border-t border-border-light">
                    <Link
                      href={`/cp/${a.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold text-primary hover:bg-surface-alt"
                    >
                      <ArrowRight size={14} />
                      Ver detalle
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  iconLeft={<ChevronLeft size={14} />}
                >
                  Anterior
                </Button>
                <span className="text-[11px] text-text-muted tabular-nums">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  iconRight={<ChevronRight size={14} />}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
