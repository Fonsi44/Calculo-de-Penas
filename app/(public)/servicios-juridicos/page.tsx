import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ContactStrip, CTAGroup } from '@/components/marketing/cta-buttons';
import { PremiumServiceGrid } from '@/components/marketing/premium-service-grid';
import { breadcrumbsSchema, itemListSchema, serviceSchema } from '@/lib/schemas/legal-page';
import { premiumServices } from '@/lib/data/service-catalog';

export const metadata: Metadata = {
  title: `Servicios Jurídicos | ${site.name}`,
  description: `Las 13 áreas del derecho que manejamos en ${site.name}: penal, familia, laboral, civil, mercantil, tributario, bancario, administrativo, aduanero, sanitario, propiedad intelectual, ambiental, conciliación y arbitraje en Nacaome, Valle, Honduras.`,
  alternates: { canonical: '/servicios-juridicos' },
};

export default function ServiciosJuridicosPage() {
  const url = absoluteUrl('/servicios-juridicos');
  const breadcrumbs = breadcrumbsSchema([
    { name: 'Inicio', url: absoluteUrl('/') },
    { name: 'Servicios Jurídicos', url },
  ]);
  const itemList = itemListSchema(
    'Servicios jurídicos',
    premiumServices.map((s) => ({
      name: s.titulo,
      url: absoluteUrl(`/servicios-juridicos/${s.slug}`),
    })),
  );
  const servSchema = serviceSchema({
    slug: 'servicios-juridicos',
    name: `Servicios Jurídicos — ${site.name}`,
    description: `Bufete multidisciplinario con 13 áreas de práctica en Nacaome, Valle, Honduras.`,
    serviceType: 'LegalService',
    keywords: site.keywords,
    url,
  });

  return (
    <>
      <PageHero
        eyebrow="Servicios Jurídicos"
        badge="Cobertura integral"
        title="13 áreas del derecho para defender y asesorarle en cualquier frente"
        subtitle={
          <>
            Desde Nacaome, Valle, ofrecemos cobertura legal integral en {premiumServices.length}{' '}
            disciplinas del derecho hondureño. La defensa penal es nuestra especialidad destacada
            y la acompañamos con servicios especializados en familia, laboral, civil, mercantil,
            tributario y más.
          </>
        }
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Áreas de práctica"
          title="Cobertura legal completa en Honduras"
          subtitle="Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes."
        />
        <PremiumServiceGrid />
      </Section>

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-accent/15 flex items-center justify-center mb-4">
            <Scale size={24} className="text-accent-dark" />
          </div>
          <p className="text-[13px] font-bold uppercase tracking-widest text-accent-dark mb-2">
            ¿No encuentra lo que busca?
          </p>
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Cada caso es único. Si su situación no encaja exactamente en una de las
            áreas descritas, consúltenos sin compromiso. Analizaremos su caso y le
            orientaremos sobre la vía legal más adecuada.
          </p>
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-white text-base font-bold hover:opacity-90 transition-opacity"
          >
            Solicitar consulta confidencial <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <Section background="muted" spacing="sm">
        <ContactStrip />
      </Section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servSchema) }} />
    </>
  );
}
