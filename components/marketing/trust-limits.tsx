import Link from 'next/link';
import {
  MapPin,
  Phone,
  ShieldCheck,
  FileText,
  Users,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/marketing/section';
import { site } from '@/lib/site';

/**
 * Bloque "Confianza y límites" (FASE 2 — Página de inicio y /despacho).
 *
 * Muestra ÚNICAMENTE elementos confirmados del bufete, sin afirmaciones
 * pendientes de validación (P01–P15) ni cifras inventadas. El bloque de
 * límites declara de forma prudente lo que el despacho NO garantiza.
 *
 * Restricciones (AGENTS.md R4, R5, R12):
 *  - No usa contadores ficticios ni resultados no comprobados.
 *  - No afirma «los mejores», «líderes», «éxito garantizado».
 *  - Reutiliza el design system existente (tokens canónicos R16).
 */

interface TrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TRUST_ITEMS: readonly TrustItem[] = [
  {
    icon: MapPin,
    title: 'Sede física en Nacaome',
    description: `Despacho con oficina real en ${site.address.city}, ${site.address.department}. Atención presencial con cita previa.`,
  },
  {
    icon: Phone,
    title: 'Atención directa',
    description: 'El abogado responsable del área atiende su caso, sin intermediarios. Un único punto de contacto por expediente.',
  },
  {
    icon: ShieldCheck,
    title: 'Confidencialidad',
    description: 'Toda comunicación está protegida por el secreto profesional del abogado y la normativa hondureña de protección de datos.',
  },
  {
    icon: FileText,
    title: 'Presupuesto por escrito',
    description: 'Antes de cualquier actuación profesional se entrega un presupuesto por escrito con alcance y honorarios.',
  },
  {
    icon: Users,
    title: 'Equipo con nombre',
    description: 'Tres socios con identidad pública dirigen las áreas. Conózcalos en la página del despacho.',
  },
] as const;

const LIMITS: readonly string[] = [
  'No se garantizan resultados: dependen del análisis individual de cada caso y de decisiones judiciales o administrativas ajenas al despacho.',
  'No se compromete respuesta inmediata: el compromiso es atender en horario hábil con la diligencia que cada asunto requiere.',
  'No se publican estadísticas de casos ganados ni tasas de éxito; esa información no es verificable ni éticamente publicable.',
  'El envío del formulario de consulta no implica aceptación formal del asunto: la relación profesional nace con el contrato.',
] as const;

export function TrustLimits({
  /** Enlace contextual mostrado al pie del bloque de confianza. */
  showLimitsLink = true,
}: {
  showLimitsLink?: boolean;
} = {}) {
  return (
    <Container size="lg" className="py-2">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        {/* Confianza: elementos confirmados */}
        <section aria-labelledby="trust-heading">
          <p className="eyebrow-rule text-accent-dark text-xs font-bold uppercase tracking-eyebrow mb-2">
            Confianza
          </p>
          <h2
            id="trust-heading"
            className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight text-balance"
          >
            Lo que sí podemos ofrecerle
          </h2>
          <ul className="mt-5 space-y-3.5">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/20">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text leading-snug">{item.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed text-pretty">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {showLimitsLink && (
            <Link
              href="/despacho"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Conozca el despacho y su forma de trabajo
            </Link>
          )}
        </section>

        {/* Límites: lo que no se garantiza */}
        <section
          aria-labelledby="limits-heading"
          className="rounded-lg border border-border-light bg-surface-alt/60 p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 rounded-lg bg-warning/15 text-warning flex items-center justify-center flex-shrink-0 border border-warning/30">
              <AlertCircle size={16} aria-hidden="true" />
            </span>
            <h2
              id="limits-heading"
              className="font-serif font-bold text-lg text-text leading-tight"
            >
              Lo que el despacho no garantiza
            </h2>
          </div>
          <ul className="space-y-2.5">
            {LIMITS.map((limit) => (
              <li
                key={limit}
                className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed text-pretty"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0"
                />
                <span>{limit}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xxs text-text-muted leading-relaxed">
            Esta información es general y no constituye asesoría jurídica. Para una
            evaluación de su caso concreto, solicite consulta.
          </p>
        </section>
      </div>
    </Container>
  );
}
