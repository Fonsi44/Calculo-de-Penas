'use client';

import { useState, useMemo } from 'react';
import {
  Brain, Search, ChevronDown, ChevronUp, CheckCircle, XCircle,
  Clock, DollarSign, TrendingUp, AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TaskType = 'clasificacion' | 'extraccion' | 'resumen' | 'correccion';
type Modelo = 'gpt-4' | 'deepseek-v3' | 'claude-3' | 'mistral-large';
type Status = 'exitoso' | 'fallido' | 'corregido';

interface EvaluacionItem {
  id: string;
  taskType: TaskType;
  modelo: Modelo;
  confianza: number;
  tokens: number;
  coste: number;
  latencia: number;
  status: Status;
  documento: string;
  fecha: string;
  detalle: string;
}

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  clasificacion: 'Clasificación',
  extraccion: 'Extracción',
  resumen: 'Resumen',
  correccion: 'Corrección',
};

const STATUS_LABEL: Record<Status, string> = {
  exitoso: 'Exitoso',
  fallido: 'Fallido',
  corregido: 'Corregido',
};

const STATUS_TONE: Record<Status, 'success' | 'danger' | 'warning'> = {
  exitoso: 'success',
  fallido: 'danger',
  corregido: 'warning',
};

const MOCK_EVALUACION: EvaluacionItem[] = [
  { id: 'e1', taskType: 'clasificacion', modelo: 'gpt-4', confianza: 94.2, tokens: 1240, coste: 0.031, latencia: 2.1, status: 'exitoso', documento: 'escritura_001.pdf', fecha: '2026-07-18', detalle: 'Clasificación correcta. Tipo: Escritura Pública. Subtipo: Compraventa. Confianza alta en todas las categorías.' },
  { id: 'e2', taskType: 'extraccion', modelo: 'deepseek-v3', confianza: 87.5, tokens: 3400, coste: 0.085, latencia: 3.4, status: 'exitoso', documento: 'contrato_arrendamiento.pdf', fecha: '2026-07-18', detalle: 'Extracción completa. Partes: 2 de 3 identificadas. Fechas correctas. Monto: Q15,000.00.' },
  { id: 'e3', taskType: 'clasificacion', modelo: 'claude-3', confianza: 62.1, tokens: 980, coste: 0.024, latencia: 1.8, status: 'fallido', documento: 'dictamen_legal.pdf', fecha: '2026-07-17', detalle: 'Confianza baja (62.1%). No se pudo determinar el tipo documental con certeza. Requiere revisión manual.' },
  { id: 'e4', taskType: 'resumen', modelo: 'gpt-4', confianza: 91.8, tokens: 2100, coste: 0.052, latencia: 2.8, status: 'exitoso', documento: 'sentencia_045.pdf', fecha: '2026-07-17', detalle: 'Resumen generado: 3 párrafos. Hechos clave identificados. Fallo correctamente resumido.' },
  { id: 'e5', taskType: 'correccion', modelo: 'deepseek-v3', confianza: 78.3, tokens: 890, coste: 0.022, latencia: 1.5, status: 'corregido', documento: 'informe_pericial.pdf', fecha: '2026-07-16', detalle: 'Corrección aplicada: 3 errores ortográficos, 1 inconsistencia numérica. Revisado y aprobado.' },
  { id: 'e6', taskType: 'extraccion', modelo: 'mistral-large', confianza: 95.0, tokens: 2800, coste: 0.070, latencia: 2.9, status: 'exitoso', documento: 'poder_especial.pdf', fecha: '2026-07-16', detalle: 'Extracción exitosa. Otorgante y apoderado identificados. Facultades: 5 de 5 extraídas.' },
  { id: 'e7', taskType: 'clasificacion', modelo: 'deepseek-v3', confianza: 88.4, tokens: 1100, coste: 0.028, latencia: 2.2, status: 'exitoso', documento: 'demanda_003.pdf', fecha: '2026-07-15', detalle: 'Clasificación: Demanda. Materia: Civil. Juzgado competente identificado.' },
  { id: 'e8', taskType: 'resumen', modelo: 'claude-3', confianza: 73.6, tokens: 1900, coste: 0.048, latencia: 2.5, status: 'corregido', documento: 'contrato_sociedad.pdf', fecha: '2026-07-15', detalle: 'Resumen corregido. Se añadieron cláusulas relevantes omitidas por el modelo.' },
  { id: 'e9', taskType: 'extraccion', modelo: 'gpt-4', confianza: 96.3, tokens: 3100, coste: 0.078, latencia: 3.1, status: 'exitoso', documento: 'testamento_002.pdf', fecha: '2026-07-14', detalle: 'Extracción completa. Herederos: 4. Bienes: 7. Albacea designado.' },
  { id: 'e10', taskType: 'correccion', modelo: 'mistral-large', confianza: 82.7, tokens: 650, coste: 0.016, latencia: 1.2, status: 'exitoso', documento: 'certificado_050.pdf', fecha: '2026-07-14', detalle: 'Corrección automática aplicada sin revisión humana necesaria.' },
  { id: 'e11', taskType: 'clasificacion', modelo: 'gpt-4', confianza: 45.2, tokens: 1020, coste: 0.026, latencia: 1.9, status: 'fallido', documento: 'documento_ilegible.pdf', fecha: '2026-07-13', detalle: 'Documento ilegible. OCR no pudo extraer texto suficiente para clasificación.' },
  { id: 'e12', taskType: 'extraccion', modelo: 'deepseek-v3', confianza: 91.2, tokens: 3600, coste: 0.090, latencia: 3.6, status: 'exitoso', documento: 'escritura_005.pdf', fecha: '2026-07-13', detalle: 'Extracción exitosa. Comparecientes: 2. Datos registrales completos.' },
];

const MODELOS: Modelo[] = ['gpt-4', 'deepseek-v3', 'claude-3', 'mistral-large'];
const TASK_TYPES: TaskType[] = ['clasificacion', 'extraccion', 'resumen', 'correccion'];

export default function EvaluacionIaPage() {
  const [filterTask, setFilterTask] = useState<TaskType | ''>('');
  const [filterModelo, setFilterModelo] = useState<Modelo | ''>('');
  const [filterStatus, setFilterStatus] = useState<Status | ''>('');
  const [filterConfMin, setFilterConfMin] = useState('');
  const [filterConfMax, setFilterConfMax] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK_EVALUACION.filter((item) => {
      if (filterTask && item.taskType !== filterTask) return false;
      if (filterModelo && item.modelo !== filterModelo) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterConfMin && item.confianza < parseFloat(filterConfMin)) return false;
      if (filterConfMax && item.confianza > parseFloat(filterConfMax)) return false;
      if (filterDateStart && item.fecha < filterDateStart) return false;
      if (filterDateEnd && item.fecha > filterDateEnd) return false;
      return true;
    });
  }, [filterTask, filterModelo, filterStatus, filterConfMin, filterConfMax, filterDateStart, filterDateEnd]);

  const summary = useMemo(() => {
    const total = MOCK_EVALUACION.length;
    const completed = MOCK_EVALUACION.filter((i) => i.status === 'exitoso').length;
    const avgConf = MOCK_EVALUACION.reduce((s, i) => s + i.confianza, 0) / total;
    const totalTokens = MOCK_EVALUACION.reduce((s, i) => s + i.tokens, 0);
    const avgLat = MOCK_EVALUACION.reduce((s, i) => s + i.latencia, 0) / total;
    return { total, completed, avgConf, totalTokens, avgLat };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Evaluación de IA</h1>
        <p className="text-sm text-text-secondary mt-1">Rendimiento, precisión y costes de las tareas ejecutadas por modelos de IA.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryCard icon={<Brain size={16} />} label="Total tareas" value={summary.total} />
        <SummaryCard icon={<CheckCircle size={16} />} label="Completadas" value={summary.completed} />
        <SummaryCard icon={<TrendingUp size={16} />} label="Confianza promedio" value={`${summary.avgConf.toFixed(1)}%`} />
        <SummaryCard icon={<DollarSign size={16} />} label="Tokens totales" value={summary.totalTokens.toLocaleString()} />
        <SummaryCard icon={<Clock size={16} />} label="Latencia promedio" value={`${summary.avgLat.toFixed(1)}s`} />
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-primary">Filtros</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <select value={filterTask} onChange={(e) => setFilterTask(e.target.value as TaskType | '')}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="">Tipo</option>
            {TASK_TYPES.map((t) => <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>)}
          </select>
          <select value={filterModelo} onChange={(e) => setFilterModelo(e.target.value as Modelo | '')}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="">Modelo</option>
            {MODELOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | '')}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="">Estado</option>
            {(['exitoso', 'fallido', 'corregido'] as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <input type="number" placeholder="Conf min" value={filterConfMin} onChange={(e) => setFilterConfMin(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <input type="number" placeholder="Conf max" value={filterConfMax} onChange={(e) => setFilterConfMax(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)}
            className="rounded-lg border border-border-light bg-surface px-2.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40" />
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
                <>
                  <tr key={item.id} className="border-b border-border-light/50 hover:bg-surface-alt/40 cursor-pointer"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                    <td className="py-2.5 px-2 text-xs text-text"><Badge tone="info" size="sm">{TASK_TYPE_LABEL[item.taskType]}</Badge></td>
                    <td className="py-2.5 px-2 text-xs text-text font-semibold">{item.modelo}</td>
                    <td className="py-2.5 px-2 text-xs text-text">{item.confianza}%</td>
                    <td className="py-2.5 px-2 text-xs text-text">{item.tokens.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-xs text-text">${item.coste.toFixed(3)}</td>
                    <td className="py-2.5 px-2 text-xs text-text">{item.latencia}s</td>
                    <td className="py-2.5 px-2"><Badge tone={STATUS_TONE[item.status]} size="sm">{STATUS_LABEL[item.status]}</Badge></td>
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
                            <p className="text-xs text-text-secondary">{item.detalle}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
