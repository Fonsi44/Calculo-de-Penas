'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, Plus, Gavel, Edit3, Trash2, BookOpen } from 'lucide-react';
import type { Delito } from '../types';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useDebounce } from '@/hooks/use-debounce';
import { formatRama } from '@/lib/ui';

export default function DelitosCatalog() {
  const toast = useToast();
  const confirm = useConfirm();

  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [ramas, setRamas] = useState<{ id: string; cantidad: number }[]>([]);
  const [search, setSearch] = useState('');
  const [activeRama, setActiveRama] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const debouncedSearch = useDebounce(search, 200);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [dRes, rRes] = await Promise.all([
        fetch('/api/delitos?limit=1000'),
        fetch('/api/clasificaciones'),
      ]);
      const dJson = await dRes.json();
      const rJson = await rRes.json();
      setDelitos(Array.isArray(dJson) ? dJson : []);
      setRamas(Array.isArray(rJson) ? rJson.map((r: any) => ({ id: r.nombre, cantidad: r.cantidad })) : []);
    } catch (e) {
      console.warn('load delitos', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = delitos.filter((d) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (
        !d.nombre.toLowerCase().includes(q) &&
        !d.articulo.toLowerCase().includes(q) &&
        !(d.conducta || '').toLowerCase().includes(q)
      ) return false;
    }
    if (activeRama && d.rama_id !== activeRama) return false;
    return true;
  });

  const handleDelete = async (delito: Delito) => {
    const ok = await confirm({
      title: `¿Eliminar "${delito.nombre}"?`,
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/delitos/${delito.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDelitos((prev) => prev.filter((d) => d.id !== delito.id));
        toast.success('Delito eliminado');
      } else {
        toast.danger('No se pudo eliminar');
      }
    } catch {
      toast.danger('Error de conexión');
    }
  };

  if (loading) return <CenteredSpinner label="Cargando catálogo..." />;

  if (error) {
    return (
      <AppShell title="Catálogo de Delitos" subtitle="Error de carga">
        <ErrorState
          title="No se pudo cargar el catálogo"
          description="Verifica tu conexión e inténtalo nuevamente."
          onRetry={load}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Catálogo de Delitos"
      subtitle={`${filtered.length} resultados`}
      headerRight={
        <Link
          href="/delito-form"
          aria-label="Crear nuevo delito"
          className="w-9 h-9 rounded-md bg-accent flex items-center justify-center hover:bg-accent-light"
        >
          <Plus size={18} className="text-primary" />
        </Link>
      }
    >
      <div className="p-3 max-w-5xl mx-auto">
        <div className="relative mb-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, artículo o conducta..."
            iconLeft={<Search size={16} />}
            iconRight={search ? (
              <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
                <X size={16} />
              </button>
            ) : undefined}
          />
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveRama(null)}
            className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              !activeRama ? 'bg-accent border-accent text-primary' : 'bg-surface border-border text-text-secondary hover:border-accent'
            }`}
          >
            Todas
            <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
              !activeRama ? 'bg-primary text-accent' : 'bg-surface-alt text-text-secondary'
            }`}>{delitos.length}</span>
          </button>
          {ramas.map((r) => {
            const isActive = activeRama === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRama(isActive ? null : r.id)}
                className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  isActive ? 'bg-accent border-accent text-primary' : 'bg-surface border-border text-text-secondary hover:border-accent'
                }`}
              >
                {formatRama(r.id) || r.id}
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive ? 'bg-primary text-accent' : 'bg-surface-alt text-text-secondary'
                }`}>{r.cantidad}</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={48} />}
            title="Sin resultados"
            description="Modifica la búsqueda o registra un nuevo delito."
            action={
              <Link href="/delito-form">
                <Button variant="primary" iconLeft={<Plus size={16} />}>
                  Nuevo delito
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2 grid md:grid-cols-2 gap-2">
            {filtered.map((item) => (
              <Card key={item.id} padding="none" className="hover:shadow-md transition-shadow">
                <Link href={`/delito-form?id=${item.id}`} className="block p-3 focus-visible:outline-none">
                  <div className="flex items-start mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-text mb-1 line-clamp-2">{item.nombre}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone="primary">{item.articulo}</Badge>
                        {item.es_grave && <Badge tone="aggravation">GRAVE</Badge>}
                      </div>
                    </div>
                  </div>
                  {item.conducta && (
                    <p className="text-text-secondary text-xs leading-4 line-clamp-2 mb-1">{item.conducta}</p>
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gavel size={14} className="text-accent" />
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {item.pena_texto || `${item.pena_minima_meses}-${item.pena_maxima_meses} meses`}
                    </span>
                  </div>
                  <p className="text-text-muted text-[11px] italic truncate">{formatRama(item.rama_id)}</p>
                </Link>

                <div className="flex border-t border-border-light">
                  <Link
                    href={`/delito-form?id=${item.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold text-primary hover:bg-surface-alt"
                  >
                    <Edit3 size={14} />
                    Editar
                  </Link>
                  <div className="w-px bg-border-light" />
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold text-danger hover:bg-danger-bg"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/delito-form"
        aria-label="Crear nuevo delito"
        className="no-print fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary-light z-10"
      >
        <Plus size={22} className="text-text-inverse" />
      </Link>
    </AppShell>
  );
}
