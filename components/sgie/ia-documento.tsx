'use client';

/**
 * SGIE — Panel de revisión IA documental (Fase 4).
 *
 * Muestra el resultado del análisis IA de un documento: tipo sugerido, campos
 * extraídos (con cita fuente), score compuesto, checks pass/warn/fail, estado
 * sugerido (prevalidado/advertencia/revision/corrección) y resumen. Acciones
 * de revisión humana: reintentar IA, aceptar, enviar a asistente/abogado,
 * pedir corrección, ignorar. Reutiliza el design system; sin rediseño.
 *
 * La IA NUNCA aprueba jurídicamente: toda decisión humana queda auditada y no
 * cierra el expediente.
 *
 * Fuentes:
 *   - GET  /api/sgie/documentos/:id/ia
 *   - POST /api/sgie/documentos/:id/ia/reintentar
 *   - POST /api/sgie/documentos/:id/ia/revision
 */
import { useCallback, useEffect, useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

interface RunIA {
  id: string;
  proveedor: string | null;
  modelo: string | null;
  exito: boolean | null;
  error: string | null;
  duracionMs: number | null;
  suggestedStatus: string | null;
  totalConfidence: number | null;
  runStatus: string | null;
  creadoEn: string | null;
}
interface CampoIA {
  clave: string;
  valor: string | null;
  tipo: string | null;
  confianza: number | null;
  citaFragmento: string | null;
}
interface CheckIA {
  reglaId: string;
  resultado: string;
  severidad: string;
  mensaje: string | null;
}
interface IaData {
  documento: { id: string; estado: string; tipoDocumento: string | null };
  iaConfigurada: boolean;
  iaResumen: string | null;
  iaScore: number | null;
  iaSuggestedStatus: string | null;
  runs: RunIA[];
  campos: CampoIA[];
  checks: CheckIA[];
}

function labelSuggested(s?: string | null): { label: string; tone: string } {
  switch (s) {
    case 'prevalidado': return { label: 'Prevalidado', tone: 'bg-success/10 text-success border-success/20' };
    case 'aceptado_con_advertencia': return { label: 'Aceptado con advertencia', tone: 'bg-info/10 text-info border-info/20' };
    case 'revision_asistente': return { label: 'Revisión asistente', tone: 'bg-warning/10 text-warning border-warning/20' };
    case 'revision_abogado': return { label: 'Revisión abogado', tone: 'bg-warning/10 text-warning border-warning/20' };
    case 'correccion_cliente': return { label: 'Corrección cliente', tone: 'bg-danger/10 text-danger border-danger/20' };
    case 'rechazado': return { label: 'Rechazado', tone: 'bg-danger/10 text-danger border-danger/20' };
    default: return { label: 'Sin sugerencia', tone: 'bg-surface-alt text-text-secondary border-border' };
  }
}

function iconCheck(resultado: string) {
  if (resultado === 'pass') return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (resultado === 'warn') return <AlertTriangle className="w-4 h-4 text-warning" />;
  if (resultado === 'fail') return <XCircle className="w-4 h-4 text-danger" />;
  return <HelpCircle className="w-4 h-4 text-text-secondary" />;
}

export function IaDocumento({ documentoId }: { documentoId: string }) {
  const toast = useToast();
  const [data, setData] = useState<IaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sgie/documentos/${documentoId}/ia`);
      if (res.ok) setData(await res.json());
    } catch { /* ignorar */ } finally { setLoading(false); }
  }, [documentoId]);

  /* eslint-disable react-hooks/set-state-in-effect -- carga inicial única */
  useEffect(() => { cargar(); }, [cargar]);

  async function postAccion(ruta: string, body: unknown, etiqueta: string) {
    setAccion(ruta);
    try {
      const res = await fetch(`/api/sgie/documentos/${documentoId}/ia/${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.danger(json.error ?? 'Error'); return; }
      toast.success(etiqueta);
      await cargar();
    } catch { toast.danger('Error'); } finally { setAccion(null); }
  }

  if (loading) return <Card className="p-4"><ListSkeleton rows={3} /></Card>;
  if (!data) return null;

  const ultRun = data.runs[0];
  const sug = labelSuggested(data.iaSuggestedStatus ?? ultRun?.suggestedStatus);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Análisis IA</h3>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${sug.tone}`}>{sug.label}</span>
      </div>

      {!data.iaConfigurada && (
        <div className="flex items-start gap-2 p-3 rounded border border-warning/20 bg-warning/5 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p>IA no configurada. Configure <code className="text-xs">IA_DOCUMENTAL_*</code> para activar el análisis con DeepSeek.</p>
        </div>
      )}

      {/* Resumen IA */}
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div><p className="text-text-secondary text-xs uppercase">Score</p><p>{data.iaScore !== null ? `${data.iaScore}/100` : '—'}</p></div>
        <div><p className="text-text-secondary text-xs uppercase">Tipo doc.</p><p>{data.documento.tipoDocumento ?? '—'}</p></div>
        <div><p className="text-text-secondary text-xs uppercase">Runs</p><p>{data.runs.length}</p></div>
      </div>

      {data.iaResumen && (
        <div className="text-sm">
          <p className="text-text-secondary text-xs uppercase mb-1">Resumen IA</p>
          <p className="text-text">{data.iaResumen}</p>
        </div>
      )}

      {/* Checks */}
      {data.checks.length > 0 && (
        <div className="space-y-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Verificación documento-expediente</p>
          <ul className="space-y-1">
            {data.checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {iconCheck(c.resultado)}
                <span className="flex-1">{c.mensaje ?? c.reglaId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Campos extraídos */}
      {data.campos.length > 0 && (
        <div className="space-y-1">
          <p className="text-text-secondary text-xs uppercase tracking-wide">Campos extraídos ({data.campos.length})</p>
          <ul className="divide-y divide-border">
            {data.campos.map((c, i) => (
              <li key={i} className="py-1.5 grid grid-cols-[1fr_auto] gap-2 text-sm">
                <div>
                  <p className="font-medium">{c.clave}: <span className="text-text">{c.valor ?? '—'}</span></p>
                  {c.citaFragmento && <p className="text-xs text-text-secondary italic">“{c.citaFragmento.slice(0, 120)}”</p>}
                </div>
                {c.confianza !== null && <span className="text-xs text-text-secondary">{c.confianza}%</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.campos.length === 0 && data.checks.length === 0 && (
        <EmptyState title="Sin análisis IA" description="El documento aún no ha sido analizado o la IA no está configurada." />
      )}

      {/* Acciones de revisión humana */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={accion === 'reintentar'} onClick={() => postAccion('reintentar', {}, 'Análisis IA reencolado')}>
          <RefreshCw className="w-4 h-4 mr-1" /> Reintentar IA
        </Button>
        <Button size="sm" variant="secondary" loading={accion === 'revision'} onClick={() => postAccion('revision', { decision: 'aceptar' }, 'Sugerencia aceptada')}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Aceptar
        </Button>
        <Button size="sm" variant="secondary" loading={accion === 'revision'} onClick={() => postAccion('revision', { decision: 'asistente' }, 'Enviado a asistente')}>
          Asistente
        </Button>
        <Button size="sm" variant="secondary" loading={accion === 'revision'} onClick={() => postAccion('revision', { decision: 'abogado' }, 'Enviado a abogado')}>
          Abogado
        </Button>
        <Button size="sm" variant="ghost" loading={accion === 'revision'} onClick={() => postAccion('revision', { decision: 'correccion' }, 'Corrección solicitada al cliente')}>
          Pedir corrección
        </Button>
        <Button size="sm" variant="ghost" loading={accion === 'revision'} onClick={() => postAccion('revision', { decision: 'ignorar' }, 'Sugerencia ignorada')}>
          Ignorar
        </Button>
      </div>
    </Card>
  );
}
