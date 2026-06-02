'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Loader } from 'lucide-react';
import Link from 'next/link';

interface ArticuloCP {
  id: number;
  articulo: string;
  epigrafe: string | null;
  texto: string;
  libro: string | null;
}

interface ArticleModalProps {
  articuloRef: string | null;
  onClose: () => void;
}

export function ArticleModal({ articuloRef, onClose }: ArticleModalProps) {
  const [article, setArticle] = useState<ArticuloCP | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articuloRef) return;
    setLoading(true);
    setError(null);
    setArticle(null);

    const num = articuloRef.match(/\d+/)?.[0];
    if (!num) {
      setError('Referencia no encontrada');
      setLoading(false);
      return;
    }

    fetch(`/api/cp?busqueda=Art. ${num}&limit=1`)
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!found) throw new Error('Artículo no disponible en la biblioteca');
        setArticle(found);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [articuloRef]);

  if (!articuloRef) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-overlay" />
      <div
        className="relative bg-surface rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            <span className="font-bold text-sm text-primary">Artículo del CP</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-text-muted mb-1">{articuloRef}</p>
              <p className="text-xs text-text-muted">{error}</p>
            </div>
          ) : article ? (
            <>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{article.epigrafe || ''}</p>
              <h3 className="text-base font-extrabold text-primary mb-3">{article.articulo}</h3>
              <div className="text-sm text-text leading-6 whitespace-pre-line font-serif">
                {article.texto}
              </div>
              <Link
                href={`/cp/${article.id}`}
                className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-accent hover:text-accent-light transition-colors"
                onClick={onClose}
              >
                Ver en la biblioteca completa →
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
