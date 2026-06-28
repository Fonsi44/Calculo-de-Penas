/**
 * SGIE — utilidades de exportación CSV (Sprint 2, tarea 2).
 *
 * Generación nativa de CSV (RFC 4180) sin dependencias externas. Funciones
 * puras, testeables. Usado por el endpoint de reportes para descarga directa.
 *
 * Convenio:
 *  - Separador: coma.
 *  - Cualquier valor con coma, comilla o salto de línea → entrecomillado doble.
 *  - Comillas internas → escapadas con doble comilla ("").
 *  - BOM UTF-8 opcional para correcta apertura en Excel.
 */

/** Escapa un valor escalar para CSV según RFC 4180. */
export function escaparCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  const s = typeof valor === 'string' ? valor : String(valor);
  // Si contiene coma, comilla, salto de línea o retorno → entrecomillar.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Genera una cadena CSV a partir de filas de objetos, usando `columnas` para
 * fijar el orden y las cabeceras.
 *
 * @param filas      Array de objetos a exportar.
 * @param columnas   Pares clave/etiqueta. `clave` es el path en el objeto;
 *                   `etiqueta` es la cabecera de la columna.
 */
export interface ColumnaCsv {
  clave: string;
  etiqueta: string;
}

export function generarCsv(
  filas: Array<Record<string, unknown>>,
  columnas: ColumnaCsv[],
): string {
  const cabecera = columnas.map((c) => escaparCelda(c.etiqueta)).join(',');
  const cuerpo = filas.map((fila) =>
    columnas
      .map((c) => escaparCelda(obtenerValor(fila, c.clave)))
      .join(','),
  );
  return [cabecera, ...cuerpo].join('\r\n');
}

/** Obtiene un valor por path simple (soporta `a.b.c`). */
function obtenerValor(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Añade BOM UTF-8 para que Excel detecte la codificación correctamente
 * (acentos, eñes). Usar al construir el body de la respuesta de descarga.
 */
export function conBom(csv: string): string {
  return '\uFEFF' + csv;
}

/**
 * Sugiere un nombre de archivo con timestamp para la descarga.
 */
export function nombreArchivoExport(prefix: string, ext = 'csv'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  // Sólo [a-z0-9-] para evitar problemas de filename.
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safePrefix || 'export'}_${ts}.${ext}`;
}
