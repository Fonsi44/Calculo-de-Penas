'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { Delito } from '@/lib/types';
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

// ---------------------------------------------------------------------------
// Fase 5 — Supuestos penales (modalidades específicas de delitos).
// ---------------------------------------------------------------------------

/** Supuesto penal con sus agravantes específicas vinculadas (Fase 3/5). */
export interface SupuestoPenalUI {
  id: string;
  delito_id: string;
  numeral: string | null;
  literal: string | null;
  inciso: string | null;
  texto_modalidad: string | null;
  pena_min_meses: number;
  pena_max_meses: number;
  tipo_pena: 'prision' | 'multa' | 'perpetuidad';
  tiene_agravantes_especificas: boolean;
  observaciones: string | null;
  agravantes_especificas: AgravanteEspecificaUI[];
}

export interface AgravanteEspecificaUI {
  id: string;
  articulo_cp: string;
  numeral: string | null;
  texto_agravante: string;
  fraccion_aumento: string;
  obligatoria: boolean;
}

export interface UseSupuestosPenales {
  supuestos: SupuestoPenalUI[];
  loading: boolean;
  error: string | null;
}

/**
 * Carga los supuestos penales (modalidades) de un delito concreto desde la API.
 * Devuelve [] si el delito no tiene modalidades específicas (uso de la pena
 * base genérica). Cachea en memoria por delitoId para evitar refetch.
 */
const supuestosCache = new Map<string, { data: SupuestoPenalUI[]; ts: number }>();
const SUPUESTOS_TTL = 5 * 60 * 1000;

type SupuestoAction =
  | { type: 'RESET' }
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: SupuestoPenalUI[] }
  | { type: 'ERROR'; message: string };

function supuestoReducer(state: UseSupuestosPenales, action: SupuestoAction): UseSupuestosPenales {
  switch (action.type) {
    case 'RESET':
      return { supuestos: [], loading: false, error: null };
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return { supuestos: action.data, loading: false, error: null };
    case 'ERROR':
      return { supuestos: [], loading: false, error: action.message };
  }
}

export function useSupuestosPenales(delitoId: string | null | undefined): UseSupuestosPenales {
  const [state, dispatch] = useReducer(supuestoReducer, { supuestos: [], loading: false, error: null });

  useEffect(() => {
    if (!delitoId) {
      dispatch({ type: 'RESET' });
      return;
    }

    const cached = supuestosCache.get(delitoId);
    if (cached && Date.now() - cached.ts < SUPUESTOS_TTL) {
      dispatch({ type: 'SUCCESS', data: cached.data });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'LOADING' });
    (async () => {
      try {
        const r = await fetch(`/api/supuestos-penales?delitoId=${encodeURIComponent(delitoId)}`);
        if (!r.ok) throw new Error('No se pudieron cargar los supuestos penales');
        const data = await r.json();
        const parsed: SupuestoPenalUI[] = Array.isArray(data) ? data : [];
        if (cancelled) return;
        supuestosCache.set(delitoId, { data: parsed, ts: Date.now() });
        dispatch({ type: 'SUCCESS', data: parsed });
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: 'ERROR', message: e instanceof Error ? e.message : 'Error al cargar supuestos penales' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [delitoId]);

  return state;
}
