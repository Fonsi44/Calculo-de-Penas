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
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors focus-visible:outline-none"
        >
          <Phone size={16} aria-hidden="true" />
          Llamar ahora
        </a>
        <a
          href={whatsappHref(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-success text-white text-sm font-bold hover:opacity-90 transition-opacity focus-visible:outline-none"
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
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors focus-visible:outline-none"
        >
          <Phone size={18} aria-hidden="true" />
          {site.phoneDisplay}
        </a>
        <Link
          href="/solicitar-consulta"
          className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity focus-visible:outline-none"
        >
          <Calendar size={18} aria-hidden="true" />
          Solicitar consulta
        </Link>
      </div>
    );
  }
  if (variant === 'inverse') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ''}`}>
        <Link
          href="/solicitar-consulta"
          className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity focus-visible:outline-none"
        >
          <Calendar size={18} aria-hidden="true" />
          Solicitar consulta
        </Link>
        <a
          href={telHref()}
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md border-2 border-text-inverse/40 text-text-inverse text-base font-bold hover:bg-primary-light/40 hover:border-text-inverse/70 transition-colors focus-visible:outline-none"
        >
          <Phone size={18} aria-hidden="true" />
          Llamar {site.phoneDisplay}
        </a>
      </div>
    );
  }
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ''}`}>
      <Link
        href="/solicitar-consulta"
        className="btn-shimmer inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity focus-visible:outline-none"
      >
        <Calendar size={18} aria-hidden="true" />
        Solicitar consulta
      </Link>
      <a
        href={telHref()}
        className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md border-2 border-primary/30 text-primary text-base font-bold hover:bg-primary hover:text-text-inverse hover:border-primary transition-colors focus-visible:outline-none"
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
      className={`rounded-lg border-2 border-aggravation/40 bg-danger-bg p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 ${className ?? ''}`}
      role="complementary"
      aria-label="Atención urgente"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-md bg-aggravation flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={20} className="text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-text leading-tight">{title}</p>
          <p className="text-xs-plus text-text-secondary mt-1.5 leading-relaxed">{description}</p>
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
    { icon: <Phone size={18} aria-hidden="true" />, label: 'Teléfono', value: site.phoneDisplay, href: telHref() },
    {
      icon: <MessageCircle size={18} aria-hidden="true" />,
      label: 'WhatsApp',
      value: 'Respuesta inmediata',
      href: whatsappHref(DEFAULT_MSG),
      external: true,
    },
    { icon: <Calendar size={18} aria-hidden="true" />, label: 'Solicitar consulta', value: 'Formulario confidencial', href: '/solicitar-consulta' },
    { icon: <MapPin size={18} aria-hidden="true" />, label: 'Visita', value: `${site.address.city}, ${site.address.department}`, href: '/como-llegar' },
  ];
  const gridCls =
    variant === 'stacked'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
  return (
    <div className={(gridCls + (className ? ' ' + className : '')).trim()}>
      {items.map((it) => {
        const inner = (
          <div className="flex items-start gap-3 p-4 rounded-md bg-surface border border-border-light hover:border-accent/50 transition-colors h-full">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              {it.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-caption font-bold uppercase tracking-wider text-text-muted">{it.label}</p>
              <p className="text-xs-plus font-semibold text-text leading-tight mt-0.5 tabular-nums">{it.value}</p>
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
              className="focus-visible:outline-none rounded-md block"
            >
              {inner}
            </a>
          );
        }
        return (
          <Link key={it.label} href={it.href} className="focus-visible:outline-none rounded-md block">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
