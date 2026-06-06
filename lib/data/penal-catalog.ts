/**
 * Catálogo de los 7 grupos especializados del hub de Derecho Penal.
 * Refleja la estructura de `data/areas-juridicas.ts#hubPenal.grupos`.
 */

export type PremiumPenalGrupo = {
  slug: string;
  titulo: string;
  resumen: string;
  icono: string;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
};

export const premiumPenalGrupos: PremiumPenalGrupo[] = [
  { slug: 'atencion-casos-penales-litigiosos', titulo: 'Casos penales litigiosos', resumen: 'Defensa técnica en casos activos: imputación, acusación, juicio oral y recursos.', icono: 'gavel', color: 'danger' },
  { slug: 'mediacion-conflictos-penales-y-multas', titulo: 'Mediación y conflictos penales', resumen: 'Criterios de oportunidad, conciliación, suspensión condicional y multas.', icono: 'handshake', color: 'accent' },
  { slug: 'menores-justicia-juvenil', titulo: 'Menores y justicia juvenil', resumen: 'Defensa de adolescentes, medidas socioeducativas y protección del CNA.', icono: 'baby', color: 'warning' },
  { slug: 'proceso-penal-completo', titulo: 'Proceso penal completo', resumen: 'De la investigación fiscal al juicio oral y la sentencia firme.', icono: 'book-open', color: 'primary' },
  { slug: 'recursos-y-defensa-avanzada', titulo: 'Recursos y defensa avanzada', resumen: 'Apelación, casación, revisión, amparo y habeas corpus.', icono: 'shield-alert', color: 'danger' },
  { slug: 'estrategia-penal-y-litigio', titulo: 'Estrategia penal y litigio', resumen: 'Compliance, peritajes, testigos y construcción de estrategia de defensa.', icono: 'target', color: 'primary' },
  { slug: 'ejecucion-penal-y-beneficios', titulo: 'Ejecución penal y beneficios', resumen: 'Libertad condicional, redención, indulto y derechos del condenado.', icono: 'key', color: 'success' },
];
