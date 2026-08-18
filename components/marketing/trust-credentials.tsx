import { ArrowUpRight, Award, BadgeCheck, MapPinned, ShieldCheck } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { IconBadge } from '@/components/marketing/icon-badge';

/**
 * Señales de confianza verificables. No publica testimonios ni reseñas
 * inventadas (content-policy: unauthorized_testimonial).
 */
export function TrustCredentials() {
  return (
    <Section background="muted" spacing="lg" ariaLabel="Confianza y respaldo profesional">
      <SectionHeader
        eyebrow="Confianza"
        title="Respaldo profesional, no promesas vacías"
        subtitle="Más de 15 años en Nacaome, Valle y el sur de Honduras. Colegiación, sede física y secreto profesional. No publicamos citas inventadas. Cuando el despacho autorice reseñas reales verificadas, las mostraremos aquí."
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <article className="relative overflow-hidden rounded-lg border border-accent/25 bg-primary text-text-inverse p-6 md:p-8 lg:col-span-5 flex flex-col justify-between min-h-[16rem]">
          <div className="absolute inset-0 pointer-events-none bg-radial-accent opacity-70" aria-hidden="true" />
          <div className="relative">
            <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent flex items-center justify-center border border-accent/30">
              <Award size={20} aria-hidden="true" />
            </div>
            <p className="mt-6 font-serif font-bold text-5xl md:text-6xl leading-none tabular-nums text-text-inverse">
              +15
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-accent">
              años de ejercicio
            </p>
          </div>
          <p className="relative mt-6 text-sm text-text-inverse/80 leading-relaxed text-pretty">
            Ejercicio jurídico en el sur de Honduras, con defensa penal como área principal.
          </p>
        </article>

        <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-border-light bg-surface p-5 md:p-6 flex flex-col">
            <IconBadge icon={BadgeCheck} variant="primary" />
            <h3 className="mt-4 font-serif text-lg font-bold text-primary">Colegiación</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed text-pretty">
              Los socios abogados del despacho están colegiados en Honduras. Atención directa, sin intermediarios.
            </p>
          </article>

          <article className="rounded-lg border border-border-light bg-surface p-5 md:p-6 flex flex-col">
            <IconBadge icon={ShieldCheck} variant="primary" />
            <h3 className="mt-4 font-serif text-lg font-bold text-primary">Secreto profesional</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed text-pretty">
              Cada consulta se trata con confidencialidad. Evaluación inicial confidencial y presupuesto por escrito.
            </p>
          </article>

          <a
            href={site.googleBusiness}
            target="_blank"
            rel="noopener noreferrer"
            className="group sm:col-span-2 rounded-lg border border-border-light bg-surface p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <IconBadge icon={MapPinned} variant="accent" />
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-bold text-primary">Google Business</h3>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed text-pretty">
                Sede en {site.address.city}, {site.address.department}. Consulte ubicación, horario y perfil oficial.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-dark group-hover:text-primary shrink-0">
              Ver perfil en Google Maps
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </Section>
  );
}
