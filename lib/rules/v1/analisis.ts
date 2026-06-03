import type { DelitoAnalizado, ResultadoConcurso } from './types';

export function generarAnalisisJuridico(
  delitos: DelitoAnalizado[],
  tipo_concurso: string,
  resultado_concurso: ResultadoConcurso,
): string {
  const lineas: string[] = [];
  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  lineas.push('='.repeat(50));
  lineas.push('ANÁLISIS JURÍDICO DEL CÁLCULO DE PENA');
  lineas.push('Código Penal de Honduras (Decreto 130-2017)');
  lineas.push('='.repeat(50));
  lineas.push(`\nFecha: ${fecha}`);
  lineas.push(`Total de delitos analizados: ${delitos.length}`);

  for (let i = 0; i < delitos.length; i++) {
    const d = delitos[i];
    lineas.push(`\n${'-'.repeat(40)}`);
    lineas.push(`DELITO ${i + 1}: ${d.nombre.toUpperCase()}`);
    lineas.push(`${'-'.repeat(40)}`);
    lineas.push(`Artículo: ${d.articulo}`);
    lineas.push(`Clasificación: ${d.clasificacion}`);
    lineas.push(`Pena base: ${d.pena_base_texto}`);
    lineas.push(`Gravedad: ${d.gravedad || 'No determinada'}`);
    lineas.push(`Pena recomendada: ${d.pena_recomendada_texto || d.pena_individual_texto}`);
    lineas.push(`Grado de autoría: ${d.grado_autoria}`);
    lineas.push(`Grado de ejecución: ${d.grado_ejecucion}`);

    if (d.modificaciones?.length) {
      lineas.push('\nModificaciones aplicadas:');
      for (const mod of d.modificaciones) {
        lineas.push(`  → ${mod}`);
      }
    }

    if (d.agravantes_aplicadas?.length) {
      lineas.push(`\nAgravantes (Art. 32 CP): ${d.agravantes_aplicadas.join(', ')}`);
    }
    if (d.atenuantes_aplicadas?.length) {
      lineas.push(`Atenuantes (Art. 31 CP): ${d.atenuantes_aplicadas.join(', ')}`);
    }

    lineas.push(`\n★ PENA INDIVIDUAL: ${d.pena_individual_texto}`);

    if (d.penas_accesorias?.length) {
      lineas.push(`\nPenas accesorias: ${d.penas_accesorias.join(', ')}`);
    }
  }

  if (delitos.length > 1 && tipo_concurso !== 'ninguno') {
    lineas.push(`\n${'='.repeat(50)}`);
    lineas.push('CONCURSO DE DELITOS');
    lineas.push(`${'='.repeat(50)}`);
    lineas.push(`Tipo: ${tipo_concurso.toUpperCase()}`);
    lineas.push(`Base legal: ${resultado_concurso.articulo}`);
    lineas.push(`Efecto: ${resultado_concurso.descripcion}`);
  }

  return lineas.join('\n');
}
