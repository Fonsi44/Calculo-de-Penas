'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Settings,
  User,
  ChevronLeft,
  Shield,
  BarChart3,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/ui';
import { Spinner } from '@/components/ui/spinner';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/intranet/admin', icon: LayoutDashboard, match: (p: string) => p === '/intranet/admin' },
  { label: 'Páginas', href: '/intranet/admin/pages', icon: Globe, match: (p: string) => p.startsWith('/intranet/admin/pages') },
  { label: 'Blog', href: '/intranet/admin/blog', icon: FileText, match: (p: string) => p.startsWith('/intranet/admin/blog') },
  { label: 'FAQ', href: '/intranet/admin/faq', icon: MessageSquare, match: (p: string) => p.startsWith('/intranet/admin/faq') },
  { label: 'Usuarios', href: '/intranet/admin/usuarios', icon: Users, match: (p: string) => p.startsWith('/intranet/admin/usuarios') },
  { label: 'SEO', href: '/intranet/admin/seo', icon: BarChart3, match: (p: string) => p.startsWith('/intranet/admin/seo') },
  { label: 'Configuración', href: '/intranet/admin/config', icon: Settings, match: (p: string) => p.startsWith('/intranet/admin/config') },
  { label: 'Perfil', href: '/intranet/admin/perfil', icon: User, match: (p: string) => p.startsWith('/intranet/admin/perfil') },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'admin')) {
      router.replace('/intranet/login');
    }
  }, [user, loading, router]);

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
    <div className="flex h-screen bg-background">
      <aside className="w-56 bg-surface border-r border-border-light flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-primary leading-tight">Panel Admin</p>
              <p className="text-xxs text-text-muted">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent/15 text-primary'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text',
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border-light">
          <Link
            href="/intranet/dashboard"
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
          >
            <ChevronLeft size={16} />
            Volver a intranet
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
