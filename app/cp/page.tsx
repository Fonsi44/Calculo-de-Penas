'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronLeft, BookOpen, FileText, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { pluralizar } from '@/lib/ui';

interface ArticuloCP {
  id: number;
  articulo: string;
  libro: string | null;
  titulo: string | null;
  capitulo: string | null;
  epigrafe: string | null;
  texto: string;
  tema: string | null;
}

const TEMAS = [
  { id: 'penas', label: 'Penas' },
  { id: 'ejecucion', label: 'Ejecución' },
  { id: 'autoria', label: 'Autoría' },
  { id: 'eximentes', label: 'Eximentes' },
  { id: 'atenuantes', label: 'Atenuantes' },
  { id: 'agravantes', label: 'Agravantes' },
  { id: 'concursos', label: 'Concursos' },
];

export default function BibliotecaCP() {
  const [articulos, setArticulos] = useState<ArticuloCP[]>([]);
  const [search, setSearch] = useState('');
  const [tema, setTema] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('busqueda', debouncedSearch);
    if (tema) params.set('tema', tema);
    params.set('limit', '200');

    fetch(`/api/cp?${params.toString()}`)
      .then(r => r.json())
      .then(data => setArticulos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tema, debouncedSearch]);

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="bg-primary px-3 py-2">
        <div className="flex items-center">
          <Link href="/" aria-label="Volver al inicio" className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center mr-2 hover:bg-white/25">
            <ChevronLeft size={18} className="text-text-inverse" />
          </Link>
          <div className="flex-1">
            <h1 className="text-text-inverse font-bold text-sm">Código Penal de Honduras</h1>
            <p className="text-[11px] text-text-inverse/70">Decreto 130-2017 · {pluralizar(articulos.length, 'artículo', 'artículos')}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-accent/20 flex items-center justify-center">
            <BookOpen size={16} className="text-accent" />
          </div>
        </div>
      </div>

      <div className="bg-primary pb-2">
        <div className="relative mx-3 mb-2">
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

        <div className="flex gap-1.5 px-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setTema(null)}
            className={`h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
              !tema ? 'bg-accent border-accent text-primary' : 'bg-white/10 border-white/20 text-text-inverse hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          {TEMAS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTema(tema === t.id ? null : t.id)}
              className={`h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                tema === t.id ? 'bg-accent border-accent text-primary' : 'bg-white/10 border-white/20 text-text-inverse hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <CenteredSpinner label="Buscando artículos..." />
        ) : articulos.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="Sin resultados"
            description="Modifica la búsqueda o selecciona otro tema."
          />
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {articulos.map(a => (
              <Link
                key={a.id}
                href={`/cp/${a.id}`}
                className="block bg-surface border border-border-light rounded-md p-3 hover:shadow-md transition-shadow focus-visible:outline-none"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-primary">{a.articulo}</p>
                    {a.epigrafe && (
                      <p className="font-semibold text-sm text-text">{a.epigrafe}</p>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-text-muted flex-shrink-0 mt-1" />
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 leading-4 mb-1">
                  {a.texto}
                </p>
                <div className="flex items-center gap-2">
                  {a.tema && <Badge tone="primary">{a.tema}</Badge>}
                  {a.libro && <span className="text-[11px] text-text-muted">{a.libro}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
