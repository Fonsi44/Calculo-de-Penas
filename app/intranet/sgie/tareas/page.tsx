'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckSquare, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

interface TareaItem {
  id: string; titulo: string; descripcion: string | null; estado: string;
  prioridad: string; automatica: boolean; fechaVencimiento: string | null;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700', media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700', urgente: 'bg-red-100 text-red-700',
};

export default function SgieTareasPage() {
  const { user } = useAuth();
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgie/tareas?limit=50');
      if (res.ok) { const d = await res.json(); setTareas(d.tareas ?? []); }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!mounted.current) { mounted.current = true; fetchData(); } }, [fetchData]);

  const handleCompletar = async (id: string) => {
    await fetch(`/api/sgie/tareas/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'completada' }) });
    fetchData();
  };

  if (!user) return null;
  const pendientes = tareas.filter(t => t.estado !== 'completada');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Tareas</h1>
        <p className="text-sm text-text-secondary mt-1">{pendientes.length} pendientes de {tareas.length}</p>
      </div>
      {loading ? <Spinner size="lg" /> : tareas.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border-light rounded-lg">
          <CheckSquare size={40} className="mx-auto text-text-muted mb-3" />
          <p className="font-semibold text-primary">Sin tareas</p>
          <p className="text-sm text-text-secondary mt-1">No tiene tareas pendientes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tareas.map((t) => (
            <div key={t.id} className={cn('bg-surface border border-border-light rounded-lg p-4', t.estado === 'completada' && 'opacity-50')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xxs font-semibold', PRIORIDAD_COLORS[t.prioridad] || 'bg-gray-100')}>
                      {t.prioridad}
                    </span>
                    {t.automatica && <span className="text-xxs text-text-muted">automática</span>}
                  </div>
                  <p className="text-sm font-semibold text-text">{t.titulo}</p>
                  {t.descripcion && <p className="text-xs text-text-secondary mt-1">{t.descripcion}</p>}
                  {t.fechaVencimiento && (
                    <p className="text-xxs text-text-muted mt-1 flex items-center gap-1">
                      <Clock size={10} /> Vence: {new Date(t.fechaVencimiento).toLocaleDateString('es-HN')}
                    </p>
                  )}
                </div>
                {t.estado !== 'completada' && (
                  <button onClick={() => handleCompletar(t.id)}
                    className="p-1.5 rounded-md hover:bg-success/10 text-success flex-shrink-0" title="Completar">
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
