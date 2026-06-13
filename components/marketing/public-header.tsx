'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, Menu, X, Phone, MessageCircle, Lock, Calendar, ChevronDown } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { useFocusTrap } from '@/hooks/use-focus-trap';

const NAV = [
  { label: 'El Despacho', href: '/despacho' },
  { label: 'Servicios Jurídicos', href: '/servicios-juridicos' },
  { label: 'Derecho Penal', href: '/derecho-penal' },
  { label: 'Hondureños en España', href: '/hondurenos-en-espana' },
  { label: 'FAQ', href: '/preguntas-frecuentes' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/solicitar-consulta#formulario' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileTrapRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full text-text-inverse transition-all duration-300 ${
        scrolled
          ? 'bg-primary/95 backdrop-blur-md border-b border-primary-light/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]'
          : 'bg-primary border-b border-primary-light/60'
      }`}
    >
      {/* Barra superior con datos de contacto */}
      <div className="hidden md:block bg-primary-dark/80 border-b border-primary-light/20">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-text-inverse/80">
            <a
              href={telHref()}
              className="flex items-center gap-1.5 hover:text-accent transition-colors focus-visible:outline-none"
            >
              <Phone size={12} aria-hidden="true" />
              <span className="tabular-nums">{site.phoneDisplay}</span>
            </a>
            <span className="text-text-inverse/40">·</span>
            <span className="text-text-inverse/80">{site.hoursShort}</span>
            <span className="text-text-inverse/40">·</span>
            <span className="text-text-inverse/80">{site.address.city}, {site.address.department}</span>
          </div>
          <Link
            href="/intranet/dashboard"
            className="flex items-center gap-1.5 text-text-inverse/50 hover:text-accent transition-colors focus-visible:outline-none"
            title="Acceso exclusivo para personal del bufete"
          >
            <Lock size={11} aria-hidden="true" />
            <span>Acceso Intranet</span>
          </Link>
        </div>
      </div>

      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-3.5 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none"
          aria-label={`Ir a la página de inicio — ${site.shortName}`}
        >
          <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center flex-shrink-0 shadow-[0_0_0_1px_rgba(154,122,34,0.45),0_4px_10px_-2px_rgba(212,175,55,0.45)]">
            <Scale size={20} className="text-primary" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-sm leading-none tracking-wide">{site.shortName}</p>
            <p className="text-xxs text-accent/90 leading-none mt-1 tracking-wider uppercase">Bufete multidisciplinario</p>
          </div>
        </Link>

        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1 ml-6 flex-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 h-9 inline-flex items-center text-sm font-semibold rounded-md transition-colors focus-visible:outline-none ${
                  active
                    ? 'text-accent'
                    : 'text-text-inverse/85 hover:text-accent hover:bg-primary-light/30'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(212,175,55,0.55)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <a
            href={whatsappHref('Hola, necesito una consulta jurídica.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-success text-white shadow-[0_4px_12px_-2px_rgba(14,122,79,0.45)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-2px_rgba(14,122,79,0.55)] transition-all duration-200 focus-visible:outline-none"
            aria-label="Contactar por WhatsApp"
            title="WhatsApp"
          >
            <MessageCircle size={16} aria-hidden="true" />
          </a>
          <Link
            href="https://www.pinedayasociadoshn.com/solicitar-consulta#formulario"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-accent text-primary text-sm font-bold border border-accent-dark/40 shadow-[0_1px_0_0_rgba(255,255,255,0.30)_inset,0_4px_12px_-2px_rgba(212,175,55,0.45)] hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-[0_1px_0_0_rgba(255,255,255,0.40)_inset,0_6px_18px_-2px_rgba(212,175,55,0.55)] transition-all duration-200 focus-visible:outline-none"
          >
            <Calendar size={14} aria-hidden="true" />
            Solicitar consulta
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden ml-auto w-9 h-9 inline-flex items-center justify-center rounded-md bg-primary-light/40 hover:bg-primary-light/60 focus-visible:outline-none transition-colors"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div ref={mobileTrapRef} className="lg:hidden border-t border-primary-light/60 bg-primary/95 backdrop-blur-md">
          <nav aria-label="Navegación móvil" className="px-3 py-3 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`relative px-3 h-11 inline-flex items-center justify-between text-sm font-semibold rounded-md ${
                    active
                      ? 'text-accent bg-primary-light/30'
                      : 'text-text-inverse/85 hover:text-accent hover:bg-primary-light/30'
                  }`}
                >
                  <span>{item.label}</span>
                  {active ? (
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(212,175,55,0.65)]" />
                  ) : (
                    <ChevronDown size={14} className="-rotate-90" />
                  )}
                </Link>
              );
            })}
            <div className="border-t border-primary-light/40 my-2" />
            <a
              href={telHref()}
              onClick={() => setOpen(false)}
              className="px-3 h-11 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent"
            >
              <Phone size={16} />
              {site.phoneDisplay}
            </a>
            <a
            href={whatsappHref('Hola, necesito una consulta jurídica.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="px-3 h-11 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <Link
              href="https://www.pinedayasociadoshn.com/solicitar-consulta#formulario"
              onClick={() => setOpen(false)}
              className="mt-2 h-11 inline-flex items-center justify-center gap-2 rounded-md bg-accent text-primary text-sm font-bold border border-accent-dark/40 shadow-[0_1px_0_0_rgba(255,255,255,0.30)_inset,0_4px_12px_-2px_rgba(212,175,55,0.45)]"
            >
              <Calendar size={16} />
              Solicitar consulta
            </Link>
            <p className="px-3 pt-2 text-xxs text-text-inverse/60">{site.hours}</p>
          </nav>
        </div>
      )}
    </header>
  );
}


