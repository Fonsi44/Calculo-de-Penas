'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Delito } from '@/app/types';
import { useDebounce } from '@/hooks/use-debounce';
import { cacheGet, cacheSet } from '@/lib/cache';

const CACHE_KEY_DELITOS = 'delitos-catalog';
const CACHE_TTL = 10 * 60 * 1000;

export interface UseDelitosLoader {
  delitos: Delito[];
  setDelitos: (d: Delito[]) => void;
  loading: boolean;
  fetchError: string | null;
  refetch: () => Promise<void>;
}

export function useDelitosLoader(): UseDelitosLoader {
  const [delitos, setDelitos] = useState<Delito[]>(() => {
    const cached = cacheGet<Delito[]>(CACHE_KEY_DELITOS);
    return cached ?? [];
  });
  const [loading, setLoading] = useState(() => !cacheGet(CACHE_KEY_DELITOS));
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch('/api/delitos?limit=1000');
      const d = await r.json();
      const data = Array.isArray(d) ? d : (d?.data || []);
      cacheSet(CACHE_KEY_DELITOS, data, CACHE_TTL);
      setDelitos(data);
      setFetchError(null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Error al cargar delitos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    (async () => {
      await refetch();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, refetch]);

  return { delitos, setDelitos, loading, fetchError, refetch };
}

export interface UseDelitosFilter {
  search: string;
  setSearch: (s: string) => void;
  filtered: Delito[];
}

export function useDelitosFilter(delitos: Delito[]): UseDelitosFilter {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return delitos;
    return delitos.filter((d) =>
      d.nombre.toLowerCase().includes(q)
      || d.articulo.toLowerCase().includes(q)
      || (d.clasificacion || '').toLowerCase().includes(q),
    );
  }, [delitos, debouncedSearch]);
  return { search, setSearch, filtered };
}
