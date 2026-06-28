/**
 * Skeletons reutilizables para estados de carga del SGIE y la intranet.
 *
 * Sustituyen al `Spinner` centrado para reducir CLS y dar feedback estructural
 * (el usuario "ve" la forma del contenido que va a aparecer). Todos usan la
 * utilidad `.skeleton` definida en globals.css (shimmer con tokens).
 *
 * Sprint 1 — tarea 5.
 */
import { cn } from '@/lib/ui';

/** Barra base con shimmer. */
function Bar({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />;
}

/**
 * Skeleton de una tabla: cabecera + N filas con columnas configurables.
 * Refleja la estructura de las tablas de Clientes/Expedientes/Documentos.
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border-light bg-surface overflow-hidden', className)}>
      <div className="border-b border-border-light px-3 py-2.5">
        <Bar className="h-3 w-32" />
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 px-3 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="flex-1">
                <Bar className={cn('h-3', c === 0 ? 'w-3/4' : 'w-full')} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton de una lista de tarjetas (Tareas, Alertas, Agenda, Correos).
 * Refleja la estructura de lista vertical con filas tipo Card padding sm.
 */
export function ListSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border-light bg-surface p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Bar className="h-3 w-20" />
            <Bar className="h-3 w-12" />
          </div>
          <Bar className="h-4 w-2/3 mb-2" />
          <Bar className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton de una cabecera de página (PageHeader) + métricas en grid.
 * Refleja el cockpit y listados con tarjetas de señal.
 */
export function PageHeaderSkeleton({
  cards = 0,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bar className="h-5 w-40" />
          <Bar className="h-3 w-56" />
        </div>
        <Bar className="h-8 w-28 rounded-md" />
      </div>
      {cards > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border-light/50 bg-surface-alt p-3">
              <Bar className="h-3 w-20 mb-2" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton de un detalle (expediente/cliente): cabecera + grid 2 columnas de
 * bloques. Refleja la estructura del detalle de expediente y la ficha de cliente.
 */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bar className="h-5 w-48" />
          <Bar className="h-3 w-64" />
          <Bar className="h-2.5 w-72" />
        </div>
        <Bar className="h-8 w-24 rounded-md" />
      </div>
      {/* Bloque resumen */}
      <div className="rounded-lg border border-border-light bg-surface p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Bar className="h-2.5 w-16" />
              <Bar className="h-4 w-20" />
            </div>
          ))}
        </div>
        <Bar className="h-2.5 w-24 mb-1.5" />
        <Bar className="h-3 w-full" />
      </div>
      {/* Grid de dos bloques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-light bg-surface overflow-hidden">
            <div className="border-b border-border-light px-3 py-2.5">
              <Bar className="h-3 w-32" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Bar key={j} className="h-3 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
