'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';

interface EventoItem {
  id: string; tipo: string; titulo: string; descripcion: string | null;
  fecha: string; estado: string;
}

const ESTADO_COLORS: Record<string, string> = {
  propuesta: 'bg-yellow-100 text-yellow-700', confirmada: 'bg-green-100 text-green-700',
  descartada: 'bg-gray-100 text-gray-500', completada: 'bg-blue-100 text-blue-700',
};

export default function SgieAgendaPage() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<EventoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgie/agenda?limit=50');
      if (res.ok) { const d = await res.json(); setEventos(d.eventos ?? []); }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!mounted.current) { mounted.current = true; fetchData(); } }, [fetchData]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Agenda</h1>
        <p className="text-sm text-text-secondary mt-1">{eventos.length} eventos</p>
      </div>
      {loading ? <Spinner size="lg" /> : eventos.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border-light rounded-lg">
          <Calendar size={40} className="mx-auto text-text-muted mb-3" />
          <p className="font-semibold text-primary">Sin eventos</p>
          <p className="text-sm text-text-secondary mt-1">No hay eventos programados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {eventos.map((e) => (
            <div key={e.id} className="bg-surface border border-border-light rounded-lg p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center flex-shrink-0">
                <Clock size={16} className="text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{e.titulo}</p>
                {e.descripcion && <p className="text-xs text-text-secondary mt-0.5">{e.descripcion}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-muted">{new Date(e.fecha).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xxs font-semibold ${ESTADO_COLORS[e.estado] || 'bg-gray-100'}`}>{e.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
