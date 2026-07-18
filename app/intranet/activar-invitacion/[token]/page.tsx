'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, KeyRound, Scale, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

type InvitationState = {
  valid: boolean;
  estado: string;
  nombre?: string;
  email?: string;
  expiraEn?: string;
};

export default function ActivateInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invitation, setInvitation] = useState<InvitationState | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activated, setActivated] = useState(false);
  const [next, setNext] = useState('/intranet/login');

  useEffect(() => {
    fetch(`/api/auth/invitaciones/${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then(setInvitation)
      .catch(() => setInvitation({ valid: false, estado: 'error' }));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/auth/invitaciones/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, termsAccepted }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo activar la cuenta');
      setNext(body.next || '/intranet/login');
      setActivated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo activar la cuenta');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
            <Scale className="text-accent" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary">Activar cuenta</h1>
            <p className="text-xs text-text-secondary">Pineda y Asociados · SGIE</p>
          </div>
        </div>

        {!invitation ? (
          <p className="text-sm text-text-secondary">Verificando invitación…</p>
        ) : activated ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle size={44} className="mx-auto text-success" />
            <h2 className="font-bold text-primary">Cuenta activada</h2>
            <p className="text-sm text-text-secondary">La invitación quedó consumida y ya no puede reutilizarse.</p>
            <Link href={next}><Button variant="primary">Continuar al inicio de sesión</Button></Link>
          </div>
        ) : !invitation.valid ? (
          <div className="space-y-4 text-center py-4">
            <ShieldAlert size={44} className="mx-auto text-danger" />
            <h2 className="font-bold text-primary">Invitación no disponible</h2>
            <p className="text-sm text-text-secondary">El enlace es inválido, expiró, fue revocado o ya se utilizó.</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="rounded-lg border border-border bg-surface-alt p-3 mb-4">
              <p className="font-semibold text-sm text-text">{invitation.nombre}</p>
              <p className="text-xs text-text-secondary">{invitation.email}</p>
            </div>
            <Field label="Nueva contraseña" required htmlFor="password"
              hint="Mínimo 12 caracteres, con mayúscula, minúscula y número.">
              <Input id="password" type="password" autoComplete="new-password"
                minLength={12} value={password} onChange={(event) => setPassword(event.target.value)}
                iconLeft={<KeyRound size={15} />} required />
            </Field>
            <Field label="Confirmar contraseña" required htmlFor="confirm">
              <Input id="confirm" type="password" autoComplete="new-password"
                minLength={12} value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
            </Field>
            <label className="flex items-start gap-2 text-xs text-text-secondary mb-4">
              <input type="checkbox" checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5" required />
              <span>
                Acepto los <Link href="/terminos" target="_blank" className="underline">términos y condiciones</Link>
                {' '}y la política aplicable.
              </span>
            </label>
            {error && <p role="alert" className="text-xs text-danger mb-3">{error}</p>}
            <Button type="submit" variant="primary" loading={saving} disabled={!termsAccepted} className="w-full">
              Activar mi cuenta
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
