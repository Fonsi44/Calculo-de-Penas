'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, User, Phone, Mail } from 'lucide-react';
import { trackLeadGenerated } from '@/lib/analytics';

const MOTIVOS = [
  'Familiar detenido',
  'Citaciones o audiencias',
  'Investigación en curso',
  'Querella o denuncia',
  'Recurso o apelación',
  'Asesoría preventiva',
  'Atención a víctima',
  'Otro asunto',
];

type Status = 'idle' | 'sending' | 'success' | 'error';

export function SolicitarConsultaForm() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    motivo: MOTIVOS[1],
    resumen: '',
    acepta: false,
    // Honeypot: campo oculto para humanos, visible para bots. Debe ir vacío.
    website: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState('');

  const onText = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acepta) {
      setErr('Debe aceptar la política de privacidad.');
      return;
    }
    if (form.resumen.length < 15) {
      setErr('Describa brevemente su situación (mínimo 15 caracteres).');
      return;
    }
    setStatus('sending');
    setErr('');
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo enviar la solicitud.');
      }
      setStatus('success');
      trackLeadGenerated('consulta_form');
    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : 'Error desconocido.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-6 text-center">
        <CheckCircle2 size={40} className="text-success mx-auto mb-3" />
        <p className="font-bold text-text text-base">Solicitud recibida</p>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-md mx-auto">
          Hemos registrado su consulta. Le contactaremos en horario hábil por el canal
          que haya indicado. Si requiere atención inmediata, use el teléfono o WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setForm({ nombre: '', telefono: '', email: '', motivo: MOTIVOS[1], resumen: '', acepta: false, website: '' });
          }}
          className="mt-4 text-xs font-semibold text-primary hover:text-accent-dark"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <fieldset className="grid sm:grid-cols-2 gap-3 border-0 p-0 m-0">
        <legend className="sr-only">Datos de contacto</legend>
        <Field
          label="Nombre completo"
          icon={User}
          value={form.nombre}
          onChange={onText('nombre')}
          required
          autoComplete="given-name"
        />
        <Field
          label="Teléfono"
          icon={Phone}
          type="tel"
          value={form.telefono}
          onChange={onText('telefono')}
          required
          autoComplete="tel"
        />
      </fieldset>
      <Field
        label="Correo electrónico"
        icon={Mail}
        type="email"
        value={form.email}
        onChange={onText('email')}
        autoComplete="email"
      />
      <div>
        <label htmlFor="consulta-motivo" className="block text-xs font-bold text-text mb-1">
          Motivo de la consulta
        </label>
        <select
          id="consulta-motivo"
          value={form.motivo}
          onChange={onText('motivo')}
          className="input-refined w-full h-11 px-3 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none"
        >
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="consulta-resumen" className="block text-xs font-bold text-text mb-1">
          Resumen de la situación
        </label>
        <textarea
          id="consulta-resumen"
          value={form.resumen}
          onChange={onText('resumen')}
          rows={6}
          placeholder="Describa brevemente los hechos. NO incluya documentos ni números sensibles innecesarios."
          className="input-refined w-full px-3 py-2.5 rounded-md border border-border-light bg-surface text-sm text-text leading-relaxed focus:outline-none"
          required
          minLength={15}
        />
        <p className="text-xxs text-text-muted mt-1">
          Mínimo 15 caracteres. La información es confidencial y se usa únicamente para
          evaluar su caso.
        </p>
      </div>
      <label htmlFor="consulta-acepta" className="flex items-start gap-2 text-xs text-text-secondary">
        <input
          id="consulta-acepta"
          type="checkbox"
          checked={form.acepta}
          onChange={(e) => setForm((f) => ({ ...f, acepta: e.target.checked }))}
          className="mt-0.5 accent-primary"
        />
        <span>
          Acepto la{' '}
          <a href="/politica-privacidad" className="text-primary font-semibold hover:underline">
            política de privacidad
          </a>{' '}
          y el tratamiento de mis datos para gestionar mi consulta.
        </span>
      </label>

      {err && (
        <div role="alert" aria-live="polite" className="flex items-start gap-2 p-2.5 rounded-md bg-aggravation/10 border border-aggravation/30 text-xs text-aggravation">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {/* Honeypot antispam: campo oculto para humanos (sr-only), visible para
          bots que rellenan todos los inputs. Si llega con contenido, el
          backend (Zod schema) rechaza el submit. No usar display:none: algunos
          bots lo detectan y saltan el campo. aria-hidden + tabindex=-1 para
          que usuarios de lector de pantalla no interactúen con él. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden">
        <label htmlFor="consulta-website">No rellenar (website)</label>
        <input
          id="consulta-website"
          type="text"
          name="website"
          value={form.website}
          onChange={onText('website')}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="focus-ring cta-primary-refined w-full h-12 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Enviando…
          </>
        ) : (
          <>
            <Send size={16} /> Enviar solicitud
          </>
        )}
      </button>
      <p className="text-xxs text-text-muted text-center leading-relaxed">
        Consulta confidencial y sin compromiso · Respuesta en horario hábil ·
        Sus datos están protegidos por el secreto profesional. No garantizamos
        resultados, que dependen del análisis individual de cada caso.
      </p>
    </form>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  required = false,
  autoComplete,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const fieldId = `consulta-${label.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}`;
  const descId = `${fieldId}-desc`;
  // aria-invalid solo cuando el campo requerido está vacío tras interacción.
  // El form valida submit global, así que marcamos inválido si required y vacío.
  const invalid = required && value.trim() === '';
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-bold text-text mb-1">
        {label}
        {required && <span className="text-aggravation ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none transition-colors" />
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={descId}
          className="input-refined w-full h-11 pl-9 pr-3 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none aria-[invalid=true]:border-aggravation"
        />
      </div>
      <span id={descId} className="sr-only">
        {required ? `${label}, campo obligatorio.` : `${label}, campo opcional.`}
      </span>
    </div>
  );
}
