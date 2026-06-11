import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export type EstadoDelito = 'verificado' | 'pendiente_revision' | 'rechazado';

export interface EntradaEstado {
  nombre: string;
  articulo: string;
  estado: EstadoDelito;
  nota: string | null;
  articulo_sugerido: string | null;
}

interface EstadosFile {
  generado_en: string;
  fuente: string;
  total_registros: number;
  verificados: number;
  pendientes_revision: number;
  rechazados: number;
  entradas: Record<string, EntradaEstado>;
}

function load(): EstadosFile {
  const p = join(process.cwd(), 'data', 'delitos-estados.json');
  if (!existsSync(p)) {
    return {
      generado_en: '', fuente: '', total_registros: 0,
      verificados: 0, pendientes_revision: 0, rechazados: 0, entradas: {},
    };
  }
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as EstadosFile;
  } catch {
    return {
      generado_en: '', fuente: '', total_registros: 0,
      verificados: 0, pendientes_revision: 0, rechazados: 0, entradas: {},
    };
  }
}

export function getEstadoDelito(nombre: string, articulo: string): EntradaEstado {
  const file = load();
  const key = `${nombre}__${articulo}`;
  if (file.entradas[key]) return file.entradas[key];
  return {
    nombre, articulo,
    estado: 'verificado',
    nota: 'No indexado en validación; tratado como verificado por defecto.',
    articulo_sugerido: null,
  };
}

export function getResumenEstados(): { verificados: number; pendientes_revision: number; rechazados: number; total: number; generado_en: string } {
  const file = load();
  return {
    verificados: file.verificados,
    pendientes_revision: file.pendientes_revision,
    rechazados: file.rechazados,
    total: file.total_registros,
    generado_en: file.generado_en,
  };
}
