'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, User, Phone, Mail } from 'lucide-react';

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
            setForm({ nombre: '', telefono: '', email: '', motivo: MOTIVOS[1], resumen: '', acepta: false });
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
      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label="Nombre completo"
          icon={User}
          value={form.nombre}
          onChange={onText('nombre')}
          required
        />
        <Field
          label="Teléfono"
          icon={Phone}
          type="tel"
          value={form.telefono}
          onChange={onText('telefono')}
          required
        />
      </div>
      <Field
        label="Correo electrónico"
        icon={Mail}
        type="email"
        value={form.email}
        onChange={onText('email')}
      />
      <div>
        <label className="block text-xs font-bold text-text mb-1">
          Motivo de la consulta
        </label>
        <select
          value={form.motivo}
          onChange={onText('motivo')}
          className="w-full h-11 px-3 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        >
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-text mb-1">
          Resumen de la situación
        </label>
        <textarea
          value={form.resumen}
          onChange={onText('resumen')}
          rows={6}
          placeholder="Describa brevemente los hechos. NO incluya documentos ni números sensibles innecesarios."
          className="w-full px-3 py-2.5 rounded-md border border-border-light bg-surface text-sm text-text leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
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
        <div role="alert" className="flex items-start gap-2 p-2.5 rounded-md bg-aggravation/10 border border-aggravation/30 text-xs text-aggravation">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors disabled:opacity-50"
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
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  const fieldId = `consulta-${label.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-bold text-text mb-1">
        {label}
        {required && <span className="text-aggravation ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full h-11 pl-9 pr-3 rounded-md border border-border-light bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>
    </div>
  );
}
