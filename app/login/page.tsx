'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email, password }
      : { email, password, nombre };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      window.location.href = '/';
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-background items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Scale size={28} className="text-accent" />
          </div>
          <h1 className="text-xl font-extrabold text-primary">LEX HONDURAS</h1>
          <p className="text-xs text-text-muted mt-1">Motor jurídico de cálculo de penas</p>
        </div>

        <div className="bg-surface rounded-xl shadow-md border border-border-light p-5">
          <div className="flex mb-4 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">Nombre completo</label>
                <div className="flex items-center border border-border rounded-lg px-3 py-2 bg-surface-alt">
                  <User size={16} className="text-text-muted mr-2" />
                  <input
                    className="flex-1 text-sm text-text outline-none bg-transparent"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1 block">Email</label>
              <div className="flex items-center border border-border rounded-lg px-3 py-2 bg-surface-alt">
                <Mail size={16} className="text-text-muted mr-2" />
                <input
                  className="flex-1 text-sm text-text outline-none bg-transparent"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1 block">Contraseña</label>
              <div className="flex items-center border border-border rounded-lg px-3 py-2 bg-surface-alt">
                <Lock size={16} className="text-text-muted mr-2" />
                <input
                  className="flex-1 text-sm text-text outline-none bg-transparent"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} className="text-text-muted" /> : <Eye size={16} className="text-text-muted" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-2.5 text-center">
                <p className="text-xs font-semibold text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Ingresando...' : 'Registrando...'}
                </span>
              ) : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-text-muted mt-4">
          Al continuar, aceptas que el cálculo es orientativo y no sustituye la función jurisdiccional.
        </p>
      </div>
    </div>
  );
}
