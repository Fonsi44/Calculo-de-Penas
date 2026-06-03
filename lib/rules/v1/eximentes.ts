export interface ResultadoEximente {
  aplica: boolean;
  modificaciones: string[];
}

export function evaluarEximenteCompleta(eximente_completa: string | null): ResultadoEximente {
  if (eximente_completa) {
    return {
      aplica: true,
      modificaciones: ['Eximente completa aplicada - EXENTO (Art. 30 CP)'],
    };
  }
  return { aplica: false, modificaciones: [] };
}
