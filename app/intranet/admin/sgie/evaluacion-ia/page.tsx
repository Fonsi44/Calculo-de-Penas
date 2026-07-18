'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain, Search, ChevronDown, ChevronUp, CheckCircle,
  Clock, DollarSign, TrendingUp, AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface EvaluacionItem {
  id: string;
  taskType: string;
  modelo: string;
  confianza: number;
  tokens: number;
  coste: number;
  latencia: number;
  status: string;
  documento: string;
  fecha: string;
  detalle: string;
}

interface SummaryData {
  total: number;
  completados: number;
  avgConf: number;
  totalTokens: number;
  avgLat: number;
}

const TASK_TYPE_LABEL: Record<string, string> = {
  clasificacion: 'Clasificación',
  extraccion: 'Extracción',
  resumen: 'Resumen',
  correccion: 'Corrección',
};

const STATUS_TONE: Record<string, 'success' | 'danger' | 'warning'> = {
  exitoso: 'success',
  fallido: 'danger',
  corregido: 'warning',
};

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-surface border border-border-light rounded-lg p-4">
      <div className="flex items-center gap-2 text-text-muted mb-1.5">
        {icon}
        <span className="text-xxs">{label}</span>
      </div>
      <p className="text-lg font-extrabold text-primary">{value}</p>
    </div>
  );
}

export default function EvaluacionIaPage() {
  const [items, setItems] = useState<EvaluacionItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/evaluacion-ia?limit=200');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const json = await res.json() as { items?: EvaluacionItem[]; summary?: SummaryData };
        if (!cancelled) {
          setItems(json.items ?? []);
          setSummary(json.summary ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar evaluaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!filterStatus) return items;
    return items.filter((i) => i.status === filterStatus);
  }, [items, filterStatus]);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;
  if (!summary) return <div className="p-8 text-center text-text-muted">Sin datos disponibles</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Evaluación de IA</h1>
        <p className="text-sm text-text-secondary mt-1">Rendimiento, precisión y costes de las tareas ejecutadas por modelos de IA.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryCard icon={<Brain size={16} />} label="Total tareas" value={summary.total} />
        <SummaryCard icon={<CheckCircle size={16} />} label="Completadas" value={summary.completados} />
        <SummaryCard icon={<TrendingUp size={16} />} label="Confianza promedio" value={`${summary.avgConf.toFixed(1)}%`} />
        <SummaryCard icon={<DollarSign size={16} />} label="Tokens totales" value={summary.totalTokens.toLocaleString()} />
        <SummaryCard icon={<Clock size={16} />} label="Latencia promedio" value={`${summary.avgLat.toFixed(1)}s`} />
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-primary">Filtros</h2>
        </div>
        <div className="flex gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none">
            <option value="">Todos los estados</option>
            <option value="exitoso">Exitoso</option>
            <option value="fallido">Fallido</option>
            <option value="corregido">Corregido</option>
          </select>
        </div>
      </Card>

      <Card padding="md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Tipo</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Modelo</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Confianza</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Tokens</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Coste</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Latencia</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Estado</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Documento</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Fecha</th>
                <th className="w-8 py-2.5 px-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="border-b border-border-light/50 hover:bg-surface-alt/40 cursor-pointer"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                    <td className="py-2.5 px-2 text-xs"><Badge tone="info" size="sm">{TASK_TYPE_LABEL[item.taskType] || item.taskType}</Badge></td>
                    <td className="py-2.5 px-2 text-xs text-text font-semibold">{item.modelo}</td>
                    <td className="py-2.5 px-2 text-xs text-text">{item.confianza.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-xs text-text">{item.tokens.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-xs text-text">${item.coste.toFixed(3)}</td>
                    <td className="py-2.5 px-2 text-xs text-text">{item.latencia.toFixed(1)}s</td>
                    <td className="py-2.5 px-2"><Badge tone={STATUS_TONE[item.status] ?? 'neutral'} size="sm">{item.status}</Badge></td>
                    <td className="py-2.5 px-2 text-xs text-text-muted font-mono">{item.documento}</td>
                    <td className="py-2.5 px-2 text-xs text-text-muted">{item.fecha}</td>
                    <td className="py-2.5 px-2">{expanded === item.id ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}</td>
                  </tr>
                  {expanded === item.id && (
                    <tr key={`${item.id}-detail`}>
                      <td colSpan={10} className="py-3 px-4 bg-surface-alt/30">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={14} className="text-info flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-text mb-1">Detalle de ejecución</p>
                            <p className="text-xs text-text-secondary">{item.detalle || 'Sin detalle disponible'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-text-muted">No se encontraron registros con los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
