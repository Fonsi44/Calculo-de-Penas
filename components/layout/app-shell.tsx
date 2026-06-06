'use client';

import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { UserActions } from './user-actions';

export interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
}

export function AppShell({
  children,
  title,
  subtitle,
  backHref,
  backLabel = 'Volver',
  headerRight,
  hideHeader = false,
}: AppShellProps) {
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
