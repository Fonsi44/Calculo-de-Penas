'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit3, Save, X, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatCards } from '@/components/ui/stat-cards';
import { meses_a_texto } from '@/lib/utils';

interface AgravanteAdmin {
  id: string;
  supuesto_penal_id: string;
  articulo_cp: string;
  numeral: string | null;
  literal: string | null;
  texto_agravante: string;
  fraccion_aumento: string;
  obligatoria: boolean;
  creado_en: string;
  supuesto_penal: {
    id: string;
    texto_modalidad: string | null;
    pena_min_meses: number;
    pena_max_meses: number;
  };
  delito: {
    id: string;
    nombre: string;
    articulo: string;
  };
}

interface SupuestoOption {
  id: string;
  label: string;
  delito_nombre: string;
  delito_articulo: string;
}

export default function AdminAgravantesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [agravantes, setAgravantes] = useState<AgravanteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    articulo_cp: '', numeral: '', texto_agravante: '', fraccion_aumento: '', obligatoria: false,
  });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    supuesto_penal_id: '', articulo_cp: '', numeral: '', texto_agravante: '', fraccion_aumento: '1/3', obligatoria: true,
  });
  const [supuestosOptions, setSupuestosOptions] = useState<SupuestoOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  // Cargar supuestos penales disponibles para el formulario de creación.
  useEffect(() => {
    fetch('/api/admin/supuestos-penales')
      .then(r => r.ok ? r.json() : { supuestos: [] })
      .then(data => {
        const opts: SupuestoOption[] = (data.supuestos ?? []).map((s: { id: string; texto_modalidad: string | null; pena_min_meses: number; pena_max_meses: number; delito?: { nombre: string; articulo: string }; delito_nombre?: string }) => ({
          id: s.id,
          label: `${s.delito?.articulo ?? ''} ${s.delito?.nombre ?? s.delito_nombre ?? ''} — ${s.texto_modalidad ?? 'Modalidad'} (${s.pena_min_meses}-${s.pena_max_meses}m)`,
          delito_nombre: s.delito?.nombre ?? s.delito_nombre ?? '',
          delito_articulo: s.delito?.articulo ?? '',
        }));
        setSupuestosOptions(opts);
      })
      .catch(() => {});
  }, []);

  const fetchAgravantes = useCallback(() => {
    fetch('/api/admin/agravantes')
      .then(r => r.json())
      .then(data => setAgravantes(data.agravantes ?? []))
      .catch(() => toast.danger('Error al cargar agravantes'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { fetchAgravantes(); }, [fetchAgravantes]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return agravantes;
    return agravantes.filter(a =>
      a.texto_agravante.toLowerCase().includes(query)
      || a.articulo_cp.toLowerCase().includes(query)
      || a.delito.nombre.toLowerCase().includes(query)
      || a.delito.articulo.toLowerCase().includes(query)
    );
  }, [agravantes, q]);

  const obligatoriasCount = agravantes.filter(a => a.obligatoria).length;
  const delitosUnicos = new Set(agravantes.map(a => a.delito.id)).size;

  const startEdit = (a: AgravanteAdmin) => {
    setEditing(a.id);
    setEditForm({
      articulo_cp: a.articulo_cp,
      numeral: a.numeral ?? '',
      texto_agravante: a.texto_agravante,
      fraccion_aumento: a.fraccion_aumento,
      obligatoria: a.obligatoria,
    });
  };

  const cancelEdit = () => { setEditing(null); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/agravantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articulo_cp: editForm.articulo_cp,
          numeral: editForm.numeral || null,
          texto_agravante: editForm.texto_agravante,
          fraccion_aumento: editForm.fraccion_aumento,
          obligatoria: editForm.obligatoria,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      toast.success('Agravante actualizada');
      setEditing(null);
      fetchAgravantes();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: AgravanteAdmin) => {
    const ok = await confirm({
      title: '¿Eliminar agravante?',
      description: `"${a.texto_agravante}" (Art. ${a.articulo_cp}). Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const r = await fetch(`/api/admin/agravantes/${a.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Error al eliminar');
      toast.success('Agravante eliminada');
      fetchAgravantes();
    } catch {
      toast.danger('Error al eliminar');
    }
  };

  const createNew = async () => {
    if (!newForm.supuesto_penal_id) { toast.danger('Selecciona un supuesto penal'); return; }
    if (!newForm.texto_agravante.trim()) { toast.danger('El texto de la agravante es obligatorio'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/agravantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supuesto_penal_id: newForm.supuesto_penal_id,
          articulo_cp: newForm.articulo_cp,
          numeral: newForm.numeral || null,
          texto_agravante: newForm.texto_agravante,
          fraccion_aumento: newForm.fraccion_aumento,
          obligatoria: newForm.obligatoria,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear');
      }
      toast.success('Agravante creada');
      setShowNew(false);
      setNewForm({ supuesto_penal_id: '', articulo_cp: '', numeral: '', texto_agravante: '', fraccion_aumento: '1/3', obligatoria: true });
      fetchAgravantes();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Agravantes específicas"
        subtitle="Catálogo de agravantes específicas del tipo penal (no genéricas Art. 32 CP). Amplían el marco legal de la pena."
        actions={
          <Button onClick={() => setShowNew(s => !s)} size="sm">
            <Plus size={14} className="mr-1" /> Nueva agravante
          </Button>
        }
      />

      <StatCards
        items={[
          { label: 'Total agravantes', value: agravantes.length },
          { label: 'Obligatorias', value: obligatoriasCount },
          { label: 'Delitos con agravantes', value: delitosUnicos },
        ]}
      />

      <FilterBar
        search={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar por delito, artículo o texto…"
      />

      {showNew && (
        <Card padding="md" className="border-accent/30">
          <h3 className="font-bold text-sm text-text mb-3">Nueva agravante específica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Supuesto penal *</label>
              <select
                value={newForm.supuesto_penal_id}
                onChange={e => setNewForm(f => ({ ...f, supuesto_penal_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-text"
              >
                <option value="">— Selecciona un supuesto penal —</option>
                {supuestosOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Artículo CP *</label>
              <Input
                value={newForm.articulo_cp}
                onChange={e => setNewForm(f => ({ ...f, articulo_cp: e.target.value }))}
                placeholder="p.ej. 312"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Numeral</label>
              <Input
                value={newForm.numeral}
                onChange={e => setNewForm(f => ({ ...f, numeral: e.target.value }))}
                placeholder="p.ej. 1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Fracción aumento *</label>
              <Input
                value={newForm.fraccion_aumento}
                onChange={e => setNewForm(f => ({ ...f, fraccion_aumento: e.target.value }))}
                placeholder="1/3"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Obligatoria</label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={newForm.obligatoria}
                  onChange={e => setNewForm(f => ({ ...f, obligatoria: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-xs text-text-secondary">Sí, es de aplicación obligatoria</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Texto de la agravante *</label>
              <Input
                value={newForm.texto_agravante}
                onChange={e => setNewForm(f => ({ ...f, texto_agravante: e.target.value }))}
                placeholder="p.ej. Por venalidad o premios prometidos"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={createNew} disabled={saving} size="sm">
              <Save size={14} className="mr-1" /> {saving ? 'Guardando…' : 'Crear agravante'}
            </Button>
            <Button onClick={() => setShowNew(false)} variant="ghost" size="sm">
              <X size={14} className="mr-1" /> Cancelar
            </Button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card padding="md">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              {agravantes.length === 0
                ? 'No hay agravantes específicas registradas. Crea la primera con el botón «Nueva agravante».'
                : 'No se encontraron agravantes con ese criterio de búsqueda.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary text-xs">Delito</th>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary text-xs">Art.</th>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary text-xs">Texto</th>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary text-xs">Fracción</th>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary text-xs">Modalidad</th>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary text-xs">Estado</th>
                  <th className="text-right px-3 py-2 font-semibold text-text-secondary text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="px-3 py-2">
                      <p className="font-medium text-text text-xs">{a.delito.nombre}</p>
                      <p className="text-xxs text-text-muted">{a.delito.articulo}</p>
                    </td>
                    <td className="px-3 py-2 text-xs text-text">
                      {editing === a.id ? (
                        <Input value={editForm.articulo_cp} onChange={e => setEditForm(f => ({ ...f, articulo_cp: e.target.value }))} className="w-20 text-xs" />
                      ) : (
                        <span>{a.articulo_cp}{a.numeral ? `.${a.numeral}` : ''}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-text max-w-xs">
                      {editing === a.id ? (
                        <Input value={editForm.texto_agravante} onChange={e => setEditForm(f => ({ ...f, texto_agravante: e.target.value }))} className="text-xs" />
                      ) : (
                        <span className="line-clamp-2">{a.texto_agravante}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-text">
                      {editing === a.id ? (
                        <Input value={editForm.fraccion_aumento} onChange={e => setEditForm(f => ({ ...f, fraccion_aumento: e.target.value }))} className="w-16 text-xs" />
                      ) : (
                        <Badge tone="warning">+{a.fraccion_aumento}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xxs text-text-muted">
                      {a.supuesto_penal.texto_modalidad ?? '—'}
                      <br />
                      <span className="text-text-muted">{meses_a_texto(a.supuesto_penal.pena_min_meses)} a {meses_a_texto(a.supuesto_penal.pena_max_meses)}</span>
                    </td>
                    <td className="px-3 py-2">
                      {editing === a.id ? (
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={editForm.obligatoria}
                            onChange={e => setEditForm(f => ({ ...f, obligatoria: e.target.checked }))}
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-xxs text-text-secondary">Obl.</span>
                        </label>
                      ) : a.obligatoria ? (
                        <Badge tone="danger">Obligatoria</Badge>
                      ) : (
                        <Badge tone="neutral">Opcional</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {editing === a.id ? (
                          <>
                            <Button onClick={() => saveEdit(a.id)} disabled={saving} size="sm" variant="ghost">
                              <Save size={12} />
                            </Button>
                            <Button onClick={cancelEdit} size="sm" variant="ghost">
                              <X size={12} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => startEdit(a)} size="sm" variant="ghost">
                              <Edit3 size={12} />
                            </Button>
                            <Button onClick={() => remove(a)} size="sm" variant="ghost" className="text-danger">
                              <Trash2 size={12} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
