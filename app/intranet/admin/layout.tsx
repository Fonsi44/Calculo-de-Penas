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
} from 'lucide-react';
import { cn } from '@/lib/ui';
import { Spinner } from '@/components/ui/spinner';

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    match: (p: string) => boolean;
    external?: boolean;
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
    label: 'Gestión de contenido',
    icon: FileText,
    items: [
      { label: 'Blog', href: '/intranet/admin/blog', icon: FileText, match: (p) => p.startsWith('/intranet/admin/blog') },
      { label: 'FAQ', href: '/intranet/admin/faq', icon: MessageSquare, match: (p) => p.startsWith('/intranet/admin/faq') },
      { label: 'Páginas', href: '/intranet/admin/pages', icon: Globe, match: (p) => p.startsWith('/intranet/admin/pages') },
    ],
  },
  {
    label: 'Herramientas jurídicas',
    icon: Scale,
    items: [
      { label: 'Calculadora', href: '/intranet/calculadora', icon: Calculator, match: (p) => p.startsWith('/intranet/calculadora') || p === '/calculadora', external: true },
      { label: 'Mis casos', href: '/intranet/casos', icon: ClipboardList, match: (p) => p.startsWith('/intranet/casos') || p === '/casos', external: true },
      { label: 'Biblioteca CP', href: '/intranet/cp', icon: BookOpen, match: (p) => p.startsWith('/intranet/cp') || p === '/cp', external: true },
      { label: 'Catálogo delitos', href: '/intranet/delitos', icon: FileCheck, match: (p) => p.startsWith('/intranet/delitos') || p === '/delitos', external: true },
    ],
  },
  {
    label: 'Administración',
    icon: Shield,
    items: [
      { label: 'Usuarios', href: '/intranet/admin/usuarios', icon: Users, match: (p) => p.startsWith('/intranet/admin/usuarios') },
      { label: 'SEO', href: '/intranet/admin/seo', icon: BarChart3, match: (p) => p.startsWith('/intranet/admin/seo') },
      { label: 'Auditoría', href: '/intranet/admin/auditoria', icon: ClipboardList, match: (p) => p.startsWith('/intranet/admin/auditoria') },
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

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const autoOpen = new Set<string>();
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
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

  return (
    <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">
      {NAV_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.label);
        const groupActive = group.items.some((item) => item.match(pathname));

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
                'overflow-hidden transition-all duration-200',
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="pl-2 pt-0.5 space-y-0.5">
                {group.items.map((item) => {
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
                      {item.external && (
                        <span className="ml-auto text-xxs text-text-muted opacity-50">↗</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'admin')) {
      router.replace('/intranet/login');
    }
  }, [user, loading, router]);

  // Mobile menu closes on pathname change via onNavigate in Link components

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || user.rol !== 'admin') {
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
        <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />

        {/* Status indicator */}
        <div className="px-4 py-2 border-t border-border-light">
          <div className="flex items-center gap-2 px-2.5 py-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xxs text-text-muted">{user.email}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border-light">
          <Link
            href="/intranet/dashboard"
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
          >
            <ChevronLeft size={16} />
            Ir al dashboard
          </Link>
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
