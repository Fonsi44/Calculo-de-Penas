import { Section, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';

/**
 * Llamada final a la acción — bloque premium centrado.
 *
 * Rediseño (Jun 2026): antes era un bloque de texto plano sobre fondo muted
 * con un único botón. Ahora es una card premium contenida (card-premium +
 * ring dorado sutil) con jerarquía clara (eyebrow → título serif → subtítulo
 * → CTAs duales) y botones consistentes vía <CTAGroup>.
 *
 * Fase 2.3 transformación coherente — variantes:
 *  - 'closing' (default): la card premium histórica con halo dorado. Para el
 *    cierre de hubs principales. Mantiene los 12 usos existentes sin cambio.
 *  - 'inline': bloque más compacto, sin halo, fondo muted plano. Para páginas
 *    que ya tienen otra card premium cerca (evita dos halos dorados juntos).
 *  - 'footer': franja sobria de cierre con texto breve + CTAs. Para landings
 *    y páginas secundarias.
 *
 * Reutiliza CTAGroup (Solicitar consulta + Llamar) para mantener una sola
 * fuente de verdad de botones en toda la web pública (R16).
 */
type ConsultationCTAVariant = 'closing' | 'inline' | 'footer';

interface ConsultationCTAProps {
  variant?: ConsultationCTAVariant;
  /** Sobrescribe el título. Útil para contextualizar el CTA por página. */
  title?: string;
  /** Sobrescribe el subtítulo. */
  subtitle?: string;
  /** Sobrescribe el eyebrow. */
  eyebrow?: string;
  /** Mensaje de WhatsApp contextual (ciudad, área o página). */
  message?: string;
  className?: string;
}

export function ConsultationCTA({
  variant = 'closing',
  title,
  subtitle,
  eyebrow,
  message,
  className,
}: ConsultationCTAProps) {
  const defaultEyebrow = 'Evaluación confidencial en Nacaome, Valle';
  const defaultTitle = 'Cada caso es único. Cuéntenos el suyo y le orientamos con discreción.';
  const defaultSubtitle =
    'Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones legales disponibles. Atendemos en Nacaome, San Lorenzo, Amapala, Goascorán, Choluteca, San Marcos de Colón y El Triunfo. Presupuesto por escrito antes de cualquier actuación. Sus datos están protegidos por el secreto profesional del abogado.';

  if (variant === 'footer') {
    return (
      <Section background="muted" spacing="sm" className={className}>
        <Container size="md">
          <div className="text-center py-6">
            <p className="font-serif font-bold text-lg md:text-xl text-primary text-balance">
              {title ?? '¿Necesita asesoría jurídica confidencial?'}
            </p>
            <p className="mt-2 text-sm text-text-secondary max-w-xl mx-auto text-pretty">
              {subtitle ?? 'Evaluación confidencial. Presupuesto por escrito. Atención directa del abogado responsable.'}
            </p>
            <div className="mt-5 flex justify-center">
              <CTAGroup variant="inline" message={message} />
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (variant === 'inline') {
    return (
      <Section background="muted" spacing="md" className={className}>
        <Container size="md">
          <div className="rounded-lg border border-border-light bg-surface px-6 py-8 md:px-10 md:py-10 text-center">
            <p className="eyebrow-label text-accent-dark">{eyebrow ?? defaultEyebrow}</p>
            <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight mt-3 text-balance tracking-tight">
              {title ?? defaultTitle}
            </h2>
            <p className="mt-3 text-sm md:text-base text-text-secondary max-w-xl mx-auto leading-relaxed text-pretty">
              {subtitle ?? 'Evaluamos su caso con rigor técnico y le explicamos las opciones legales disponibles, con presupuesto por escrito y bajo secreto profesional.'}
            </p>
            <div className="mt-6 flex justify-center">
              <CTAGroup variant="inline" message={message} />
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // 'closing' — la card premium histórica.
  return (
    <Section background="muted" spacing="md" className={className}>
      <Container size="md">
        <div className="relative rounded-lg card-premium ring-gradient-accent overflow-hidden px-6 py-10 md:px-10 md:py-12 text-center">
          {/* Halo dorado sutil en la parte superior — profundidad premium */}
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none opacity-60"
            style={{
              background:
                'radial-gradient(60% 100% at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <p className="eyebrow-label text-accent-dark">{eyebrow ?? defaultEyebrow}</p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight mt-3 text-balance tracking-tight">
              {title ?? defaultTitle}
            </h2>
            <p className="mt-4 text-sm md:text-base text-text-secondary max-w-xl mx-auto leading-relaxed text-pretty">
              {subtitle ?? defaultSubtitle}
            </p>
            <div className="mt-7 flex justify-center">
              <CTAGroup variant="inline" message={message} />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
