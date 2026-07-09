'use client';

/**
 * SGIE — Panel de revisión de extracción documental (Fase 3).
 *
 * Permite al asistente/abogado ver el estado de extracción de un documento,
 * el texto extraído por página, errores, confianza y si requiere OCR. Acciones:
 * reintentar extracción, marcar como revisado o marcar como requiere nuevo
 * archivo. Reutiliza el design system; no es un rediseño.
 *
 * Fuentes:
 *   - GET  /api/sgie/documentos/:id/extraccion
 *   - POST /api/sgie/documentos/:id/extraccion/reintentar
 *   - POST /api/sgie/documentos/:id/extraccion/revisar
 */
import { useCallback, useEffect, useState } from 'react';
import { FileText, RefreshCw, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

interface Pagina {
  pageNumber: number;
  text: string;
  method: string;
  confidence: number | null;
}
interface ExtraccionData {
  documento: { id: string; estado: string; tipoMime: string; nombreOriginal: string; procesadoEn: string | null };
  metodo: string | null;
  paginasDetectadas: number;
  confianza: number | null;
  ocrConfigurado: boolean;
  error: string | null;
  paginas: Pagina[];
}

function labelEstado(estado: string): { label: string; tone: string } {
  switch (estado) {
    case 'texto_extraido': return { label: 'Texto extraído', tone: 'bg-success/10 text-success border-success/20' };
    case 'clasificado': return { label: 'Clasificado', tone: 'bg-info/10 text-info border-info/20' };
    case 'aprobado': return { label: 'Revisado/Aprobado', tone: 'bg-success/10 text-success border-success/20' };
    case 'ocr_pendiente': return { label: 'Requiere OCR', tone: 'bg-warning/10 text-warning border-warning/20' };
    case 'ilegible': return { label: 'Ilegible / error', tone: 'bg-danger/10 text-danger border-danger/20' };
    case 'incorrecto': return { label: 'Requiere nuevo archivo', tone: 'bg-danger/10 text-danger border-danger/20' };
    case 'pendiente_abogado': return { label: 'Pendiente de revisión', tone: 'bg-warning/10 text-warning border-warning/20' };
    default: return { label: estado, tone: 'bg-surface-alt text-text-secondary border-border' };
  }
}

export function ExtraccionDocumento({ documentoId }: { documentoId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<ExtraccionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState<string | null>(null);
  const [paginaExpandida, setPaginaExpandida] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sgie/documentos/${documentoId}/extraccion`);
      if (res.ok) setData(await res.json());
    } catch { /* ignorar */ } finally { setLoading(false); }
  }, [documentoId]);

  /* eslint-disable react-hooks/set-state-in-effect -- carga inicial única */
  useEffect(() => { cargar(); }, [cargar]);

  async function postAccion(ruta: string, body: unknown, etiqueta: string) {
    setAccion(ruta);
    try {
      const res = await fetch(`/api/sgie/documentos/${documentoId}/extraccion/${ruta}`, {
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

  const ed = labelEstado(data.documento.estado);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Extracción documental</h3>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${ed.tone}`}>{ed.label}</span>
      </div>

      {/* Resumen */}
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div><p className="text-text-secondary text-xs uppercase">Método</p><p>{data.metodo ?? '—'}</p></div>
        <div><p className="text-text-secondary text-xs uppercase">Páginas</p><p>{data.paginasDetectadas}</p></div>
        <div><p className="text-text-secondary text-xs uppercase">Confianza</p><p>{data.confianza !== null ? `${data.confianza}%` : '—'}</p></div>
      </div>

      {/* Avisos */}
      {data.documento.estado === 'ocr_pendiente' && (
        <div className="flex items-start gap-2 p-3 rounded border border-warning/20 bg-warning/5 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p>
            El documento requiere OCR. {data.ocrConfigurado
              ? 'El proveedor OCR está configurado; reintente la extracción.'
              : 'OCR no configurado (stub). Configure OCR_PROVIDER para procesar escaneos.'}
          </p>
        </div>
      )}
      {data.error && (
        <div className="flex items-start gap-2 p-3 rounded border border-danger/20 bg-danger/5 text-sm">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-danger">{data.error}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={accion === 'reintentar'} onClick={() => postAccion('reintentar', {}, 'Extracción reencolada')}>
          <RefreshCw className="w-4 h-4 mr-1" /> Reintentar extracción
        </Button>
        <Button size="sm" variant="secondary" loading={accion === 'revisar'}
          onClick={() => postAccion('revisar', { decision: 'revisado' }, 'Documento marcado como revisado')}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar revisado
        </Button>
        <Button size="sm" variant="ghost" loading={accion === 'revisar'}
          onClick={async () => {
            const ok = await confirm({ title: 'Requiere nuevo archivo', description: 'Se marcará el documento como incorrecto.', confirmLabel: 'Marcar' });
            if (ok) await postAccion('revisar', { decision: 'requiere_nuevo_archivo' }, 'Marcado como requiere nuevo archivo');
          }}>
          Requiere nuevo archivo
        </Button>
      </div>

      {/* Texto por página */}
      <div className="space-y-1.5">
        <p className="text-text-secondary text-xs uppercase tracking-wide">Texto extraído por página</p>
        {data.paginas.length === 0 ? (
          <EmptyState title="Sin texto extraído" description="El documento no tiene texto por página todavía." />
        ) : (
          <ul className="divide-y divide-border">
            {data.paginas.map((p) => {
              const abierta = paginaExpandida === p.pageNumber;
              return (
                <li key={p.pageNumber} className="py-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm w-full text-left hover:text-primary"
                    onClick={() => setPaginaExpandida(abierta ? null : p.pageNumber)}
                  >
                    {abierta ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Página {p.pageNumber}
                    <span className="text-text-secondary text-xs">· {p.method}{p.confidence !== null ? ` · ${p.confidence}%` : ''}</span>
                  </button>
                  {abierta && (
                    <pre className="mt-1.5 ml-5 whitespace-pre-wrap text-xs text-text-secondary bg-surface-alt p-2 rounded max-h-60 overflow-auto">
                      {p.text}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
