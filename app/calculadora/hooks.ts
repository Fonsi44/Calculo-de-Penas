'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Delito } from '@/app/types';
import { useDebounce } from '@/hooks/use-debounce';

export interface UseDelitosLoader {
  delitos: Delito[];
  setDelitos: (d: Delito[]) => void;
  loading: boolean;
  fetchError: string | null;
  refetch: () => Promise<void>;
}

export function useDelitosLoader(): UseDelitosLoader {
  const [delitos, setDelitos] = useState<Delito[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const r = await fetch('/api/delitos?limit=1000');
      const d = await r.json();
      setDelitos(Array.isArray(d) ? d : (d?.data || []));
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Error al cargar delitos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

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
