'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, X, Bookmark, Lock, DollarSign, Ribbon, FileText, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { Delito, Clasificacion } from '../types';

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
    <div className="bg-surface rounded-lg p-3 mb-2.5 border border-border-light shadow-sm">
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border-light">
        <span className="text-accent">{icon}</span>
        <h3 className="font-bold text-xs text-primary uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-semibold text-text-secondary mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function DelitoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClasifPicker, setShowClasifPicker] = useState(false);

  useEffect(() => {
    fetch('/api/clasificaciones')
      .then(r => r.json())
      .then(data => setClasificaciones(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (isEdit && id) {
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
        .catch(() => alert('No se pudo cargar el delito'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const update = (k: keyof FormState, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const validate = (): string | null => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.articulo.trim()) return 'El artículo es obligatorio';
    if (!form.clasificacion.trim()) return 'La clasificación es obligatoria';
    const min = parseInt(form.pena_minima_meses, 10);
    const max = parseInt(form.pena_maxima_meses, 10);
    if (isNaN(min) || min < 0) return 'Pena mínima inválida';
    if (isNaN(max) || max < min) return 'Pena máxima inválida';
    if (form.tiene_pena_alternativa) {
      const altMin = parseInt(form.pena_alternativa_min, 10);
      const altMax = parseInt(form.pena_alternativa_max, 10);
      if (isNaN(altMin) || isNaN(altMax) || altMax < altMin) return 'Pena alternativa inválida';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { alert(err); return; }
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

      if (!res.ok) throw new Error(await res.text());
      router.back();
    } catch (e: any) {
      alert(`No se pudo guardar: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!confirm('¿Eliminar este delito? Acción irreversible.')) return;
    try {
      const res = await fetch(`/api/delitos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.back();
    } catch {
      alert('No se pudo eliminar');
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
      <div className="flex items-center bg-primary px-3 py-1.5">
        <Link href="/delitos" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-2 hover:bg-white/20 transition-colors">
          <X size={20} className="text-white" />
        </Link>
        <h1 className="flex-1 text-center text-white font-bold text-sm">{isEdit ? 'Editar delito' : 'Nuevo delito'}</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto p-3">
          <Section title="Identificación" icon={<Bookmark size={14} />}>
            <Field label="Nombre del delito *">
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent"
                value={form.nombre}
                onChange={e => update('nombre', e.target.value)}
                placeholder="Ej: Hurto agravado"
              />
            </Field>
            <Field label="Artículo *">
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent"
                value={form.articulo}
                onChange={e => update('articulo', e.target.value)}
                placeholder="Ej: Art. 363 CP"
              />
            </Field>
            <Field label="Clasificación *">
              <div className="relative">
                <button
                  onClick={() => setShowClasifPicker(!showClasifPicker)}
                  className="w-full flex items-center border border-border rounded-lg px-3 py-2 text-sm bg-surface-alt outline-none focus:border-accent"
                >
                  <span className={`flex-1 text-left ${form.clasificacion ? 'text-text' : 'text-text-muted'}`}>
                    {form.clasificacion || 'Selecciona o escribe la clasificación'}
                  </span>
                  {showClasifPicker ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </button>
                {showClasifPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-alt border border-border rounded-lg p-2.5 z-10 shadow-lg max-h-48 overflow-y-auto">
                    <input
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-text bg-white outline-none focus:border-accent mb-2"
                      value={form.clasificacion}
                      onChange={e => update('clasificacion', e.target.value)}
                      placeholder="Escribe una nueva o elige abajo"
                    />
                    {clasificaciones.map(c => (
                      <button
                        key={c.nombre}
                        onClick={() => { update('clasificacion', c.nombre); setShowClasifPicker(false); }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-text hover:bg-white rounded transition-colors"
                      >
                        <span className="flex-1 text-left">{c.nombre}</span>
                        <span className="text-xs text-text-muted">{c.cantidad}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Conducta tipificada">
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent min-h-[60px] resize-y"
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
                <Field label="Mínima (meses) *">
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent"
                    value={form.pena_minima_meses}
                    onChange={e => update('pena_minima_meses', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Máxima (meses) *">
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent"
                    value={form.pena_maxima_meses}
                    onChange={e => update('pena_maxima_meses', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
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
                  <Field label="Mín. alternativa">
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent"
                      value={form.pena_alternativa_min}
                      onChange={e => update('pena_alternativa_min', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Máx. alternativa">
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent"
                      value={form.pena_alternativa_max}
                      onChange={e => update('pena_alternativa_max', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>
            )}
          </Section>

          <Section title="Penas accesorias" icon={<Ribbon size={14} />}>
            <Field label="Lista (separadas por coma)">
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent min-h-[60px] resize-y"
                value={form.penas_accesorias}
                onChange={e => update('penas_accesorias', e.target.value)}
                placeholder="Inhabilitación absoluta, Multa proporcional"
                rows={2}
              />
            </Field>
          </Section>

          <Section title="Observaciones" icon={<FileText size={14} />}>
            <Field label="Notas adicionales">
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent min-h-[60px] resize-y"
                value={form.observaciones}
                onChange={e => update('observaciones', e.target.value)}
                placeholder="Apuntes técnicos, jurisprudencia, etc."
                rows={3}
              />
            </Field>
          </Section>

          {isEdit && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg border border-danger/30 bg-danger/10 text-danger font-bold text-sm hover:bg-danger/20 transition-colors"
            >
              <Trash2 size={16} />
              Eliminar delito
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-light px-3 py-2 flex gap-3">
        <Link
          href="/delitos"
          className="flex-1 py-2.5 rounded-md border border-border text-center text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors disabled:opacity-70"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={16} />
              {isEdit ? 'Guardar cambios' : 'Crear delito'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
