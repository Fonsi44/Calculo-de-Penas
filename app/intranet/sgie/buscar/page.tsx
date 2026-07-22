'use client';

import { useState, useCallback } from 'react';
import { Search, X, FileText, Users, Briefcase, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

interface SearchResult {
  id: string; resourceType: string; resourceId: string;
  expedienteId: string | null; title: string;
  snippet: string; pageNumber: number | null;
  documentVersionId: number | null;
  score: number; matchType: string; updatedAt: string;
}

export default function SgieBuscarPage() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: '20' });
      if (resourceType) params.set('resourceType', resourceType);
      const resp = await fetch(`/api/sgie/buscar?${params}`);
      if (!resp.ok) {
        if (resp.status === 403) setError('No tiene permisos para buscar.');
        else if (resp.status === 429) setError('Demasiadas búsquedas. Espere un momento.');
        else setError('Error al buscar. Intente de nuevo.');
        setResults([]);
        return;
      }
      const data = await resp.json();
      setResults(data.results || []);
    } catch {
      setError('Error de conexión.');
    } finally { setLoading(false); }
  }, [query, resourceType]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const navigateTo = (r: SearchResult) => {
    if (r.resourceType === 'document_page' && r.expedienteId) {
      router.push(`/intranet/sgie/expedientes/${r.expedienteId}`);
    } else if (r.expedienteId) {
      router.push(`/intranet/sgie/expedientes/${r.expedienteId}`);
    }
  };

  return (
    <div className="space-y-4" role="search" aria-label="Búsqueda SGIE">
      <h1 className="text-lg font-bold text-text">Búsqueda</h1>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar expedientes, documentos, clientes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Consulta de búsqueda"
        />
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="border border-border rounded-lg px-2 py-1 text-sm bg-surface text-text"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos</option>
          <option value="expediente">Expedientes</option>
          <option value="documento">Documentos</option>
          <option value="cliente">Clientes</option>
          <option value="tarea">Tareas</option>
          <option value="evento">Eventos</option>
          <option value="comunicacion">Comunicaciones</option>
        </select>
        <Button variant="primary" size="sm" onClick={handleSearch} loading={loading}>
          <Search size={14} /> Buscar
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg" role="alert">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : searched && results.length === 0 ? (
        <EmptyState icon={<Search size={24} />} title="Sin resultados" description={query ? `No se encontraron resultados para "${query}".` : 'Ingrese un término de búsqueda.'} />
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((r) => (
            <Card key={r.id} padding="sm" className="cursor-pointer hover:bg-surface-alt transition-colors" onClick={() => navigateTo(r)}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-accent-dark">{resourceTypeLabel(r.resourceType)}</span>
                    <span className="text-xs text-text-muted">{matchTypeLabel(r.matchType)}</span>
                    {r.pageNumber && <span className="text-xxs text-text-muted">pág. {r.pageNumber}</span>}
                  </div>
                  <p className="text-sm text-text truncate mt-0.5">{r.title}</p>
                  {r.snippet && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{r.snippet}</p>}
                </div>
                <ChevronRight size={14} className="text-text-muted flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
          <p className="text-xs text-text-muted text-center">{results.length} resultados</p>
        </div>
      ) : null}
    </div>
  );
}

function resourceTypeLabel(t: string): string {
  const m: Record<string, string> = { expediente: 'Expediente', documento: 'Documento', document_page: 'Página', cliente: 'Cliente', tarea: 'Tarea', evento: 'Evento', comunicacion: 'Comunicación' };
  return m[t] || t;
}

function matchTypeLabel(t: string): string {
  const m: Record<string, string> = { exact: 'Exacto', fts: 'Texto', trigram: 'Similar' };
  return m[t] || t;
}
