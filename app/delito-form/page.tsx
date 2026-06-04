'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Save, Trash2, X, Bookmark, Lock, DollarSign, Ribbon, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { Delito, Clasificacion } from '../types';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

export default function DelitoFormPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DelitoForm />
    </Suspense>
  );
}

interface FormState {
  nombre: string;
  articulo: string;
  conducta: string;
  clasificacion: string;
  pena_minima_meses: string;
  pena_maxima_meses: string;
  tiene_pena_alternativa: boolean;
  pena_alternativa_min: string;
  pena_alternativa_max: string;
  penas_accesorias: string;
  observaciones: string;
}

const DEFAULT_FORM: FormState = {
  nombre: '', articulo: '', conducta: '', clasificacion: '',
  pena_minima_meses: '', pena_maxima_meses: '',
  tiene_pena_alternativa: false,
  pena_alternativa_min: '', pena_alternativa_max: '',
  penas_accesorias: '', observaciones: '',
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card padding="md" className="mb-3">
      <CardHeader title={title} />
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border-light -mt-3 pt-3">
        <span className="text-accent">{icon}</span>
        <h3 className="font-bold text-xs text-primary uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function DelitoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = Boolean(id);
  const toast = useToast();
  const confirm = useConfirm();

  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClasifPicker, setShowClasifPicker] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    fetch('/api/clasificaciones')
      .then(r => r.json())
      .then(data => setClasificaciones(Array.isArray(data) ? data : []))
      .catch(() => toast.danger('No se pudieron cargar las clasificaciones'));

    if (isEdit && id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch hydration
      setLoading(true);
      fetch(`/api/delitos/${id}`)
        .then(r => r.json())
        .then((d: Delito) => {
          setForm({
            nombre: d.nombre || '',
            articulo: d.articulo || '',
            conducta: d.conducta || '',
            clasificacion: d.clasificacion || '',
            pena_minima_meses: String(d.pena_minima_meses ?? ''),
            pena_maxima_meses: String(d.pena_maxima_meses ?? ''),
            tiene_pena_alternativa: !!d.tiene_pena_alternativa,
            pena_alternativa_min: String(d.pena_alternativa_min ?? ''),
            pena_alternativa_max: String(d.pena_alternativa_max ?? ''),
            penas_accesorias: (d.penas_accesorias || []).join(', '),
            observaciones: d.observaciones || '',
          });
        })
        .catch(() => toast.danger('No se pudo cargar el delito'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, toast]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.articulo.trim()) errs.articulo = 'El artículo es obligatorio';
    if (!form.clasificacion.trim()) errs.clasificacion = 'La clasificación es obligatoria';
    const min = parseInt(form.pena_minima_meses, 10);
    const max = parseInt(form.pena_maxima_meses, 10);
    if (form.pena_minima_meses === '' || isNaN(min) || min < 0) errs.pena_minima_meses = 'Pena mínima inválida';
    if (form.pena_maxima_meses === '' || isNaN(max) || max < 0) errs.pena_maxima_meses = 'Pena máxima inválida';
    if (!isNaN(min) && !isNaN(max) && max < min) errs.pena_maxima_meses = 'La pena máxima debe ser ≥ a la mínima';
    if (form.tiene_pena_alternativa) {
      const altMin = parseInt(form.pena_alternativa_min, 10);
      const altMax = parseInt(form.pena_alternativa_max, 10);
      if (form.pena_alternativa_min === '' || isNaN(altMin) || altMin < 0) errs.pena_alternativa_min = 'Mínimo inválido';
      if (form.pena_alternativa_max === '' || isNaN(altMax) || altMax < 0) errs.pena_alternativa_max = 'Máximo inválido';
      if (!isNaN(altMin) && !isNaN(altMax) && altMax < altMin) errs.pena_alternativa_max = 'Debe ser ≥ al mínimo';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.warning('Revisa los campos marcados');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        articulo: form.articulo.trim(),
        conducta: form.conducta.trim(),
        clasificacion: form.clasificacion.trim(),
        pena_minima_meses: parseInt(form.pena_minima_meses, 10),
        pena_maxima_meses: parseInt(form.pena_maxima_meses, 10),
        tiene_pena_alternativa: form.tiene_pena_alternativa,
        pena_alternativa_min: form.tiene_pena_alternativa ? parseInt(form.pena_alternativa_min, 10) || 0 : 0,
        pena_alternativa_max: form.tiene_pena_alternativa ? parseInt(form.pena_alternativa_max, 10) || 0 : 0,
        penas_accesorias: form.penas_accesorias.split(',').map(s => s.trim()).filter(Boolean),
        observaciones: form.observaciones.trim() || null,
      };

      const url = isEdit ? `/api/delitos/${id}` : '/api/delitos';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error del servidor');
      }
      toast.success(isEdit ? 'Delito actualizado' : 'Delito creado');
      router.back();
    } catch (e) {
      toast.danger('No se pudo guardar', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    const ok = await confirm({
      title: '¿Eliminar este delito?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/delitos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Delito eliminado');
      router.back();
    } catch {
      toast.danger('No se pudo eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header */}
      <div className="flex items-center bg-primary px-3 py-2 no-print">
        <Link href="/delitos" aria-label="Volver al catálogo" className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center mr-2 hover:bg-white/25">
          <X size={18} className="text-text-inverse" />
        </Link>
        <h1 className="flex-1 text-center text-text-inverse font-bold text-sm">{isEdit ? 'Editar delito' : 'Nuevo delito'}</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto p-3">
          <Section title="Identificación" icon={<Bookmark size={14} />}>
            <Field label="Nombre del delito" required htmlFor="nombre" error={errors.nombre}>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={e => update('nombre', e.target.value)}
                placeholder="Ej: Hurto agravado"
                invalid={!!errors.nombre}
              />
            </Field>
            <Field label="Artículo" required htmlFor="articulo" error={errors.articulo}>
              <Input
                id="articulo"
                value={form.articulo}
                onChange={e => update('articulo', e.target.value)}
                placeholder="Ej: Art. 363 CP"
                invalid={!!errors.articulo}
              />
            </Field>
            <Field label="Clasificación" required htmlFor="clasificacion" error={errors.clasificacion}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClasifPicker(!showClasifPicker)}
                  aria-haspopup="listbox"
                  aria-expanded={showClasifPicker}
                  className="w-full flex items-center h-10 border border-border rounded-md px-3 text-sm bg-surface-alt outline-none focus:border-accent"
                >
                  <span className={`flex-1 text-left ${form.clasificacion ? 'text-text' : 'text-text-muted'}`}>
                    {form.clasificacion || 'Selecciona o escribe la clasificación'}
                  </span>
                  {showClasifPicker ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </button>
                {showClasifPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-alt border border-border rounded-md p-2.5 z-10 shadow-lg max-h-48 overflow-y-auto">
                    <Input
                      value={form.clasificacion}
                      onChange={e => update('clasificacion', e.target.value)}
                      placeholder="Escribe una nueva o elige abajo"
                      className="mb-2"
                    />
                    {clasificaciones.map(c => (
                      <button
                        key={c.nombre}
                        type="button"
                        onClick={() => { update('clasificacion', c.nombre); setShowClasifPicker(false); }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-text hover:bg-white rounded"
                      >
                        <span className="flex-1 text-left">{c.nombre}</span>
                        <span className="text-xs text-text-muted">{c.cantidad}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Conducta tipificada" htmlFor="conducta">
              <Textarea
                id="conducta"
                value={form.conducta}
                onChange={e => update('conducta', e.target.value)}
                placeholder="Descripción de la conducta sancionada"
                rows={3}
              />
            </Field>
          </Section>

          <Section title="Pena de prisión" icon={<Lock size={14} />}>
            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="Mínima (meses)" required htmlFor="pmin" error={errors.pena_minima_meses}>
                  <Input
                    id="pmin"
                    inputMode="numeric"
                    value={form.pena_minima_meses}
                    onChange={e => update('pena_minima_meses', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    invalid={!!errors.pena_minima_meses}
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Máxima (meses)" required htmlFor="pmax" error={errors.pena_maxima_meses}>
                  <Input
                    id="pmax"
                    inputMode="numeric"
                    value={form.pena_maxima_meses}
                    onChange={e => update('pena_maxima_meses', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    invalid={!!errors.pena_maxima_meses}
                  />
                </Field>
              </div>
            </div>
            <p className="text-[11px] text-text-muted italic mt-1">
              Tip: 1 año = 12 meses · 5 años = 60 meses · ≥60 meses ⇒ delito grave
            </p>
          </Section>

          <Section title="Pena alternativa" icon={<DollarSign size={14} />}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text">Posee pena alternativa</p>
                <p className="text-[11px] text-text-muted">Permite optar por multa u otra pena no privativa</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.tiene_pena_alternativa}
                  onChange={e => update('tiene_pena_alternativa', e.target.checked)}
                />
                <div className="w-9 h-5 bg-border rounded-full peer-checked:bg-accent peer-focus:ring-2 peer-focus:ring-accent/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            {form.tiene_pena_alternativa && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Field label="Mín. alternativa" htmlFor="palmin" error={errors.pena_alternativa_min}>
                    <Input
                      id="palmin"
                      inputMode="numeric"
                      value={form.pena_alternativa_min}
                      onChange={e => update('pena_alternativa_min', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      invalid={!!errors.pena_alternativa_min}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Máx. alternativa" htmlFor="palmax" error={errors.pena_alternativa_max}>
                    <Input
                      id="palmax"
                      inputMode="numeric"
                      value={form.pena_alternativa_max}
                      onChange={e => update('pena_alternativa_max', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      invalid={!!errors.pena_alternativa_max}
                    />
                  </Field>
                </div>
              </div>
            )}
          </Section>

          <Section title="Penas accesorias" icon={<Ribbon size={14} />}>
            <Field label="Lista (separadas por coma)" htmlFor="penas-acc">
              <Textarea
                id="penas-acc"
                value={form.penas_accesorias}
                onChange={e => update('penas_accesorias', e.target.value)}
                placeholder="Inhabilitación absoluta, Multa proporcional"
                rows={2}
              />
            </Field>
          </Section>

          <Section title="Observaciones" icon={<FileText size={14} />}>
            <Field label="Notas adicionales" htmlFor="observaciones">
              <Textarea
                id="observaciones"
                value={form.observaciones}
                onChange={e => update('observaciones', e.target.value)}
                placeholder="Apuntes técnicos, jurisprudencia, etc."
                rows={3}
              />
            </Field>
          </Section>

          {isEdit && (
            <Button
              variant="danger"
              fullWidth
              size="lg"
              onClick={handleDelete}
              iconLeft={<Trash2 size={16} />}
              className="bg-danger-bg text-danger border border-danger/30 hover:bg-danger/15 mt-2"
            >
              Eliminar delito
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-light px-3 py-2 flex gap-3 no-print z-40">
        <Button variant="secondary" fullWidth onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          fullWidth
          loading={saving}
          iconLeft={!saving ? <Save size={16} /> : undefined}
          onClick={handleSave}
        >
          {isEdit ? 'Guardar cambios' : 'Crear delito'}
        </Button>
      </div>
    </div>
  );
}
