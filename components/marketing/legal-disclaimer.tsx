import { LEGAL_DISCLAIMER, formatLegalDate } from '@/lib/legal-disclaimer';

interface LegalDisclaimerProps {
  /** Fecha documental real. No equivale a revisión jurídica humana. */
  documentaryReviewedAt?: string | Date | null;
  /** Variante visual. 'box' = recuadro (default), 'inline' = texto plano. */
  variant?: 'box' | 'inline';
  /** Clase extra opcional para el contenedor. */
  className?: string;
}

/**
 * Aviso legal estándar reutilizable.
 *
 * Es el ÚNICO disclaimer visible de la página de artículo. El footer global
 * no repite este texto.
 *
 * Si un post necesita mostrarlo con su fecha de revisión real, usa este
 * componente con `documentaryReviewedAt={post.aiReviewedAt}`. Esta fecha no
 * equivale a revisión jurídica ni firma editorial.
 *
 * @example
 * <LegalDisclaimer documentaryReviewedAt={post.aiReviewedAt} />
 */
export function LegalDisclaimer({
  documentaryReviewedAt,
  variant = 'box',
  className = '',
}: LegalDisclaimerProps) {
  const fecha = formatLegalDate(documentaryReviewedAt);

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-text-muted leading-relaxed ${className}`}>
        {LEGAL_DISCLAIMER}
        {fecha ? <span className="block mt-2">Revisión documental: {fecha}.</span> : null}
      </p>
    );
  }

  return (
    <div
      className={`mt-10 p-5 rounded-xl border border-border/30 bg-surface-alt ${className}`}
      role="note"
      aria-label="Aviso legal"
    >
      <p className="text-xs text-text-muted leading-relaxed">
        {LEGAL_DISCLAIMER}
        {fecha ? <span className="block mt-2">Revisión documental: {fecha}.</span> : null}
      </p>
    </div>
  );
}
