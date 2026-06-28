/**
 * SGIE — Tiempo medio por estado de expedientes (Sprint 5, tarea 4).
 *
 * Reconstruye intervalos por estado desde el `historial_expediente` (que ya
 * tiene estadoAnterior/estadoNuevo/creadoEn). Funciones puras, testeables sin DB.
 *
 * El estado actual de un expediente "sigue activo" hasta ahora (no hay evento
 * de fin); se usa `ahora` como límite superior del último intervalo abierto.
 *
 * Sprint 5.
 */

export interface EventoHistorial {
  estadoAnterior: string | null;
  estadoNuevo: string;
  creadoEn: string | Date;
}

export interface IntervaloEstado {
  estado: string;
  inicio: Date;
  fin: Date;
  duracionMs: number;
}

export interface EstadisticaEstado {
  estado: string;
  /** Duración media en milisegundos. */
  mediaMs: number;
  mediaHoras: number;
  mediaDias: number;
  /** Número de intervalos considerados. */
  muestras: number;
}

/**
 * Reconstruye los intervalos de estado de un expediente a partir de su
 * historial ordenado cronológicamente.
 *
 * El primer evento suele ser (null → 'creado'); el intervalo 'creado' va desde
 * ese momento hasta el siguiente cambio. El último estado permanece "abierto"
 * hasta `ahora`.
 *
 * Función pura.
 */
export function reconstruirIntervalos(eventos: EventoHistorial[], ahora: Date = new Date()): IntervaloEstado[] {
  if (eventos.length === 0) return [];
  const ordenados = [...eventos].sort((a, b) => ts(a.creadoEn) - ts(b.creadoEn));
  const intervalos: IntervaloEstado[] = [];

  for (let i = 0; i < ordenados.length; i++) {
    const ev = ordenados[i];
    const estado = ev.estadoNuevo;
    const inicio = new Date(ev.creadoEn);
    // El fin es el siguiente evento, o `ahora` si es el último.
    const fin = i < ordenados.length - 1 ? new Date(ordenados[i + 1].creadoEn) : ahora;
    const duracionMs = fin.getTime() - inicio.getTime();
    // Ignorar intervalos negativos (reloj desordenado o datos corruptos).
    if (duracionMs >= 0) {
      intervalos.push({ estado, inicio, fin, duracionMs });
    }
  }

  return intervalos;
}

function ts(d: string | Date): number {
  return new Date(d).getTime();
}

/**
 * Agrega intervalos de múltiples expedientes por estado y calcula la duración
 * media. Estados con 0 muestras se omiten.
 *
 * Función pura.
 */
export function calcularTiempoMedioPorEstado(intervalos: IntervaloEstado[]): EstadisticaEstado[] {
  const porEstado = new Map<string, number[]>();
  for (const iv of intervalos) {
    if (!porEstado.has(iv.estado)) porEstado.set(iv.estado, []);
    porEstado.get(iv.estado)!.push(iv.duracionMs);
  }

  const out: EstadisticaEstado[] = [];
  for (const [estado, duraciones] of porEstado) {
    const muestras = duraciones.length;
    if (muestras === 0) continue;
    const suma = duraciones.reduce((a, b) => a + b, 0);
    const mediaMs = suma / muestras;
    out.push({
      estado,
      mediaMs,
      mediaHoras: mediaMs / (1000 * 60 * 60),
      mediaDias: mediaMs / (1000 * 60 * 60 * 24),
      muestras,
    });
  }

  // Ordenar por duración media descendente (mayor cuello de botella primero).
  return out.sort((a, b) => b.mediaMs - a.mediaMs);
}

/**
 * Identifica cuellos de botella: estados con tiempo medio superior al percentil
 * 75 o a un umbral configurable (en días). Devuelve los estados que superan.
 *
 * Función pura.
 */
export function identificarCuellosBotella(estadisticas: EstadisticaEstado[], umbralDias = 7): EstadisticaEstado[] {
  if (estadisticas.length === 0) return [];
  const umbMs = umbralDias * 24 * 60 * 60 * 1000;
  return estadisticas.filter((e) => e.mediaMs > umbMs);
}

/** Formatea una duración media de forma legible (ej. "3,5 días", "12 h", "45 min"). */
export function formatDuracion(mediaMs: number): string {
  if (mediaMs <= 0) return '—';
  const dias = mediaMs / (1000 * 60 * 60 * 24);
  const horas = mediaMs / (1000 * 60 * 60);
  const min = mediaMs / (1000 * 60);
  if (dias >= 1) return `${dias.toFixed(1)} días`;
  if (horas >= 1) return `${horas.toFixed(0)} h`;
  return `${min.toFixed(0)} min`;
}
