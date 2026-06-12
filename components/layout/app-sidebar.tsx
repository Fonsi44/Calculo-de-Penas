'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Scale, Home, Calculator, Briefcase, BookOpen, FileText, Menu, X, ChevronRight, Keyboard, Shield } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { cn } from '@/lib/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match: (path: string) => boolean;
  admin?: boolean;
}

const NAV: NavItem[] = [
  { label: 'Inicio', href: '/intranet/dashboard', icon: Home, match: (p) => p === '/intranet/dashboard' },
  { label: 'Calculadora', href: '/intranet/calculadora', icon: Calculator, match: (p) => p.startsWith('/intranet/calculadora') || p === '/calculadora' || p.startsWith('/calculadora/') },
  { label: 'Mis casos', href: '/intranet/casos', icon: Briefcase, match: (p) => p.startsWith('/intranet/casos') || p === '/casos' || p.startsWith('/casos/') },
  { label: 'Biblioteca CP', href: '/intranet/cp', icon: BookOpen, match: (p) => p.startsWith('/intranet/cp') || p === '/cp' || p.startsWith('/cp/') },
  { label: 'Catálogo de delitos', href: '/intranet/delitos', icon: FileText, match: (p) => p.startsWith('/intranet/delitos') || p === '/delitos' || p.startsWith('/delitos/') },
  { label: 'Atajos de teclado', href: '/intranet/atajos', icon: Keyboard, match: (p) => p.startsWith('/intranet/atajos') || p === '/atajos' || p.startsWith('/atajos/') },
  { label: 'Web Admin', href: '/intranet/admin', icon: Shield, match: (p) => p.startsWith('/intranet/admin'), admin: true },
];

export function AppSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const mainItems = NAV.filter(i => !i.admin);
  const adminItems = NAV.filter(i => i.admin);

  return (
    <nav aria-label="Navegación principal" className={cn('flex flex-col gap-0.5', className)}>
      {mainItems.map(item => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              active
                ? 'bg-accent/10 text-primary'
                : 'text-text-secondary hover:bg-surface-alt hover:text-text hover:pl-4',
            )}
          >
            {active && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
            )}
            <item.icon size={17} className={cn('flex-shrink-0 transition-colors', active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary')} />
            <span className="flex-1 truncate">{item.label}</span>
            {active && <ChevronRight size={14} className="text-accent flex-shrink-0" />}
          </Link>
        );
      })}

      {adminItems.length > 0 && (
        <>
          <div className="my-2 mx-3 border-t border-border-light" />
          {adminItems.map(item => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                  active
                    ? 'bg-accent/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text hover:pl-4',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
                )}
                <item.icon size={17} className={cn('flex-shrink-0 transition-colors', active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary')} />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <ChevronRight size={14} className="text-accent flex-shrink-0" />}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50 no-print" role="presentation">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
      <aside
        ref={trapRef}
        className="absolute left-0 top-0 bottom-0 w-72 bg-surface shadow-2xl p-5 flex flex-col"
        role="dialog"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Scale size={17} className="text-accent" />
            </div>
            <span className="font-extrabold text-sm text-primary tracking-widest">LEX HONDURAS</span>
          </div>
          <IconButton label="Cerrar menú" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <AppSidebar onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function MobileNavToggle({ onClick, open }: { onClick: () => void; open?: boolean }) {
  return (
    <IconButton
      label={open ? 'Cerrar menú' : 'Abrir menú'}
      variant="solid"
      onClick={onClick}
      aria-expanded={open}
      className="lg:hidden shadow-lg"
    >
      {open ? <X size={18} /> : <Menu size={18} />}
    </IconButton>
  );
}

export function useMobileNav() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  useEffect(() => {
    if (isDesktop) setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect -- media query sync
  }, [isDesktop]);
  return { open, setOpen };
}
