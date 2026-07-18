'use client';

import { useState } from 'react';
import {
  Play, AlertTriangle, CheckCircle, XCircle, ArrowRight, ArrowLeft,
  ListOrdered, FileText, Mail, GitBranch, Ban, Repeat, Info, Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Procedimiento {
  id: string;
  nombre: string;
  version: string;
}

interface Fase {
  id: string;
  nombre: string;
  orden: number;
  requisitos: string[];
  duracionEstimada: string;
}

interface TareaSimulada {
  id: string;
  nombre: string;
  fase: string;
  responsable: string;
}

interface Comunicacion {
  id: string;
  tipo: string;
  origen: string;
  destino: string;
  plantilla: string;
}

interface Transicion {
  id: string;
  desde: string;
  hacia: string;
  condicion: string;
}

interface Bloqueo {
  id: string;
  fase: string;
  razon: string;
  criticidad: 'alto' | 'medio' | 'bajo';
}

interface ResultadoSimulacion {
  procedimiento: string;
  version: string;
  duracionTotal: string;
  fases: Fase[];
  tareas: TareaSimulada[];
  comunicaciones: Comunicacion[];
  transiciones: Transicion[];
  bloqueos: Bloqueo[];
  loops: string[];
}

const MOCK_PROCEDIMIENTOS: Procedimiento[] = [
  { id: 'proc-1', nombre: 'Revisión documental', version: '2.1.0' },
  { id: 'proc-2', nombre: 'Gestión de expedientes', version: '1.5.0' },
  { id: 'proc-3', nombre: 'Clasificación asistida por IA', version: '1.0.0' },
  { id: 'proc-4', nombre: 'Notificaciones electrónicas', version: '0.9.0' },
];

const MOCK_RESULTADO: ResultadoSimulacion = {
  procedimiento: 'Revisión documental',
  version: '2.1.0',
  duracionTotal: '45 min estimados',
  fases: [
    { id: 'f1', nombre: 'Carga de documentos', orden: 1, requisitos: ['Documento en formato PDF', 'OCR completado', 'Firma digital válida'], duracionEstimada: '5 min' },
    { id: 'f2', nombre: 'Clasificación automática', orden: 2, requisitos: ['Metadatos extraídos', 'Área jurídica identificada'], duracionEstimada: '3 min' },
    { id: 'f3', nombre: 'Revisión de clasificación', orden: 3, requisitos: ['Usuario abogado autenticado', 'Clasificación previa generada'], duracionEstimada: '15 min' },
    { id: 'f4', nombre: 'Validación de metadatos', orden: 4, requisitos: ['Campos obligatorios completos', 'Coherencia con tipo documental'], duracionEstimada: '5 min' },
    { id: 'f5', nombre: 'Archivo y notificación', orden: 5, requisitos: ['Almacenamiento confirmado', 'Destinatario disponible'], duracionEstimada: '2 min' },
    { id: 'f6', nombre: 'Cierre', orden: 6, requisitos: ['Acta de cierre generada', 'Trazabilidad completa'], duracionEstimada: '1 min' },
  ],
  tareas: [
    { id: 't1', nombre: 'Subir documento al sistema', fase: 'Carga de documentos', responsable: 'Sistema' },
    { id: 't2', nombre: 'Ejecutar OCR', fase: 'Carga de documentos', responsable: 'Sistema' },
    { id: 't3', nombre: 'Clasificar por tipo documental', fase: 'Clasificación automática', responsable: 'Motor IA' },
    { id: 't4', nombre: 'Revisar y corregir clasificación', fase: 'Revisión de clasificación', responsable: 'Abogado' },
    { id: 't5', nombre: 'Validar metadatos', fase: 'Validación de metadatos', responsable: 'Sistema' },
    { id: 't6', nombre: 'Enviar notificación', fase: 'Archivo y notificación', responsable: 'Sistema' },
    { id: 't7', nombre: 'Cerrar expediente', fase: 'Cierre', responsable: 'Abogado' },
  ],
  comunicaciones: [
    { id: 'c1', tipo: 'Email', origen: 'Carga de documentos', destino: 'Cliente', plantilla: 'confirmacion_carga' },
    { id: 'c2', tipo: 'Email', origen: 'Clasificación automática', destino: 'Abogado', plantilla: 'clasificacion_completada' },
    { id: 'c3', tipo: 'Notificación', origen: 'Archivo y notificación', destino: 'Cliente', plantilla: 'documento_archivado' },
  ],
  transiciones: [
    { id: 'tr1', desde: 'Carga de documentos', hacia: 'Clasificación automática', condicion: 'OCR exitoso y firma válida' },
    { id: 'tr2', desde: 'Clasificación automática', hacia: 'Revisión de clasificación', condicion: 'Confianza IA >= 70%' },
    { id: 'tr3', desde: 'Revisión de clasificación', hacia: 'Validación de metadatos', condicion: 'Aprobación del abogado' },
    { id: 'tr4', desde: 'Validación de metadatos', hacia: 'Archivo y notificación', condicion: 'Metadatos válidos' },
    { id: 'tr5', desde: 'Archivo y notificación', hacia: 'Cierre', condicion: 'Notificación enviada exitosamente' },
  ],
  bloqueos: [
    { id: 'b1', fase: 'Carga de documentos', razon: 'OCR falla en documentos escaneados de baja calidad', criticidad: 'alto' },
    { id: 'b2', fase: 'Revisión de clasificación', razon: 'Confianza IA < 70% requiere revisión manual completa', criticidad: 'medio' },
    { id: 'b3', fase: 'Archivo y notificación', razon: 'Destinatario sin correo electrónico registrado', criticidad: 'bajo' },
  ],
  loops: [
    'Revisión de clasificación → Validación de metadatos (si metadatos inválidos, retorna a revisión)',
    'Validación de metadatos → Revisión de clasificación (hasta 3 reintentos)',
  ],
};

export default function SimuladorPage() {
  const [selected, setSelected] = useState('');
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);
  const [simulando, setSimulando] = useState(false);

  const procedimiento = MOCK_PROCEDIMIENTOS.find((p) => p.id === selected);

  function handleSimular() {
    if (!selected) return;
    setSimulando(true);
    setTimeout(() => {
      setResultado(MOCK_RESULTADO);
      setSimulando(false);
    }, 1200);
  }

  function handleReiniciar() {
    setResultado(null);
    setSelected('');
  }

  const BLOQUEO_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
    alto: 'danger',
    medio: 'warning',
    bajo: 'neutral',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Simulador de flujo de trabajo</h1>
        <p className="text-sm text-text-secondary mt-1">Ejecute una simulación para validar el comportamiento del procedimiento antes de desplegarlo.</p>
      </div>

      <Card padding="md" tone="warning">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">Esta es una simulación. No se escriben datos ni se ejecutan acciones reales. Los resultados son ilustrativos basados en la configuración actual del procedimiento.</p>
        </div>
      </Card>

      {!resultado ? (
        <Card padding="md">
          <div className="max-w-md">
            <label htmlFor="procedimiento" className="block text-sm font-semibold text-text mb-2">Procedimiento / Versión</label>
            <select
              id="procedimiento"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            >
              <option value="">Seleccione un procedimiento...</option>
              {MOCK_PROCEDIMIENTOS.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} (v{p.version})</option>
              ))}
            </select>
            <div className="mt-4">
              <Button onClick={handleSimular} disabled={!selected || simulando} loading={simulando} iconLeft={<Play size={14} />}>
                Simular
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Resultados para <span className="font-bold text-text">{resultado.procedimiento}</span> v{resultado.version} — <span className="text-accent-dark font-semibold">{resultado.duracionTotal}</span>
            </p>
            <Button variant="tertiary" size="sm" onClick={handleReiniciar}>Nueva simulación</Button>
          </div>

          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-accent-dark" />
              <h2 className="text-sm font-bold text-primary">Línea de tiempo de fases</h2>
            </div>
            <ol className="relative border-s border-border-light ml-3 space-y-6">
              {resultado.fases.map((fase, i) => (
                <li key={fase.id} className="ms-5">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-dark">
                    {fase.orden}
                  </span>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">{fase.nombre}</p>
                    <span className="text-xxs text-text-muted">{fase.duracionEstimada}</span>
                  </div>
                  {fase.requisitos.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {fase.requisitos.map((req) => (
                        <Badge key={req} tone="info" size="sm">{req}</Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-accent-dark" />
                <h2 className="text-sm font-bold text-primary">Tareas generadas ({resultado.tareas.length})</h2>
              </div>
              <div className="space-y-2">
                {resultado.tareas.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border-light bg-surface-alt/30">
                    <CheckCircle size={14} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-text">{t.nombre}</p>
                      <p className="text-xxs text-text-muted">Fase: {t.fase} · Responsable: {t.responsable}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={16} className="text-accent-dark" />
                <h2 className="text-sm font-bold text-primary">Comunicaciones ({resultado.comunicaciones.length})</h2>
              </div>
              <div className="space-y-2">
                {resultado.comunicaciones.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border-light bg-surface-alt/30">
                    <Mail size={14} className="text-info flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-text">{c.tipo} → {c.destino}</p>
                      <p className="text-xxs text-text-muted">Origen: {c.origen} · Plantilla: {c.plantilla}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch size={16} className="text-accent-dark" />
                <h2 className="text-sm font-bold text-primary">Transiciones ({resultado.transiciones.length})</h2>
              </div>
              <div className="space-y-2">
                {resultado.transiciones.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border-light bg-surface-alt/30 text-sm">
                    <span className="font-semibold text-text">{t.desde}</span>
                    <ArrowRight size={12} className="text-text-muted flex-shrink-0" />
                    <span className="font-semibold text-text">{t.hacia}</span>
                    <span className="text-xxs text-text-muted ml-auto">Condición: {t.condicion}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Ban size={16} className="text-danger" />
                <h2 className="text-sm font-bold text-primary">Bloqueos detectados ({resultado.bloqueos.length})</h2>
              </div>
              <div className="space-y-2">
                {resultado.bloqueos.map((b) => (
                  <div key={b.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border-light bg-surface-alt/30">
                    <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 text-${b.criticidad === 'alto' ? 'danger' : b.criticidad === 'medio' ? 'warning' : 'text-muted'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text">Fase: {b.fase}</p>
                        <Badge tone={BLOQUEO_TONE[b.criticidad]} size="sm">{b.criticidad}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{b.razon}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {resultado.loops.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Repeat size={16} className="text-warning" />
                <h2 className="text-sm font-bold text-primary">Loops detectados ({resultado.loops.length})</h2>
              </div>
              <div className="space-y-2">
                {resultado.loops.map((loop, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-border-light bg-warning/5">
                    <Repeat size={14} className="text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-text">{loop}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
