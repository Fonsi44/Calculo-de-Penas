'use client';

/**
 * SGIE — Correos (Sprint 0: unificación visual + feedback).
 *
 * Histórico de correos transaccionales enviados. Sólo-lectura.
 *
 * Cambios Sprint 0: design tokens, feedback de error, estado vacío,
 * traducción de estados.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { traducirEstadoCorreo } from '@/lib/sgie/estados';

interface CorreoItem {
  id: string;
  plantillaSlug: string;
  destinatario: string;
  asunto: string;
  estado: string;
  error: string | null;
  creadoEn: string;
}

const ESTADO_TONE: Record<string, string> = {
  enviado: 'bg-success/10 text-success border-success/20',
  fallido: 'bg-danger/10 text-danger border-danger/20',
  pendiente: 'bg-warning/10 text-warning border-warning/20',
  reintentando: 'bg-info/10 text-info border-info/20',
};

export default function SgieCorreosPage() {
  const { user } = useAuth();
  const [correos, setCorreos] = useState<CorreoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/sgie/correos?limit=50', { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      const d = await res.json();
      setCorreos(d.correos ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; fetchData(); }
  }, [fetchData]);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Correos</h1>
        <p className="text-xs text-text-secondary mt-0.5">{correos.length} correos registrados</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Card padding="md">
          <ErrorState
            title="No se pudieron cargar los correos"
            description="Verifique su conexión y vuelva a intentarlo."
            onRetry={fetchData}
          />
        </Card>
      ) : correos.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<Mail size={28} />}
            title="Sin correos"
            description="No se han enviado correos transaccionales todavía. Los avisos automáticos del sistema aparecerán aquí."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {correos.map((c) => (
            <Card key={c.id} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', ESTADO_TONE[c.estado] || ESTADO_TONE.pendiente)}>
                      {traducirEstadoCorreo(c.estado)}
                    </span>
                    <span className="text-xxs text-text-muted">{c.plantillaSlug}</span>
                  </div>
                  <p className="text-sm font-semibold text-text">{c.asunto}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Para: {c.destinatario}</p>
                  {c.error && <p className="text-xxs text-danger mt-1">Error: {c.error}</p>}
                </div>
                <span className="text-xxs text-text-muted flex-shrink-0">
                  {new Date(c.creadoEn).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
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
