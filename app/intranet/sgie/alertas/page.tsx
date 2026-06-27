'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

interface AlertaItem {
  id: string; tipo: string; severidad: string; titulo: string; mensaje: string | null; resuelta: boolean;
}

const SEVERIDAD_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 border-blue-300',
  advertencia: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  error: 'bg-red-100 text-red-700 border-red-300',
  critico: 'bg-red-200 text-red-800 border-red-500 font-bold',
};

export default function SgieAlertasPage() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgie/alertas?limit=50');
      if (res.ok) { const d = await res.json(); setAlertas(d.alertas ?? []); }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!mounted.current) { mounted.current = true; fetchData(); } }, [fetchData]);

  const handleResolver = async (id: string) => {
    await fetch(`/api/sgie/alertas/${id}/resolver`, { method: 'POST' });
    fetchData();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Alertas</h1>
        <p className="text-sm text-text-secondary mt-1">{alertas.filter(a => !a.resuelta).length} activas de {alertas.length}</p>
      </div>
      {loading ? <Spinner size="lg" /> : alertas.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border-light rounded-lg">
          <AlertTriangle size={40} className="mx-auto text-text-muted mb-3" />
          <p className="font-semibold text-primary">Sin alertas</p>
          <p className="text-sm text-text-secondary mt-1">El motor de reglas no ha detectado incidencias.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertas.map((a) => (
            <div key={a.id} className={cn('bg-surface border border-border-light rounded-lg p-4', a.resuelta && 'opacity-50')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xxs font-semibold border', SEVERIDAD_COLORS[a.severidad] || 'bg-gray-100')}>
                      {a.severidad}
                    </span>
                    <span className="text-xs text-text-muted">{a.tipo?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-semibold text-text">{a.titulo}</p>
                  {a.mensaje && <p className="text-xs text-text-secondary mt-1">{a.mensaje}</p>}
                </div>
                {!a.resuelta && (
                  <button onClick={() => handleResolver(a.id)}
                    className="p-1.5 rounded-md hover:bg-success/10 text-success flex-shrink-0" title="Resolver">
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
