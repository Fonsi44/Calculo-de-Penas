/**
 * Catálogo de servicios jurídicos generales.
 * Estructura desacoplada de `data/areas-juridicas.ts` para iterar con libertad
 * en la capa visual (PremiumServiceGrid) sin tocar el dominio legal.
 *
 * Cada servicio apunta a su slug canónico (el mismo que `getAreaBySlug`
 * resuelve en `data/areas-juridicas.ts`).
 */

export type PremiumService = {
  slug: string;
  titulo: string;
  resumen: string;
  icono: string;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
  destacado?: string;
};

export const premiumServices: PremiumService[] = [
  { slug: 'derecho-de-familia', titulo: 'Derecho de Familia', resumen: 'Divorcio, custodia, alimentos, sucesiones y violencia intrafamiliar.', icono: 'users', color: 'primary', destacado: 'Conocemos Juzgados de Nacaome, San Lorenzo, Choluteca y Tegucigalpa.' },
  { slug: 'derecho-laboral', titulo: 'Derecho Laboral', resumen: 'Despidos, prestaciones, riesgos profesionales, contratos y conflictos laborales.', icono: 'briefcase', color: 'primary' },
  { slug: 'derecho-civil-y-notarial', titulo: 'Derecho Civil y Notarial', resumen: 'Contratos, propiedad, obligaciones, actos notariales y litigio civil.', icono: 'file-text', color: 'primary' },
  { slug: 'derecho-mercantil-empresarial', titulo: 'Derecho Mercantil y Empresarial', resumen: 'Sociedades, gobierno corporativo, M&A, propiedad industrial y arbitraje.', icono: 'building-2', color: 'accent' },
  { slug: 'derecho-bancario-y-financiero', titulo: 'Derecho Bancario y Financiero', resumen: 'Defensa ante bancos, regulación CNBS, reestructuras y cobranzas.', icono: 'banknote', color: 'accent' },
  { slug: 'derecho-administrativo-y-servicio-civil', titulo: 'Derecho Administrativo y Servicio Civil', resumen: 'Sanciones, recurso de revisión, contratos públicos y contencioso.', icono: 'landmark', color: 'muted' },
  { slug: 'derecho-aduanero-y-comercio-exterior', titulo: 'Derecho Aduanero y Comercio Exterior', resumen: 'Importación, exportación, regímenes aduaneros y defensa ante SAR.', icono: 'ship', color: 'accent' },
  { slug: 'regulacion-sanitaria', titulo: 'Regulación Sanitaria y Salud', resumen: 'ARSA, registro sanitario, alimentos, medicamentos y dispositivos médicos.', icono: 'heart-pulse', color: 'success' },
  { slug: 'extranjeria-en-honduras', titulo: 'Extranjería en Honduras', resumen: 'Visas, residencia, naturalización y defensa ante el INM.', icono: 'globe', color: 'accent' },
  { slug: 'propiedad-intelectual', titulo: 'Propiedad Intelectual', resumen: 'Marcas, patentes, derechos de autor, secretos empresariales y defensa IP.', icono: 'lightbulb', color: 'accent' },
  { slug: 'tributario-fiscal', titulo: 'Derecho Tributario y Fiscal', resumen: 'Asesoría fiscal, defensa ante SAR, fiscalización y planificación.', icono: 'receipt', color: 'warning' },
  { slug: 'ambiental-regulatorio', titulo: 'Derecho Ambiental y Regulatorio', resumen: 'Licencia ambiental, MiAmbiente, evaluación de impacto y litigio ambiental.', icono: 'leaf', color: 'success' },
  { slug: 'conciliacion-y-arbitraje', titulo: 'Conciliación y Arbitraje', resumen: 'MASC, arbitraje nacional e internacional y mediación privada.', icono: 'scale', color: 'primary' },
];

export function searchServices(query: string): PremiumService[] {
  const q = query.trim().toLowerCase();
  if (!q) return premiumServices;
  return premiumServices.filter((s) => {
    return (
      s.titulo.toLowerCase().includes(q) ||
      s.resumen.toLowerCase().includes(q) ||
      s.slug.includes(q)
    );
  });
}
