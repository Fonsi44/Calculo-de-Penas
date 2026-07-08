'use client';

import { useState } from 'react';
import { Scale, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function IntranetLoginPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      toast.success('Sesión iniciada');
      // SGIE — routing post-login por rol: admin → panel admin, abogado → SGIE.
      // El proxy ya hace el mismo derivado si se accede al login con sesión activa.
      const destino = data.user?.rol === 'admin' ? '/intranet/admin' : '/intranet/sgie';
      window.location.href = destino;
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
          <h1 className="text-xl font-extrabold text-primary">PINEDA Y ASOCIADOS</h1>
          <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} /> Acceso exclusivo para personal autorizado
          </p>
        </div>

        <Card padding="md" className="shadow-md">
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <Field label="Email" htmlFor="email" required hint="Use su correo corporativo @pinedayasociadoshn.com">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@pinedayasociadoshn.com"
                iconLeft={<Mail size={16} />}
                required
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="password"
              required
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
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xxs text-text-muted mt-4 leading-relaxed">
          Este acceso es de uso interno del bufete. Toda actividad queda registrada en el sistema de auditoría conforme a nuestras políticas de seguridad.
        </p>
      </div>
    </div>
  );
}
