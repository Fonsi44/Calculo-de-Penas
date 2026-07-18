'use client';

import { useState, useMemo } from 'react';
import {
  Activity, AlertTriangle, Clock, Users, Database, Mail, Briefcase,
  FileText, ShieldAlert, UserX, UserCheck, UserPlus, HardDrive,
  RefreshCw, Server, FileSearch, Eye, Bot, XCircle, CheckCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/ui';

interface GrupoMetricas {
  titulo: string;
  descripcion: string;
  items: { label: string; valor: string | number; icon: typeof Activity; tone?: string }[];
}

const MOCK_INCIDENCIAS: GrupoMetricas = {
  titulo: 'Incidencias',
  descripcion: 'Fallos y bloqueos activos en el sistema',
  items: [
    { label: 'Jobs DLQ', valor: 3, icon: Activity, tone: 'danger' },
    { label: 'Documentos atascados', valor: 7, icon: FileText, tone: 'warning' },
    { label: 'Outbox fallidos', valor: 12, icon: Mail, tone: 'danger' },
    { label: 'Rebotes de correo', valor: 5, icon: XCircle, tone: 'warning' },
    { label: 'OCR/IA fallidos', valor: 2, icon: Bot, tone: 'danger' },
    { label: 'Expedientes sin responsable', valor: 14, icon: UserX, tone: 'warning' },
  ],
};

const MOCK_RIESGO: GrupoMetricas = {
  titulo: 'Riesgo',
  descripcion: 'Vencimientos y SLA críticos',
  items: [
    { label: 'Vence en 24h', valor: 8, icon: Clock, tone: 'danger' },
    { label: 'Vence en 48h', valor: 15, icon: Clock, tone: 'warning' },
    { label: 'Vence en 72h', valor: 22, icon: Clock, tone: 'warning' },
    { label: 'SLA incumplido', valor: 4, icon: AlertTriangle, tone: 'danger' },
    { label: 'Bloqueos', valor: 6, icon: ShieldAlert, tone: 'danger' },
    { label: 'Espera cliente', valor: 18, icon: Eye, tone: 'warning' },
  ],
};

const MOCK_PERSONAS: GrupoMetricas = {
  titulo: 'Personas',
  descripcion: 'Usuarios y equipos del sistema',
  items: [
    { label: 'Total usuarios', valor: 48, icon: Users, tone: 'info' },
    { label: 'SGIE activos', valor: 32, icon: UserCheck, tone: 'success' },
    { label: 'Suspendidos', valor: 3, icon: UserX, tone: 'danger' },
    { label: 'Invitaciones pendientes', valor: 7, icon: UserPlus, tone: 'warning' },
    { label: 'Equipos', valor: 12, icon: Briefcase, tone: 'info' },
  ],
};

const MOCK_AUTOMATIZACION: GrupoMetricas = {
  titulo: 'Automatización',
  descripcion: 'Estado de procesos automatizados',
  items: [
    { label: 'Jobs pendientes', valor: 24, icon: Activity, tone: 'warning' },
    { label: 'Outbox pendientes', valor: 9, icon: Mail, tone: 'warning' },
    { label: 'OCR realizados (hoy)', valor: 43, icon: FileSearch, tone: 'success' },
    { label: 'IA realizados (hoy)', valor: 28, icon: Bot, tone: 'success' },
    { label: 'Comunicaciones enviadas', valor: 156, icon: Mail, tone: 'info' },
    { label: 'Errores (24h)', valor: 6, icon: XCircle, tone: 'danger' },
  ],
};

interface SaludItem {
  label: string;
  ok: boolean;
  icon: typeof Database;
}

const MOCK_SALUD: SaludItem[] = [
  { label: 'Base de datos', ok: true, icon: Database },
  { label: 'Blob Storage', ok: true, icon: HardDrive },
  { label: 'Worker', ok: true, icon: Server },
  { label: 'Cron', ok: true, icon: Clock },
  { label: 'Resend', ok: false, icon: Mail },
  { label: 'OCR', ok: true, icon: FileSearch },
  { label: 'IA', ok: true, icon: Bot },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const grupos = useMemo(() => [
    { key: 'incidencias', data: MOCK_INCIDENCIAS, border: 'border-danger/20' },
    { key: 'riesgo', data: MOCK_RIESGO, border: 'border-warning/20' },
    { key: 'personas', data: MOCK_PERSONAS, border: 'border-info/20' },
    { key: 'automatizacion', data: MOCK_AUTOMATIZACION, border: 'border-accent/20' },
  ], []);

  const TONE_BG: Record<string, string> = {
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Dashboard administrativo</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw size={14} /> Refrescar
        </Button>
      </div>

      {error ? (
        <Card padding="md"><p className="text-danger font-semibold">{error}</p></Card>
      ) : (
        <>
          {/* Grupos de métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grupos.map(({ key, data, border }) => (
              <Card key={key} padding="md">
                <CardHeader title={data.titulo} subtitle={data.descripcion} />
                {data.items.length === 0 ? (
                  <EmptyState icon={<Activity size={24} />} title="Sin datos" description="No hay métricas disponibles." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.items.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border-light p-3 transition-colors hover:border-border">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <item.icon size={14} className="text-text-secondary" />
                          <span className={cn('text-xs font-bold', item.tone ? TONE_BG[item.tone]?.split(' ')[0] : '')}>
                            {item.valor}
                          </span>
                        </div>
                        <p className="text-xxs text-text-secondary leading-tight">{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Salud del sistema */}
          <Card padding="md">
            <CardHeader
              title="Salud del sistema"
              subtitle="Estado actual de servicios y dependencias"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {MOCK_SALUD.length === 0 ? (
                <div className="col-span-full text-center py-6 text-xs text-text-muted">Sin información de salud.</div>
              ) : (
                MOCK_SALUD.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border-light p-3">
                    <div className={cn('w-3 h-3 rounded-full', s.ok ? 'bg-success' : 'bg-danger')} />
                    <s.icon size={16} className="text-text-secondary" />
                    <span className="text-xxs text-text-secondary text-center">{s.label}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
