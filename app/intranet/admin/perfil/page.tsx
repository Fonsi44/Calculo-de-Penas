'use client';

import { useState } from 'react';
import { Save, Lock, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/app/auth-context';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminPerfilPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [cpForm, setCpForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpForm.newPassword !== cpForm.confirmPassword) { toast.danger('Las contraseñas no coinciden'); return; }
    if (cpForm.newPassword.length < 6) { toast.danger('La contraseña debe tener al menos 6 caracteres'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: cpForm.currentPassword, newPassword: cpForm.newPassword }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Contraseña actualizada correctamente');
      setCpForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <PageHeader title="Perfil" subtitle="Gestiona tu cuenta y credenciales" />

      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center">
            <User size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-text">{user?.nombre ?? '—'}</p>
            <p className="text-xs text-text-secondary">{user?.email ?? '—'}</p>
            <Badge tone="warning" className="mt-1">{user?.rol ?? '—'}</Badge>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <h2 className="font-bold text-sm text-primary mb-3 flex items-center gap-2"><Lock size={14} /> Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Contraseña actual</label>
            <Input type="password" value={cpForm.currentPassword} onChange={e => setCpForm(f => ({ ...f, currentPassword: e.target.value }))} required placeholder="••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Nueva contraseña</label>
            <Input type="password" value={cpForm.newPassword} onChange={e => setCpForm(f => ({ ...f, newPassword: e.target.value }))} required placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Confirmar nueva contraseña</label>
            <Input type="password" value={cpForm.confirmPassword} onChange={e => setCpForm(f => ({ ...f, confirmPassword: e.target.value }))} required placeholder="Repite la contraseña" />
          </div>
          <Button type="submit" variant="primary" size="sm" loading={saving}><Save size={14} /> Actualizar contraseña</Button>
        </form>
      </Card>
    </div>
  );
}