/**
 * Sección premium para la página /despacho.
 * Reemplaza Timeline + StatsCounter del diseño anterior.
 * - Hero editorial
 * - Stats sobrios con borde dorado
 * - Bloque de valores
 * - Equipo destacado
 */

import { Scale, Shield, Heart, Compass, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { site, telHref, whatsappHref, mailtoHref } from '@/lib/site';
import Link from 'next/link';

const VALUES = [
  { icon: Scale, title: 'Ética profesional', desc: 'Confidencialidad, independencia y lealtad al cliente. Código deontológico del CNA.' },
  { icon: Shield, title: 'Defensa seria', desc: 'Estricta aplicación del Código Penal · Decreto 130-2017. Estrategia procesal robusta.' },
  { icon: Heart, title: 'Cercanía real', desc: 'Atención humana en momentos sensibles. Te explicamos cada paso con claridad.' },
  { icon: Compass, title: 'Visión integral', desc: '13 áreas del derecho integradas. Coordinamos equipos multidisciplinarios para tu caso.' },
];

const STATS = [
  { value: '+15', label: 'Años de ejercicio' },
  { value: '13', label: 'Áreas del derecho' },
  { value: '24/7', label: 'Asistencia a detenidos' },
  { value: '100%', label: 'Confidencialidad' },
];

export function PremiumDespacho() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-primary text-text-inverse p-8 md:p-12">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">
          El Despacho
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-balance">
          Defensa seria, atención humana, resultados que importan
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-text-inverse/85 leading-relaxed text-pretty">
          Bufete multidisciplinar en {site.address.city}, {site.address.department}, con más de 15 años de
          ejercicio profesional y la defensa penal como pilar histórico. Integramos 13 áreas del derecho
          para asesorarle en cualquier frente, con atención confidencial y personalizada.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/solicitar-consulta"
            className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors focus-visible:outline-none ring-1 ring-accent/40"
          >
            Solicitar consulta
          </Link>
          <a
            href={telHref()}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md border-2 border-text-inverse/40 text-text-inverse text-sm font-bold hover:bg-primary-light/40 hover:border-text-inverse/70 transition-colors focus-visible:outline-none tabular-nums"
          >
            <Phone size={16} aria-hidden="true" />
            {site.phoneDisplay}
          </a>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-premium"
          >
            <p className="text-3xl font-extrabold text-primary tabular-nums leading-none">
              {s.value}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-extrabold text-text">Nuestros valores</h2>
        <p className="mt-2 max-w-2xl text-text-secondary text-pretty">
          Cuatro principios que guían cada caso, cada audiencia y cada pieza de correspondencia.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="card-premium rounded-2xl border border-slate-100 bg-white p-6 shadow-premium"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <v.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-bold text-text">{v.title}</h3>
              <p className="mt-2 text-[13px] text-text-secondary leading-relaxed text-pretty">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-premium">
        <h2 className="text-xl font-extrabold text-text">Visítanos</h2>
        <p className="mt-2 text-[13px] text-text-secondary text-pretty">
          Atendemos presencialmente con cita previa y virtualmente en todo Honduras.
        </p>
        <ul className="mt-6 space-y-3 text-[14px]">
          <li className="flex items-start gap-3">
            <MapPin size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-text">
              {site.address.line1}, {site.address.line2}, {site.address.city},{' '}
              {site.address.department}, {site.address.country}
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Phone size={16} className="text-accent flex-shrink-0" aria-hidden="true" />
            <a href={telHref()} className="text-text tabular-nums hover:text-primary">
              {site.phoneDisplay}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <MessageCircle size={16} className="text-accent flex-shrink-0" aria-hidden="true" />
            <a
              href={whatsappHref('Hola, necesito una consulta jurídica.')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:text-primary"
            >
              WhatsApp
            </a>
          </li>
          <li className="flex items-center gap-3">
            <Mail size={16} className="text-accent flex-shrink-0" aria-hidden="true" />
            <a href={mailtoHref()} className="text-text break-all hover:text-primary">
              {site.email}
            </a>
          </li>
          <li className="flex items-start gap-3">
            <Clock size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-text">{site.hours}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
