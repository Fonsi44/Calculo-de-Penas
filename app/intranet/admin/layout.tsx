'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  User,
  ChevronLeft,
  Shield,
  BarChart3,
  Globe,
  ClipboardList,
  Calculator,
  BookOpen,
  FileCheck,
  Scale,
  ChevronDown,
  Settings,
  Menu,
  MenuSquare,
  Image,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/ui';
import { Spinner } from '@/components/ui/spinner';

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    match: (p: string) => boolean;
    adminOnly?: boolean;
  }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Inicio',
    icon: LayoutDashboard,
    items: [
      { label: 'Panel general', href: '/intranet/admin', icon: LayoutDashboard, match: (p) => p === '/intranet/admin' },
    ],
  },
  {
    label: 'Herramientas jurídicas',
    icon: Scale,
    items: [
      { label: 'Calculadora', href: '/intranet/admin/calculadora', icon: Calculator, match: (p) => p.startsWith('/intranet/admin/calculadora') || p.startsWith('/intranet/calculadora') || p === '/calculadora' },
      { label: 'Mis casos', href: '/intranet/admin/casos', icon: ClipboardList, match: (p) => p.startsWith('/intranet/admin/casos') || p.startsWith('/intranet/casos') || p === '/casos' },
      { label: 'Biblioteca CP', href: '/intranet/admin/cp', icon: BookOpen, match: (p) => p.startsWith('/intranet/admin/cp') || p.startsWith('/intranet/cp') || p === '/cp' },
      { label: 'Catálogo delitos', href: '/intranet/admin/delitos', icon: FileCheck, match: (p) => p.startsWith('/intranet/admin/delitos') || p.startsWith('/intranet/delitos') || p === '/delitos' },
    ],
  },
  {
    label: 'Administración',
    icon: Shield,
    adminOnly: true,
    items: [
      { label: 'Usuarios', href: '/intranet/admin/usuarios', icon: Users, match: (p) => p.startsWith('/intranet/admin/usuarios'), adminOnly: true },
      { label: 'SEO', href: '/intranet/admin/seo', icon: BarChart3, match: (p) => p.startsWith('/intranet/admin/seo'), adminOnly: true },
      { label: 'Auditoría', href: '/intranet/admin/auditoria', icon: ClipboardList, match: (p) => p.startsWith('/intranet/admin/auditoria'), adminOnly: true },
    ],
  },
  {
    label: 'Gestión de contenido',
    icon: FileText,
    adminOnly: true,
    items: [
      { label: 'Blog', href: '/intranet/admin/blog', icon: FileText, match: (p) => p.startsWith('/intranet/admin/blog'), adminOnly: true },
      { label: 'FAQ', href: '/intranet/admin/faq', icon: MessageSquare, match: (p) => p.startsWith('/intranet/admin/faq'), adminOnly: true },
      { label: 'Páginas', href: '/intranet/admin/pages', icon: Globe, match: (p) => p.startsWith('/intranet/admin/pages'), adminOnly: true },
      { label: 'Menús', href: '/intranet/admin/menus', icon: MenuSquare, match: (p) => p.startsWith('/intranet/admin/menus'), adminOnly: true },
      { label: 'Biblioteca medios', href: '/intranet/admin/medios', icon: Image, match: (p) => p.startsWith('/intranet/admin/medios'), adminOnly: true },
      { label: 'Áreas jurídicas', href: '/intranet/admin/servicios', icon: Briefcase, match: (p) => p.startsWith('/intranet/admin/servicios'), adminOnly: true },
    ],
  },
  {
    label: 'Configuración',
    icon: Settings,
    items: [
      { label: 'Perfil', href: '/intranet/admin/perfil', icon: User, match: (p) => p.startsWith('/intranet/admin/perfil') },
      { label: 'Sitio', href: '/intranet/admin/pages/configuracion', icon: Settings, match: (p) => p === '/intranet/admin/pages/configuracion' },
    ],
  },
];

function SidebarNav({ pathname, isAdmin, onNavigate }: { pathname: string; isAdmin: boolean; onNavigate?: () => void }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const autoOpen = new Set<string>();
    for (const group of NAV_GROUPS) {
      if (group.adminOnly && !isAdmin) continue;
      for (const item of group.items) {
        if (item.adminOnly && !isAdmin) continue;
        if (item.match(pathname)) {
          autoOpen.add(group.label);
          break;
        }
      }
    }
    return autoOpen;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const visibleGroups = NAV_GROUPS.filter(g => !g.adminOnly || isAdmin);

  return (
    <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
      {visibleGroups.map((group) => {
        const visibleItems = group.items.filter(i => !i.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;
        const isExpanded = expandedGroups.has(group.label);
        const groupActive = visibleItems.some((item) => item.match(pathname));

        return (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold transition-colors',
                groupActive
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-alt/50',
              )}
            >
              <group.icon size={14} />
              <span className="flex-1 text-left uppercase tracking-wider">{group.label}</span>
              <ChevronDown
                size={12}
                className={cn(
                  'transition-transform duration-200',
                  isExpanded ? 'rotate-0' : '-rotate-90',
                )}
              />
            </button>
            <div
              className={cn(
                'grid transition-all duration-200',
                isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="pl-2 pt-0.5 space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = item.match(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors relative',
                          active
                            ? 'bg-accent/15 text-primary font-semibold'
                            : 'text-text-secondary hover:bg-surface-alt/70 hover:text-text',
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-accent" />
                        )}
                        <item.icon size={15} className={active ? 'text-accent-dark' : ''} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setStuck(true), 8000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const isAdmin = user?.rol === 'admin';

  useEffect(() => {
    if (!loading && !user) {
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
            <p className="text-xs text-text-secondary">Esto puede ocurrir si la sesión expiró o hay un problema de conexión.</p>
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

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-overlay z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border-light flex flex-col flex-shrink-0 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-border-light">
          <Link href="/intranet/admin" className="flex items-center gap-3 focus-visible:outline-none group">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center shadow-md group-hover:shadow-gold-ring transition-shadow">
              <Scale size={18} className="text-accent" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-primary tracking-widest leading-none">LEX HONDURAS</p>
              <p className="text-xxs text-text-muted leading-none mt-0.5">Panel de administración</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <SidebarNav pathname={pathname} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />

        {/* User section */}
        <div className="border-t border-border-light">
          <div className="p-3 space-y-1.5">
            <div className="flex items-center gap-2.5 px-2.5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <User size={13} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text leading-tight truncate">{user.nombre || user.email}</p>
                <p className="text-xxs text-text-muted truncate">{isAdmin ? 'Administrador' : 'Usuario'}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Link
                href="/intranet/admin/perfil"
                className="flex-1 flex items-center justify-center gap-1 h-8 rounded-md text-xxs font-semibold text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
              >
                <User size={12} />
                Perfil
              </Link>
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
          <div className="px-3 pb-2">
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-3 border-b border-border-light bg-surface">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-surface-alt transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Scale size={14} className="text-accent" />
            </div>
            <p className="font-bold text-xs text-primary tracking-widest">LEX HONDURAS</p>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
