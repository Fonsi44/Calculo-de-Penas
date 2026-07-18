'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity, Archive, ChevronLeft, ClipboardCheck,
  FolderKanban, Gavel, HeartPulse, KeyRound, Link2, ListChecks,
  LockKeyhole, LogOut, Mail, Menu, Network, ScrollText, Settings, Shield,
  ShieldCheck, Users, Workflow,
} from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

type Item = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const GROUPS: Array<{ label: string; items: Item[] }> = [
  {
    label: 'Operación',
    items: [
      { label: 'Resumen operativo', href: '/intranet/admin', icon: Activity },
      { label: 'Expedientes', href: '/intranet/sgie/expedientes', icon: FolderKanban },
      { label: 'Incidencias', href: '/intranet/sgie/alertas', icon: ShieldCheck },
      { label: 'Automatizaciones / trabajos', href: '/intranet/admin/sgie/metricas', icon: Workflow },
      { label: 'Salud del sistema', icon: HeartPulse },
    ],
  },
  {
    label: 'Personas y acceso',
    items: [
      { label: 'Usuarios', href: '/intranet/admin/usuarios', icon: Users },
      { label: 'Invitaciones', href: '/intranet/admin/invitaciones', icon: Mail },
      { label: 'Equipos', icon: Network },
      { label: 'Roles y permisos', href: '/intranet/admin/usuarios', icon: KeyRound },
      { label: 'Sesiones y seguridad', href: '/intranet/admin/perfil', icon: LockKeyhole },
    ],
  },
  {
    label: 'Configuración SGIE',
    items: [
      { label: 'Plantillas de procedimiento', href: '/intranet/admin/sgie/plantillas', icon: ClipboardCheck },
      { label: 'Requisitos documentales', icon: ListChecks },
      { label: 'Reglas', href: '/intranet/admin/sgie/reglas', icon: Gavel },
      { label: 'Comunicaciones', href: '/intranet/sgie/correos', icon: Mail },
      { label: 'Retención', href: '/intranet/admin/sgie/retencion', icon: Archive },
    ],
  },
  {
    label: 'Gobierno',
    items: [
      { label: 'Auditoría', href: '/intranet/admin/auditoria', icon: ScrollText },
      { label: 'Integraciones', icon: Link2 },
      { label: 'Configuración de seguridad', href: '/intranet/admin/perfil', icon: Settings },
    ],
  },
];

function Navigation({ pathname, close }: { pathname: string; close: () => void }) {
  return <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
    {GROUPS.map((group) => <section key={group.label}>
      <p className="px-2.5 mb-1 text-xxs font-bold uppercase tracking-wider text-text-muted">{group.label}</p>
      <div className="space-y-0.5">{group.items.map((item) => {
        const Icon = item.icon;
        if (!item.href) return <div key={item.label} title="Próxima fase"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-text-muted opacity-60">
          <Icon size={15} /><span>{item.label}</span><span className="ml-auto text-xxs">Próxima fase</span>
        </div>;
        const active = item.href === '/intranet/admin'
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return <Link key={item.label} href={item.href} onClick={close}
          className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors',
            active ? 'bg-accent/15 text-primary font-semibold' : 'text-text-secondary hover:bg-surface-alt')}>
          <Icon size={15} className={active ? 'text-accent-dark' : ''} /><span>{item.label}</span>
        </Link>;
      })}</div>
    </section>)}
  </nav>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'admin')) router.replace('/intranet/login');
  }, [loading, router, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user || user.rol !== 'admin') return null;

  return <div className="flex h-screen bg-background overflow-hidden">
    {mobileOpen && <button className="fixed inset-0 bg-overlay z-40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" />}
    <aside className={cn(
      'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border-light flex flex-col transition-transform',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    )}>
      <Link href="/intranet/admin" className="p-4 border-b border-border-light flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center"><Shield size={20} className="text-accent" /></div>
        <div><p className="font-extrabold text-sm text-primary">Pineda y Asociados</p><p className="text-xxs text-text-muted">Administración SGIE</p></div>
      </Link>
      <Navigation pathname={pathname} close={() => setMobileOpen(false)} />
      <div className="border-t border-border-light p-3 space-y-2">
        <div className="px-2"><p className="text-xs font-bold truncate">{user.nombre || user.email}</p><p className="text-xxs text-text-muted">Administrador</p></div>
        <button onClick={async () => { await logout(); router.push('/intranet/login'); }}
          className="w-full h-8 flex items-center justify-center gap-1 rounded-md text-xs text-danger hover:bg-danger-bg">
          <LogOut size={13} /> Salir
        </button>
        <Link href="/" className="flex items-center gap-1 px-2 text-xxs text-text-muted hover:text-text"><ChevronLeft size={12} /> Ir al sitio público</Link>
      </div>
    </aside>
    <div className="flex-1 min-w-0 flex flex-col">
      <header className="lg:hidden p-3 border-b border-border-light bg-surface">
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
      </header>
      <main className="flex-1 overflow-y-auto"><div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div></main>
    </div>
  </div>;
}
