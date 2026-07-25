'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Calendar, Download, MessageCircle, Phone, Share, X } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { formatHondurasTime, getHondurasClock } from '@/lib/datetime';
import { trackWhatsAppClick, trackPhoneClick } from '@/lib/analytics';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

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
  const { showButton, isIOS, promptInstall, dismiss } = useInstallPrompt();
  const [iosPanelOpen, setIosPanelOpen] = useState(false);

  // Cierra el panel de instrucciones iOS con Escape (accesibilidad teclado).
  useEffect(() => {
    if (!iosPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIosPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [iosPanelOpen]);

  const handleInstallClick = useCallback(() => {
    if (isIOS) {
      setIosPanelOpen((v) => !v);
    } else {
      void promptInstall();
    }
  }, [isIOS, promptInstall]);

  const closeIosPanel = useCallback(() => setIosPanelOpen(false), []);

  const handleIosGotIt = useCallback(() => {
    dismiss();
    setIosPanelOpen(false);
  }, [dismiss]);

  return (
    <div
      data-floating-widget
      aria-label="Acceso rápido de contacto"
      className="fixed bottom-4 right-4 z-30 hidden md:flex flex-col gap-2 print:hidden safe-bottom"
    >
      <a
        href={whatsappHref('Hola, necesito orientación jurídica.')}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('floating_button')}
        className="group w-12 h-12 rounded-full bg-success text-white flex items-center justify-center btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 transition-transform"
        aria-label="Contactar por WhatsApp"
        title="WhatsApp"
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-xxs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          WhatsApp
        </span>
      </a>
      {/* Botón "Instalar app" (PWA): visible cuando el navegador permite
          instalar (beforeinstallprompt) o en iOS (instrucciones manuales).
          Oculto si ya está instalada o si el usuario lo descartó (<30 días). */}
      {showButton && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="group w-12 h-12 rounded-full bg-accent text-primary flex items-center justify-center btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 transition-transform focus-visible:outline-none"
          aria-label="Instalar como aplicación"
          title="Instalar esta web como aplicación"
        >
          <Download size={20} aria-hidden="true" />
          <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-text text-text-inverse text-xxs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Instalar app
          </span>
        </button>
      )}

      {/* Panel de instrucciones para iOS: Safari no dispara
          beforeinstallprompt, la instalación es manual vía Compartir. */}
      {iosPanelOpen && (
        <>
          {/* Overlay clic-fuera para cerrar. role=presentation porque el
              overlay no es accionable por teclado (el cierre real vía Escape
              y botón X ya está cubierto). */}
          <div role="presentation" onClick={closeIosPanel} className="fixed inset-0 z-40" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cómo instalar en iPhone o iPad"
            className="absolute bottom-full right-0 mb-2 z-50 w-64 rounded-lg border border-accent/30 bg-surface text-text shadow-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-sm font-bold leading-tight">Instalar en iPhone o iPad</p>
              <button
                type="button"
                onClick={closeIosPanel}
                aria-label="Cerrar instrucciones"
                className="-mr-1 -mt-1 p-1 rounded text-text-secondary hover:text-text focus-visible:outline-none"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <ol className="space-y-2 text-xs text-text-secondary leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-xxs font-bold flex items-center justify-center mt-0.5">1</span>
                <span>
                  Toca <strong className="text-text">Compartir</strong>{' '}
                  <Share size={11} className="inline -mt-0.5 text-accent-dark" aria-hidden="true" /> en Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-xxs font-bold flex items-center justify-center mt-0.5">2</span>
                <span>
                  Selecciona <strong className="text-text">«Añadir a pantalla de inicio»</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-xxs font-bold flex items-center justify-center mt-0.5">3</span>
                <span>
                  Pulsa <strong className="text-text">«Añadir»</strong>.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={handleIosGotIt}
              className="mt-3 w-full h-9 rounded-md bg-accent text-primary text-xs font-bold hover:bg-accent-light transition-colors focus-visible:outline-none"
            >
              Entendido
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MobileContactBar() {
  return (
    <nav
      data-floating-widget
      aria-label="Contacto rápido"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-px border-t border-border bg-surface/95 px-2 py-2 shadow-lg backdrop-blur-md md:hidden print:hidden safe-bottom"
    >
      <a
        href={telHref()}
        onClick={() => trackPhoneClick('mobile_contact_bar')}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/5"
      >
        <Phone size={18} aria-hidden="true" />
        Llamar
      </a>
      <a
        href={whatsappHref('Hola, necesito orientación jurídica.')}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('mobile_contact_bar')}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-success text-xs font-bold text-white btn-shadow-success"
      >
        <MessageCircle size={18} aria-hidden="true" />
        WhatsApp
      </a>
      <a
        href="/solicitar-consulta#formulario"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-bold text-primary hover:bg-accent/10"
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
