'use client';

import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { UserActions } from './user-actions';
import { AppSidebar, MobileNavDrawer, MobileNavToggle, useMobileNav } from './app-sidebar';

export interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
  withSidebar?: boolean;
}

export function AppShell({
  children,
  title,
  subtitle,
  backHref,
  backLabel = 'Volver',
  headerRight,
  hideHeader = false,
  withSidebar = true,
}: AppShellProps) {
  const { open, setOpen } = useMobileNav();

  if (!withSidebar) {
    return (
      <>
        {!hideHeader && (
          <header className="bg-surface border-b border-border-light px-3 py-2 no-print sticky top-0 z-30">
            <div className="flex items-center gap-2">
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label={backLabel}
                  className="w-9 h-9 rounded-md bg-surface-alt flex items-center justify-center hover:bg-border-light focus-visible:outline-none"
                >
                  <ChevronLeft size={18} className="text-text-secondary" />
                </Link>
              ) : (
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
                {subtitle && <p className="text-xxs text-text-muted truncate">{subtitle}</p>}
              </div>
              <UserActions />
              {headerRight}
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </>
    );
  }

  return (
    <div className="flex flex-1 bg-background">
      <aside className="hidden lg:flex desktop-sidebar bg-surface border-r border-border-light flex-col p-4 sticky top-0 h-screen overflow-y-auto no-print">
        <Link
          href="/"
          className="flex items-center gap-2 mb-6 focus-visible:outline-none"
        >
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
            <span className="text-accent font-extrabold text-sm">L</span>
          </div>
          <div>
            <p className="font-extrabold text-xs text-primary tracking-widest leading-none">LEX HONDURAS</p>
            <p className="text-xxs text-text-muted leading-none mt-0.5">Cálculo de penas</p>
          </div>
        </Link>
        <AppSidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {!hideHeader && (
          <header className="bg-surface border-b border-border-light px-3 py-2 no-print sticky top-0 z-30">
            <div className="flex items-center gap-2">
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label={backLabel}
                  className="w-9 h-9 rounded-md bg-surface-alt flex items-center justify-center hover:bg-border-light focus-visible:outline-none"
                >
                  <ChevronLeft size={18} className="text-text-secondary" />
                </Link>
              ) : (
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
                {subtitle && <p className="text-xxs text-text-muted truncate">{subtitle}</p>}
              </div>
              <UserActions />
              {headerRight}
            </div>
          </header>
        )}

        <main id="main" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-40 lg:hidden no-print">
        <MobileNavToggle open={open} onClick={() => setOpen(true)} />
      </div>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
