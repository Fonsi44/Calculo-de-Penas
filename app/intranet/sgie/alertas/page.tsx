'use client';

/**
 * SGIE — Alertas (Sprint 0: unificación visual + feedback).
 *
 * Lista de alertas activas y resueltas. Sólo-lectura + resolver.
 *
 * Cambios Sprint 0: design tokens, feedback de error, estado vacío,
 * traducción de severidad.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirSeveridad } from '@/lib/sgie/estados';

interface AlertaItem {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  mensaje: string | null;
  resuelta: boolean;
}

// Tonos semánticos (tokens) para severidad.
const SEVERIDAD_TONE: Record<string, string> = {
  info: 'bg-info/10 text-info border-info/20',
  advertencia: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-danger/10 text-danger border-danger/20',
  critico: 'bg-danger/15 text-danger border-danger/30 font-bold',
};

export default function SgieAlertasPage() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolviendo, setResolviendo] = useState<string | null>(null);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/sgie/alertas?limit=50', { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const d = await res.json();
      setAlertas(d.alertas ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; fetchData(); }
  }, [fetchData]);

  const handleResolver = async (id: string) => {
    setResolviendo(id);
    try {
      const res = await fetch(`/api/sgie/alertas/${id}/resolver`, { method: 'POST' });
      if (!res.ok) throw new Error('Error');
      fetchData();
    } catch {
      // feedback silencioso mantenido (coherente con versión anterior); el
      // state de error global sólo cubre la carga inicial.
    } finally {
      setResolviendo(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Alertas</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {alertas.filter((a) => !a.resuelta).length} activas de {alertas.length}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Card padding="md">
          <ErrorState
            title="No se pudieron cargar las alertas"
            description="Verifique su conexión y vuelva a intentarlo."
            onRetry={fetchData}
          />
        </Card>
      ) : alertas.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<AlertTriangle size={28} />}
            title="Sin alertas"
            description="El motor de reglas no ha detectado incidencias en sus expedientes."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {alertas.map((a) => (
            <Card key={a.id} padding="sm" className={cn(a.resuelta && 'opacity-50')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', SEVERIDAD_TONE[a.severidad] || SEVERIDAD_TONE.info)}>
                      {traducirSeveridad(a.severidad)}
                    </span>
                    <span className="text-xxs text-text-muted">{a.tipo?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-semibold text-text">{a.titulo}</p>
                  {a.mensaje && <p className="text-xs text-text-secondary mt-1">{a.mensaje}</p>}
                </div>
                {!a.resuelta && (
                  <button
                    onClick={() => handleResolver(a.id)}
                    disabled={resolviendo === a.id}
                    className="p-1.5 rounded-md hover:bg-success/10 text-success flex-shrink-0 disabled:opacity-50"
                    title="Resolver alerta"
                    aria-label={`Resolver alerta: ${a.titulo}`}
                  >
                    {resolviendo === a.id ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}
