/**
 * Fuente única de verdad para el aviso legal (disclaimer) reutilizable.
 *
 * Regla editorial: el aviso legal estándar es el ÚNICO que debe mostrarse
 * visible por página. En el blog se muestra al final del artículo y el footer
 * global no lo repite.
 *
 * Si una página necesita mostrarlo con contexto (ej. fecha de revisión real),
 * usa el componente <LegalDisclaimer> con la fecha, no copia el texto.
 */

/**
 * Aviso legal estándar del sitio (texto base, sin fecha).
 * Texto exacto aprobado editorialmente — no variar entre secciones.
 */
export const LEGAL_DISCLAIMER =
  'Aviso legal: Este contenido es informativo y no constituye asesoría jurídica personalizada ni crea una relación abogado–cliente. La normativa aplicable y su interpretación pueden variar según los hechos y las reformas vigentes. Para evaluar un caso concreto, consulte directamente con un abogado habilitado en Honduras.';

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
  'Bufete jurídico con sede en Nacaome, Valle, y más de 15 años de ejercicio profesional en la zona sur de Honduras. Defensa penal técnica y asesoría jurídica integral.';

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
export function formatLegalDate(isoDate: string | Date | null | undefined): string {
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
export function buildDisclaimerText(): string {
  return LEGAL_DISCLAIMER;
}
