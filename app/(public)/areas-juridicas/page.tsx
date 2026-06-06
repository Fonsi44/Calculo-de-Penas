import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { FeatureGrid, type FeatureItem } from '@/components/marketing/feature-grid';
import { areasGenerales } from '@/data/areas-juridicas';
import { areaHref, breadcrumbsSchema, itemListSchema, serviceSchema } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';

export const metadata: Metadata = {
  title: 'Áreas Jurídicas',
  description: `Conozca las 13 áreas de práctica de ${site.name}: derecho penal, de familia, laboral, civil, mercantil, bancario, administrativo, aduanero, sanitario, extranjería, propiedad intelectual, tributario, ambiental, conciliación y arbitraje en Nacaome, Valle, Honduras.`,
  alternates: { canonical: '/areas-juridicas' },
};

export default function AreasJuridicasPage() {
  const url = absoluteUrl('/areas-juridicas');
  const breadcrumbs = breadcrumbsSchema([{ name: 'Inicio', url: absoluteUrl('/') }, { name: 'Áreas Jurídicas', url }]);
  const itemList = itemListSchema('Áreas de práctica', areasGenerales.map((a) => ({ name: a.titulo, url: areaHref(a.slug) })));
  const servSchema = serviceSchema({
    slug: 'areas-juridicas',
    name: 'Áreas Jurídicas — Pineda y Asociados',
    description: 'Bufete multidisciplinario con 13 áreas de práctica en Nacaome, Valle, Honduras.',
    serviceType: 'LegalService',
    keywords: site.keywords,
    url,
  });

  return (
    <>
      <PageHero
        eyebrow="Áreas Jurídicas"
        badge="Cobertura integral"
        title="13 áreas del derecho para defender y asesorarle en cualquier frente"
        subtitle={
          <>
            Desde Nacaome, Valle, ofrecemos cobertura legal integral en {areasGenerales.length}{' '}
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
        <FeatureGrid
          bento
          cols={5}
          items={areasGenerales.map<FeatureItem>((area) => {
            const Icon = getIcon(area.icono);
            return {
              title: area.titulo,
              description: area.resumen,
              icon: Icon,
              href: areaHref(area.slug),
              tone: (area.color as FeatureItem['tone']) ?? 'primary',
              badge: area.slug === 'derecho-penal' ? 'Pilar' : undefined,
            };
          })}
        />
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
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity"
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
