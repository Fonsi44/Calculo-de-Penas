'use client';

import { useEffect, useState, useCallback } from 'react';
import { Briefcase, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

interface WorkloadData {
  activeCases: number;
  criticalCases: number;
  openTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  pendingDocuments: number;
  weightedLoad: number;
  capacity: number;
  utilization: number;
  suggestedReassignments: string[];
}

export default function CargaPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/sgie/carga', {
        method: 'POST',
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      const data = await resp.json();
      setWorkload(data);
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : 'Error al calcular carga');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetch('/api/sgie/carga', { method: 'POST' })
      .then(async r => { if (r.ok) setWorkload(await r.json()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const utilColor = workload
    ? workload.utilization > 150 ? 'text-red-600'
      : workload.utilization > 100 ? 'text-orange-600'
      : workload.utilization > 70 ? 'text-yellow-600'
      : 'text-green-600'
    : '';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase size={24} className="text-accent-dark" />
          <h1 className="text-xl font-extrabold text-primary">Carga de trabajo</h1>
        </div>
        <Button onClick={calculate} disabled={loading} size="sm">
          <RefreshCw size={14} className={cn('mr-1', loading && 'animate-spin')} />
          Recalcular
        </Button>
      </div>

      {loading && <Spinner label="Calculando carga..." />}

      {workload && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{workload.activeCases}</p>
            <p className="text-xs text-text-muted">Expedientes activos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className={cn('text-2xl font-extrabold', workload.criticalCases > 0 ? 'text-red-600' : 'text-primary')}>
              {workload.criticalCases}
            </p>
            <p className="text-xs text-text-muted">Casos críticos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{workload.openTasks}</p>
            <p className="text-xs text-text-muted">Tareas abiertas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className={cn('text-2xl font-extrabold', workload.overdueTasks > 0 ? 'text-danger' : 'text-primary')}>
              {workload.overdueTasks}
            </p>
            <p className="text-xs text-text-muted">Tareas vencidas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{workload.upcomingDeadlines}</p>
            <p className="text-xs text-text-muted">Plazos próximos (7d)</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{workload.pendingDocuments}</p>
            <p className="text-xs text-text-muted">Documentos pendientes</p>
          </Card>
          <Card className="p-4 text-center col-span-2">
            <p className={cn('text-3xl font-extrabold', utilColor)}>
              {workload.utilization}%
            </p>
            <p className="text-xs text-text-muted">Utilización</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  workload.utilization > 150 ? 'bg-red-500' : workload.utilization > 100 ? 'bg-orange-500' : workload.utilization > 70 ? 'bg-yellow-500' : 'bg-green-500',
                )}
                style={{ width: `${Math.min(workload.utilization, 200)}%` }}
              />
            </div>
          </Card>
        </div>
      )}

      {workload?.suggestedReassignments && workload.suggestedReassignments.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <p className="text-sm font-bold text-text">Recomendaciones</p>
          </div>
          <ul className="space-y-1">
            {workload.suggestedReassignments.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
