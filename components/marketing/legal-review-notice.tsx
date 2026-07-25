import { getLegalReview, isReviewAttributable, type LegalReview } from '@/lib/legal-review';

interface LegalReviewNoticeProps {
  /** Path público de la página (ej. '/servicios-juridicos/derecho-laboral').
   *  Se consulta contra LEGAL_REVIEW_REGISTRY. */
  path: string;
  /** Clase extra opcional. */
  className?: string;
}

/**
 * Atribución pública de revisión jurídica (FASE 1).
 *
 * Comportamiento estricto para no falsear confianza (AGENTS.md R4, R11):
 *  - Si la revisión NO es `verified` (pendiente, needs_update o ausente):
 *    NO renderiza nada. Nunca muestra "Revisado por" sin firma humana real,
 *    y nunca expone marcas internas tipo [REVISIÓN PENDIENTE] en producción.
 *  - Si la revisión SÍ es `verified` con revisor humano canónico y fecha
 *    válida: renderiza una atribución sobria y verificable.
 *
 * El aviso jurídico general prudente lo aporta <LegalDisclaimer/> (footer
 * global); este componente solo añade atribución de revisión cuando procede.
 *
 * @example
 * <LegalReviewNotice path="/servicios-juridicos/derecho-laboral" />
 */
export function LegalReviewNotice({ path, className = '' }: LegalReviewNoticeProps) {
  const review: LegalReview = getLegalReview(path);
  if (!isReviewAttributable(review)) return null;

  const fecha = review.reviewedAt ?? '';
  return (
    <p
      className={`text-xs text-text-muted italic mt-2 ${className}`}
      data-legal-review={path}
      data-review-status={review.reviewStatus}
    >
      Contenido revisado por {review.reviewedBy}
      {fecha ? ` el ${fecha}` : ''}.
    </p>
  );
}
