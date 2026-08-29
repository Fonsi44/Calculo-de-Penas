'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ChevronRight, Search, Phone, MessageCircle, Calendar, Download } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { trackFormClick, trackPhoneClick, trackWhatsAppClick } from '@/lib/analytics';
import { useFocusTrap } from '@/hooks/use-focus-trap';

type NavItem = {
  readonly label: string;
  readonly title: string;
  readonly href: string;
};

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly pathname: string;
  readonly nav: readonly NavItem[];
  readonly waMessage: string;
  readonly showInstall: boolean;
  readonly isIOS: boolean;
  readonly onOpenSearch: () => void;
  readonly onPromptInstall: () => void;
  readonly isActive: (pathname: string, href: string) => boolean;
};

/** Drawer móvil en portal (evita bugs de z-index dentro del header sticky). */
export function PublicMobileNavDrawer({
  open,
  onClose,
  pathname,
  nav,
  waMessage,
  showInstall,
  isIOS,
  onOpenSearch,
  onPromptInstall,
  isActive,
}: Props) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const trapRef = useFocusTrap<HTMLElement>(open, { onEscape: onClose });

  if (!mounted || !open) return null;

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[55] print:hidden" role="presentation">
      <div
        className="absolute inset-0 bg-primary-dark/55 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={trapRef}
        id="public-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="absolute top-14 bottom-0 right-0 w-[min(22rem,92vw)] bg-primary border-l border-primary-light/40 shadow-2xl overflow-y-auto overscroll-contain safe-bottom"
      >
        <nav aria-label="Navegación móvil" className="px-3 py-4 flex flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 min-h-11 inline-flex items-center justify-between text-sm font-semibold rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  active
                    ? 'text-accent bg-primary-light/30'
                    : 'text-text-inverse/85 hover:text-accent hover:bg-primary-light/30'
                }`}
              >
                <span>{item.label}</span>
                {active ? (
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent" />
                ) : (
                  <ChevronRight size={14} aria-hidden="true" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="px-3 min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
          >
            <Search size={16} aria-hidden="true" />
            Buscar servicios
          </button>
          <div className="border-t border-primary-light/40 my-2" />
          <a
            href={telHref()}
            title="Llamar a Pineda y Asociados — abogados en Nacaome"
            onClick={() => {
              trackPhoneClick('header_mobile');
              onClose();
            }}
            className="px-3 min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
          >
            <Phone size={16} aria-hidden="true" />
            {site.phoneDisplay}
          </a>
          <a
            href={whatsappHref(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            title="Escribir por WhatsApp a Pineda y Asociados"
            onClick={() => {
              trackWhatsAppClick('header_mobile');
              onClose();
            }}
            className="px-3 min-h-12 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-success rounded-lg btn-shadow-success focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
          </a>
          <Link
            href="/solicitar-consulta#formulario"
            title="Solicitar consulta legal con Pineda y Asociados"
            onClick={() => {
              trackFormClick('header_mobile');
              onClose();
            }}
            className="mt-2 min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Calendar size={16} aria-hidden="true" />
            Solicitar consulta
          </Link>
          {showInstall && (
            <button
              type="button"
              onClick={() => {
                if (!isIOS) void onPromptInstall();
                onClose();
              }}
              className="px-3 min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-text-inverse/85 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
            >
              <Download size={16} aria-hidden="true" />
              Instalar app
            </button>
          )}
          <p className="px-3 pt-2 text-xxs text-text-inverse/75">{site.hours}</p>
        </nav>
      </aside>
    </div>,
    document.body,
  );
}
