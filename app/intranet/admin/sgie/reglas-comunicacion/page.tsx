'use client';

import { useState, useMemo } from 'react';
import {
  Mail, Plus, Search, FileText, User, Clock, Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type StatusRegla = 'borrador' | 'activa' | 'desactivada' | 'archivada';

interface ReglaComunicacion {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: string;
  plantilla: string;
  status: StatusRegla;
  version: string;
  ultimaModificacion: string;
  canales: string[];
  condiciones: string[];
}

const STATUS_LABEL: Record<StatusRegla, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  desactivada: 'Desactivada',
  archivada: 'Archivada',
};

const STATUS_TONE: Record<StatusRegla, 'neutral' | 'success' | 'warning' | 'info'> = {
  borrador: 'neutral',
  activa: 'success',
  desactivada: 'warning',
  archivada: 'info',
};

const MOCK_REGLAS: ReglaComunicacion[] = [
  {
    id: 'r1',
    nombre: 'Notificar carga de documentos',
    descripcion: 'Envía un correo al cliente cuando se carga un nuevo documento en su expediente.',
    trigger: 'documento.creado',
    plantilla: 'confirmacion_carga',
    status: 'activa',
    version: '1.2.0',
    ultimaModificacion: '2026-07-10',
    canales: ['email'],
    condiciones: ['Documento no interno', 'Cliente con correo registrado'],
  },
  {
    id: 'r2',
    nombre: 'Alerta de clasificación completada',
    descripcion: 'Notifica al abogado responsable cuando la clasificación IA ha finalizado.',
    trigger: 'clasificacion.completada',
    plantilla: 'clasificacion_lista',
    status: 'activa',
    version: '1.0.0',
    ultimaModificacion: '2026-06-28',
    canales: ['email', 'notificacion_interna'],
    condiciones: ['Confianza >= 70%', 'Abogado asignado'],
  },
  {
    id: 'r3',
    nombre: 'Requerir revisión manual',
    descripcion: 'Solicita revisión manual cuando la confianza IA es baja.',
    trigger: 'clasificacion.confianza_baja',
    plantilla: 'revision_requerida',
    status: 'activa',
    version: '1.1.0',
    ultimaModificacion: '2026-07-05',
    canales: ['email', 'notificacion_interna'],
    condiciones: ['Confianza < 70%'],
  },
  {
    id: 'r4',
    nombre: 'Notificación de archivo',
    descripcion: 'Informa al cliente que su documento ha sido archivado exitosamente.',
    trigger: 'documento.archivado',
    plantilla: 'documento_archivado',
    status: 'activa',
    version: '1.0.0',
    ultimaModificacion: '2026-06-15',
    canales: ['email'],
    condiciones: ['Archivo confirmado', 'Cliente con correo registrado'],
  },
  {
    id: 'r5',
    nombre: 'Alerta de vencimiento próximo',
    descripcion: 'Notifica al abogado cuando un plazo está por vencer.',
    trigger: 'plazo.proximo_vencer',
    plantilla: 'vencimiento_proximo',
    status: 'borrador',
    version: '0.5.0',
    ultimaModificacion: '2026-07-12',
    canales: ['email', 'notificacion_interna'],
    condiciones: ['Plazo < 48 horas'],
  },
  {
    id: 'r6',
    nombre: 'Recordatorio de documentos pendientes',
    descripcion: 'Envía recordatorio al cliente si tiene documentos pendientes por más de 7 días.',
    trigger: 'documento.pendiente_7d',
    plantilla: 'recordatorio_documentos',
    status: 'desactivada',
    version: '0.9.0',
    ultimaModificacion: '2026-06-20',
    canales: ['email'],
    condiciones: ['Documentos pendientes > 7 días', 'Cliente con correo registrado'],
  },
  {
    id: 'r7',
    nombre: 'Notificación de corrección IA',
    descripcion: 'Informa al equipo de calidad cuando una corrección IA es aplicada.',
    trigger: 'correccion.aplicada',
    plantilla: 'correccion_realizada',
    status: 'archivada',
    version: '1.0.0',
    ultimaModificacion: '2026-05-01',
    canales: ['email'],
    condiciones: ['Corrección automática aplicada'],
  },
  {
    id: 'r8',
    nombre: 'Alerta de error de OCR',
    descripcion: 'Notifica al administrador cuando el OCR falla reiteradamente.',
    trigger: 'ocr.error_reiterado',
    plantilla: 'error_ocr',
    status: 'activa',
    version: '1.3.0',
    ultimaModificacion: '2026-07-14',
    canales: ['email', 'notificacion_interna'],
    condiciones: ['3+ fallos consecutivos'],
  },
];

export default function ReglasComunicacionPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_REGLAS;
    const q = search.toLowerCase();
    return MOCK_REGLAS.filter((r) =>
      r.nombre.toLowerCase().includes(q) || r.trigger.toLowerCase().includes(q) || r.plantilla.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Reglas de comunicación</h1>
          <p className="text-sm text-text-secondary mt-1">Definición de reglas que disparan notificaciones automáticas según eventos del sistema.</p>
        </div>
        <Button variant="secondary" size="sm" disabled iconLeft={<Plus size={14} />}>
          Nueva regla
        </Button>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Buscar por nombre, trigger o plantilla..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-surface pl-8 pr-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Layers size={14} />
            <span>{filtered.length} reglas</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Nombre</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Trigger</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Plantilla</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Canales</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Versión</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Estado</th>
                <th className="text-left py-2.5 px-2 text-xxs font-bold text-text-muted uppercase">Última mod.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((regla) => (
                <tr key={regla.id} className="border-b border-border-light/50 hover:bg-surface-alt/40">
                  <td className="py-3 px-2">
                    <div>
                      <p className="text-sm font-semibold text-text">{regla.nombre}</p>
                      <p className="text-xxs text-text-muted mt-0.5">{regla.descripcion}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded text-accent-dark font-mono">{regla.trigger}</code>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary font-mono">{regla.plantilla}</td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {regla.canales.map((c) => (
                        <Badge key={c} tone="neutral" size="sm">{c === 'email' ? 'Email' : c === 'notificacion_interna' ? 'Interna' : c}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary">v{regla.version}</td>
                  <td className="py-3 px-2">
                    <Badge tone={STATUS_TONE[regla.status]} size="sm">{STATUS_LABEL[regla.status]}</Badge>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-muted">{regla.ultimaModificacion}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-text-muted">No se encontraron reglas con ese criterio de búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
