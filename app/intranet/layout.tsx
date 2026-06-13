'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppSidebar, MobileNavDrawer, MobileNavToggle, useMobileNav } from '@/components/layout/app-sidebar';

export default function IntranetLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useMobileNav();
  // Admin tiene su propio layout. Dashboard redirige a admin.
  if (pathname.startsWith('/intranet/admin') || pathname === '/intranet/dashboard') {
    return <>{children}</>;
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
        {children}
      </div>

      <div className="fixed bottom-4 right-4 z-40 lg:hidden no-print">
        <MobileNavToggle open={open} onClick={() => setOpen(true)} />
      </div>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
