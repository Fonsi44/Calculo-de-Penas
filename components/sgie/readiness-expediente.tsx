'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ThumbsUp, ArrowLeft, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

interface Check {
  id: string; checkName: string; status: string; source: string; blocking: boolean | null; reason: string | null;
}
interface Readiness {
  id: string; estadoFinal: string; score: number | null; checksTotal: number; checksPass: number; checksWarn: number; checksFail: number; createdAt: string; checks: Check[];
}

function iconCheck(s: string) {
  if (s === 'pass') return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (s === 'warn') return <AlertTriangle className="w-4 h-4 text-warning" />;
  if (s === 'fail') return <XCircle className="w-4 h-4 text-danger" />;
  return <HelpCircle className="w-4 h-4 text-text-secondary" />;
}
function labelEstadoFinal(e: string) {
  switch (e) {
    case 'listo_para_revision': return { label: 'Listo para revisión', tone: 'bg-success/10 text-success border-success/20' };
    case 'preparado_con_advertencias': return { label: 'Preparado con advertencias', tone: 'bg-warning/10 text-warning border-warning/20' };
    case 'no_preparado': return { label: 'No preparado', tone: 'bg-danger/10 text-danger border-danger/20' };
    case 'bloqueado_por_cliente': return { label: 'Bloqueado por cliente', tone: 'bg-surface-alt text-text-secondary border-border' };
    case 'requiere_accion_abogado': return { label: 'Requiere acción del abogado', tone: 'bg-danger/10 text-danger border-danger/20' };
    default: return { label: e, tone: 'bg-surface-alt text-text-secondary border-border' };
  }
}

export function ReadinessExpediente({ expedienteId }: { expedienteId: string }) {
  const toast = useToast();
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState<string | null>(null);

  const cargar = useCallback(async () => { setLoading(true); try { const r = await fetch(`/api/sgie/expedientes/${expedienteId}/readiness`); if (r.ok) { const j = await r.json(); setData(j.readiness ?? null); } } catch {} finally { setLoading(false); } }, [expedienteId]);
  useEffect(() => { cargar(); }, [cargar]); // eslint-disable-line react-hooks/set-state-in-effect -- carga inicial única

  async function postAccion(ruta: string, body: unknown, etq: string) {
    setAccion(ruta);
    try {
      const r = await fetch(`/api/sgie/expedientes/${expedienteId}/readiness/${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { toast.danger(j.error ?? 'Error'); return; }
      toast.success(etq); await cargar();
    } catch { toast.danger('Error'); } finally { setAccion(null); }
  }

  if (loading) return <Card className="p-4"><ListSkeleton rows={3} /></Card>;
  if (!data) return <Card className="p-4"><EmptyState title="Sin evaluación" description="La preparación no se ha calculado aún." /></Card>;

  const ef = labelEstadoFinal(data.estadoFinal);
  const checks = data.checks ?? [];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /><h3 className="font-semibold">Preparación documental</h3></div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${ef.tone}`}>{ef.label}</span>
      </div>
      <div className="grid sm:grid-cols-4 gap-3 text-sm">
        <div><p className="text-text-secondary text-xs uppercase">Score</p><p>{data.score ?? 0}/100</p></div>
        <div className="flex gap-2"><span className="text-success text-xs">{data.checksPass} ✓</span><span className="text-warning text-xs">{data.checksWarn} ⚠</span><span className="text-danger text-xs">{data.checksFail} ✗</span></div>
        <div><p className="text-text-secondary text-xs uppercase">Total</p><p>{data.checksTotal} checks</p></div>
        <div><Button size="sm" variant="ghost" loading={accion === 'recalcular'} onClick={() => postAccion('recalcular', {}, 'Readiness recalculado')}><RefreshCw className="w-4 h-4" /></Button></div>
      </div>
      <div className="space-y-1"><p className="text-text-secondary text-xs uppercase tracking-wide">Checks</p>
        {checks.length === 0 ? <EmptyState title="Sin checks" /> : (
          <ul className="space-y-1">{checks.map((c) => (<li key={c.id} className="flex items-start gap-2 text-sm">{iconCheck(c.status)}<span className="flex-1">{c.reason ?? c.checkName}</span><span className="text-xs text-text-secondary">{c.source}</span></li>))}</ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={accion === 'aprobar'} onClick={() => postAccion('aprobar', {}, 'Revisión documental aprobada')}><ThumbsUp className="w-4 h-4 mr-1" /> Aprobar revisión</Button>
        <Button size="sm" variant="secondary" loading={accion === 'devolver'} onClick={() => postAccion('devolver', { motivo: 'Documentación pendiente' }, 'Expediente devuelto')}><ArrowLeft className="w-4 h-4 mr-1" /> Devolver</Button>
        <Button size="sm" variant="ghost" loading={accion === 'pedir-info'} onClick={() => postAccion('pedir-info', {}, 'Solicitud enviada al cliente')}><Mail className="w-4 h-4 mr-1" /> Pedir información</Button>
      </div>
    </Card>
  );
}
