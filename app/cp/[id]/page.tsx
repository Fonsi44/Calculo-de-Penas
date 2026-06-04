'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Gavel, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { AppShell } from '@/components/layout/app-shell';

interface ArticuloCP {
  id: number;
  articulo: string;
  libro: string | null;
  titulo: string | null;
  capitulo: string | null;
  epigrafe: string | null;
  texto: string;
  tema: string | null;
  delitos_relacionados?: { id: string; nombre: string; articulo: string }[];
}

const TEMA_LABELS: Record<string, string> = {
  delitos: 'Delitos',
  garantias_penales: 'Garantías penales',
  circunstancias: 'Circunstancias',
  consecuencias_juridicas: 'Consecuencias jurídicas',
  hecho_penal: 'Hecho penal',
  autoria_participacion: 'Autoría y participación',
  parte_general: 'Parte general',
  penas: 'Penas',
  ejecucion_medidas: 'Ejecución',
  responsabilidad_civil: 'Responsabilidad civil',
  prescripcion: 'Prescripción',
  ejecucion: 'Ejecución',
  autoria: 'Autoría',
};

export default function ArticuloCPPage() {
  const params = useParams();
  const [articulo, setArticulo] = useState<ArticuloCP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch hydration
    setLoading(true);
    fetch(`/api/cp/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setArticulo(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <CenteredSpinner label="Cargando artículo..." />;

  if (error || !articulo) {
    return (
      <AppShell title="Artículo no encontrado" backHref="/cp">
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Artículo no disponible"
          description={error || 'El artículo solicitado no existe.'}
          action={
            <Link href="/cp">
              <Button variant="primary">Volver a la biblioteca</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={articulo.articulo}
      subtitle="Código Penal de Honduras"
      backHref="/cp"
    >
      <div className="p-3 max-w-2xl mx-auto space-y-3">
        <Card padding="md" tone="accent">
          {articulo.epigrafe && (
            <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">{articulo.epigrafe}</p>
          )}
          <h2 className="text-xl font-extrabold text-primary mb-3 font-serif">{articulo.articulo}</h2>
          <div className="text-sm text-text leading-6 whitespace-pre-line font-serif">
            {articulo.texto}
          </div>
        </Card>

        {(articulo.libro || articulo.titulo || articulo.capitulo || articulo.tema) && (
          <Card padding="md">
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-3 text-xs">
              {articulo.libro && (
                <>
                  <dt className="font-semibold text-text">Libro</dt>
                  <dd className="text-text-secondary">{articulo.libro}</dd>
                </>
              )}
              {articulo.titulo && (
                <>
                  <dt className="font-semibold text-text">Título</dt>
                  <dd className="text-text-secondary">{articulo.titulo}</dd>
                </>
              )}
              {articulo.capitulo && (
                <>
                  <dt className="font-semibold text-text">Capítulo</dt>
                  <dd className="text-text-secondary">{articulo.capitulo}</dd>
                </>
              )}
              {articulo.tema && (
                <>
                  <dt className="font-semibold text-text">Tema</dt>
                  <dd><Badge tone="primary">{TEMA_LABELS[articulo.tema] || articulo.tema}</Badge></dd>
                </>
              )}
            </dl>
          </Card>
        )}

        {articulo.delitos_relacionados && articulo.delitos_relacionados.length > 0 && (
          <Card padding="md">
            <div className="flex items-center gap-1.5 mb-3">
              <Gavel size={14} className="text-accent" />
              <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Delitos relacionados</h3>
            </div>
            <div className="space-y-1">
              {articulo.delitos_relacionados.map(d => (
                <Link
                  key={d.id}
                  href={`/delito-form?id=${d.id}`}
                  className="flex items-center gap-2 h-9 px-2.5 rounded-md hover:bg-surface-alt text-sm focus-visible:outline-none"
                >
                  <ExternalLink size={12} className="text-text-muted flex-shrink-0" />
                  <span className="font-semibold text-text flex-1 truncate">{d.nombre}</span>
                  <span className="text-[11px] text-text-muted">{d.articulo}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/cp"
            className="h-10 rounded-md border border-border text-center text-sm font-semibold text-text-secondary hover:bg-surface-alt inline-flex items-center justify-center"
          >
            Volver a biblioteca
          </Link>
          <Link
            href={`/cp?tema=${encodeURIComponent(articulo.tema || '')}`}
            className="h-10 rounded-md bg-primary text-center text-text-inverse text-sm font-bold hover:bg-primary-light inline-flex items-center justify-center"
          >
            Ver más {articulo.tema ? TEMA_LABELS[articulo.tema] || articulo.tema : 'relacionados'}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
