'use client';

import { useEffect, useState } from 'react';
import { Activity, MapPin, Phone, MessageCircle } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { formatHondurasTime, getHondurasClock } from '@/lib/datetime';

/**
 * Indicador "vivo": pulso animado, número de visitantes simulados,
 * reloj en tiempo real. Refuerza la sensación de oficina activa.
 */
export function LiveBadge() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 6000);
    return () => clearInterval(t);
  }, []);

  const visitors = 2 + (tick % 4);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-success text-xxs font-bold">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <span>{visitors} {visitors === 1 ? 'consulta activa' : 'consultas activas'} ahora</span>
    </div>
  );
}

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
    : 'Cerrado ahora';

  const dotColor = isOpen === null
    ? 'bg-text-muted'
    : isOpen
    ? 'bg-success'
    : 'bg-aggravation';

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
  return (
    <div
      aria-label="Acceso rápido de contacto"
      className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 print:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <a
        href={whatsappHref('Hola, necesito orientación jurídica.')}
        target="_blank"
        rel="noopener noreferrer"
        className="group w-12 h-12 rounded-full bg-success text-white flex items-center justify-center shadow-lg shadow-success/30 hover:scale-105 transition-transform"
        aria-label="Contactar por WhatsApp"
        title="WhatsApp"
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-xxs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          WhatsApp
        </span>
      </a>
      <a
        href={telHref()}
        className="group w-12 h-12 rounded-full bg-primary text-text-inverse flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform"
        aria-label="Llamar al bufete"
        title={`Llamar ${site.phoneDisplay}`}
      >
        <Phone size={20} aria-hidden="true" />
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-xxs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tabular-nums">
          {site.phoneDisplay}
        </span>
      </a>
    </div>
  );
}

export function Ticker() {
  const items = [
    'Asistencia a detenidos · Respuesta inmediata por WhatsApp',
    'Procesos penales, familia, laboral, civil y mercantil',
    'Ubicados en Nacaome, Valle · Atención en todo Honduras',
  ];
  return (
    <div className="bg-primary-dark text-text-inverse/80 overflow-hidden border-b border-primary-light/30">
      <div className="flex animate-[ticker_45s_linear_infinite] whitespace-nowrap py-1.5">
        {[...items, ...items, ...items].map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 text-xxs font-semibold"
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
      `}</style>
    </div>
  );
}

export function StatsCounter() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { value: '+15', label: 'Años de ejercicio', icon: Activity },
        { value: '635', label: 'Artículos CP', icon: MapPin },
        { value: '60h', label: 'Horario continuo', icon: Phone },
        { value: '100%', label: 'Privacidad legal', icon: MessageCircle },
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
