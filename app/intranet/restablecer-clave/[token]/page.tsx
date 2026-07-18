'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'form' | 'done'>('form');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo cambiar la contraseña');
      setStatus('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  }

  return <main className="min-h-screen bg-background flex items-center justify-center p-4">
    <Card padding="lg" className="w-full max-w-md">
      <div className="w-11 h-11 rounded-lg bg-primary text-accent flex items-center justify-center mb-4"><KeyRound size={20} /></div>
      <h1 className="text-xl font-extrabold text-primary mb-1">Restablecer contraseña</h1>
      {status === 'done' ? <div className="space-y-4">
        <p className="text-sm text-text-secondary">Contraseña actualizada y sesiones anteriores revocadas.</p>
        <Link href="/intranet/login"><Button variant="primary">Iniciar sesión</Button></Link>
      </div> : <form onSubmit={submit} className="mt-4">
        <Field label="Nueva contraseña" required hint="Mínimo 12 caracteres.">
          <Input type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Field>
        <Field label="Confirmar contraseña" required>
          <Input type="password" minLength={12} value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
        </Field>
        {error && <p role="alert" className="text-xs text-danger mb-3">{error}</p>}
        <Button type="submit" variant="primary" loading={saving} className="w-full">Guardar contraseña</Button>
      </form>}
    </Card>
  </main>;
}
