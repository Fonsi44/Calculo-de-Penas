import { ShieldAlert } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';

/**
 * Aviso jurisdiccional Honduras–España (FASE 4 §10).
 *
 * Bloque visible, reutilizable y adaptado al diseño canónico, que delimita con
 * claridad el alcance del despacho: actúa en materias sujetas al derecho
 * hondureño; determinados procedimientos en España deben realizarse
 * personalmente o con asistencia de un profesional habilitado en ese país.
 *
 * Reglas (AGENTS.md R4/R5, FASE 4 §3): no afirma ejercicio del derecho español,
 * no inventa colaboraciones, no garantiza resultados. Solo delimita alcance y
 * orienta al usuario antes de contratar. Es contenido visible (no decorativo):
 * aparece en el hub y en cada subpágina de Honduras–España.
 *
 * Texto adaptado del §10 del pliego de Fase 4, redacción prudente.
 */
export function SpainJurisdictionNotice() {
  return (
    <Section background="warm" spacing="sm">
      <Container size="lg">
        <div
          className="rounded-lg border border-accent/30 bg-accent/5 p-5 md:p-6"
          data-spain-jurisdiction-notice
          role="note"
          aria-label="Aviso sobre el alcance jurisdiccional del servicio"
        >
          <div className="flex items-start gap-3">
            <span
              className="w-11 h-11 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <ShieldAlert size={20} className="text-accent-dark" />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif font-bold text-base md:text-lg text-primary leading-snug">
                Alcance del servicio: Honduras y España
              </h2>
              <p className="mt-2 text-sm md:text-base text-text-secondary leading-relaxed">
                Pineda y Asociados asesora y representa en los aspectos sujetos al derecho
                hondureño. Determinados procedimientos en España deben realizarse
                personalmente o con asistencia de un profesional habilitado en ese país.
                Antes de contratar, el despacho indicará el alcance concreto del servicio y
                las actuaciones que puede asumir en cada caso.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
