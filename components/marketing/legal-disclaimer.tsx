import Link from 'next/link';
import { LEGAL_DISCLAIMER, formatLegalDate } from '@/lib/legal-disclaimer';

interface LegalDisclaimerProps {
  /** Fecha ISO de la última revisión del contenido (ej. post.updatedAt).
   *  Si se omite, se muestra "al momento de su última revisión". */
  lastReviewedIso?: string | null;
  /** Variante visual. 'box' = recuadro (default), 'inline' = texto plano. */
  variant?: 'box' | 'inline';
  /** Clase extra opcional para el contenedor. */
  className?: string;
}

/**
 * Aviso legal estándar reutilizable.
 *
 * Es el ÚNICO disclaimer que debe mostrarse visible por página. El footer
 * global ya lo incluye en todas las páginas; por tanto, los componentes
 * internos (posts, servicios) NO deben renderizar otro disclaimer adicional.
 *
 * Si un post necesita mostrarlo con su fecha de revisión real, usa este
 * componente con `lastReviewedIso={post.updatedAt}`. La fecha proviene del
 * campo del post (DB), no se escribe manualmente en el texto.
 *
 * @example
 * <LegalDisclaimer lastReviewedIso={post.updatedAt} />
 */
export function LegalDisclaimer({
  lastReviewedIso,
  variant = 'box',
  className = '',
}: LegalDisclaimerProps) {
  const fecha = formatLegalDate(lastReviewedIso);
  const texto = fecha
    ? LEGAL_DISCLAIMER.replace(
        'al momento de su última revisión',
        `al ${fecha}`,
      )
    : LEGAL_DISCLAIMER;

  // Reemplaza "solicite una consulta con Pineda y Asociados" por un enlace
  // al formulario, manteniendo el texto natural.
  const partes = texto.split(
    'solicite una consulta con Pineda y Asociados.',
  );

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-text-muted leading-relaxed ${className}`}>
        {partes[0]}
        <Link
          href="/solicitar-consulta#formulario"
          className="text-accent-dark underline font-medium"
        >
          solicite una consulta con Pineda y Asociados
        </Link>
        {partes[1] ?? '.'}
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
        {partes[0]}
        <Link
          href="/solicitar-consulta#formulario"
          className="text-accent-dark underline font-medium"
        >
          solicite una consulta con Pineda y Asociados
        </Link>
        {partes[1] ?? '.'}
      </p>
    </div>
  );
}
