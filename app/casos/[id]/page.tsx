'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gavel, Calculator, ArrowRight, FileDown, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { formatFechaCorta, pluralizar } from '@/lib/ui';
import type { DelitoConfig, ResultadoCalculo } from '@/lib/rules/v1/types';

interface Calculo {
  id: string;
  config: DelitoConfig;
  resultado: ResultadoCalculo;
  creadoEn: string;
}

interface Caso {
  id: string;
  titulo: string;
  cliente: string | null;
  estado: string;
  creadoEn: string;
  calculos: Calculo[];
}

export default function CasoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!params?.id) return;

    fetch(`/api/casos/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setCaso(data);
        setEditTitulo(data.titulo);
      })
      .catch(() => router.push('/casos'))
      .finally(() => setLoading(false));
  }, [params?.id, user, authLoading, router]);

  const updateCaso = async () => {
    if (!editTitulo.trim() || !caso) return;
    await fetch(`/api/casos/${caso.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: editTitulo }),
    });
    setCaso({ ...caso, titulo: editTitulo });
    setEditing(false);
  };

  const deleteCalculo = async (calculoId: string) => {
    if (!caso) return;
    const ok = await confirm({
      title: '¿Eliminar cálculo?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await fetch(`/api/calculos/${calculoId}`, { method: 'DELETE' });
    if (res.ok) {
      setCaso({ ...caso, calculos: caso.calculos.filter(c => c.id !== calculoId) });
      toast.success('Cálculo eliminado');
    } else {
      toast.danger('Error al eliminar');
    }
  };

  const deleteCaso = async () => {
    if (!caso) return;
    const ok = await confirm({
      title: `¿Eliminar caso "${caso.titulo}"?`,
      description: 'Se eliminará el caso y todos sus cálculos asociados. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar caso',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await fetch(`/api/casos/${caso.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Caso eliminado');
      router.push('/casos');
    } else {
      toast.danger('Error al eliminar el caso');
    }
  };

  const downloadPDF = async () => {
    if (!caso) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/casos/${caso.id}/pdf`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || 'No se pudo generar el PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('content-disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] || 'informe.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF download', e);
      alert('Error de red al generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading || loading) return <CenteredSpinner label="Cargando caso..." />;

  if (!caso) {
    return (
      <AppShell title="Caso" backHref="/casos" backLabel="Volver a mis casos">
        <div className="p-4">
          <EmptyState
            title="Caso no encontrado"
            description="El caso solicitado no existe o fue eliminado."
            action={
              <Link href="/casos">
                <Button variant="primary">Volver a mis casos</Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const subtitle = [
    caso.cliente && `Cliente: ${caso.cliente}`,
    pluralizar(caso.calculos.length, 'cálculo', 'cálculos'),
  ].filter(Boolean).join(' · ');

  return (
    <AppShell
      title={caso.titulo}
      subtitle={subtitle}
      backHref="/casos"
      backLabel="Volver a mis casos"
      headerRight={
        <div className="flex items-center gap-1">
          <IconButton label="Editar título" variant="subtle" onClick={() => setEditing(true)}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label="Eliminar caso" variant="subtle" onClick={deleteCaso}>
            <Trash2 size={16} className="text-danger" />
          </IconButton>
          {caso.calculos.length > 0 && (
            <IconButton
              label="Descargar informe en PDF"
              variant="subtle"
              onClick={downloadPDF}
              disabled={downloading}
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            </IconButton>
          )}
        </div>
      }
    >
      <div className="p-3">
        {editing && (
          <Card padding="md" tone="accent" className="mb-3 max-w-2xl mx-auto">
            <h2 className="font-bold text-sm text-text mb-2">Editar t&iacute;tulo del caso</h2>
            <Input
              value={editTitulo}
              onChange={e => setEditTitulo(e.target.value)}
              autoFocus
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => { setEditing(false); setEditTitulo(caso.titulo); }}>Cancelar</Button>
              <Button variant="primary" fullWidth disabled={!editTitulo.trim() || editTitulo === caso.titulo} onClick={updateCaso}>Guardar</Button>
            </div>
          </Card>
        )}
        <div className="max-w-2xl mx-auto">
          {caso.calculos.length === 0 ? (
            <EmptyState
              icon={<Calculator size={48} />}
              title="Sin cálculos"
              description="Realiza un cálculo desde la calculadora y guárdalo en este caso."
              action={
                <Link href={`/calculadora?casoId=${caso.id}`}>
                  <Button variant="primary" iconLeft={<Calculator size={16} />}>
                    Ir a la calculadora
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {caso.calculos.map(calc => (
                <Card key={calc.id} padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel size={14} className="text-accent" />
                    <p className="font-bold text-sm text-text flex-1 font-serif">
                      {calc.resultado?.pena_principal || 'Cálculo'}
                    </p>
                    <span className="text-xxs text-text-muted tabular-nums">
                      {formatFechaCorta(calc.creadoEn)}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary leading-4 line-clamp-3 mb-2">
                    {calc.resultado?.analisis_juridico?.split('\n').slice(0, 5).join(' · ')}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border-light">
                    <Link
                      href={`/calculadora?casoId=${caso.id}&calculoId=${calc.id}`}
                      className="flex-1 flex items-center justify-center gap-1 h-8 px-2 rounded-md bg-accent/15 text-primary text-xxs font-bold hover:bg-accent/25 focus-visible:outline-none"
                    >
                      <Pencil size={12} />
                      Modificar
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteCalculo(calc.id)}
                      className="flex items-center justify-center gap-1 h-8 px-2 rounded-md text-danger text-xxs font-semibold hover:bg-danger-bg focus-visible:outline-none"
                      aria-label="Eliminar cálculo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border-light px-3 py-2 no-print">
        <Link
          href={`/calculadora?casoId=${caso.id}`}
          className="flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-text-inverse font-bold text-sm hover:bg-primary-light"
        >
          <Calculator size={16} />
          Nuevo cálculo en este caso
          <ArrowRight size={16} />
        </Link>
      </div>
    </AppShell>
  );
}
