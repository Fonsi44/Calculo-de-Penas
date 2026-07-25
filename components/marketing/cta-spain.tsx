'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
 */
export function CtaSpain() {
  const handleClick = () => trackCtaSpain();
  return (
    <Section background="primary" spacing="md">
      <Container size="lg">
        <div className="max-w-3xl">
          <h2 className="font-serif font-extrabold text-xl md:text-2xl text-text-inverse leading-tight">
            ¿Necesita gestionar un trámite en Honduras desde España?
          </h2>
          <p className="mt-3 text-sm md:text-base text-text-inverse/85 leading-relaxed">
            Cuéntenos su caso y le indicamos el alcance concreto del servicio, qué podemos
            asumir desde Honduras y qué pasos requieren su actuación o un profesional
            habilitado en España. Primera evaluación sin compromiso.
          </p>
          <div className="mt-5">
            <Link
              href="/solicitar-consulta?motivo=hondurenos-en-espana#formulario"
              onClick={handleClick}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-primary hover:bg-accent-dark hover:text-text-inverse transition-colors btn-shadow-primary"
              data-cta-spain
            >
              Explicar qué gestión necesito en Honduras desde España
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
