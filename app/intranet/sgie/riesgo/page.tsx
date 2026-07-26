'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

interface RiskData {
  riskLevel: string;
  score: number;
  reasons: string[];
  blockingFactors: string[];
  dataQuality: number;
  confidence: number;
  suggestedActions: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  low: <AlertTriangle size={14} className="text-green-600" />,
  medium: <AlertTriangle size={14} className="text-yellow-600" />,
  high: <ShieldAlert size={14} className="text-orange-600" />,
  critical: <ShieldAlert size={14} className="text-red-600" />,
  unknown: <AlertTriangle size={14} className="text-gray-400" />,
};

export default function RiesgoPage() {
  const toast = useToast();
  const [expedienteId, setExpedienteId] = useState('');
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(false);

  const evaluate = useCallback(async (persist = false) => {
    if (!expedienteId.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/sgie/riesgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expedienteId: expedienteId.trim(), persist }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      const data = await resp.json();
      setRisk(data);
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : 'Error al evaluar riesgo');
    } finally {
      setLoading(false);
    }
  }, [expedienteId, toast]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert size={24} className="text-accent-dark" />
        <h1 className="text-xl font-extrabold text-primary">Evaluación de riesgo</h1>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            value={expedienteId}
            onChange={(e) => setExpedienteId(e.target.value)}
            placeholder="ID del expediente (UUID)"
            className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <Button onClick={() => evaluate(false)} disabled={loading || !expedienteId.trim()}>
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            Evaluar
          </Button>
          <Button onClick={() => evaluate(true)} disabled={loading || !expedienteId.trim()} variant="secondary">
            Evaluar y guardar
          </Button>
        </div>
      </Card>

      {loading && <Spinner label="Evaluando riesgo..." />}

      {risk && !loading && (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {LEVEL_ICONS[risk.riskLevel]}
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', LEVEL_COLORS[risk.riskLevel])}>
                  {risk.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-muted">Score: <strong>{risk.score}/100</strong></span>
                <span className="text-text-muted">Data quality: <strong>{risk.dataQuality}%</strong></span>
                <span className="text-text-muted">Confianza: <strong>{risk.confidence}%</strong></span>
              </div>
            </div>

            {risk.reasons.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Factores de riesgo</p>
                <ul className="space-y-1">
                  {risk.reasons.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {risk.blockingFactors.length > 0 && (
              <div>
                <p className="text-xs font-bold text-danger mb-1.5 uppercase tracking-wider">Factores bloqueantes</p>
                <ul className="space-y-1">
                  {risk.blockingFactors.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-danger">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {risk.suggestedActions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Acciones sugeridas</p>
                <ul className="space-y-1">
                  {risk.suggestedActions.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
