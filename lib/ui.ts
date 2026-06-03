export function cn(...args: Array<unknown>): string {
  return args.filter((a): a is string | number => Boolean(a) || a === 0 || a === '').map(String).join(' ');
}

export function pluralizar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function formatFechaCorta(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatFechaCompleta(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatFechaHora(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMeses(meses: number): string {
  if (!Number.isFinite(meses) || meses < 0) return '0 meses';
  const anos = Math.floor(meses / 12);
  const m = meses % 12;
  if (anos === 0) return pluralizar(m, 'mes', 'meses');
  if (m === 0) return pluralizar(anos, 'año', 'años');
  return `${pluralizar(anos, 'año', 'años')} y ${pluralizar(m, 'mes', 'meses')}`;
}

export function formatRangoPena(min: number, max: number): string {
  return `${formatMeses(min)} - ${formatMeses(max)}`;
}

export function truncar(texto: string, n: number): string {
  if (!texto) return '';
  return texto.length > n ? texto.slice(0, n - 1).trimEnd() + '…' : texto;
}

export function claseEstado(estado: string): string {
  const map: Record<string, string> = {
    completado: 'badge-mitigation',
    archivado: 'badge-neutral',
    borrador: 'badge-warning',
    proceso: 'badge-info',
  };
  return map[estado] || 'badge-neutral';
}

export const RAMA_NOMBRES: Record<string, string> = {
  'vida_integridad': 'Vida e Integridad Física',
  'vida_integridad.homicidio': 'Homicidio',
  'vida_integridad.homicidio.consumado': 'Homicidio consumado',
  'vida_integridad.homicidio.imprudente': 'Homicidio imprudente',
  'vida_integridad.aborto': 'Aborto',
  'vida_integridad.lesiones': 'Lesiones',
  'vida_integridad.lesiones.graves': 'Lesiones graves',
  'vida_integridad.lesiones.leves': 'Lesiones leves',
  'vida_integridad.riña': 'Riña',
  'vida_integridad.vida_dependiente': 'Vida humana dependiente',
  'libertad': 'Libertad',
  'libertad.detenciones': 'Detenciones ilegales',
  'libertad.detenciones.ilegal': 'Detención ilegal',
  'libertad.detenciones.secuestro': 'Secuestro',
  'libertad.amenazas': 'Amenazas y coacciones',
  'libertad.violencia_genero': 'Violencia de género',
  'libertad.integridad_moral': 'Integridad moral',
  'libertad_sexual': 'Libertad Sexual',
  'libertad_sexual.agresiones': 'Agresiones sexuales',
  'libertad_sexual.agresiones.violacion': 'Violación',
  'libertad_sexual.agresiones.agravada': 'Agresión sexual agravada',
  'libertad_sexual.abusos': 'Abusos sexuales',
  'libertad_sexual.abusos.menores': 'Abusos a menores',
  'libertad_sexual.acoso': 'Acoso sexual',
  'libertad_sexual.explotacion': 'Explotación sexual',
  'libertad_sexual.trata': 'Trata de personas',
  'honor_intimidad': 'Honor e Intimidad',
  'honor_intimidad.calumnias': 'Calumnias e injurias',
  'honor_intimidad.secretos': 'Revelación de secretos',
  'honor_intimidad.allanamiento': 'Allanamiento',
  'familia': 'Familia',
  'patrimonio': 'Patrimonio',
  'patrimonio.hurto': 'Hurto',
  'patrimonio.hurto.simple': 'Hurto simple',
  'patrimonio.hurto.agravado': 'Hurto agravado',
  'patrimonio.robo': 'Robo',
  'patrimonio.robo.simple': 'Robo simple',
  'patrimonio.robo.agravado': 'Robo agravado',
  'patrimonio.extorsion': 'Extorsión',
  'patrimonio.estafa': 'Estafas',
  'patrimonio.estafa.simple': 'Estafa',
  'patrimonio.estafa.agravada': 'Estafa agravada',
  'patrimonio.apropiacion': 'Apropiación indebida',
  'patrimonio.daños': 'Daños',
  'patrimonio.receptacion': 'Receptación',
  'patrimonio.fraude_informatico': 'Fraude informático',
  'trabajadores': 'Derechos Laborales',
  'territorio_ambiente': 'Territorio y Medio Ambiente',
  'territorio_ambiente.medio_ambiente': 'Medio ambiente',
  'territorio_ambiente.flora_fauna': 'Flora y fauna',
  'territorio_ambiente.incendio_forestal': 'Incendio forestal',
  'salud_publica': 'Salud Pública',
  'salud_publica.drogas': 'Drogas',
  'salud_publica.drogas.trafico': 'Tráfico de drogas',
  'seguridad_colectiva': 'Seguridad Colectiva',
  'seguridad_colectiva.vial': 'Seguridad vial',
  'fe_publica': 'Fe Pública',
  'fe_publica.moneda': 'Falsificación de moneda',
  'admin_publica': 'Administración Pública',
  'admin_publica.cohecho': 'Cohecho',
  'admin_publica.malversacion': 'Malversación',
  'justicia': 'Administración de Justicia',
  'justicia.prevaricato': 'Prevaricato',
  'orden_publico': 'Orden Público',
  'constitucion': 'Constitución',
  'constitucion.rebelion': 'Rebelión',
  'constitucion.derechos_fundamentales': 'Derechos fundamentales',
  'seguridad_estado': 'Seguridad del Estado',
  'comunidad_internacional': 'Comunidad Internacional',
  'comunidad_internacional.genocidio': 'Genocidio',
  'comunidad_internacional.lesa_humanidad': 'Lesa humanidad',
};

export function formatRama(ramaId: string | null | undefined): string {
  if (!ramaId) return '';
  const parts = ramaId.split('.');
  const names = parts
    .map((_, i) => RAMA_NOMBRES[parts.slice(0, i + 1).join('.')])
    .filter(Boolean);
  return names.join(' › ');
}
