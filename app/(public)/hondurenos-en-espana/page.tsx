import type { Metadata } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ContactStrip, CTAGroup } from '@/components/marketing/cta-buttons';
import { hubMigrantes } from '@/data/areas-juridicas';
import { areaSchemas } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';
import { PlaceholderPhoto } from '@/components/marketing/placeholder-photo';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `Hondureños en España | ${site.name}`,
  description: `Asistencia legal integral para la comunidad hondureña en España: gestión documental, actos notariales internacionales y asuntos civiles y familiares entre Honduras y España. ${site.name}.`,
  alternates: { canonical: '/hondurenos-en-espana' },
};

export default function HondurenosEnEspanaPage() {
  const url = absoluteUrl('/hondurenos-en-espana');
  const ldSchemas = areaSchemas({
    service: {
      slug: 'hondurenos-en-espana',
      name: `Hondureños en España — ${site.name}`,
      description: hubMigrantes.descripcion,
      serviceType: 'LegalService',
      keywords: hubMigrantes.keywords,
      url,
    },
    faqs: hubMigrantes.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Hondureños en España', url },
    ],
    url,
  });

  return (
    <>
      <PageHero
        eyebrow={hubMigrantes.heroEyebrow}
        badge="Asistencia transnacional"
        title={hubMigrantes.heroTitle}
        subtitle={<>{hubMigrantes.heroSubtitle}</>}
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios transnacionales"
          title="Honduras y España, una sola atención"
          subtitle="Resolvemos sus trámites legales entre Honduras y España con pleno efecto jurídico en ambos países."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hubMigrantes.subareas.map((sub) => {
            const Icon = getIcon(sub.icono);
            return (
              <Link
                key={sub.slug}
                href={`/hondurenos-en-espana/${sub.slug}`}
                className="card-premium group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-premium focus-visible:outline-none"
              >
                <PlaceholderPhoto
                  tone="migrante"
                  aspect="16/9"
                  rounded="none"
                  label={sub.titulo}
                  className="w-full"
                />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-text leading-tight">{sub.titulo}</h3>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed text-pretty">
                    {sub.resumen}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-primary group-hover:text-accent-dark transition-colors">
                    Conocer más
                    <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title="Dudas habituales sobre trámites Honduras-España"
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {hubMigrantes.faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-100 bg-white border-l-4 border-l-accent p-4"
            >
              <h3 className="font-bold text-[15px] text-text leading-tight mb-1.5">
                {faq.pregunta}
              </h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                {faq.respuesta}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section background="muted" spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Si reside en España y necesita gestionar trámites legales en Honduras,
            podemos ayudarle. Consúltenos sin compromiso y le explicaremos el
            procedimiento paso a paso.
          </p>
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-white text-base font-bold hover:opacity-90 transition-opacity"
          >
            Solicitar consulta confidencial <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <Section spacing="sm">
        <ContactStrip />
      </Section>

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
}
