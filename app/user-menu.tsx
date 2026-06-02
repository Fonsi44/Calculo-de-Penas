'use client';

import { useAuth } from './auth-context';
import { useTheme } from './theme-context';
import Link from 'next/link';
import { LogOut, User, Scale, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  if (loading) return null;
  if (pathname === '/login') return null;

  return (
    <div className="bg-primary px-3 py-1.5 flex items-center justify-between no-print">
      <Link href="/" className="flex items-center gap-1.5">
        <Scale size={14} className="text-accent" />
        <span className="text-[10px] font-bold text-accent tracking-widest">LEX</span>
        <span className="text-[9px] text-white/50 ml-1 hidden sm:inline">HONDURAS</span>
      </Link>
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={12} className="text-accent" /> : <Moon size={12} className="text-white" />}
        </button>
        {user ? (
          <>
            <Link href="/casos" className="text-[10px] text-[#C9D1DD] hover:text-white transition-colors">
              {user.nombre}
            </Link>
            <button
              onClick={logout}
              className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={12} className="text-white" />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-[10px] px-2 py-1 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition-colors"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
