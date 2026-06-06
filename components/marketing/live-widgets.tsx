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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-success text-[11px] font-bold">
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
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) {
    return <span className="tabular-nums">--:--:--</span>;
  }
  return (
    <span className="tabular-nums">
      {formatHondurasTime(now, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Estado de la oficina
        </p>
        <p className="text-[14px] font-bold text-text leading-tight">
          {isOpen === null
            ? 'Verificando horario'
            : isOpen
            ? 'Abierto · atendiendo'
            : 'Cerrado · respondemos al abrir'}
        </p>
        {now && (
          <p className="text-[11px] text-text-secondary mt-0.5 tabular-nums">
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
      className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 print:hidden"
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
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-[11px] font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-[11px] font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tabular-nums">
          {site.phoneDisplay}
        </span>
      </a>
    </div>
  );
}

export function Ticker() {
  const items = [
    'Defensa penal seria y confidencial · 13 áreas del derecho',
    'Lunes a sábado · 7:00 a 20:00',
    'Asistencia a detenidos 24/7 por WhatsApp en horario hábil',
    'Aplicación rigurosa del Código Penal · Decreto 130-2017',
    'Bufete multidisciplinar en Nacaome y todo el sur de Honduras',
  ];
  return (
    <div className="bg-primary-dark text-text-inverse/80 overflow-hidden border-b border-primary-light/30">
      <div className="flex animate-[ticker_45s_linear_infinite] whitespace-nowrap py-1.5">
        {[...items, ...items, ...items].map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 text-[11px] font-semibold"
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
        { value: '60h', label: 'Atención semanal', icon: Phone },
        { value: '100%', label: 'Confidencialidad', icon: MessageCircle },
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
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-2">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
