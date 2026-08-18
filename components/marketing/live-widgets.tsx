'use client';

import { useEffect, useState } from 'react';
import { Activity, Calendar, MessageCircle, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { site, telHref, whatsappHref } from '@/lib/site';
import { formatHondurasTime, getHondurasClock } from '@/lib/datetime';
import { trackWhatsAppClick, trackPhoneClick } from '@/lib/analytics';
import { useConsentObserver } from '@/hooks/use-consent-observer';
import { isPenalUrgencyPath, whatsappMessageForPath } from '@/lib/whatsapp-messages';

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  if (!now) {
    return <span className="tabular-nums">--:--:--</span>;
  }
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {formatHondurasTime(now, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export function HeroOfficeBadge() {
  const [now, setNow] = useState<Date | null>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const isOpen = (() => {
    if (!now) return null;
    const { dayOfWeek, minutesOfDay } = getHondurasClock(now);
    if (dayOfWeek === 0) return false;
    return minutesOfDay >= 7 * 60 && minutesOfDay < 20 * 60;
  })();

  const label = isOpen === null
    ? 'Verificando horario'
    : isOpen
    ? 'Atendiendo ahora'
    : 'Fuera de horario · respondemos al abrir';

  const dotColor = isOpen === null
    ? 'bg-text-muted'
    : isOpen
    ? 'bg-success'
    : 'bg-accent';

  const pulseClass = isOpen
    ? 'animate-glow-pulse'
    : '';

  return (
    <span className="inline-flex items-center gap-1.5 bg-primary-light/50 border border-primary-light/30 rounded-full px-3 py-1" suppressHydrationWarning>
      <span className="relative w-2 h-2 flex-shrink-0">
        <span className={`absolute inset-0 rounded-full ${dotColor} ${pulseClass}`} />
      </span>
      <span className="text-xxs font-semibold tracking-wider uppercase text-text-inverse/85">{label}</span>
    </span>
  );
}

export function LiveOfficeStatus() {
  const [now, setNow] = useState<Date | null>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const isOpen = (() => {
    if (!now) return null;
    const { dayOfWeek, minutesOfDay } = getHondurasClock(now);
    if (dayOfWeek === 0) return false;
    return minutesOfDay >= 7 * 60 && minutesOfDay < 20 * 60;
  })();

  return (
    <div className="rounded-lg border border-border-light bg-surface p-4 flex items-center gap-3">
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full ${
            isOpen === null
              ? 'bg-text-muted'
              : isOpen
              ? 'bg-success'
              : 'bg-aggravation'
          }`}
        />
        {isOpen && (
          <span className="absolute -inset-1 rounded-full bg-success/30 animate-ping" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">
          Estado de la oficina
        </p>
        <p className="text-sm font-bold text-text leading-tight">
          {isOpen === null
            ? 'Verificando horario'
            : isOpen
            ? 'Abierto · atendiendo'
            : 'Cerrado · respondemos al abrir'}
        </p>
        {now && (
          <p className="text-xxs text-text-secondary mt-0.5 tabular-nums">
            <LiveClock /> · {site.hours}
          </p>
        )}
      </div>
    </div>
  );
}

export function FloatingContactRail() {
  const pathname = usePathname();
  const waMessage = whatsappMessageForPath(pathname);
  const penalUrgent = isPenalUrgencyPath(pathname);
  const consentOpen = useConsentObserver();

  return (
    <div
      data-floating-widget
      role="region"
      inert={consentOpen}
      aria-hidden={consentOpen ? 'true' : undefined}
      aria-label="Acceso rápido de contacto"
      className="hidden md:flex fixed bottom-4 right-4 z-30 flex-col gap-2 print:hidden"
    >
      <a
        href={whatsappHref(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('floating_button')}
        className={`group relative flex items-center justify-center rounded-full bg-success text-white btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 transition-transform focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
          penalUrgent ? 'h-14 w-14' : 'h-12 w-12'
        }`}
        aria-label={penalUrgent ? 'WhatsApp urgente — defensa penal' : 'Contactar por WhatsApp'}
        title="WhatsApp"
      >
        <MessageCircle size={penalUrgent ? 24 : 22} aria-hidden="true" />
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-xxs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          WhatsApp
        </span>
      </a>
    </div>
  );
}

export function MobileContactBar() {
  const pathname = usePathname();
  const waMessage = whatsappMessageForPath(pathname);
  const penalUrgent = isPenalUrgencyPath(pathname);
  const consentOpen = useConsentObserver();
  return (
    <nav
      data-floating-widget
      inert={consentOpen}
      aria-hidden={consentOpen ? 'true' : undefined}
      aria-label="Contacto rápido"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-1 border-t border-border bg-surface/95 px-2 py-2 shadow-lg backdrop-blur-md md:hidden print:hidden safe-bottom"
    >
      <a
        href={telHref()}
        onClick={() => trackPhoneClick('mobile_contact_bar')}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Phone size={18} aria-hidden="true" />
        Llamar
      </a>
      <a
        href={whatsappHref(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('mobile_contact_bar')}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-success text-xs font-bold text-white btn-shadow-success focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        aria-label={penalUrgent ? 'WhatsApp urgente — defensa penal' : 'Contactar por WhatsApp'}
      >
        <MessageCircle size={18} aria-hidden="true" />
        WhatsApp
      </a>
      <a
        href="/solicitar-consulta#formulario"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg text-xs font-bold text-primary hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Calendar size={18} aria-hidden="true" />
        Consulta
      </a>
    </nav>
  );
}

export function Ticker() {
  const items = [
    'Asistencia a detenidos · Atención prioritaria en horario hábil',
    'Procesos penales, familia, laboral, civil y mercantil',
    'Ubicados en Nacaome, Valle · Atención en todo Honduras',
  ];
  return (
    <div className="bg-primary-dark text-text-inverse/80 overflow-hidden border-b border-primary-light/30">
      <div className="flex animate-[ticker_45s_linear_infinite] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center whitespace-nowrap py-1.5">
        {items.map((t, i) => (
          <span
            key={`main-${i}`}
            className="inline-flex items-center gap-2 px-6 text-xxs font-semibold"
          >
            <Activity size={10} className="text-accent" aria-hidden="true" /> {t}
          </span>
        ))}
        {[...items, ...items].map((t, i) => (
          <span
            key={`dup-${i}`}
            aria-hidden="true"
            className="inline-flex items-center gap-2 px-6 text-xxs font-semibold motion-reduce:hidden"
          >
            <Activity size={10} className="text-accent" /> {t}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flex {
            animation: none !important;
            white-space: normal !important;
            flex-wrap: wrap;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export function StatsCounter() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { value: '+15', label: 'Años de ejercicio', icon: Activity },
        { value: '3', label: 'Socios identificados', icon: MessageCircle },
        { value: '6 días', label: 'Atención semanal', icon: Phone },
      ].map((s, i) => (
        <div
          key={i}
          className="rounded-lg bg-surface border border-border-light p-4 text-center hover:border-accent/50 hover:shadow-md transition-all"
        >
          <s.icon
            size={18}
            className="mx-auto mb-2 text-accent-dark"
            aria-hidden="true"
          />
          <p className="font-extrabold text-2xl text-primary tabular-nums leading-none">
            {s.value}
          </p>
          <p className="text-xxs text-text-muted uppercase tracking-wider mt-2">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
