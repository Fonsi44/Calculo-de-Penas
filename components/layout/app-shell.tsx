'use client';

import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AppSidebar, MobileNavDrawer, MobileNavToggle, useMobileNav } from './app-sidebar';
import { UserActions } from './user-actions';

export interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerRight?: React.ReactNode;
  showSidebar?: boolean;
  hideHeader?: boolean;
}

export function AppShell({
  children,
  title,
  subtitle,
  backHref,
  backLabel = 'Volver',
  headerRight,
  showSidebar = true,
  hideHeader = false,
}: AppShellProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { open, setOpen } = useMobileNav();

  return (
    <div className="flex flex-1 bg-background">
      {/* Sidebar desktop */}
      {showSidebar && isDesktop && (
        <aside className="hidden lg:flex desktop-sidebar bg-surface border-r border-border-light flex-col p-4 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-2 mb-6 focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <span className="text-accent font-extrabold text-sm">L</span>
            </div>
            <div>
              <p className="font-extrabold text-xs text-primary tracking-widest leading-none">LEX HONDURAS</p>
              <p className="text-[10px] text-text-muted leading-none mt-0.5">Cálculo de penas</p>
            </div>
          </Link>
          <AppSidebar />
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {!hideHeader && (
          <header className="bg-surface border-b border-border-light px-3 py-2 no-print sticky top-0 z-30">
            <div className="flex items-center gap-2">
              {!isDesktop && <MobileNavToggle onClick={() => setOpen(true)} />}
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label={backLabel}
                  className="w-9 h-9 rounded-md bg-surface-alt flex items-center justify-center hover:bg-border-light focus-visible:outline-none"
                >
                  <ChevronLeft size={18} className="text-text-secondary" />
                </Link>
              ) : !isDesktop ? null : (
                <Link
                  href="/"
                  aria-label="Ir al inicio"
                  className="w-9 h-9 rounded-md bg-surface-alt flex items-center justify-center hover:bg-border-light focus-visible:outline-none"
                >
                  <Home size={18} className="text-text-secondary" />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-base text-text truncate">{title}</h1>
                {subtitle && <p className="text-[11px] text-text-muted truncate">{subtitle}</p>}
              </div>
              <UserActions />
              {headerRight}
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
