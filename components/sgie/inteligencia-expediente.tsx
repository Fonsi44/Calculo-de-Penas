'use client';

/**
 * SGIE — Sección "Inteligencia del expediente" (Sprint 3, tarea 4).
 *
 * Muestra los datos IA del expediente: confianza global, documentos con su
 * confianza, campos extraídos con valor/confianza/cita/estado, e
 * inconsistencias detectadas. Sólo lectura: la IA nunca aprueba/firma/cierra.
 *
 * Sprint 3.
 */
import { useEffect, useState } from 'react';
import { BrainCircuit, ShieldCheck, FileText, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';
import {
  etiquetarConfianza, traducirEtiquetaConfianza, tonoConfianza,
  estadoCampoExtraido, valorEfectivoCampo,
} from '@/lib/sgie/inteligencia';
import { traducirEstadoDocumento } from '@/lib/sgie/estados';

interface InteligenciaData {
  confianza: { valor: number; etiqueta: string };
  documentos: Array<{
    id: string; nombreOriginal: string; tipoDocumento: string | null;
    estado: string; confianza: number; etiquetaConfianza: string;
  }>;
  campos: Array<{
    id: string; documentoId: string; clave: string; valor: string | null;
    tipo: string | null; confianza: number | null; citaFragmento: string | null;
    confirmadoPor: string | null; corregidoPor: string | null; corregidoValor: string | null;
  }>;
  inconsistencias: Array<{ clave: string; valoresDistintos: string[] }>;
  resumenIaDisponible: boolean;
}

export function InteligenciaExpediente({ expedienteId }: { expedienteId: string }) {
  const [data, setData] = useState<InteligenciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resumen, setResumen] = useState<{ disponible: boolean; resumen?: string; generadoEn?: string; motivo?: string } | null>(null);
  const [resumenGenerando, setResumenGenerando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de inteligencia
    setLoading(true);
    Promise.all([
      fetch(`/api/sgie/expedientes/${expedienteId}/inteligencia`, { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/sgie/expedientes/${expedienteId}/resumen-ia`, { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([d, r]) => {
        if (cancelado) return;
        if (d) setData(d); else setError(true);
        if (r) setResumen(r);
      })
      .catch(() => { if (!cancelado) setError(true); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [expedienteId]);

  const generarResumen = async () => {
    setResumenGenerando(true);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/resumen-ia`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const d = await res.json();
      setResumen(d);
    } finally {
      setResumenGenerando(false);
    }
  };

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-3 border-b border-border-light">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-text">Inteligencia del expediente</h2>
        </div>
        {data && (
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xxs font-semibold border', tonoConfianza(data.confianza.etiqueta))}>
            <ShieldCheck size={11} /> Confianza {data.confianza.valor} · {traducirEtiquetaConfianza(data.confianza.etiqueta)}
          </span>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : error ? (
          <p className="text-xs text-text-muted text-center py-6">No se pudo cargar la inteligencia del expediente.</p>
        ) : !data ? null : (
          <div className="space-y-4">
            {/* Resumen IA (Sprint 4) */}
            <div className="rounded-md border border-border-light p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Sparkles size={12} className="text-accent-dark" /> Resumen automático
                </h3>
                <button
                  onClick={generarResumen}
                  disabled={resumenGenerando}
                  className="inline-flex items-center gap-1 text-xxs text-info hover:underline disabled:opacity-50"
                  title="Generar o actualizar el resumen con IA"
                >
                  {resumenGenerando ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  {resumen?.disponible ? 'Regenerar' : 'Generar'}
                </button>
              </div>
              {resumenGenerando ? (
                <p className="text-xxs text-text-muted italic">Generando resumen con IA…</p>
              ) : resumen?.disponible ? (
                <>
                  <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">{resumen.resumen}</p>
                  <p className="text-xxs text-text-muted mt-2 italic">
                    Resumen generado automáticamente; requiere revisión del abogado.
                    {resumen.generadoEn && ` Generado ${new Date(resumen.generadoEn).toLocaleString('es-HN')}.`}
                  </p>
                </>
              ) : (
                <p className="text-xxs text-text-muted">
                  {resumen?.motivo === 'sin_api_key' || resumen?.motivo === 'ia_deshabilitada'
                    ? 'Resumen IA no disponible: el proveedor de IA no está configurado.'
                    : 'Sin resumen generado todavía. Pulse "Generar" para crearlo con IA.'}
                </p>
              )}
            </div>

            {/* Inconsistencias */}
            {data.inconsistencias.length > 0 && (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-2.5">
                <p className="text-xs font-semibold text-warning flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={12} /> {data.inconsistencias.length} inconsistencia(s) detectada(s)
                </p>
                <ul className="space-y-1">
                  {data.inconsistencias.map((inc, i) => (
                    <li key={i} className="text-xxs text-text-secondary">
                      <strong>{inc.clave}:</strong> {inc.valoresDistintos.join(' vs ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documentos clasificados */}
            <div>
              <h3 className="text-xs font-bold text-text mb-2 flex items-center gap-1">
                <FileText size={12} /> Documentos ({data.documentos.length})
              </h3>
              {data.documentos.length === 0 ? (
                <p className="text-xxs text-text-muted">Sin documentos clasificados.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.documentos.map((d) => {
                    const etiqueta = etiquetarConfianza(d.confianza);
                    return (
                      <li key={d.id} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 min-w-0 truncate text-text">{d.nombreOriginal}</span>
                        <span className="text-xxs text-text-muted flex-shrink-0">{d.tipoDocumento ?? '—'}</span>
                        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border flex-shrink-0', tonoConfianza(etiqueta))}>
                          {d.confianza}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Campos extraídos */}
            <div>
              <h3 className="text-xs font-bold text-text mb-2">Campos extraídos ({data.campos.length})</h3>
              {data.campos.length === 0 ? (
                <p className="text-xxs text-text-muted">Sin campos extraídos.</p>
              ) : (
                <div className="rounded-md border border-border-light overflow-hidden">
                  <table className="w-full text-xxs">
                    <thead>
                      <tr className="bg-surface-alt text-text-muted border-b border-border-light">
                        <th className="text-left p-1.5 font-semibold">Campo</th>
                        <th className="text-left p-1.5 font-semibold">Valor</th>
                        <th className="text-left p-1.5 font-semibold hidden sm:table-cell">Conf.</th>
                        <th className="text-left p-1.5 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {data.campos.map((campo) => {
                        const estado = estadoCampoExtraido(campo);
                        const valor = valorEfectivoCampo(campo);
                        const etiqueta = etiquetarConfianza(campo.confianza);
                        return (
                          <tr key={campo.id}>
                            <td className="p-1.5 text-text-secondary font-medium">{campo.clave}</td>
                            <td className="p-1.5 text-text max-w-[180px] truncate" title={valor ?? ''}>{valor ?? '—'}</td>
                            <td className="p-1.5 hidden sm:table-cell">
                              {campo.confianza !== null && (
                                <span className={cn('inline-flex items-center px-1 py-0.5 rounded text-xxs font-semibold border', tonoConfianza(etiqueta))}>
                                  {campo.confianza}
                                </span>
                              )}
                            </td>
                            <td className="p-1.5">
                              <span className={cn('text-xxs font-semibold',
                                estado === 'confirmado' ? 'text-success' :
                                estado === 'corregido' ? 'text-info' : 'text-text-muted')}>
                                {estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {data.campos.some((c) => c.citaFragmento) && (
                <p className="text-xxs text-text-muted mt-1.5 italic">
                  Las citas fuente están disponibles en el detalle de cada documento.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
