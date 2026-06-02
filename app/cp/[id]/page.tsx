'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Gavel, ExternalLink } from 'lucide-react';

interface ArticuloCP {
  id: number;
  articulo: string;
  libro: string | null;
  titulo: string | null;
  capitulo: string | null;
  epigrafe: string | null;
  texto: string;
  tema: string | null;
  delitos_relacionados?: { id: string; nombre: string; articulo: string }[];
}

export default function ArticuloCPPage() {
  const params = useParams();
  const [articulo, setArticulo] = useState<ArticuloCP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    fetch(`/api/cp/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setArticulo(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !articulo) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="font-bold text-lg text-danger mb-2">Artículo no encontrado</p>
          <p className="text-sm text-text-muted mb-4">{error || 'El artículo solicitado no existe'}</p>
          <Link href="/cp" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors">
            Volver a la biblioteca
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="bg-primary px-3 py-2">
        <div className="flex items-center">
          <Link href="/cp" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-2 hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-sm truncate">{articulo.articulo}</h1>
            <p className="text-[#C9D1DD] text-[10px]">Código Penal de Honduras</p>
          </div>
          <div className="w-8 h-8 rounded-md bg-accent/20 flex items-center justify-center">
            <BookOpen size={18} className="text-accent" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface border border-accent/30 rounded-lg p-4 shadow-md mb-3">
            {articulo.epigrafe && (
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{articulo.epigrafe}</p>
            )}
            <h2 className="text-lg font-extrabold text-primary mb-3">{articulo.articulo}</h2>
            <div className="text-sm text-text leading-6 whitespace-pre-line font-serif">
              {articulo.texto}
            </div>
          </div>

          <div className="bg-surface border border-border-light rounded-lg p-3 mb-3">
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              {articulo.libro && (
                <>
                  <span className="font-semibold text-text">Libro:</span>
                  <span>{articulo.libro}</span>
                </>
              )}
              {articulo.titulo && (
                <>
                  <span className="font-semibold text-text">Título:</span>
                  <span>{articulo.titulo}</span>
                </>
              )}
              {articulo.capitulo && (
                <>
                  <span className="font-semibold text-text">Capítulo:</span>
                  <span>{articulo.capitulo}</span>
                </>
              )}
              {articulo.tema && (
                <>
                  <span className="font-semibold text-text">Tema:</span>
                  <span className="uppercase">{articulo.tema}</span>
                </>
              )}
            </div>
          </div>

          {articulo.delitos_relacionados && articulo.delitos_relacionados.length > 0 && (
            <div className="bg-surface border border-border-light rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Gavel size={14} className="text-accent" />
                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Delitos relacionados</h3>
              </div>
              <div className="space-y-1">
                {articulo.delitos_relacionados.map(d => (
                  <Link
                    key={d.id}
                    href={`/delito-form?id=${d.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    <ExternalLink size={12} className="text-text-muted flex-shrink-0" />
                    <span className="font-semibold text-text flex-1 truncate">{d.nombre}</span>
                    <span className="text-[10px] text-text-muted">{d.articulo}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <Link
              href="/cp"
              className="flex-1 py-2.5 rounded-md border border-border text-center text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
            >
              Volver a biblioteca
            </Link>
            <Link
              href={`/cp?busqueda=${encodeURIComponent(articulo.tema || '')}`}
              className="flex-1 py-2.5 rounded-md bg-primary text-center text-white text-sm font-bold hover:bg-primary-light transition-colors"
            >
              Ver más {articulo.tema || 'relacionados'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
