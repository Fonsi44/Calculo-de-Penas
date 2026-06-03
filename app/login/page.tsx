'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const toast = useToast();
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

    if (mode === 'register' && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

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
      toast.success(mode === 'login' ? 'Sesión iniciada' : 'Cuenta creada');
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
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

        <Card padding="md" className="shadow-md">
          <div className="flex mb-4 bg-surface-alt rounded-md p-0.5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => setMode('login')}
              className={`flex-1 h-9 text-sm font-semibold rounded transition-colors ${
                mode === 'login' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => setMode('register')}
              className={`flex-1 h-9 text-sm font-semibold rounded transition-colors ${
                mode === 'register' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {mode === 'register' && (
              <Field label="Nombre completo" htmlFor="nombre" required>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  iconLeft={<User size={16} />}
                  required
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                iconLeft={<Mail size={16} />}
                required
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="password"
              required
              hint={mode === 'register' ? 'Mínimo 6 caracteres' : undefined}
            >
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                iconLeft={<Lock size={16} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />
            </Field>

            {error && (
              <div role="alert" className="bg-danger-bg border border-danger/30 rounded-md p-2.5 text-center">
                <p className="text-xs font-semibold text-danger">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
            >
              {loading
                ? (mode === 'login' ? 'Ingresando...' : 'Registrando...')
                : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
            </Button>
          </form>
        </Card>

        <p className="text-center text-[11px] text-text-muted mt-4">
          Al continuar, aceptas que el cálculo es orientativo y no sustituye la función jurisdiccional.
        </p>
      </div>
    </div>
  );
}
