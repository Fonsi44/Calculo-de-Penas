import Link from 'next/link';
import type { ReactNode } from 'react';
import { Phone, MessageCircle, Calendar, ShieldAlert, MapPin } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';

interface CTAGroupProps {
  variant?: 'primary' | 'inline' | 'compact' | 'inverse';
  message?: string;
  className?: string;
}

const DEFAULT_MSG = 'Hola, necesito una consulta jurídica. Vi su sitio web.';

export function CTAGroup({ variant = 'primary', message = DEFAULT_MSG, className }: CTAGroupProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
        <a
          href={telHref()}
          title="Llamar a Pineda y Asociados — consulta legal en Nacaome"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold border border-primary-light/40 btn-shadow-primary btn-shadow-primary-hover hover:-translate-y-0.5 hover:bg-primary-light transition-all duration-200 focus-visible:outline-none"
        >
          <Phone size={16} aria-hidden="true" />
          Llamar ahora
        </a>
        <a
          href={whatsappHref(message)}
          target="_blank"
          rel="noopener noreferrer"
          title="Escribir por WhatsApp a Pineda y Asociados — respuesta inmediata"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-success text-white text-sm font-bold border border-success/40 btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 hover:opacity-95 transition-all duration-200 focus-visible:outline-none"
        >
          <MessageCircle size={16} aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    );
  }
  if (variant === 'inline') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ''}`}>
        <a
          href={telHref()}
          title="Llamar a Pineda y Asociados — abogados en Nacaome"
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg bg-primary text-white text-base font-bold border border-primary-light/40 btn-shadow-primary btn-shadow-primary-hover hover:-translate-y-0.5 hover:bg-primary-light transition-all duration-200 focus-visible:outline-none"
        >
          <Phone size={18} aria-hidden="true" />
          {site.phoneDisplay}
        </a>
        <a
          href="/solicitar-consulta#formulario"
          title="Solicitar consulta legal confidencial con Pineda y Asociados en Nacaome"
          className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg bg-accent text-primary text-base font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none cursor-pointer"
        >
          <Calendar size={18} aria-hidden="true" />
          Solicitar consulta
        </a>
      </div>
    );
  }
  if (variant === 'inverse') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ''}`}>
        <a
          href="/solicitar-consulta#formulario"
          title="Solicitar consulta legal confidencial — Pineda y Asociados"
          className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg bg-accent text-primary text-base font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none cursor-pointer"
        >
          <Calendar size={18} aria-hidden="true" />
          Solicitar consulta
        </a>
        <a
          href={telHref()}
          title="Llamar a Pineda y Asociados — abogados en Nacaome, Valle"
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border-2 border-text-inverse/40 text-text-inverse text-base font-bold hover:bg-text-inverse/10 hover:border-text-inverse/70 transition-colors focus-visible:outline-none cursor-pointer"
        >
          <Phone size={18} aria-hidden="true" />
          Llamar {site.phoneDisplay}
        </a>
      </div>
    );
  }
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ''}`}>
      <a
        href="/solicitar-consulta#formulario"
        title="Solicitar consulta legal con Pineda y Asociados en Nacaome"
        className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg bg-accent text-primary text-base font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none cursor-pointer"
      >
        <Calendar size={18} aria-hidden="true" />
        Solicitar consulta
      </a>
      <a
        href={telHref()}
        title="Llamar a Pineda y Asociados — defensa penal y asesoría jurídica"
        className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border-2 border-primary/25 text-primary bg-surface text-base font-bold hover:bg-primary hover:text-text-inverse hover:border-primary transition-colors focus-visible:outline-none btn-shadow-secondary btn-shadow-secondary-hover"
      >
        <Phone size={18} aria-hidden="true" />
        Llamar {site.phoneDisplay}
      </a>
    </div>
  );
}

interface UrgencyCalloutProps {
  title?: string;
  description?: string;
  className?: string;
}

export function UrgencyCallout({
  title = '¿Tiene un familiar detenido o acaba de recibir una citación?',
  description = 'Actúe con rapidez. La asistencia letrada temprana es determinante. Le orientamos de inmediato por teléfono o WhatsApp.',
  className,
}: UrgencyCalloutProps) {
  return (
    <div
      className={`rounded-lg border border-danger/30 bg-danger-bg p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 shadow-[0_1px_0_0_rgba(255,255,255,0.60)_inset,0_2px_8px_rgba(178,34,52,0.06),0_8px_24px_-8px_rgba(178,34,52,0.10)] ${className ?? ''}`}
      role="complementary"
      aria-label="Atención urgente"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-md bg-danger flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-2px_rgba(178,34,52,0.45)]">
          <ShieldAlert size={20} className="text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-text leading-tight">{title}</p>
          <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <CTAGroup variant="compact" className="md:flex-shrink-0" />
    </div>
  );
}

interface ContactStripProps {
  variant?: 'horizontal' | 'stacked';
  className?: string;
}

export function ContactStrip({ variant = 'horizontal', className }: ContactStripProps) {
  const items: { icon: ReactNode; label: string; value: string; href?: string; external?: boolean }[] = [
    { icon: <Phone size={20} aria-hidden="true" />, label: 'Teléfono', value: site.phoneDisplay, href: telHref() },
    {
      icon: <MessageCircle size={20} aria-hidden="true" />,
      label: 'WhatsApp',
      value: 'Respuesta inmediata',
      href: whatsappHref(DEFAULT_MSG),
      external: true,
    },
    { icon: <Calendar size={20} aria-hidden="true" />, label: 'Solicitar consulta', value: 'Formulario confidencial', href: '/solicitar-consulta#formulario' },
    { icon: <MapPin size={20} aria-hidden="true" />, label: 'Visita', value: `${site.address.city}, ${site.address.department}`, href: '/como-llegar' },
  ];
  const gridCls =
    variant === 'stacked'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
  return (
    <div className={(gridCls + (className ? ' ' + className : '')).trim()}>
      {items.map((it) => {
        const inner = (
          <div className="card-premium flex items-start gap-3 p-4 h-full">
            <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              {it.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">{it.label}</p>
              <p className="text-sm font-semibold text-text leading-tight mt-1 tabular-nums">{it.value}</p>
            </div>
          </div>
        );
        if (!it.href) return <div key={it.label}>{inner}</div>;
        const external = it.external ?? (it.href.startsWith('http') || it.href.startsWith('tel:'));
        if (external) {
          return (
            <a
              key={it.label}
              href={it.href}
              target={it.href.startsWith('http') ? '_blank' : undefined}
              rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              title={`${it.label} — ${it.value} · Pineda y Asociados`}
              className="focus-visible:outline-none rounded-md block"
            >
              {inner}
            </a>
          );
        }
        return (
          <Link key={it.label} href={it.href} title={`${it.label} — ${it.value} · Pineda y Asociados`} className="focus-visible:outline-none rounded-md block">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}



