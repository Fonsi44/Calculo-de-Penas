'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, MessageCircle, Calendar, ChevronDown } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { trackFormClick, trackPhoneClick, trackWhatsAppClick } from '@/lib/analytics';
import { whatsappMessageForPath } from '@/lib/whatsapp-messages';

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
  const hrefPath = href.split('#')[0] || '/';
  if (hrefPath === '/') return pathname === '/';
  return pathname === hrefPath || pathname.startsWith(hrefPath + '/');
}

export function PublicHeader() {
  const pathname = usePathname();
  const waMessage = whatsappMessageForPath(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const lastPathname = useRef(pathname);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      const id = requestAnimationFrame(() => setOpen(false));
      return () => cancelAnimationFrame(id);
    }
  }, [pathname]);

  // Cierre seguro con Escape y retorno de foco para el menú móvil no modal
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar menú si la pantalla pasa a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) { // xl es 1280px
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full text-text-inverse transition-all duration-200 ${
        scrolled
          ? 'bg-primary/95 backdrop-blur-md border-b border-primary-light/40 shadow-lg'
          : 'bg-primary border-b border-primary-light/60'
      }`}
    >
      {/* Barra superior con datos de contacto — se pliega al hacer scroll */}
      <div
        className={`hidden md:block bg-primary-dark/80 border-b border-primary-light/20 overflow-hidden transition-all duration-200 ${
          scrolled ? 'max-h-0 opacity-0 border-b-0' : 'max-h-10 opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-text-inverse/80">
            <a
              href={telHref()}
              title="Llamar a Pineda y Asociados"
              className="flex items-center gap-1.5 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
            >
              <Phone size={12} aria-hidden="true" />
              <span className="tabular-nums">{site.phoneDisplay}</span>
            </a>
            <span className="text-text-inverse/70">·</span>
            <span className="text-text-inverse/80">{site.hoursShort}</span>
            <span className="text-text-inverse/70">·</span>
            <span className="text-text-inverse/80">{site.address.city}, {site.address.department}</span>
          </div>
        </div>
      </div>

      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
        <Link
          href="/"
          className="group flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg flex-shrink-0 cursor-pointer"
          aria-label={`Ir a la página de inicio — ${site.shortName}`}
        >
          {/* Logo oficial */}
          <Image
            src="/images/logo.png"
            alt={`${site.name} — Logo oficial`}
            width={741}
            height={728}
            className="relative flex-shrink-0 h-8 sm:h-9 lg:h-10 w-auto transition-all duration-200 ease-out group-hover:opacity-90"
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 6px rgba(212,175,55,0.18))',
              objectFit: 'contain',
            }}
            priority
            decoding="async"
          />

          {/* Wordmark */}
          <span className="flex flex-col leading-tight">
            <span className="font-serif font-bold text-text-inverse text-sm whitespace-nowrap">
              {site.name}
            </span>
            <span className="text-xxs sm:text-xxs font-semibold tracking-eyebrow text-accent whitespace-nowrap">
              Bufete Jurídico
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden xl:flex items-center gap-0.5 ml-2 flex-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-current={active ? 'page' : undefined}
                className={`relative px-2 h-10 inline-flex items-center text-[13px] font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  active
                    ? 'text-accent'
                    : 'text-text-inverse/85 hover:text-accent hover:bg-primary-light/30'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-accent"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden xl:flex items-center gap-2">
          <a
            href={whatsappHref(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('header_desktop')}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-success text-white btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label="Contactar por WhatsApp"
            title="Escribir por WhatsApp a Pineda y Asociados — atención en horario hábil"
          >
            <MessageCircle size={15} aria-hidden="true" />
          </a>
          <Link
            href="/solicitar-consulta#formulario"
            title="Solicitar consulta legal confidencial — Pineda y Asociados"
            onClick={() => trackFormClick('header_desktop')}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-accent text-primary text-xs font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Calendar size={13} aria-hidden="true" />
            Solicitar consulta
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="xl:hidden ml-auto w-11 h-11 inline-flex items-center justify-center rounded-lg bg-primary-light/40 hover:bg-primary-light/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-colors"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="public-mobile-navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div id="public-mobile-navigation" className="xl:hidden border-t border-primary-light/60 bg-primary/95 backdrop-blur-md">
          <nav aria-label="Navegación móvil" className="px-3 py-3 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3 h-11 inline-flex items-center justify-between text-sm font-semibold rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    active
                      ? 'text-accent bg-primary-light/30'
                      : 'text-text-inverse/85 hover:text-accent hover:bg-primary-light/30'
                  }`}
                >
                  <span>{item.label}</span>
                  {active ? (
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent" />
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
              onClick={() => {
                trackPhoneClick('header_mobile');
                setOpen(false);
              }}
              className="px-3 h-11 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
            >
              <Phone size={16} />
              {site.phoneDisplay}
            </a>
            <a
              href={whatsappHref(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              title="Escribir por WhatsApp a Pineda y Asociados"
              onClick={() => {
                trackWhatsAppClick('header_mobile');
                setOpen(false);
              }}
              className="px-3 min-h-12 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-success rounded-lg btn-shadow-success focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <Link
              href="/solicitar-consulta#formulario"
              title="Solicitar consulta legal con Pineda y Asociados"
              onClick={() => {
                trackFormClick('header_mobile');
                setOpen(false);
              }}
              className="mt-2 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
