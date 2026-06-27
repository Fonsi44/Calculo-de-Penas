'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

interface CorreoItem {
  id: string; plantillaSlug: string; destinatario: string;
  asunto: string; estado: string; error: string | null; creadoEn: string;
}

const ESTADO_COLORS: Record<string, string> = {
  enviado: 'bg-green-100 text-green-700', fallido: 'bg-red-100 text-red-700',
  pendiente: 'bg-yellow-100 text-yellow-700', reintentando: 'bg-blue-100 text-blue-700',
};

export default function SgieCorreosPage() {
  const { user } = useAuth();
  const [correos, setCorreos] = useState<CorreoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgie/correos?limit=50');
      if (res.ok) { const d = await res.json(); setCorreos(d.correos ?? []); }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!mounted.current) { mounted.current = true; fetchData(); } }, [fetchData]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Correos</h1>
        <p className="text-sm text-text-secondary mt-1">{correos.length} correos registrados</p>
      </div>
      {loading ? <Spinner size="lg" /> : correos.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border-light rounded-lg">
          <Mail size={40} className="mx-auto text-text-muted mb-3" />
          <p className="font-semibold text-primary">Sin correos</p>
          <p className="text-sm text-text-secondary mt-1">No se han enviado correos transaccionales aún.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {correos.map((c) => (
            <div key={c.id} className="bg-surface border border-border-light rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xxs font-semibold', ESTADO_COLORS[c.estado] || 'bg-gray-100')}>
                      {c.estado}
                    </span>
                    <span className="text-xs text-text-muted">{c.plantillaSlug}</span>
                  </div>
                  <p className="text-sm font-semibold text-text">{c.asunto}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Para: {c.destinatario}</p>
                  {c.error && <p className="text-xxs text-danger mt-1">Error: {c.error}</p>}
                </div>
                <span className="text-xxs text-text-muted flex-shrink-0">
                  {new Date(c.creadoEn).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
