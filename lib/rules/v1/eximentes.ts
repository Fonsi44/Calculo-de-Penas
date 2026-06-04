import { EXIMENTES } from '../../catalogos';

export interface ResultadoEximente {
  aplica: boolean;
  modificaciones: string[];
}

export function evaluarEximenteCompleta(eximente_completa: string | null): ResultadoEximente {
  if (eximente_completa) {
    const ex = EXIMENTES.find((e) => e.id === eximente_completa);
    if (!ex) {
      return { aplica: false, modificaciones: [] };
    }
    return {
      aplica: true,
      modificaciones: [`Eximente completa aplicada (${ex.articulo ?? 'Art. 30 CP'}): EXENTO`],
    };
  }
  return { aplica: false, modificaciones: [] };
}
