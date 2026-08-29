'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Phone, MessageCircle, Calendar, ShieldAlert, MapPin } from 'lucide-react';
import { site, telHref, whatsappHref, directTelHref, directWhatsappHref, FOUNDER_PROFILE } from '@/lib/site';
import { semanticLinkProps } from '@/lib/semantic-link';
import { trackWhatsAppClick, trackPhoneClick, trackConsultationCtaClick, trackDirectionsClick } from '@/lib/analytics';

const URGENCY_WA_MSG =
  'Emergencia penal: necesito asistencia legal inmediata. Escribo desde la web de Pineda y Asociados.';

interface CTAGroupProps {
  variant?: 'primary' | 'inline' | 'compact' | 'inverse';
  message?: string;
  className?: string;
  phone?: string;
  phoneDisplay?: string;
  contactName?: string;
}

const DEFAULT_MSG = 'Hola, necesito una consulta jurídica. Los contacto desde la web de Pineda y Asociados.';

export function CTAGroup({ variant = 'primary', message = DEFAULT_MSG, className, phone, phoneDisplay, contactName }: CTAGroupProps) {
  const callHref = phone ? directTelHref(phone) : telHref();
  const waHref = phone ? directWhatsappHref(phone, message) : whatsappHref(message);
  const display = phoneDisplay ?? site.phoneDisplay;
  const who = contactName ? ` con ${contactName}` : '';
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
        <a
          href={callHref}
          title="Llamar a Pineda y Asociados — consulta legal en Nacaome"
          onClick={() => trackPhoneClick('cta_compact')}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-3.5 rounded-lg bg-primary text-white text-xs font-bold border border-primary-light/40 btn-shadow-primary btn-shadow-primary-hover hover:-translate-y-0.5 hover:bg-primary-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Phone size={14} aria-hidden="true" />
          Llamar ahora
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Escribir por WhatsApp a Pineda y Asociados — atención en horario hábil"
          onClick={() => trackWhatsAppClick('cta_compact')}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-3.5 rounded-lg bg-success text-white text-xs font-bold border border-success/40 btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 hover:opacity-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MessageCircle size={14} aria-hidden="true" />
          WhatsApp{who}
        </a>
      </div>
    );
  }
  if (variant === 'inline') {
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
        <a
          href={callHref}
          title="Llamar a Pineda y Asociados — abogados en Nacaome"
          onClick={() => trackPhoneClick('cta_inline')}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary text-white text-sm font-bold border border-primary-light/40 btn-shadow-primary btn-shadow-primary-hover hover:-translate-y-0.5 hover:bg-primary-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Phone size={16} aria-hidden="true" />
          {display}
        </a>
        <a
          href="/solicitar-consulta#formulario"
          {...semanticLinkProps('/solicitar-consulta')}
          title="Solicitar consulta legal confidencial con Pineda y Asociados en Nacaome"
          onClick={() => trackConsultationCtaClick('cta_solicitar')}
          className="btn-shimmer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <Calendar size={16} aria-hidden="true" />
          Solicitar evaluación confidencial
        </a>
      </div>
    );
  }
  if (variant === 'inverse') {
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
        {phone ? (
          <a href={waHref} target="_blank" rel="noopener noreferrer" title={`Escribir por WhatsApp${who}`} onClick={() => trackWhatsAppClick('cta_inverse')} className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-success text-white text-sm font-bold btn-shadow-success btn-shadow-success-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <MessageCircle size={16} aria-hidden="true" /> WhatsApp{who}
          </a>
        ) : (
          <a href="/solicitar-consulta#formulario" {...semanticLinkProps('/solicitar-consulta')} title="Solicitar consulta legal confidencial — Pineda y Asociados" onClick={() => trackConsultationCtaClick('cta_inverse')} className="btn-shimmer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer">
            <Calendar size={16} aria-hidden="true" /> Solicitar evaluación confidencial
          </a>
        )}
        <a
          href={callHref}
          title="Llamar a Pineda y Asociados — abogados en Nacaome, Valle"
          onClick={() => trackPhoneClick('cta_inverse')}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border-2 border-text-inverse/40 text-text-inverse text-sm font-bold hover:bg-text-inverse/10 hover:border-text-inverse/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <Phone size={16} aria-hidden="true" />
          Llamar {display}
        </a>
      </div>
    );
  }
  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
      <a
        href="/solicitar-consulta#formulario"
        {...semanticLinkProps('/solicitar-consulta')}
        title="Solicitar consulta legal con Pineda y Asociados en Nacaome"
        onClick={() => trackConsultationCtaClick('cta_primary')}
        className="btn-shimmer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
      >
        <Calendar size={16} aria-hidden="true" />
        Solicitar evaluación confidencial
      </a>
      <a
        href={callHref}
        title="Llamar a Pineda y Asociados — defensa penal y asesoría jurídica"
        onClick={() => trackPhoneClick('cta_primary')}
        className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border-2 border-primary/25 text-primary bg-surface text-sm font-bold hover:bg-primary hover:text-text-inverse hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-shadow-secondary btn-shadow-secondary-hover"
      >
        <Phone size={16} aria-hidden="true" />
        Llamar {display}
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
      className={`rounded-lg border border-danger/30 bg-danger-bg p-3.5 md:p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-[0_1px_0_0_rgba(255,255,255,0.60)_inset,0_2px_8px_rgba(178,34,52,0.06),0_8px_24px_-8px_rgba(178,34,52,0.10)] ${className ?? ''}`}
      role="complementary"
      aria-label="Atención urgente"
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-md bg-danger flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_-2px_rgba(178,34,52,0.45)]">
          <ShieldAlert size={16} className="text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-text leading-tight text-sm">{title}</p>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 md:flex-shrink-0">
        <a
          href={directWhatsappHref(FOUNDER_PROFILE.phone, URGENCY_WA_MSG)}
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp urgente — detención o citación penal"
          onClick={() => trackWhatsAppClick('cta_urgency')}
          className="inline-flex min-h-12 items-center justify-center gap-2 px-4 rounded-lg bg-success text-white text-sm font-bold border border-success/40 btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 hover:opacity-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MessageCircle size={18} aria-hidden="true" />
          WhatsApp urgente
        </a>
        <a
          href={directTelHref(FOUNDER_PROFILE.phone)}
          title="Llamar ahora — urgencia penal"
          onClick={() => trackPhoneClick('cta_urgency')}
          className="inline-flex min-h-12 items-center justify-center gap-2 px-4 rounded-lg bg-primary text-white text-sm font-bold border border-primary-light/40 btn-shadow-primary btn-shadow-primary-hover hover:-translate-y-0.5 hover:bg-primary-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Phone size={18} aria-hidden="true" />
          Llamar ahora
        </a>
      </div>
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
      value: 'Atención en horario hábil',
      href: whatsappHref(DEFAULT_MSG),
      external: true,
    },
    { icon: <Calendar size={20} aria-hidden="true" />, label: 'Solicitar consulta', value: 'Formulario confidencial', href: '/solicitar-consulta#formulario' },
    { icon: <MapPin size={20} aria-hidden="true" />, label: 'Visita', value: `${site.address.city}, ${site.address.department}`, href: '/como-llegar' },
  ];
  const gridCls =
    variant === 'stacked'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-1.5'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5';
  return (
    <div className={(gridCls + (className ? ' ' + className : '')).trim()}>
      {items.map((it) => {
        const inner = (
          <div className="card-premium flex items-start gap-2.5 p-2.5 h-full">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0">
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
              onClick={() => {
                const h = it.href;
                if (!h) return;
                if (h.startsWith('tel:')) trackPhoneClick('contact_strip');
                else if (h.includes('wa.me') || h.includes('whatsapp')) trackWhatsAppClick('contact_strip');
              }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md block"
            >
              {inner}
            </a>
          );
        }
        return (
          <Link
            key={it.label}
            href={it.href}
            title={`${it.label} — ${it.value} · Pineda y Asociados`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md block"
            onClick={() => {
              if (it.href?.includes('/solicitar-consulta')) trackConsultationCtaClick('contact_strip');
              else if (it.href?.includes('/como-llegar')) trackDirectionsClick('contact_strip');
            }}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
