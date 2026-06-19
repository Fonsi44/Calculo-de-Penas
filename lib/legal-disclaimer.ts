/**
 * Fuente única de verdad para el aviso legal (disclaimer) reutilizable.
 *
 * Regla editorial: el aviso legal estándar es el ÚNICO que debe mostrarse
 * visible por página. El footer global lo muestra en TODAS las páginas, por
 * lo que los posts de blog y páginas internas NO deben repetirlo (lo heredan).
 *
 * Si una página necesita mostrarlo con contexto (ej. fecha de revisión real),
 * usa el componente <LegalDisclaimer> con la fecha, no copia el texto.
 */

/**
 * Aviso legal estándar del sitio (texto base, sin fecha).
 * Texto exacto aprobado editorialmente — no variar entre secciones.
 */
export const LEGAL_DISCLAIMER =
  'Aviso legal: este contenido tiene carácter informativo, orientativo y educativo. Se basa en la legislación hondureña vigente al momento de su última revisión y no constituye asesoría legal personalizada ni crea relación abogado–cliente. Cada caso requiere análisis individual por un abogado habilitado en Honduras. Para orientación específica, solicite una consulta con Pineda y Asociados.';

/**
 * Versión corta para espacios reducidos (badges, captions).
 * No sustituye al disclaimer visible completo.
 */
export const LEGAL_DISCLAIMER_SHORT =
  'Contenido informativo. No sustituye la asesoría legal personalizada de un abogado habilitado en Honduras.';

/**
 * Bio corta estandarizada del despacho.
 * Única fuente para footer, "Sobre el autor" de posts y /despacho.
 */
export const FIRM_BIO_SHORT =
  'Bufete multidisciplinario con sede en Nacaome, Valle, y más de 15 años de ejercicio profesional en la zona sur de Honduras. Defensa penal técnica y asesoría jurídica integral.';

/**
 * Bio de autoría para el bloque "Sobre el autor" de los posts.
 */
export const AUTHOR_BIO = `${FIRM_BIO_SHORT} Abogados colegiados en Honduras con registro profesional vigente.`;

/**
 * Sello del marco legal aplicado (referencia al CP vigente).
 */
export const LEGAL_FRAME_BADGE =
  'Código Penal · Decreto 130-2017 y sus reformas vigentes';

/**
 * Formatea una fecha ISO en español (formato Honduras).
 * @returns "3 de junio de 2026" o cadena vacía si la fecha es inválida.
 */
export function formatLegalDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toLocaleDateString('es-HN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Construye el disclaimer completo con la fecha de revisión inyectada.
 * Usa este helper cuando necesites el texto plano (PDF, email, JSON-LD),
 * no en componentes React (usa <LegalDisclaimer> en su lugar).
 */
export function buildDisclaimerText(lastReviewedIso?: string | null): string {
  const fecha = formatLegalDate(lastReviewedIso);
  if (!fecha) return LEGAL_DISCLAIMER;
  return LEGAL_DISCLAIMER.replace(
    'al momento de su última revisión',
    `al ${fecha}`,
  );
}
