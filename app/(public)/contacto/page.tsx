'use client';

import { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  MessageSquare,
} from 'lucide-react';
import { site, telHref, whatsappHref, mailtoHref } from '@/lib/site';
import { Section } from '@/components/marketing/section';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { Card } from '@/components/ui/card';
import { LiveOfficeStatus } from '@/components/marketing/live-widgets';
import { CONTACTO_ASUNTOS } from '@/lib/validation';

type Status = 'idle' | 'sending' | 'success' | 'error';

const SUBJECTS = CONTACTO_ASUNTOS;

export default function ContactoPage() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    asunto: SUBJECTS[1],
    mensaje: '',
    acepta: false,
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = k === 'acepta' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acepta) {
      setErrorMsg('Debe aceptar la política de privacidad.');
      return;
    }
    if (form.mensaje.length < 10) {
      setErrorMsg('Describa brevemente su situación (mínimo 10 caracteres).');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo enviar el mensaje.');
      }
      setStatus('success');
      setForm({ nombre: '', telefono: '', email: '', asunto: SUBJECTS[1], mensaje: '', acepta: false });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        badge="Respuesta en horario hábil"
        title="Estamos disponibles para escucharle"
        subtitle={
          <>
            Elija el canal que prefiera. Toda comunicación está protegida por el
            <strong className="font-bold text-accent"> secreto profesional</strong>.
            Atendemos <strong className="font-bold">cualquiera de las 13 áreas del bufete</strong>:
            defensa penal, familia, laboral, civil, mercantil, tributario, bancario,
            administrativo, aduanero, sanitario, extranjería, propiedad intelectual,
            ambiental y conciliación/arbitraje.
          </>
        }
        cta={undefined}
      />

      <TrustBar background="light" />

      <Section spacing="md">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card padding="md" className="card-premium">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <h2 className="font-bold text-base text-primary">Formulario confidencial</h2>
              </div>

              {status === 'success' ? (
                <div className="rounded-md border border-success/30 bg-success/10 p-5 text-center">
                  <CheckCircle2 size={36} className="text-success mx-auto mb-2" />
                  <p className="font-bold text-text">Mensaje recibido</p>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                    Le contactaremos en horario hábil por el medio que haya indicado.
                    Si requiere atención inmediata, use el teléfono o WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-[12px] font-semibold text-primary hover:text-accent-dark"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field
                      label="Nombre"
                      icon={User}
                      value={form.nombre}
                      onChange={onChange('nombre')}
                      required
                    />
                    <Field
                      label="Teléfono"
                      icon={Phone}
                      type="tel"
                      value={form.telefono}
                      onChange={onChange('telefono')}
                      required
                    />
                  </div>
                  <Field
                    label="Correo electrónico"
                    icon={Mail}
                    type="email"
                    value={form.email}
                    onChange={onChange('email')}
                  />
                  <div>
                    <label className="block text-[12px] font-bold text-text mb-1">
                      Asunto
                    </label>
                    <select
                      value={form.asunto}
                      onChange={onChange('asunto')}
                      className="w-full h-11 px-3 rounded-md border border-border-light bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-text mb-1">
                      Mensaje
                    </label>
                    <textarea
                      value={form.mensaje}
                      onChange={onChange('mensaje')}
                      rows={5}
                      placeholder="Describa brevemente su situación. NO incluya datos sensibles innecesarios."
                      className="w-full px-3 py-2.5 rounded-md border border-border-light bg-surface text-[14px] text-text leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      required
                      minLength={10}
                    />
                    <p className="text-[11px] text-text-muted mt-1">
                      Mínimo 10 caracteres. Por seguridad, no envíe contraseñas, números de tarjeta ni documentos de identidad completos.
                    </p>
                  </div>
                  <label className="flex items-start gap-2 text-[12px] text-text-secondary">
                    <input
                      type="checkbox"
                      checked={form.acepta}
                      onChange={onChange('acepta')}
                      className="mt-0.5 accent-primary"
                    />
                    <span>
                      Acepto la{' '}
                      <a href="/politica-privacidad" className="text-primary font-semibold hover:underline">
                        política de privacidad
                      </a>{' '}
                      y el tratamiento de mis datos para gestionar mi consulta, conforme a la legislación hondureña.
                    </span>
                  </label>

                  {errorMsg && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-aggravation/10 border border-aggravation/30 text-[12px] text-aggravation">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn-shimmer w-full h-12 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Enviando…
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-3">
            <LiveOfficeStatus />

            <Card padding="md">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-accent-dark mb-3">
                Canales directos
              </h3>
              <ul className="space-y-3 text-[13px]">
                <li>
                  <a href={telHref()} className="flex items-start gap-3 hover:text-primary">
                    <Phone size={16} className="text-accent-dark flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-text">Teléfono</p>
                      <p className="tabular-nums text-text-secondary">{site.phoneDisplay}</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappHref('Hola, necesito orientación jurídica.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 hover:text-success"
                  >
                    <MessageCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-text">WhatsApp</p>
                      <p className="text-text-secondary">Respuesta en horario hábil</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a href={mailtoHref('Consulta desde sitio web')} className="flex items-start gap-3 hover:text-primary">
                    <Mail size={16} className="text-accent-dark flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-text">Correo</p>
                      <p className="text-text-secondary break-all">{site.email}</p>
                    </div>
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text">Dirección</p>
                    <p className="text-text-secondary leading-relaxed">
                      {site.address.line1}<br />
                      {site.address.line2}<br />
                      {site.address.city}, {site.address.department}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={16} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text">Horario</p>
                    <p className="text-text-secondary">Lunes a sábado · 7:00 a 20:00</p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card padding="md" className="bg-warning-bg border border-warning/30">
              <p className="text-[12px] text-text-secondary leading-relaxed">
                <strong className="text-text">¿Urgencia legal?</strong>{' '}
                Detención, desalojo, despido, denuncia o retención migratoria —si es
                apremiante, contáctenos de inmediato. Actuamos en toda Honduras con
                presencia en Nacaome, Tegucigalpa, San Pedro Sula, Choluteca y Comayagua.
              </p>
            </Card>

            <Card padding="sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent-dark mb-2">
                13 áreas de práctica
              </p>
              <div className="flex flex-wrap gap-1">
                {['Penal','Familia','Laboral','Civil','Mercantil','Bancario','Administrativo','Aduanero','Sanitario','Extranjería','Prop.Intelectual','Tributario','Ambiental','Conciliación'].map((a) => (
                  <span key={a} className="inline-flex px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-text-secondary font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </>
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
  return (
    <div>
      <label className="block text-[12px] font-bold text-text mb-1">
        {label}
        {required && <span className="text-aggravation ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full h-11 pl-9 pr-3 rounded-md border border-border-light bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>
    </div>
  );
}
