'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, MessageCircle, Calendar, Download, Share } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { trackFormClick, trackWhatsAppClick } from '@/lib/analytics';
import { whatsappMessageForPath } from '@/lib/whatsapp-messages';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { HeaderServiceSearch } from '@/components/marketing/header-service-search';
import { PublicMobileNavDrawer } from '@/components/marketing/public-mobile-nav';
import type { ServiceSearchEntry } from '@/lib/service-search-index';

const NAV = [
  { label: 'Despacho', title: 'Conozca el bufete Pineda y Asociados en Nacaome, Valle', href: '/despacho' },
  { label: 'Servicios', title: 'Servicios jurídicos en Nacaome — defensa penal, familia, laboral y más', href: '/servicios-juridicos' },
  { label: 'Penal', title: 'Defensa penal en Nacaome, Valle y Honduras — abogados penalistas', href: '/derecho-penal' },
  { label: 'España', title: 'Asistencia legal para hondureños en España desde Nacaome, Valle', href: '/hondurenos-en-espana' },
  { label: 'FAQ', title: 'Preguntas frecuentes sobre defensa penal y asesoría jurídica en Honduras', href: '/preguntas-frecuentes' },
  { label: 'Blog', title: 'Blog jurídico de Pineda y Asociados — guías legales para Honduras', href: '/blog' },
  { label: 'Contacto', title: 'Solicitar consulta legal con Pineda y Asociados en Nacaome', href: '/solicitar-consulta#formulario' },
] as const;

function isActive(pathname: string, href: string): boolean {
  const hrefPath = href.split('#')[0] || '/';
  if (hrefPath === '/') return pathname === '/';
  return pathname === hrefPath || pathname.startsWith(hrefPath + '/');
}

export function PublicHeader({
  searchEntries,
}: {
  readonly searchEntries: readonly ServiceSearchEntry[];
}) {
  const pathname = usePathname();
  const waMessage = whatsappMessageForPath(pathname);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const installButtonRef = useRef<HTMLButtonElement>(null);
  const lastPathname = useRef(pathname);
  const [iosPanelOpen, setIosPanelOpen] = useState(false);
  const { showButton: showInstall, isIOS, promptInstall, dismiss } = useInstallPrompt();

  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      const id = requestAnimationFrame(() => {
        setOpen(false);
        setIosPanelOpen(false);
        setSearchOpen(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [pathname]);

  useEffect(() => {
    if (!iosPanelOpen && !open && !searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
        if (iosPanelOpen) {
          setIosPanelOpen(false);
          installButtonRef.current?.focus();
          return;
        }
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, iosPanelOpen, searchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
        setSearchOpen(false);
        setIosPanelOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const overlayOpen = open || searchOpen || iosPanelOpen;

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

  useEffect(
    () => () => {
      document.body.style.overflow = '';
    },
    [],
  );

  return (
    <header
      className={`sticky top-0 z-[60] w-full text-text-inverse transition-all duration-200 ${
        scrolled
          ? 'bg-primary/95 backdrop-blur-md border-b border-primary-light/40 shadow-lg'
          : 'bg-primary border-b border-primary-light/60'
      }`}
    >
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center gap-2 min-w-0">
        <Link
          href="/"
          className="group flex items-center gap-2 min-w-0 flex-1 lg:flex-none max-w-[calc(100%-7.5rem)] sm:max-w-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg cursor-pointer"
          aria-label={`Ir a la página de inicio — ${site.shortName}`}
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={741}
            height={728}
            className="relative flex-shrink-0 h-8 sm:h-9 lg:h-10 w-auto transition-opacity duration-200 ease-out group-hover:opacity-90"
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 6px rgba(212,175,55,0.18))',
              objectFit: 'contain',
            }}
            priority
            decoding="async"
            aria-hidden="true"
          />

          <span className="flex flex-col leading-tight min-w-0 overflow-hidden">
            <span className="font-serif font-bold text-text-inverse text-sm truncate">
              {site.name}
            </span>
            <span className="text-xxs font-semibold tracking-eyebrow text-accent truncate hidden min-[380px]:block">
              Bufete Jurídico
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-0.5 ml-2 flex-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-current={active ? 'page' : undefined}
                className={`relative px-2 h-11 inline-flex items-center text-[13px] font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
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

        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <HeaderServiceSearch
            entries={searchEntries}
            open={searchOpen}
            onOpenChange={(next) => {
              if (next) {
                setOpen(false);
                setIosPanelOpen(false);
              }
              setSearchOpen(next);
            }}
          />
          <div className="hidden lg:flex items-center gap-2">
            <a
              href={whatsappHref(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('header_desktop')}
              className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg bg-success text-white btn-shadow-success btn-shadow-success-hover hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label="Contactar por WhatsApp"
              title="Escribir por WhatsApp a Pineda y Asociados — atención en horario hábil"
            >
              <MessageCircle size={15} aria-hidden="true" />
            </a>
            <Link
              href="/solicitar-consulta#formulario"
              title="Solicitar consulta legal confidencial — Pineda y Asociados"
              onClick={() => trackFormClick('header_desktop')}
              className="inline-flex items-center gap-2 min-h-11 px-3.5 rounded-lg bg-accent text-primary text-xs font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 hover:bg-accent-light transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Calendar size={13} aria-hidden="true" />
              Solicitar consulta
            </Link>
          </div>

          {showInstall && (
            <button
              ref={installButtonRef}
              type="button"
              onClick={() => {
                if (isIOS) {
                  setIosPanelOpen((v) => !v);
                } else {
                  void promptInstall();
                }
              }}
              className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-accent hover:bg-primary-light/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label="Instalar como aplicación"
              title="Instalar esta web como aplicación"
              aria-expanded={iosPanelOpen}
              aria-controls={isIOS ? 'ios-install-instructions' : undefined}
            >
              <Download size={18} aria-hidden="true" />
            </button>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setIosPanelOpen(false);
              setOpen((v) => !v);
            }}
            className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-primary-light/40 hover:bg-primary-light/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-colors"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="public-mobile-navigation"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {iosPanelOpen && (
        <>
          <div role="presentation" onClick={() => setIosPanelOpen(false)} className="fixed inset-0 z-[48]" />
          <div
            id="ios-install-instructions"
            role="region"
            aria-label="Cómo instalar en iPhone o iPad"
            className="absolute right-3 top-full z-[49] mt-2 w-64 rounded-lg border border-accent/30 bg-surface text-text shadow-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-sm font-bold leading-tight">Instalar en iPhone o iPad</p>
              <button
                type="button"
                onClick={() => {
                  setIosPanelOpen(false);
                  installButtonRef.current?.focus();
                }}
                aria-label="Cerrar instrucciones"
                className="min-h-11 min-w-11 -mr-1 -mt-1 inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-text focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
              onClick={() => {
                dismiss();
                setIosPanelOpen(false);
                installButtonRef.current?.focus();
              }}
              className="mt-3 w-full min-h-11 rounded-lg bg-accent text-primary text-xs font-bold hover:bg-accent-light transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Entendido
            </button>
          </div>
        </>
      )}

      <PublicMobileNavDrawer
        open={open}
        onClose={() => setOpen(false)}
        pathname={pathname}
        nav={NAV}
        waMessage={waMessage}
        showInstall={showInstall}
        isIOS={isIOS}
        onOpenSearch={() => setSearchOpen(true)}
        onPromptInstall={() => void promptInstall()}
        isActive={isActive}
      />
    </header>
  );
}
