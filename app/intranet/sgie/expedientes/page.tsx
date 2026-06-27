'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Search, Scale, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

interface ExpedienteItem {
  id: string;
  numeroInterno: string;
  estado: string;
  prioridad: string;
  clienteNombre: string | null;
  tipoProcedimientoNombre: string | null;
  actualizadoEn: string | null;
}

export default function SgieExpedientesPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [expedientes, setExpedientes] = useState<ExpedienteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    resumen: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta' | 'urgente',
    clienteNombre: '',
  });

  const fetchExpedientes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (q) params.set('q', q);
    fetch(`/api/sgie/expedientes?${params}`)
      .then((r) => r.json())
      .then((data) => { setExpedientes(data.expedientes ?? []); setTotal(data.total ?? 0); })
      .catch(() => toast.danger('Error al cargar expedientes'))
      .finally(() => setLoading(false));
  }, [q, toast]);

  useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]); // eslint-disable-line react-hooks/set-state-in-effect -- carga inicial

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // En la Fase 3 base, el expediente se crea con responsable = abogado actual.
      // Cliente y tipo de procedimiento se gestionarán en fases posteriores (CRUD clientes/procedimientos).
      const res = await fetch('/api/sgie/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumen: form.resumen || undefined,
          prioridad: form.prioridad,
          // Requisitos iniciales mínimos de ejemplo genérico (editable en fases posteriores).
          requisitosIniciales: [
            { nombre: 'Identidad del cliente', tipo: 'obligatorio' },
            { nombre: 'Documentación de respaldo', tipo: 'obligatorio' },
          ],
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      toast.success(`Expediente ${data.expediente.numeroInterno} creado`);
      setShowForm(false);
      setForm({ resumen: '', prioridad: 'media', clienteNombre: '' });
      fetchExpedientes();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al crear expediente');
    } finally {
      setSaving(false);
    }
  };

  const prioridadTone = (p: string) => {
    switch (p) {
      case 'urgente': return 'text-danger';
      case 'alta': return 'text-warning';
      case 'media': return 'text-info';
      default: return 'text-text-muted';
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expedientes"
        subtitle={`${total} expedientes ${user?.rol === 'admin' ? '(vista administrador)' : 'asignados'}`}
        actions={<Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Nuevo expediente</Button>}
      />

      {showForm && (
        <Card padding="md">
          <form onSubmit={handleCrear} className="space-y-3">
            <h2 className="font-bold text-sm text-primary">Crear nuevo expediente</h2>
            <p className="text-xxs text-text-muted">
              El expediente se crea con usted como responsable y estado inicial <code>creado</code>.
              Las transiciones críticas (validar, firmar, finalizar) requerirán acción explícita suya.
              Cliente y tipo de procedimiento se asociarán desde el detalle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1">Resumen / motivo</label>
                <textarea
                  value={form.resumen}
                  onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
                  placeholder="Describa brevemente el asunto del expediente"
                  rows={2}
                  maxLength={2000}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Prioridad</label>
                <select
                  value={form.prioridad}
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as typeof f.prioridad }))}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-all hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>Crear expediente</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <form onSubmit={(e) => { e.preventDefault(); fetchExpedientes(); }} className="flex gap-2">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, cliente o resumen..." iconLeft={<Search size={14} />} />
        </div>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : expedientes.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<FolderKanban size={28} />}
            title={q ? 'Sin resultados' : 'No tiene expedientes todavía'}
            description={q ? 'Pruebe con otros términos de búsqueda.' : 'Cree su primer expediente para empezar a gestionar su cartera.'}
            action={!q ? <Button variant="primary" size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> Nuevo expediente</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase">N.º interno</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Cliente</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Procedimiento</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Estado</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase">Prioridad</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {expedientes.map((e) => (
                  <tr key={e.id} className="border-b border-border hover:bg-surface-alt">
                    <td className="p-3 font-mono text-xs font-semibold text-text">{e.numeroInterno}</td>
                    <td className="p-3 text-text-secondary">{e.clienteNombre ?? '—'}</td>
                    <td className="p-3 text-text-secondary">{e.tipoProcedimientoNombre ?? '—'}</td>
                    <td className="p-3">
                      <EstadoBadge estado={e.estado} />
                    </td>
                    <td className="p-3">
                      <span className={cn('text-xxs font-bold uppercase', prioridadTone(e.prioridad))}>{e.prioridad}</span>
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/intranet/sgie/expedientes/${e.id}`}>
                        <Button variant="ghost" size="sm">Abrir <Scale size={12} /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const tono = (() => {
    if (estado === 'validado' || estado === 'finalizado' || estado === 'archivado') return 'success';
    if (estado === 'pendiente_validacion_abogado' || estado === 'analisis_completado') return 'info';
    if (estado.includes('inconsisten') || estado === 'pendiente_de_firma') return 'warning';
    return 'neutral';
  })();
  const tonoClass = {
    success: 'bg-success/10 text-success border-success/20',
    info: 'bg-info/10 text-info border-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    neutral: 'bg-surface-alt text-text-secondary border-border',
  }[tono];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border whitespace-nowrap', tonoClass)}>
      {estado.replace(/_/g, ' ')}
    </span>
  );
}
