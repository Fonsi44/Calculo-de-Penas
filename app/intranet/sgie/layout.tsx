'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, FileText, AlertTriangle,
  CheckSquare, Calendar, Mail, ChevronLeft, User, LogOut,
  Scale, Briefcase, Menu, Users, Search,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';
import { Spinner } from '@/components/ui/spinner';
import { GlobalSearch } from '@/components/sgie/global-search';
import { NotificationsPopover } from '@/components/sgie/notifications-popover';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match: (p: string) => boolean;
};

const NAV: NavItem[] = [
  { label: 'Cockpit', href: '/intranet/sgie', icon: LayoutDashboard, match: (p) => p === '/intranet/sgie' },
  { label: 'Clientes', href: '/intranet/sgie/clientes', icon: Users, match: (p) => p.startsWith('/intranet/sgie/clientes') },
  { label: 'Expedientes', href: '/intranet/sgie/expedientes', icon: FolderKanban, match: (p) => p.startsWith('/intranet/sgie/expedientes') },
  { label: 'Documentos', href: '/intranet/sgie/documentos', icon: FileText, match: (p) => p.startsWith('/intranet/sgie/documentos') },
  { label: 'Alertas', href: '/intranet/sgie/alertas', icon: AlertTriangle, match: (p) => p.startsWith('/intranet/sgie/alertas') },
  { label: 'Tareas', href: '/intranet/sgie/tareas', icon: CheckSquare, match: (p) => p.startsWith('/intranet/sgie/tareas') },
  { label: 'Agenda', href: '/intranet/sgie/agenda', icon: Calendar, match: (p) => p.startsWith('/intranet/sgie/agenda') },
  { label: 'Correos', href: '/intranet/sgie/correos', icon: Mail, match: (p) => p.startsWith('/intranet/sgie/correos') },
];

export default function SgieLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setStuck(true), 8000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Acceso: abogado o admin. Un usuario sin rol suficiente no entra.
  useEffect(() => {
    if (!loading && (!user || (user.rol !== 'abogado' && user.rol !== 'admin'))) {
      router.replace('/intranet/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {stuck ? (
          <div className="text-center space-y-3 max-w-sm px-4">
            <div className="w-14 h-14 rounded-xl bg-danger-bg flex items-center justify-center mx-auto">
              <span className="text-danger font-extrabold text-xl">!</span>
            </div>
            <p className="font-bold text-sm text-primary">La sesión está tardando en cargar</p>
            <p className="text-xs text-text-secondary">Esto puede ocurrir si la sesión expiró o no tiene acceso al módulo SGIE.</p>
            <a href="/intranet/login"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-text-inverse font-bold text-sm hover:bg-primary-light">
              Ir al inicio de sesión
            </a>
          </div>
        ) : (
          <Spinner size="lg" />
        )}
      </div>
    );
  }

  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return null;
  }

  const isAdmin = user.rol === 'admin';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-overlay z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border-light flex flex-col flex-shrink-0 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="p-4 border-b border-border-light">
          <Link href="/intranet/sgie" className="flex items-center gap-3 focus-visible:outline-none group">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center shadow-md group-hover:shadow-gold-ring transition-shadow">
              <Scale size={18} className="text-accent" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-primary tracking-widest leading-none">Pineda y Asociados</p>
              <p className="text-xxs text-text-muted leading-none mt-0.5">SGIE — Panel del abogado</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <p className="px-2.5 mb-1 text-xxs font-bold uppercase tracking-wider text-text-muted">Gestión de expedientes</p>
          <div className="space-y-0.5">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors relative',
                    active
                      ? 'bg-accent/15 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-surface-alt/70 hover:text-text',
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-accent" />}
                  <item.icon size={15} className={active ? 'text-accent-dark' : ''} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border-light">
          <div className="p-3 space-y-1.5">
            <div className="flex items-center gap-2.5 px-2.5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <User size={13} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text leading-tight truncate">{user.nombre || user.email}</p>
                <p className="text-xxs text-text-muted truncate">{isAdmin ? 'Administrador' : 'Abogado'}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push('/intranet/login');
                }}
                className="flex-1 flex items-center justify-center gap-1 h-8 rounded-md text-xxs font-semibold text-danger hover:bg-danger-bg transition-colors"
              >
                <LogOut size={12} />
                Salir
              </button>
            </div>
          </div>
          <div className="px-3 pb-2 space-y-1">
            {isAdmin && (
              <Link
                href="/intranet/admin"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xxs text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
              >
                <Briefcase size={12} />
                Panel de administración
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xxs text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
            >
              <ChevronLeft size={12} />
              Ir al sitio web
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior: buscador global (⌘K) + menú móvil */}
        <div className="flex items-center gap-3 p-3 border-b border-border-light bg-surface">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-surface-alt transition-colors lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Scale size={14} className="text-accent" />
            </div>
            <p className="font-bold text-xs text-primary tracking-widest">SGIE</p>
          </div>
          <div className="flex-1" />
          <NotificationsPopover />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-md border border-border-light bg-surface-alt/60 text-xs text-text-muted hover:bg-surface-alt hover:text-text-secondary transition-colors"
            aria-label="Buscar (Ctrl+K)"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Buscar…</span>
            <kbd className="hidden sm:inline-block font-mono text-xxs px-1 py-0.5 rounded border border-border-light bg-surface">⌘K</kbd>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <GlobalSearch externalOpen={searchOpen} onExternalOpenChange={setSearchOpen} />
    </div>
  );
}
