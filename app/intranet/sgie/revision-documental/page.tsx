'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText, ShieldAlert, ScanLine, FileWarning,
  Ban, Copy, XCircle, AlertTriangle, FileCheck, CheckCircle,
  RotateCcw, Eye, ThumbsUp, FileX, RefreshCw,
  ArrowLeft, Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/app/auth-context';
import { cn } from '@/lib/ui';

type FiltroRevision = 'baja_confianza' | 'ocr_insuficiente' | 'clasificacion_dudosa' | 'contradiccion' | 'ilegible' | 'duplicado' | 'rechazado' | 'error_tecnico' | null;

interface DocumentoRevision {
  id: string;
  nombre: string;
  expedienteId: string;
  numeroInterno: string;
  requisito: string;
  cliente: string;
  estado: string;
  confianza: number;
  fecha: string;
  tipoError: string;
}

const FILTROS: { key: FiltroRevision; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'baja_confianza', label: 'Baja confianza', icon: ShieldAlert },
  { key: 'ocr_insuficiente', label: 'OCR insuficiente', icon: ScanLine },
  { key: 'clasificacion_dudosa', label: 'Clasificación dudosa', icon: FileWarning },
  { key: 'contradiccion', label: 'Contradicción', icon: AlertTriangle },
  { key: 'ilegible', label: 'Ilegible', icon: Ban },
  { key: 'duplicado', label: 'Duplicado', icon: Copy },
  { key: 'rechazado', label: 'Rechazado', icon: XCircle },
  { key: 'error_tecnico', label: 'Error técnico', icon: AlertTriangle },
];

const MOCK_DOCS: DocumentoRevision[] = [
  { id: 'd1', nombre: 'Escritura de compraventa.pdf', expedienteId: 'exp-1', numeroInterno: 'EXP-2026-0042', requisito: 'Escritura pública', cliente: 'Carlos Mendoza', estado: 'pendiente', confianza: 45, fecha: '2026-07-18T10:30:00Z', tipoError: 'baja_confianza' },
  { id: 'd2', nombre: 'Certificado de libertad.jpg', expedienteId: 'exp-2', numeroInterno: 'EXP-2026-0038', requisito: 'Certificado registro', cliente: 'María López', estado: 'pendiente', confianza: 30, fecha: '2026-07-17T14:00:00Z', tipoError: 'ocr_insuficiente' },
  { id: 'd3', nombre: 'Poder especial.png', expedienteId: 'exp-3', numeroInterno: 'EXP-2026-0051', requisito: 'Poder', cliente: 'Juan Pérez', estado: 'pendiente', confianza: 55, fecha: '2026-07-16T09:15:00Z', tipoError: 'clasificacion_dudosa' },
  { id: 'd4', nombre: 'Identidad_cliente.pdf', expedienteId: 'exp-4', numeroInterno: 'EXP-2026-0029', requisito: 'Documento identidad', cliente: 'Ana Rodríguez', estado: 'pendiente', confianza: 20, fecha: '2026-07-15T11:45:00Z', tipoError: 'ilegible' },
  { id: 'd5', nombre: 'Recibo_pago.png', expedienteId: 'exp-5', numeroInterno: 'EXP-2026-0015', requisito: 'Comprobante pago', cliente: 'Pedro García', estado: 'pendiente', confianza: 88, fecha: '2026-07-14T16:30:00Z', tipoError: 'duplicado' },
  { id: 'd6', nombre: 'Contrato_arrendamiento.pdf', expedienteId: 'exp-6', numeroInterno: 'EXP-2026-0012', requisito: 'Contrato', cliente: 'Luis Hernández', estado: 'rechazado', confianza: 15, fecha: '2026-07-13T08:00:00Z', tipoError: 'rechazado' },
  { id: 'd7', nombre: 'Acta_matrimonio.pdf', expedienteId: 'exp-7', numeroInterno: 'EXP-2026-0023', requisito: 'Acta', cliente: 'Sofía Torres', estado: 'pendiente', confianza: 0, fecha: '2026-07-12T13:20:00Z', tipoError: 'error_tecnico' },
];

function formatFecha(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function labelTipoError(tipo: string): string {
  const m: Record<string, string> = {
    baja_confianza: 'Baja confianza', ocr_insuficiente: 'OCR insuficiente',
    clasificacion_dudosa: 'Clasif. dudosa', contradiccion: 'Contradicción',
    ilegible: 'Ilegible', duplicado: 'Duplicado', rechazado: 'Rechazado', error_tecnico: 'Error técnico',
  };
  return m[tipo] || tipo;
}

function toneConfianza(confianza: number): string {
  if (confianza >= 80) return 'bg-success/10 text-success border-success/20';
  if (confianza >= 50) return 'bg-warning/10 text-warning border-warning/20';
  if (confianza > 0) return 'bg-danger/10 text-danger border-danger/20';
  return 'bg-surface-alt text-text-muted border-border';
}

export default function RevisionDocumentalPage() {
  const { user, loading: authLoading } = useAuth();
  const [filtroActivo, setFiltroActivo] = useState<FiltroRevision>(null);
  const [accionId, setAccionId] = useState<string | null>(null);

  if (authLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;
  }

  const filtrados = filtroActivo
    ? MOCK_DOCS.filter((d) => d.tipoError === filtroActivo)
    : MOCK_DOCS;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Revisión documental</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {MOCK_DOCS.length} documentos requieren revisión
            {filtroActivo ? ` · ${labelTipoError(filtroActivo)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltroActivo(null)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xxs font-semibold border transition-colors',
            !filtroActivo
              ? 'bg-accent/15 text-accent-dark border-accent/30'
              : 'bg-surface text-text-secondary border-border-light hover:bg-surface-alt',
          )}
        >
          <Search size={12} /> Todos
        </button>
        {FILTROS.map((f) => {
          const active = filtroActivo === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltroActivo(active ? null : f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xxs font-semibold border transition-colors',
                active
                  ? 'bg-accent/15 text-accent-dark border-accent/30'
                  : 'bg-surface text-text-secondary border-border-light hover:bg-surface-alt',
              )}
            >
              <f.icon size={12} /> {f.label}
            </button>
          );
        })}
      </div>

      {filtrados.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<FileCheck size={28} />}
            title="Sin documentos pendientes"
            description={filtroActivo ? `No hay documentos con filtro "${labelTipoError(filtroActivo)}".` : 'Todos los documentos han sido revisados.'}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto bg-surface border border-border-light rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light text-left bg-surface-alt/50">
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Documento</th>
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Expediente</th>
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Requisito</th>
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Motivo</th>
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Confianza</th>
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Fecha</th>
                <th className="py-2.5 px-3 font-semibold text-text-secondary text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filtrados.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-alt/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-text-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-text truncate max-w-[200px]" title={doc.nombre}>
                          {doc.nombre}
                        </p>
                        <p className="text-xxs text-text-muted">{doc.cliente}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Link href={`/intranet/sgie/expedientes/${doc.expedienteId}`}
                      className="text-primary font-mono text-xs hover:underline">
                      {doc.numeroInterno}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-text-secondary">{doc.requisito}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border',
                      doc.tipoError === 'ilegible' || doc.tipoError === 'rechazado' || doc.tipoError === 'error_tecnico'
                        ? 'bg-danger/10 text-danger border-danger/20'
                        : doc.tipoError === 'baja_confianza' || doc.tipoError === 'ocr_insuficiente'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-accent/10 text-accent-dark border-accent/20',
                    )}>
                      {labelTipoError(doc.tipoError)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold border', toneConfianza(doc.confianza))}>
                      {doc.confianza > 0 ? `${doc.confianza}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-text-muted">{formatFecha(doc.fecha)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAccionId(`aprobar-${doc.id}`)}
                        disabled={accionId === `aprobar-${doc.id}`}
                        className="p-1.5 rounded-md hover:bg-success/10 text-success hover:text-success transition-colors disabled:opacity-50"
                        title="Aprobar documento"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => setAccionId(`rechazar-${doc.id}`)}
                        disabled={accionId === `rechazar-${doc.id}`}
                        className="p-1.5 rounded-md hover:bg-danger/10 text-danger hover:text-danger transition-colors disabled:opacity-50"
                        title="Rechazar documento"
                      >
                        <FileX size={14} />
                      </button>
                      <button
                        onClick={() => setAccionId(`reemplazar-${doc.id}`)}
                        disabled={accionId === `reemplazar-${doc.id}`}
                        className="p-1.5 rounded-md hover:bg-accent/10 text-accent-dark hover:text-accent-dark transition-colors disabled:opacity-50"
                        title="Solicitar reemplazo"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => setAccionId(`reintentar-${doc.id}`)}
                        disabled={accionId === `reintentar-${doc.id}`}
                        className="p-1.5 rounded-md hover:bg-info/10 text-info transition-colors disabled:opacity-50"
                        title="Reintentar OCR/IA"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-surface-alt text-text-secondary hover:text-text transition-colors"
                        title="Vista previa"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <ArrowLeft size={12} /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}
