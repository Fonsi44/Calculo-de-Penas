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
 * Reutiliza CTAGroup (Solicitar consulta + Llamar) para mantener una sola
 * fuente de verdad de botones en toda la web pública (R16).
 */
export function ConsultationCTA() {
  return (
    <Section background="muted" spacing="md">
      <Container size="md">
        <div className="relative rounded-lg card-premium ring-gradient-accent px-6 py-10 md:px-10 md:py-12 text-center">
          <p className="eyebrow-label text-accent-dark">
            Consulta confidencial sin costo en Nacaome, Valle
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight mt-3 text-balance">
            Cada caso es único. Cuéntenos el suyo y le orientamos sin compromiso.
          </h2>
          <p className="mt-4 text-sm md:text-base text-text-secondary max-w-xl mx-auto leading-relaxed text-pretty">
            Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones
            legales disponibles. Atendemos en Nacaome, San Lorenzo, Choluteca y la zona sur
            de Honduras. Presupuesto por escrito antes de cualquier actuación.
          </p>
          <div className="mt-7 flex justify-center">
            <CTAGroup variant="inline" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
