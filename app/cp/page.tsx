'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronLeft, BookOpen, FileText, ArrowRight } from 'lucide-react';

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

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('busqueda', search);
    if (tema) params.set('tema', tema);
    params.set('limit', '200');

    fetch(`/api/cp?${params.toString()}`)
      .then(r => r.json())
      .then(data => setArticulos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tema]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="bg-primary px-3 py-2">
        <div className="flex items-center">
          <Link href="/" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-2 hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-sm">Código Penal de Honduras</h1>
            <p className="text-[#C9D1DD] text-[10px]">Decreto 130-2017 · {articulos.length} artículos</p>
          </div>
          <div className="w-8 h-8 rounded-md bg-accent/20 flex items-center justify-center">
            <BookOpen size={18} className="text-accent" />
          </div>
        </div>
      </div>

      <div className="bg-primary pb-2">
        <form onSubmit={handleSearch} className="flex items-center bg-white mx-3 px-3 py-2 rounded-lg shadow-sm mb-2">
          <Search size={16} className="text-text-muted mr-2" />
          <input
            className="flex-1 text-sm text-text outline-none bg-transparent py-1"
            placeholder="Buscar por artículo, epígrafe o texto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); load(); }}>
              <X size={16} className="text-text-muted" />
            </button>
          )}
        </form>

        <div className="flex gap-1.5 px-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setTema(null)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border transition-colors ${
              !tema ? 'bg-accent border-accent text-primary' : 'bg-white/10 border-white/15 text-[#D5DDEA] hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          {TEMAS.map(t => (
            <button
              key={t.id}
              onClick={() => setTema(tema === t.id ? null : t.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border transition-colors ${
                tema === t.id ? 'bg-accent border-accent text-primary' : 'bg-white/10 border-white/15 text-[#D5DDEA] hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articulos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-text-muted">
            <FileText size={48} className="mb-2 opacity-50" />
            <p className="font-bold text-base text-text">Sin resultados</p>
            <p className="text-sm">Modifica la búsqueda o selecciona otro tema.</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {articulos.map(a => (
              <Link
                key={a.id}
                href={`/cp/${a.id}`}
                className="block bg-surface border border-border-light rounded-lg p-3 hover:shadow-md transition-shadow"
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
                <p className="text-xs text-text-muted line-clamp-2 leading-4 mb-1">
                  {a.texto}
                </p>
                <div className="flex items-center gap-2">
                  {a.tema && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                      {a.tema}
                    </span>
                  )}
                  {a.libro && (
                    <span className="text-[10px] text-text-muted">{a.libro}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
