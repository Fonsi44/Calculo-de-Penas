'use client';

import Link from 'next/link';
import { ArrowRight, Send } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';
import { trackCtaSpain } from '@/lib/analytics';

/**
 * CTA contextual del hub Honduras–España (FASE 4 §14).
 *
 * Enlaza al formulario con el motivo preseleccionado de forma segura:
 * /solicitar-consulta?motivo=hondurenos-en-espana#formulario
 * El motivo es una CATEGORÍA (no PII); la whitelist del formulario valida que
 * el slug esté permitido y el usuario puede cambiarlo libremente. Sin envío
 * automático, sin PII en la URL.
 *
 * Conserva el evento GA4 específico `cta_spain` (trackCtaSpain) — contrato
 * analítico verificado por tests/fase4-local-espana.test.ts. Visualmente
 * alineado con ContextualCta (mismo fondo sutil dorado + borde), pero sigue
 * siendo Client Component para disparar el evento propio al hacer clic.
 */
export function CtaSpain() {
  const handleClick = () => trackCtaSpain();
  return (
    <Section spacing="md">
      <Container size="md">
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 md:p-8 text-center">
          <p className="eyebrow-rule text-accent-dark mb-2">Honduras — España</p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight text-balance">
            ¿Necesita gestionar un trámite en Honduras desde España?
          </h2>
          <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Cuéntenos su caso y le indicamos el alcance concreto del servicio, qué podemos
            asumir desde Honduras y qué pasos requieren su actuación o un profesional
            habilitado en España. Evaluación inicial confidencial.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <Link
              href="/solicitar-consulta?motivo=hondurenos-en-espana#formulario"
              onClick={handleClick}
              className="focus-ring cta-primary-refined inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
              data-cta-spain
            >
              <Send size={16} aria-hidden="true" />
              Explicar qué gestión necesito
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
