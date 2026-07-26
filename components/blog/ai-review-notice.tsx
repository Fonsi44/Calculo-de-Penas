import type { BlogPost } from '@/lib/schema';

/**
 * Aviso público de estado de revisión IA (Fase 3).
 *
 * Semántica estricta para no falsear confianza (AGENTS.md R4, R11, R12):
 *
 *  - `completed`:        "Contenido contrastado documentalmente con las fuentes
 *                         oficiales indicadas…"
 *  - `source_checked`:   "Parte de la información… puede requerir comprobación
 *                         adicional o análisis profesional."
 *  - `needs_human_review`: "Este contenido contiene cuestiones pendientes de
 *                         revisión jurídica adicional…"
 *  - `blocked`, `in_progress`, `not_started`, `corrected`:
 *                         NO renderiza nada (no afirmar lo que no está verificado).
 *
 * Reglas:
 *  - Nunca menciona al proveedor de análisis (DeepSeek) ni al modelo.
 *  - Nunca muestra "contrastada con fuentes oficiales" si el estado no es
 *    `completed` o `source_checked`.
 *  - El disclaimer jurídico general lo aporta <LegalDisclaimer/> (footer);
 *    este componente solo añade la precisión del estado de revisión IA cuando
 *    el estado lo permite.
 *
 * Integración: NO se monta por defecto en app/(public)/blog/** (R5). Queda
 * disponible para integración autorizada. El componente es puro de presentación.
 *
 * @example
 * <AiReviewNotice aiReviewStatus="completed" aiReviewedAt={post.aiReviewedAt} />
 */
interface AiReviewNoticeProps {
  aiReviewStatus: BlogPost['aiReviewStatus'];
  aiReviewedAt: BlogPost['aiReviewedAt'];
  className?: string;
}

type ReviewStatus = NonNullable<BlogPost['aiReviewStatus']>;

const COPY: Partial<Record<ReviewStatus, string>> = {
  completed:
    'Contenido contrastado documentalmente con las fuentes oficiales indicadas, disponibles en la fecha de revisión. La información es general y no sustituye el análisis jurídico de un caso concreto.',
  source_checked:
    'Parte de la información de este contenido ha sido contrastada documentalmente con fuentes oficiales disponibles en la fecha indicada. Algunas cuestiones pueden requerir comprobación adicional o análisis profesional.',
  needs_human_review:
    'Este contenido contiene cuestiones pendientes de revisión jurídica adicional. No debe utilizarse como sustituto del asesoramiento profesional sobre un caso concreto.',
};

/**
 * Estados que SÍ muestran aviso. El resto devuelve null.
 */
function getNoticeCopy(status: ReviewStatus | null | undefined): string | null {
  if (!status) return null;
  return COPY[status] ?? null;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export function AiReviewNotice({
  aiReviewStatus,
  aiReviewedAt,
  className = '',
}: AiReviewNoticeProps): JSX.Element | null {
  const copy = getNoticeCopy(aiReviewStatus);
  if (!copy) return null;

  const fecha = formatDate(aiReviewedAt);
  const status = (aiReviewStatus ?? '') as ReviewStatus;

  return (
    <p
      className={`text-xs text-text-muted italic mt-3 leading-relaxed ${className}`}
      data-ai-review-status={status}
      data-ai-reviewed={fecha ? 'true' : 'false'}
    >
      {copy}
      {fecha ? ` Revisión documental: ${fecha}.` : ''}
    </p>
  );
}
