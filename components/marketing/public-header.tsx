'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, MessageCircle, Lock, Calendar, ChevronDown } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { useFocusTrap } from '@/hooks/use-focus-trap';

const NAV = [
  { label: 'El Despacho', title: 'Conozca el bufete Pineda y Asociados en Nacaome, Valle', href: '/despacho' },
  { label: 'Servicios Jurídicos', title: 'Servicios jurídicos en Nacaome — defensa penal, familia, laboral y más', href: '/servicios-juridicos' },
  { label: 'Derecho Penal', title: 'Defensa penal en Nacaome, Valle y Honduras — abogados penalistas', href: '/derecho-penal' },
  { label: 'Hondureños en España', title: 'Asistencia legal para hondureños en España desde Nacaome, Valle', href: '/hondurenos-en-espana' },
  { label: 'FAQ', title: 'Preguntas frecuentes sobre defensa penal y asesoría jurídica en Honduras', href: '/preguntas-frecuentes' },
  { label: 'Blog', title: 'Blog jurídico de Pineda y Asociados — guías legales para Honduras', href: '/blog' },
  { label: 'Contacto', title: 'Solicitar consulta legal con Pineda y Asociados en Nacaome', href: '/solicitar-consulta#formulario' },
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
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-text-inverse/80">
            <a
              href={telHref()}
              title="Llamar a Pineda y Asociados — abogados en Nacaome, Valle"
              className="flex items-center gap-1.5 hover:text-accent transition-colors focus-visible:outline-none"
            >
              <Phone size={12} aria-hidden="true" />
              <span className="tabular-nums">{site.phoneDisplay}</span>
            </a>
            <span className="text-text-inverse/70">·</span>
            <span className="text-text-inverse/80">{site.hoursShort}</span>
            <span className="text-text-inverse/70">·</span>
            <span className="text-text-inverse/80">{site.address.city}, {site.address.department}</span>
          </div>
          <Link
            href="/intranet/admin"
            rel="nofollow"
            className="flex items-center gap-1.5 text-text-inverse/75 hover:text-accent transition-colors focus-visible:outline-none"
            title="Acceso exclusivo para personal del bufete"
          >
            <Lock size={11} aria-hidden="true" />
            <span>Acceso Intranet</span>
          </Link>
        </div>
      </div>

      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-1 md:py-1.5 flex items-center gap-2">
        <Link
          href="/"
          className="group flex items-center gap-1.5 focus-visible:outline-none flex-shrink-0 cursor-pointer"
          aria-label={`Ir a la página de inicio — ${site.shortName}`}
        >
          {/* Logo oficial — PNG transparente (741×728, ~cuadrado).
              Altura equilibrada con la barra de navegación (items h-9 = 36px),
              proporción preservada vía width/height intrínsecos + h-* w-auto.
              Drop-shadow sutil para contraste sobre fondo navy; sin halo ni
              escala que provoquen saltos visuales o lo hagan dominar. */}
          <Image
            src="/images/logo.png"
            alt={`${site.name} — Logo oficial`}
            width={741}
            height={728}
            className="relative flex-shrink-0 h-6 sm:h-7 md:h-8 lg:h-9 w-auto transition-all duration-300 ease-out group-hover:scale-105 group-hover:opacity-90"
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 6px rgba(212,175,55,0.18))',
              objectFit: 'contain',
            }}
            priority
            decoding="async"
          />

          {/* Wordmark — lockup logo + nombre del bufete. Dos líneas para
              reforzar la marca sin dominar la barra: nombre (serif, blanco)
              sobre subtítulo (eyebrow dorado). Compacto y responsive; queda
              junto al logo en móvil y escritorio. */}
          <span className="flex flex-col leading-tight transition-transform duration-300 ease-out group-hover:scale-105 origin-left">
            <span className="font-serif font-bold text-text-inverse text-xs sm:text-sm whitespace-nowrap">
              {site.name}
            </span>
            <span className="text-xxs sm:text-xxs font-semibold tracking-eyebrow text-accent whitespace-nowrap">
              Bufete Jurídico
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1 ml-1 flex-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-current={active ? 'page' : undefined}
                className={`relative px-2.5 h-9 inline-flex items-center text-sm font-semibold rounded-md transition-colors focus-visible:outline-none ${
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
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-success text-white btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none"
            aria-label="Contactar por WhatsApp"
            title="Escribir por WhatsApp a Pineda y Asociados — respuesta inmediata"
          >
            <MessageCircle size={15} aria-hidden="true" />
          </a>
          <Link
            href="/solicitar-consulta#formulario"
            title="Solicitar consulta legal confidencial — Pineda y Asociados"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-accent text-primary text-xs font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:outline-none"
          >
            <Calendar size={13} aria-hidden="true" />
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
                  title={item.title}
                  onClick={() => setOpen(false)}
                  className={`relative px-3 h-10 inline-flex items-center justify-between text-sm font-semibold rounded-md ${
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
              title="Llamar a Pineda y Asociados — abogados en Nacaome"
              onClick={() => setOpen(false)}
              className="px-3 h-10 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent"
            >
              <Phone size={16} />
              {site.phoneDisplay}
            </a>
            <a
            href={whatsappHref('Hola, necesito una consulta jurídica.')}
              target="_blank"
              rel="noopener noreferrer"
              title="Escribir por WhatsApp a Pineda y Asociados"
              onClick={() => setOpen(false)}
              className="px-3 h-10 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <Link
              href="/solicitar-consulta#formulario"
              title="Solicitar consulta legal con Pineda y Asociados"
              onClick={() => setOpen(false)}
              className="mt-2 h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent"
            >
              <Calendar size={16} />
              Solicitar consulta
            </Link>
            <p className="px-3 pt-2 text-xxs text-text-inverse/75">{site.hours}</p>
          </nav>
        </div>
      )}
    </header>
  );
}


