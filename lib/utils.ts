export function meses_a_texto(meses: number): string {
  if (meses <= 0) return '0 meses';
  if (meses >= 480) return 'Prisión perpetua';

  const años = Math.floor(meses / 12);
  const meses_restantes = meses % 12;

  if (años > 0 && meses_restantes > 0) {
    return `${años} año${años !== 1 ? 's' : ''} y ${meses_restantes} mes${meses_restantes !== 1 ? 'es' : ''}`;
  } else if (años > 0) {
    return `${años} año${años !== 1 ? 's' : ''}`;
  } else {
    return `${meses_restantes} mes${meses_restantes !== 1 ? 'es' : ''}`;
  }
}

export function reducir_grado(minimo: number, maximo: number, grados: number = 1): [number, number] {
  for (let i = 0; i < grados; i++) {
    const nuevo_max = minimo;
    const nuevo_min = Math.max(1, Math.floor(minimo / 2));
    minimo = nuevo_min;
    maximo = nuevo_max;
  }
  return [minimo, maximo];
}

export function aumentar_grado(minimo: number, maximo: number, grados: number = 1): [number, number] {
  for (let i = 0; i < grados; i++) {
    const nuevo_min = maximo;
    const nuevo_max = Math.min(480, Math.floor(maximo + (maximo - minimo) / 2));
    minimo = nuevo_min;
    maximo = nuevo_max;
  }
  return [minimo, maximo];
}

export function aplicar_mitad_superior(minimo: number, maximo: number): [number, number] {
  const punto_medio = Math.floor((minimo + maximo) / 2);
  return [punto_medio, maximo];
}

export function aplicar_mitad_inferior(minimo: number, maximo: number): [number, number] {
  const punto_medio = Math.floor((minimo + maximo) / 2);
  return [minimo, punto_medio];
}
