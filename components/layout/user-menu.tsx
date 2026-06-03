'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { useTheme } from '@/app/theme-context';
import { LogOut, Moon, Sun, Scale, ChevronDown, Briefcase, BookOpen, Home, Calculator, FileText } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading) return null;

  return (
    <div className="bg-primary px-3 py-1.5 flex items-center justify-between no-print">
      <Link href="/" className="flex items-center gap-1.5 focus-visible:outline-none">
        <Scale size={14} className="text-accent" />
        <span className="text-xs font-extrabold text-accent tracking-widest">LEX</span>
        <span className="text-[11px] text-text-inverse/70 hidden sm:inline">HONDURAS</span>
      </Link>

      <div className="flex items-center gap-1.5" ref={ref}>
        <IconButton
          label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          variant="solid"
          size="sm"
          onClick={toggle}
        >
          {theme === 'dark' ? <Sun size={12} className="text-accent" /> : <Moon size={12} className="text-text-inverse" />}
        </IconButton>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-1 h-7 px-2 rounded-md bg-white/10 hover:bg-white/20 text-text-inverse text-xs font-semibold"
            >
              <span className="max-w-[140px] truncate">{user.nombre}</span>
              <ChevronDown size={12} />
            </button>
            {open && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-56 bg-surface rounded-md border border-border-light shadow-lg overflow-hidden z-50"
              >
                <div className="px-3 py-2 border-b border-border-light">
                  <p className="text-xs font-bold text-text truncate">{user.nombre}</p>
                  <p className="text-[11px] text-text-secondary truncate">{user.email}</p>
                </div>
                <Link
                  href="/"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt"
                >
                  <Home size={14} /> Inicio
                </Link>
                <Link
                  href="/calculadora"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt"
                >
                  <Calculator size={14} /> Calculadora
                </Link>
                <Link
                  href="/casos"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt"
                >
                  <Briefcase size={14} /> Mis casos
                </Link>
                <Link
                  href="/cp"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt"
                >
                  <BookOpen size={14} /> Biblioteca CP
                </Link>
                <Link
                  href="/delitos"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt"
                >
                  <FileText size={14} /> Catálogo de delitos
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-bg border-t border-border-light"
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="h-7 px-3 inline-flex items-center rounded-md bg-accent/20 text-accent text-xs font-semibold hover:bg-accent/30"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
