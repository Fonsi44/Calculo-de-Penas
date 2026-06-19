'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Scale, Home, Calculator, Briefcase, BookOpen, FileText, Menu, X, ChevronRight, Shield, PlusCircle, AlertTriangle } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { cn } from '@/lib/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { label: 'Inicio', href: '/intranet/admin', icon: Home, match: (p) => p.startsWith('/intranet/admin') || p === '/intranet/dashboard' },
  { label: 'Calculadora', href: '/intranet/admin/calculadora', icon: Calculator, match: (p) => p.startsWith('/intranet/admin/calculadora') },
  { label: 'Mis casos', href: '/intranet/admin/casos', icon: Briefcase, match: (p) => p.startsWith('/intranet/admin/casos') },
  { label: 'Biblioteca CP', href: '/intranet/admin/cp', icon: BookOpen, match: (p) => p.startsWith('/intranet/admin/cp') },
  { label: 'Catálogo de delitos', href: '/intranet/admin/delitos', icon: FileText, match: (p) => p.startsWith('/intranet/admin/delitos') },
  { label: 'Agravantes específicas', href: '/intranet/admin/agravantes', icon: AlertTriangle, match: (p) => p.startsWith('/intranet/admin/agravantes') },
  { label: 'Registrar delito', href: '/intranet/admin/delito-form', icon: PlusCircle, match: (p) => p.startsWith('/intranet/admin/delito-form') },
  { label: 'Web Admin', href: '/intranet/admin', icon: Shield, match: (p) => p.startsWith('/intranet/admin') },
];

export function AppSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className={cn('flex flex-col gap-1', className)}>
      {NAV.map(item => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 h-10 px-3 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none',
              active
                ? 'bg-accent/15 text-primary'
                : 'text-text-secondary hover:bg-surface-alt hover:text-text',
            )}
          >
            <item.icon size={16} />
            <span className="flex-1">{item.label}</span>
            {active && <ChevronRight size={14} className="text-accent" />}
          </Link>
        );
      })}
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
        className="absolute left-0 top-0 bottom-0 w-72 bg-surface shadow-xl p-4 flex flex-col"
        role="dialog"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Scale size={16} className="text-accent" />
            </div>
            <span className="font-extrabold text-sm text-primary tracking-widest">Pineda y Asociados</span>
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
    <IconButton label={open ? 'Cerrar menú' : 'Abrir menú'} variant="solid" onClick={onClick} aria-expanded={open} className="lg:hidden">
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
