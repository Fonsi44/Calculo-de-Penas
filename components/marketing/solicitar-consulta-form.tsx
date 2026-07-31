'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, User, Phone, Mail, PhoneCall, MessageCircle, AlertTriangle } from 'lucide-react';
import {
  trackContactFormSubmit,
  trackLeadGenerated,
  trackConsultationFormView,
  trackConsultationFormStart,
  trackConsultationFormError,
} from '@/lib/analytics';
import { TurnstileWidget, type TurnstileStatus } from './turnstile-widget';
import { telHref, whatsappHref } from '@/lib/site';

const MOTIVOS = [
  'Familiar detenido',
  'Citaciones o audiencias',
  'Investigación en curso',
  'Querella o denuncia',
  'Recurso o apelación',
  'Asesoría preventiva',
  'Atención a víctima',
  'Despido o prestaciones laborales',
  'Divorcio, custodia o pensión de alimentos',
  'Contrato, propiedad, sucesión o trámite notarial',
  'Asunto desde España',
  'Otro asunto',
] as const;

/**
 * FASE 3 (§15) + FASE 4 (§14) — Whitelist slug de servicio → motivo textual
 * del dropdown. Permite preseleccionar el motivo cuando se llega desde un CTA
 * contextual (p. ej. /solicitar-consulta?motivo=derecho-penal#formulario).
 *
 * Reglas de seguridad:
 *  - Solo se aceptan slugs explícitamente listados (no inyección).
 *  - El valor mapeado debe existir en MOTIVOS Y en CONSULTA_MOTIVOS (backend);
 *    si no, se ignora. Antes 3 de 4 valores mapeaban a motivos que el backend
 *    rechazaba con 400 "Motivo inválido"; ahora las listas están alineadas.
 *  - El parámetro NO se reenvía automáticamente: solo preselecciona el
 *    dropdown, que el usuario puede cambiar libremente.
 *  - No registra PII: el `motivo` es una categoría, no contenido del usuario.
 */
const MOTIVO_FROM_QUERY: Record<string, string> = {
  'derecho-penal': 'Citaciones o audiencias',
  'derecho-de-familia': 'Divorcio, custodia o pensión de alimentos',
  'derecho-laboral': 'Despido o prestaciones laborales',
  'derecho-civil-y-notarial': 'Contrato, propiedad, sucesión o trámite notarial',
  'derecho-mercantil-empresarial': 'Otro asunto',
  'derecho-administrativo-y-servicio-civil': 'Otro asunto',
  'hondurenos-en-espana': 'Asunto desde España',
};

const MEDIOS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'llamada', label: 'Llamada programada' },
] as const;

const URGENCIAS = [
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta (audiencia/citación próxima)' },
  { value: 'penal', label: 'Urgencia penal (detención en curso)' },
] as const;

type Status = 'idle' | 'sending' | 'success' | 'error';

interface FormState {
  nombre: string;
  telefono: string;
  email: string;
  motivo: string;
  medioPreferido: string;
  localidad: string;
  urgencia: string;
  fechaAudiencia: string;
  hayDetencion: string;
  fechaDespido: string;
  residenciaEspana: string;
  disponibleLlamada: string;
  resumen: string;
  acepta: boolean;
  // Honeypot: campo oculto para humanos, visible para bots. Debe ir vacío.
  website: string;
}

const INITIAL_FORM: FormState = {
  nombre: '',
  telefono: '',
  email: '',
  motivo: MOTIVOS[1],
  medioPreferido: 'whatsapp',
  localidad: '',
  urgencia: 'normal',
  fechaAudiencia: '',
  hayDetencion: '',
  fechaDespido: '',
  residenciaEspana: '',
  disponibleLlamada: '',
  resumen: '',
  acepta: false,
  website: '',
};

/**
 * FASE 3 (§15) — Lee el motivo preseleccionado desde ?motivo={slug} de forma
 * segura. Solo acepta slugs de la whitelist MOTIVO_FROM_QUERY; cualquier otro
 * valor (o ausencia del parámetro) se ignora. No reenvía el parámetro ni
 * registra PII. Se invoca como inicializador perezoso del useState (una sola
 * vez, sin efecto secundario posterior).
 */
function leerMotivoInicial(motivoPorDefecto: string): string {
  if (typeof window === 'undefined') return motivoPorDefecto;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('motivo');
  if (!raw) return motivoPorDefecto;
  const mapped = MOTIVO_FROM_QUERY[raw];
  // Doble validación: el slug debe estar en la whitelist Y el motivo mapeado
  // debe seguir siendo una opción válida del catálogo actual.
  if (mapped && (MOTIVOS as readonly string[]).includes(mapped)) {
    return mapped;
  }
  return motivoPorDefecto;
}

export function SolicitarConsultaForm() {
  // Inicialización perezosa: preselecciona el motivo si ?motivo= es válido.
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_FORM,
    motivo: leerMotivoInicial(INITIAL_FORM.motivo),
  }));
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState('');
  const [reference, setReference] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileStatus, setTurnstileStatus] = useState<TurnstileStatus>('loading');
  const [started, setStarted] = useState(false);

  // Vista del formulario al montar (evento de conversión FASE 2, sin PII).
  // Se dispara una sola vez al montar el componente.
  useEffect(() => {
    trackConsultationFormView(typeof window !== 'undefined' ? window.location.pathname : '');
  }, []);

  const onText =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      // Primer campo editado → dispara form_start una sola vez.
      if (!started) {
        setStarted(true);
        trackConsultationFormStart(typeof window !== 'undefined' ? window.location.pathname : '');
      }
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acepta) {
      setErr('Debe aceptar la política de privacidad.');
      trackConsultationFormError({ campo: 'acepta', tipo: 'consent', ruta: typeof window !== 'undefined' ? window.location.pathname : '' });
      return;
    }
    if (form.resumen.length < 15) {
      setErr('Describa brevemente su situación (mínimo 15 caracteres).');
      trackConsultationFormError({ campo: 'resumen', tipo: 'minlength', ruta: typeof window !== 'undefined' ? window.location.pathname : '' });
      return;
    }
    // Bloquear el envío cuando el captcha está configurado pero el usuario
    // aún no ha completado la verificación (o el widget falló al cargar).
    if (turnstileStatus !== 'unconfigured' && !turnstileToken) {
      const msg =
        turnstileStatus === 'error'
          ? 'No se pudo cargar la verificación antispam. Recargue la página e intente de nuevo.'
          : 'Complete la verificación antispam antes de enviar.';
      setErr(msg);
      trackConsultationFormError({ campo: 'turnstile', tipo: 'captcha', ruta: typeof window !== 'undefined' ? window.location.pathname : '' });
      return;
    }
    setStatus('sending');
    setErr('');
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, 'cf-turnstile-response': turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const suffix = typeof data.reference === 'string' ? ` Referencia: ${data.reference}.` : '';
        throw new Error(`${data.error ?? 'No se pudo enviar la solicitud.'}${suffix}`);
      }
      setReference(typeof data.reference === 'string' ? data.reference : '');
      setStatus('success');
      setTurnstileToken('');
      trackLeadGenerated('consulta_form');
      trackContactFormSubmit({ motivo: form.motivo, ruta: typeof window !== 'undefined' ? window.location.pathname : '' });
    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : 'Error desconocido.');
      setTurnstileToken('');
      trackConsultationFormError({ tipo: 'submit', ruta: typeof window !== 'undefined' ? window.location.pathname : '' });
    }
  };

  if (status === 'success') {
    // Confirmación ampliada FASE 2: recibido, plazo prudente, urgencia penal,
    // no aceptación implícita, no originales, protección de datos.
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={32} className="text-success flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-text text-base">Solicitud recibida</p>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed text-pretty">
              Hemos registrado su consulta. La revisamos en horario hábil y le
              contactamos por el canal que haya indicado. No se garantiza
              respuesta inmediata: el compromiso es atender con la diligencia que
              cada caso requiere.
            </p>
            {reference ? (
              <p className="mt-2 text-xs font-semibold text-text-secondary">
                Referencia de solicitud: <span className="font-mono">{reference}</span>
              </p>
            ) : null}
            <div className="mt-4 rounded-lg border border-aggravation/20 bg-aggravation/5 p-3">
              <p className="flex items-center gap-2 text-xs font-bold text-aggravation">
                <AlertTriangle size={14} /> ¿Urgencia penal?
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Si hay una detención en curso o una audiencia inminente, no espere:
                use el teléfono o WhatsApp directo para activar la atención prioritaria.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <a href={telHref()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-aggravation text-white text-xs font-bold">
                  <PhoneCall size={12} /> Llamar
                </a>
                <a
                  href={whatsappHref('Emergencia: necesito asistencia legal inmediata.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-success text-white text-xs font-bold"
                >
                  <MessageCircle size={12} /> WhatsApp
                </a>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-text-secondary leading-relaxed">
              <li>• El envío del formulario <strong>no implica aceptación formal</strong> del asunto.</li>
              <li>• <strong>No envíe originales</strong>: para la evaluación inicial basta con copias digitales.</li>
              <li>• Sus datos están protegidos por el secreto profesional y la normativa de protección de datos.</li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setForm(INITIAL_FORM);
            setReference('');
          }}
          className="mt-4 text-xs font-semibold text-primary hover:text-accent-dark"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const isPenalMatter =
    form.motivo === 'Familiar detenido'
    || form.motivo === 'Citaciones o audiencias'
    || form.motivo === 'Investigación en curso';
  const isLaborMatter = form.motivo === 'Despido o prestaciones laborales';
  const isSpainMatter = form.motivo === 'Asunto desde España';
  const needsCallAvailability = isSpainMatter || form.medioPreferido === 'llamada';
  const hasAdditionalFields = isPenalMatter || isLaborMatter || isSpainMatter || needsCallAvailability;

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
        label="Correo electrónico (opcional)"
        icon={Mail}
        type="email"
        value={form.email}
        onChange={onText('email')}
        autoComplete="email"
      />
      <p className="text-xxs text-text-muted -mt-1">
        El teléfono es necesario para devolverle el contacto. El correo es opcional y se utiliza también para enviar confirmaciones.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <SelectField
          id="consulta-medio"
          label="Medio de contacto preferido"
          value={form.medioPreferido}
          onChange={onText('medioPreferido')}
          options={MEDIOS.map((m) => ({ value: m.value, label: m.label }))}
        />
        <SelectField
          id="consulta-urgencia"
          label="Nivel de urgencia"
          value={form.urgencia}
          onChange={onText('urgencia')}
          options={URGENCIAS.map((u) => ({ value: u.value, label: u.label }))}
        />
      </div>

      <Field
        label="Localidad o país"
        value={form.localidad}
        onChange={onText('localidad')}
        placeholder="Ej.: Nacaome, Valle · Choluteca · Madrid, España"
        autoComplete="address-level2"
      />

      <div>
        <label htmlFor="consulta-motivo" className="block text-xs font-bold text-text mb-1">
          Tipo general de asunto
        </label>
        <select
          id="consulta-motivo"
          value={form.motivo}
          onChange={onText('motivo')}
          className="input-refined w-full h-11 px-3 rounded-lg border border-border-light bg-surface text-sm text-text focus:outline-none"
        >
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* CAMPOS CONDICIONALES (FASE 2) — solo se muestran cuando aportan valor
          según el tipo de asunto. No se solicita detalle penal excesivo. */}
      {hasAdditionalFields && (
      <details className="rounded-lg border border-border-light bg-surface-alt/40 p-3">
          <summary className="cursor-pointer text-xs font-bold text-text-secondary select-none">
            Información adicional para este tipo de asunto (opcional)
          </summary>
          <div className="mt-3 space-y-3">
            {/* Penal: audiencia/detención */}
            {isPenalMatter && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="Fecha de audiencia o citación (si la tiene)"
                value={form.fechaAudiencia}
                onChange={onText('fechaAudiencia')}
                placeholder="Ej.: 30 de julio de 2026"
              />
              <SelectField
                id="consulta-detencion"
                label="¿Hay alguna persona detenida?"
                value={form.hayDetencion}
                onChange={onText('hayDetencion')}
                options={[
                  { value: '', label: '— Seleccione —' },
                  { value: 'si', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </div>
          )}
            {/* Laboral: fecha de despido */}
            {isLaborMatter && (
              <Field
                label="Fecha de despido (si la conoce)"
                value={form.fechaDespido}
                onChange={onText('fechaDespido')}
                placeholder="Ej.: 15 de junio de 2026"
              />
            )}
            {/* España: residencia */}
            {isSpainMatter && (
              <SelectField
                id="consulta-espana"
                label="¿Se encuentra actualmente en España?"
                value={form.residenciaEspana}
                onChange={onText('residenciaEspana')}
                options={[
                  { value: '', label: '— Seleccione —' },
                  { value: 'si', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
            )}
            {/* Disponibilidad: solo para consultas desde España o llamadas programadas */}
            {needsCallAvailability && (
              <SelectField
                id="consulta-llamada"
                label="¿Está disponible para una llamada?"
                value={form.disponibleLlamada}
                onChange={onText('disponibleLlamada')}
                options={[
                  { value: '', label: '— Seleccione —' },
                  { value: 'si', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
            )}
          </div>
        </details>
      )}

      <div>
        <label htmlFor="consulta-resumen" className="block text-xs font-bold text-text mb-1">
          Descripción breve de la situación
        </label>
        <textarea
          id="consulta-resumen"
          value={form.resumen}
          onChange={onText('resumen')}
          rows={6}
          placeholder="Describa brevemente los hechos. NO incluya documentos, números de tarjeta ni datos de identidad completos."
          className="input-refined w-full px-3 py-2.5 rounded-lg border border-border-light bg-surface text-sm text-text leading-relaxed focus:outline-none"
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
        <div role="alert" aria-live="polite" className="flex items-start gap-2 p-2.5 rounded-lg bg-aggravation/10 border border-aggravation/30 text-xs text-aggravation">
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

      <TurnstileWidget onToken={setTurnstileToken} onStatusChange={setTurnstileStatus} />

      <button
        type="submit"
        disabled={status === 'sending' || (turnstileStatus !== 'unconfigured' && !turnstileToken)}
        className="focus-ring cta-primary-refined w-full h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-base font-bold btn-shadow-primary btn-shadow-primary-hover hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  placeholder,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [touched, setTouched] = useState(false);
  const fieldId = `consulta-${label.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}`;
  const descId = `${fieldId}-desc`;
  const invalid = touched && required && value.trim() === '';
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-bold text-text mb-1">
        {label}
        {required && <span className="text-aggravation ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none transition-colors" />
        )}
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={descId}
          className={`input-refined w-full h-11 ${Icon ? 'pl-9' : 'pl-3'} pr-3 rounded-lg border border-border-light bg-surface text-sm text-text focus:outline-none aria-[invalid=true]:border-aggravation`}
        />
      </div>
      <span id={descId} className="sr-only">
        {required ? `${label}, campo obligatorio.` : `${label}, campo opcional.`}
      </span>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-text mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="input-refined w-full h-11 px-3 rounded-lg border border-border-light bg-surface text-sm text-text focus:outline-none"
      >
        {options.map((o) => (
          <option key={`${id}-${o.value}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
