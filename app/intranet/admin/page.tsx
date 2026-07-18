'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Briefcase, Calendar, Database, Mail, Settings, ShieldAlert, UserX, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Dashboard = {
  metrics: Record<string, number>;
  dependencies: Record<string, { status: string }>;
};

const METRICS = [
  ['activeUsers', 'Usuarios activos', Users],
  ['sgIeLawyers', 'Accesos SGIE activos', Briefcase],
  ['pendingInvitations', 'Invitaciones pendientes', Mail],
  ['expiredInvitations', 'Invitaciones expiradas', AlertTriangle],
  ['suspendedUsers', 'Usuarios suspendidos', UserX],
  ['activeCases', 'Expedientes activos', Briefcase],
  ['unassignedCases', 'Sin responsable', ShieldAlert],
  ['upcomingEvents', 'Próximos eventos', Calendar],
  ['pendingJobs', 'Trabajos pendientes', Activity],
  ['failedJobs', 'Trabajos fallidos', AlertTriangle],
  ['activeAlerts', 'Alertas operativas', ShieldAlert],
] as const;

export default function OperationalDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/operaciones')
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setData(body);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudo cargar el resumen'));
  }, []);

  if (!data && !error) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Resumen operativo</h1>
          <p className="text-sm text-text-secondary">Identidad, acceso y operación del SGIE con datos persistidos.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/intranet/admin/invitaciones"><Button variant="primary" size="sm"><Mail size={14} /> Invitar usuario</Button></Link>
          <Link href="/intranet/sgie/expedientes"><Button variant="secondary" size="sm"><Briefcase size={14} /> Expedientes</Button></Link>
        </div>
      </div>
      {error ? <Card padding="md"><p className="text-danger">{error}</p></Card> : data && <>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {METRICS.map(([key, label, Icon]) => (
            <Card key={key} padding="md">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-2xl font-extrabold text-primary">{data.metrics[key] ?? 0}</p><p className="text-xs text-text-secondary">{label}</p></div>
                <div className="w-11 h-11 rounded-lg bg-accent/15 flex items-center justify-center"><Icon size={19} className="text-primary" /></div>
              </div>
            </Card>
          ))}
        </div>
        <Card padding="md">
          <h2 className="font-bold text-primary mb-3">Dependencias operativas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['database', 'Base de datos', Database],
              ['resend', 'Resend', Mail],
              ['automations', 'Automatizaciones', Settings],
            ].map(([key, label, Icon]) => {
              const status = data.dependencies[key as string]?.status ?? 'no_verificable';
              return <div key={key as string} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Icon size={18} className="text-accent-dark" />
                <div><p className="font-semibold text-sm">{label as string}</p>
                  <Badge tone={status === 'verificado' ? 'success' : status === 'no_configurado' ? 'warning' : 'neutral'}>
                    {status.replaceAll('_', ' ')}
                  </Badge></div>
              </div>;
            })}
          </div>
          <p className="text-xs text-text-muted mt-3">“Configurado no verificado” indica presencia de configuración, no una llamada externa ni una entrega confirmada.</p>
        </Card>
      </>}
    </div>
  );
}
