'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ArrowRight, FileCheck, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Delito } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { formatRama } from '@/lib/ui';

export default function AdminDelitoDetailPage() {
  const params = useParams();
  const [delito, setDelito] = useState<Delito | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/delitos/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setDelito(data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <CenteredSpinner label="Cargando delito..." />;

  if (error || !delito) {
    return <EmptyState icon={<BookOpen size={48} />} title="Delito no disponible" description={error || 'El delito solicitado no existe.'}
      action={<Link href="/intranet/admin/delitos"><Button variant="primary">Volver al catálogo</Button></Link>} />;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/intranet/admin/delitos" className="p-1 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text flex-shrink-0">
          <ArrowRight size={18} className="rotate-180" />
        </Link>
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md flex-shrink-0">
          <FileCheck size={18} className="text-accent" />
        </div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-lg text-primary leading-tight truncate">{delito.nombre}</h1>
          <p className="text-xs text-text-secondary">Código Penal de Honduras · {delito.articulo}</p>
        </div>
      </div>

      <Card padding="md" tone="accent">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl font-extrabold text-primary mb-1 font-serif">{delito.nombre}</h2>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="primary">{delito.articulo}</Badge>
              {delito.es_grave && <Badge tone="aggravation">GRAVE</Badge>}
              {delito.estado === 'verificado' && <Badge tone="success">Verificado</Badge>}
              {delito.estado === 'pendiente_revision' && <Badge tone="warning">Pendiente</Badge>}
              {delito.estado === 'rechazado' && <Badge tone="danger">Rechazado</Badge>}
            </div>
          </div>
        </div>
        {delito.conducta && (
          <div className="text-sm text-text leading-6 whitespace-pre-line font-serif">{delito.conducta}</div>
        )}
      </Card>

      <Card padding="md">
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-3 text-xs">
          {delito.rama_id && <><dt className="font-semibold text-text">Rama jurídica</dt><dd className="text-text-secondary">{formatRama(delito.rama_id)}</dd></>}
          {delito.clasificacion && <><dt className="font-semibold text-text">Clasificación</dt><dd className="text-text-secondary">{delito.clasificacion}</dd></>}
          <><dt className="font-semibold text-text">Pena base</dt><dd className="text-text-secondary font-bold tabular-nums">{delito.pena_texto || `${delito.pena_minima_meses}-${delito.pena_maxima_meses} meses`}</dd></>
          {delito.tiene_pena_alternativa && (
            <><dt className="font-semibold text-text">Pena alternativa</dt><dd className="text-text-secondary tabular-nums">{delito.pena_alternativa_min}-{delito.pena_alternativa_max} meses</dd></>
          )}
          {delito.penas_accesorias && delito.penas_accesorias.length > 0 && (
            <><dt className="font-semibold text-text">Penas accesorias</dt><dd className="text-text-secondary">{delito.penas_accesorias.join(', ')}</dd></>
          )}
          {delito.constitucion_articulo_id && (
            <><dt className="font-semibold text-text">Art. Constitución</dt><dd className="text-text-secondary">{delito.constitucion_articulo_id}</dd></>
          )}
        </dl>
      </Card>

      {delito.observaciones && (
        <Card padding="md">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} className="text-accent" />
            <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Observaciones</h3>
          </div>
          <p className="text-sm text-text-secondary leading-5 whitespace-pre-line">{delito.observaciones}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href="/intranet/admin/delitos"
          className="h-10 rounded-md border border-border text-center text-sm font-semibold text-text-secondary hover:bg-surface-alt inline-flex items-center justify-center">
          Volver al catálogo
        </Link>
        <Link href={`/delito-form?id=${delito.id}`}
          className="h-10 rounded-md bg-primary text-center text-text-inverse text-sm font-bold hover:bg-primary-light inline-flex items-center justify-center gap-1.5">
          <ExternalLink size={14} /> Editar delito
        </Link>
      </div>
    </div>
  );
}
