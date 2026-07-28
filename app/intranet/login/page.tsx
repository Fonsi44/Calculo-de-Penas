'use client';

import { useState, useRef, useEffect } from 'react';
import { Scale, Mail, Lock, Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type LoginStep = 'credentials' | '2fa';

export default function IntranetLoginPage() {
  const toast = useToast();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [challenge, setChallenge] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [usarRecuperacion, setUsarRecuperacion] = useState(false);
  const [cooldownResend, setCooldownResend] = useState(0);
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // Foco automático en el campo de código al pasar a 2FA
  useEffect(() => {
    if (step === '2fa' && codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, [step]);

  // Cooldown para reenvío
  useEffect(() => {
    if (cooldownResend <= 0) return;
    const t = setInterval(() => setCooldownResend(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownResend]);

  const resetToLogin = () => {
    setStep('credentials');
    setChallenge(null);
    setCodigo('');
    setCodigoError(null);
    setUsarRecuperacion(false);
    setError(null);
    setCooldownResend(0);
  };

  const handleSubmitCredentials = async (e: React.FormEvent) => {
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

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      // Verificar si el backend solicita 2FA
      if (data.requiere2fa && data.challenge) {
        setChallenge(data.challenge);
        setStep('2fa');
        setLoading(false);
        return;
      }

      // Login exitoso sin 2FA
      toast.success('Sesión iniciada');
      const destino = data.user?.rol === 'admin' ? '/intranet/admin' : '/intranet/sgie';
      window.location.href = destino;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || codigo.length < 6) {
      setCodigoError('Ingrese un código válido de al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setCodigoError(null);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          codigo,
          usarRecuperacion,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      toast.success('Verificación completada');
      const destino = data.user?.rol === 'admin' ? '/intranet/admin' : '/intranet/sgie';
      window.location.href = destino;
    } catch (e) {
      setCodigoError(e instanceof Error ? e.message : 'Código inválido');
      setCodigo('');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarNuevoCodigo = async () => {
    // Reenviar login para obtener un challenge fresco
    setCooldownResend(30);
    setLoading(true);
    setCodigoError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.requiere2fa && data.challenge) {
        setChallenge(data.challenge);
        setCodigo('');
        toast.success('Nuevo código solicitado. Revise su aplicación autenticadora.');
      } else {
        setCodigoError('No se pudo solicitar un nuevo código. Intente de nuevo.');
      }
    } catch {
      setCodigoError('Error al solicitar nuevo código.');
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 1: Credenciales ──
  if (step === 'credentials') {
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
            <form onSubmit={handleSubmitCredentials} className="space-y-3" noValidate>
              <Field label="Email" htmlFor="email" required hint="Use su correo corporativo @pinedayasociadoshn.com">
                <Input
                  id="email"
                  name="email"
                  autoComplete="email"
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
                  name="password"
                  autoComplete="current-password"
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
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Iniciar sesión'}
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

  // ── Paso 2: Verificación 2FA ──
  return (
    <div className="flex flex-col flex-1 bg-background items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
            <KeyRound size={28} className="text-accent" />
          </div>
          <h1 className="text-xl font-extrabold text-primary">Verificación en dos pasos</h1>
          <p className="text-xs text-text-muted mt-1">
            {usarRecuperacion
              ? 'Ingrese uno de sus códigos de recuperación.'
              : 'Ingrese el código de su aplicación autenticadora.'}
          </p>
        </div>

        <Card padding="md" className="shadow-md">
          <form onSubmit={handleSubmit2fa} className="space-y-3" noValidate>
            <Field
              label={usarRecuperacion ? 'Código de recuperación' : 'Código de verificación'}
              htmlFor="codigo"
              required
              hint={usarRecuperacion ? 'Códigos de 10 caracteres' : 'Código de 6 dígitos de su app autenticadora'}
            >
              <Input
                ref={codigoInputRef}
                id="codigo"
                type="text"
                inputMode={usarRecuperacion ? 'text' : 'numeric'}
                value={codigo}
                onChange={e => {
                  setCodigo(e.target.value.replace(/\s/g, ''));
                  setCodigoError(null);
                }}
                placeholder={usarRecuperacion ? 'XXXX-XXXX-XX' : '000000'}
                iconLeft={<KeyRound size={16} />}
                maxLength={usarRecuperacion ? 12 : 6}
                autoComplete="one-time-code"
                required
              />
            </Field>

            {codigoError && (
              <div role="alert" className="bg-danger-bg border border-danger/30 rounded-md p-2.5 text-center">
                <p className="text-xs font-semibold text-danger">{codigoError}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading || !codigo}
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => setUsarRecuperacion(!usarRecuperacion)}
              className="w-full text-xs text-text-muted hover:text-primary transition-colors text-center"
            >
              {usarRecuperacion
                ? '← Usar código de aplicación autenticadora'
                : 'Usar código de recuperación →'}
            </button>

            <button
              type="button"
              onClick={handleSolicitarNuevoCodigo}
              disabled={cooldownResend > 0 || loading}
              className="w-full text-xs text-text-muted hover:text-primary transition-colors text-center flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <RefreshCw size={12} />
              {cooldownResend > 0
                ? `Solicitar nuevo código (${cooldownResend}s)`
                : 'Solicitar nuevo código'}
            </button>
          </div>
        </Card>

        <button
          type="button"
          onClick={resetToLogin}
          className="mt-4 w-full text-xs text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeft size={14} />
          Volver al inicio de sesión
        </button>

        <p className="text-center text-xxs text-text-muted mt-4 leading-relaxed">
          Si no tiene acceso a su aplicación autenticadora ni a sus códigos de recuperación, contacte con el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
