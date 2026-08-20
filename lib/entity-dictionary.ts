/**
 * Diccionario de entidades para auto-linking contextual en bodies de blog.
 *
 * Detecta menciones de ciudades, áreas de práctica y conceptos legales en el
 * texto HTML de los posts y las convierte en enlaces internos hacia sus
 * páginas canónicas. Esto crea la tela de araña blog → ciudades/servicios
 * que antes no existía (gap #2 del diagnóstico de arquitectura).
 *
 * Diseño:
 *   - Cada entidad: { pattern (RegExp), href, anchor, maxOccurrences? }
 *   - El linker (lib/blog-context-linker.ts) respeta HTML existente:
 *     no enlaza dentro de <a>, <h1>-<h3>, <script>, <pre>, <code>.
 *   - Anti-over-optimization: máx 1 ocurrencia por entidad, anchors variados.
 *
 * R4 (AGENTS.md): no se inventan URLs. Todas las páginas destino existen.
 */

export interface LinkableEntity {
  /** Patrón regex (con word boundaries) para detectar la mención. */
  pattern: RegExp;
  /** Ruta canónica interna (ej: /abogados-en-choluteca). */
  href: string;
  /** Texto del anchor que reemplaza la mención original. */
  anchor: string;
  /** Máximo de ocurrencias a enlazar (default 1 para evitar saturación). */
  maxOccurrences?: number;
  /** Peso para ordenar qué entidades se enlazan primero (mayor = más prioritario). */
  weight?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CIUDADES — entidades geográficas del sur de Honduras
// ─────────────────────────────────────────────────────────────────────────────

const cityEntities: LinkableEntity[] = [
  { pattern: /\bNacaome\b/g, href: '/abogados-en-nacaome', anchor: 'Nacaome', weight: 10 },
  { pattern: /\bCholuteca\b/g, href: '/abogados-en-choluteca', anchor: 'Choluteca', weight: 10 },
  { pattern: /\bSan Lorenzo\b/g, href: '/abogados-en-san-lorenzo', anchor: 'San Lorenzo', weight: 8 },
  { pattern: /\bGoascor[aá]n\b/g, href: '/abogados-en-goascoran', anchor: 'Goascorán', weight: 7 },
  { pattern: /\bSan Marcos de Col[oó]n\b/g, href: '/abogados-en-san-marcos-de-colon', anchor: 'San Marcos de Colón', weight: 7 },
  { pattern: /\bEl Triunfo\b/g, href: '/abogados-en-el-triunfo', anchor: 'El Triunfo', weight: 6 },
  { pattern: /\bAmapala\b/g, href: '/abogados-en-amapala', anchor: 'Amapala', weight: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ÁREAS DE PRÁCTICA — entidades jurídicas principales
// ─────────────────────────────────────────────────────────────────────────────

const practiceAreaEntities: LinkableEntity[] = [
  {
    pattern: /\bdefensa penal\b/gi,
    href: '/derecho-penal',
    anchor: 'defensa penal',
    weight: 9,
  },
  {
    pattern: /\bderecho penal\b/gi,
    href: '/derecho-penal',
    anchor: 'derecho penal',
    weight: 9,
  },
  {
    pattern: /\babogado penalista\b/gi,
    href: '/derecho-penal',
    anchor: 'abogado penalista',
    weight: 9,
  },
  {
    pattern: /\bderecho de familia\b/gi,
    href: '/servicios-juridicos/derecho-de-familia',
    anchor: 'derecho de familia',
    weight: 8,
  },
  {
    pattern: /\bderecho laboral\b/gi,
    href: '/servicios-juridicos/derecho-laboral',
    anchor: 'derecho laboral',
    weight: 8,
  },
  {
    pattern: /\bderecho civil\b/gi,
    href: '/servicios-juridicos/derecho-civil-y-notarial',
    anchor: 'derecho civil',
    weight: 7,
  },
  {
    pattern: /\bderecho mercantil\b/gi,
    href: '/servicios-juridicos/derecho-mercantil-empresarial',
    anchor: 'derecho mercantil',
    weight: 7,
  },
  {
    pattern: /\bderecho aduanero\b/gi,
    href: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
    anchor: 'derecho aduanero',
    weight: 6,
  },
  {
    pattern: /\bderecho tributario\b/gi,
    href: '/servicios-juridicos/tributario-fiscal',
    anchor: 'derecho tributario',
    weight: 6,
  },
  {
    pattern: /\bderecho administrativo\b/gi,
    href: '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
    anchor: 'derecho administrativo',
    weight: 6,
  },
  {
    pattern: /\bconciliaci[oó]n y arbitraje\b/gi,
    href: '/servicios-juridicos/conciliacion-y-arbitraje',
    anchor: 'conciliación y arbitraje',
    weight: 5,
  },
  {
    pattern: /\bpropiedad intelectual\b/gi,
    href: '/servicios-juridicos/propiedad-intelectual',
    anchor: 'propiedad intelectual',
    weight: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPTOS LEGALES FRECUENTES (hacia posts/guías estratégicas)
// ─────────────────────────────────────────────────────────────────────────────

const legalConceptEntities: LinkableEntity[] = [
  {
    pattern: /\baudiencia inicial\b/gi,
    href: '/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras',
    anchor: 'audiencia inicial',
    weight: 4,
  },
  {
    pattern: /\bmedidas cautelares\b/gi,
    href: '/blog/derecho-penal/fianza-medidas-cautelares-proceso-penal-honduras',
    anchor: 'medidas cautelares',
    weight: 4,
  },
  {
    pattern: /\bmedidas sustitutivas\b/gi,
    href: '/blog/derecho-penal/medidas-sustitutivas-prision-preventiva-honduras',
    anchor: 'medidas sustitutivas',
    weight: 4,
  },
  {
    pattern: /\bsobreseimiento\b/gi,
    href: '/blog/proceso-penal/sobreseimiento-definitivo-provisional',
    anchor: 'sobreseimiento',
    weight: 3,
  },
  {
    pattern: /\bpensi[oó]n alimenticia\b/gi,
    href: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa',
    anchor: 'pensión alimenticia',
    weight: 8,
  },
  {
    pattern: /\bliquidaci[oó]n laboral\b/gi,
    href: '/blog/derecho-laboral/calcular-liquidacion-laboral-honduras',
    anchor: 'liquidación laboral',
    weight: 3,
  },
  {
    pattern: /\bprestaciones laborales\b/gi,
    href: '/blog/derecho-laboral/calcular-liquidacion-laboral-honduras',
    anchor: 'prestaciones laborales',
    weight: 8,
  },
  {
    pattern: /\bdespido injustificado\b/gi,
    href: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa',
    anchor: 'despido injustificado',
    weight: 8,
  },
  {
    pattern: /\bderechos laborales\b/gi,
    href: '/blog/derecho-laboral/derechos-laborales-basicos-honduras',
    anchor: 'derechos laborales',
    weight: 7,
  },
  {
    pattern: /\bacoso laboral\b/gi,
    href: '/blog/derecho-laboral/acoso-laboral-mobbing-honduras',
    anchor: 'acoso laboral',
    weight: 7,
  },
  {
    pattern: /\bcontratos? de trabajo\b/gi,
    href: '/blog/derecho-laboral/contratos-trabajo-tipos-clausulas-honduras',
    anchor: 'contrato de trabajo',
    weight: 6,
  },
  {
    pattern: /\bjornada laboral\b/gi,
    href: '/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras',
    anchor: 'jornada laboral',
    weight: 7,
  },
  {
    pattern: /\bhoras? extras?\b/gi,
    href: '/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras',
    anchor: 'horas extra',
    weight: 6,
  },
  {
    pattern: /\btrabajadoras? embarazadas?\b/gi,
    href: '/blog/derecho-laboral/derechos-trabajadora-embarazada-honduras',
    anchor: 'trabajadora embarazada',
    weight: 7,
  },
  {
    pattern: /\b(riesgos profesionales|accidentes laborales)\b/gi,
    href: '/blog/derecho-laboral/riesgos-profesionales-accidentes',
    anchor: 'riesgos profesionales',
    weight: 6,
  },
  {
    pattern: /\bprescripci[oó]n de deudas\b/gi,
    href: '/blog/derecho-civil/prescripcion-deudas-plazos-honduras',
    anchor: 'prescripción de deudas',
    weight: 9,
  },
  {
    pattern: /\bcustodia de (hijos|menores)\b/gi,
    href: '/blog/derecho-de-familia/custodia-hijos-honduras-juez',
    anchor: 'custodia de hijos',
    weight: 9,
  },
  {
    pattern: /\bdivorcio\b/gi,
    href: '/blog/derecho-de-familia/divorcio-honduras-guia-completa',
    anchor: 'divorcio',
    weight: 9,
  },
  {
    pattern: /\bdaños y perjuicios\b/gi,
    href: '/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras',
    anchor: 'daños y perjuicios',
    weight: 9,
  },
  {
    pattern: /\bpoder notarial\b/gi,
    href: '/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita',
    anchor: 'poder notarial',
    weight: 9,
  },
  {
    pattern: /\bnaturalizaci[oó]n\b/gi,
    href: '/blog/extranjeria-migracion/naturalizacion-nacionalidad-hondurena',
    anchor: 'naturalización',
    weight: 8,
  },
];

/**
 * Catálogo completo de entidades, ordenado por peso descendente.
 * El linker procesa primero las entidades de mayor peso (ciudades > áreas > conceptos).
 */
export const ENTITY_CATALOG: LinkableEntity[] = [
  ...cityEntities,
  ...practiceAreaEntities,
  ...legalConceptEntities,
].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

/**
 * Reset de los índices regex (necesario porque los objetos RegExp con flag
 * global mantienen lastIndex entre usos). El linker llama a esto antes de
 * cada pasada para evitar saltos.
 */
export function resetEntityPatterns(): void {
  for (const entity of ENTITY_CATALOG) {
    entity.pattern.lastIndex = 0;
  }
}
