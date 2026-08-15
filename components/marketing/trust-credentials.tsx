import { Award, BadgeCheck, MapPinned, ShieldCheck } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';

/**
 * Señales de confianza verificables. No publica testimonios ni reseñas
 * inventadas (content-policy: unauthorized_testimonial).
 */
export function TrustCredentials() {
  return (
    <Section background="muted" spacing="md" ariaLabel="Confianza y respaldo profesional">
      <SectionHeader
        eyebrow="Confianza"
        title="Respaldo profesional, no promesas vacías"
        subtitle="Más de 15 años en Nacaome, Valle y el sur de Honduras. Colegiación, sede física y secreto profesional. No publicamos citas inventadas. Cuando el despacho autorice reseñas reales verificadas, las mostraremos aquí."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-border-light bg-surface p-5 h-full">
            <div className="w-11 h-11 rounded-lg bg-primary/8 text-primary flex items-center justify-center border border-primary/15">
              <Award size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-serif text-lg font-extrabold text-primary">+15 años</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Ejercicio jurídico en el sur de Honduras, con defensa penal como área principal.
            </p>
          </article>
          <article className="rounded-lg border border-border-light bg-surface p-5 h-full">
            <div className="w-11 h-11 rounded-lg bg-primary/8 text-primary flex items-center justify-center border border-primary/15">
              <BadgeCheck size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-serif text-lg font-extrabold text-primary">Colegiación</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Los socios abogados del despacho están colegiados en Honduras. Atención directa, sin intermediarios.
            </p>
          </article>
          <article className="rounded-lg border border-border-light bg-surface p-5 h-full">
            <div className="w-11 h-11 rounded-lg bg-primary/8 text-primary flex items-center justify-center border border-primary/15">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-serif text-lg font-extrabold text-primary">Secreto profesional</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Cada consulta se trata con confidencialidad. Evaluación inicial confidencial y presupuesto por escrito.
            </p>
          </article>
          <article className="rounded-lg border border-border-light bg-surface p-5 h-full">
            <div className="w-11 h-11 rounded-lg bg-primary/8 text-primary flex items-center justify-center border border-primary/15">
              <MapPinned size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-serif text-lg font-extrabold text-primary">Google Business</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Sede en {site.address.city}, {site.address.department}. Consulte ubicación, horario y perfil oficial.
            </p>
            <a
              href={site.googleBusiness}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent-dark hover:text-primary focus-visible:outline-none"
            >
              Ver perfil en Google Maps
            </a>
          </article>
        </div>
    </Section>
  );
}
