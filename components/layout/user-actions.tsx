'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { useTheme } from '@/app/theme-context';
import { LogOut, Moon, Sun, ChevronDown, User as UserIcon, Shield } from 'lucide-react';
import { isAdminRole } from '@/lib/roles';
import { IconButton } from '@/components/ui/icon-button';

export function UserActions() {
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
    <div className="flex items-center gap-1" ref={ref}>
      <IconButton
        label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        variant="subtle"
        onClick={toggle}
      >
        {theme === 'dark' ? <Sun size={16} className="text-accent" /> : <Moon size={16} className="text-text-secondary" />}
      </IconButton>

      {user ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex items-center gap-1 h-9 px-2.5 rounded-md bg-surface-alt hover:bg-border-light text-text text-xs font-semibold"
          >
            <UserIcon size={14} className="text-text-secondary" />
            <span className="max-w-[140px] truncate">{user.nombre}</span>
            <ChevronDown size={12} className="text-text-muted" />
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 bg-surface rounded-md border border-border-light shadow-lg overflow-hidden z-50"
              onKeyDown={(e) => {
                const items = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]');
                const idx = Array.from(items).indexOf(document.activeElement as HTMLElement);
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const next = Math.min(idx + 1, items.length - 1);
                  items[next >= 0 ? next : 0]?.focus();
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const prev = Math.max(idx - 1, 0);
                  items[prev]?.focus();
                }
                if (e.key === 'Escape') {
                  setOpen(false);
                  const btn = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement;
                  btn?.focus();
                }
              }}
            >
              <div className="px-3 py-2 border-b border-border-light">
                <p className="text-xs font-bold text-text truncate">{user.nombre}</p>
                <p className="text-xxs text-text-secondary truncate">{user.email}</p>
              </div>
              {isAdminRole(user.rol) && (
                <Link
                  href="/intranet/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt"
                >
                  <Shield size={14} className="text-accent-dark" /> Panel Admin
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  router.push('/intranet/login');
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
          href="/intranet/login"
          className="h-9 px-3 inline-flex items-center rounded-md bg-primary text-text-inverse text-xs font-semibold hover:bg-primary-light"
        >
          Iniciar sesión
        </Link>
      )}
    </div>
  );
}
