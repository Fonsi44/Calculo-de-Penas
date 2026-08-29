import { MapPin } from 'lucide-react';
import { absoluteUrl, site } from '@/lib/site';
import { Section, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { CargoHubBridge } from '@/components/marketing/cargo-hub-bridge';
import { LocalFaq } from '@/components/marketing/local-faq';
import { RelatedCities, RelatedServices, RelatedBlogArticles } from '@/components/marketing/related-links';
import {
  CARGO_HUB,
  CARGO_LAWYER,
  type CargoLanding,
} from '@/data/landings-cargo';

export { cargoMetadata } from '@/data/landings-cargo';

const AREA_SERVICE_SLUG: Record<CargoLanding['area'], string> = {
  penal: 'derecho-penal',
  familia: 'derecho-de-familia',
  laboral: 'derecho-laboral',
  civil: 'derecho-civil-y-notarial',
};

export function CargoLandingView({ cargo }: { cargo: CargoLanding }) {
  const url = absoluteUrl(cargo.path);
  const hub = CARGO_HUB[cargo.area];
  const lawyer = CARGO_LAWYER[cargo.lawyer];
  const firstName = lawyer.name.split(' ')[0];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: hub.crumb, href: hub.href },
          { label: cargo.h1 },
        ]}
      />

      <section className="bg-primary text-text-inverse py-16 md:py-20">
        <Container>
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            {cargo.heroEyebrow}
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4">
            {cargo.h1}
          </h1>
          <p className="text-base md:text-lg text-text-inverse/85 max-w-3xl mb-8">
            {cargo.heroSubtitle}
          </p>
          <CTAGroup
            variant="inverse"
            message={cargo.whatsappMsg}
            phone={lawyer.phone}
            phoneDisplay={lawyer.phoneDisplay}
            contactName={firstName}
          />
        </Container>
      </section>

      <CargoHubBridge
        hubHref={hub.href}
        hubLabel={hub.label}
        title={hub.title}
        body={hub.body(cargo.city)}
        profileHref={`/equipo/${lawyer.slug}`}
        profileLabel={`Perfil de ${firstName}`}
      />

      <Section background="default" spacing="md">
        <div className="max-w-3xl">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-4">
            {cargo.introTitle}
          </h2>
          <p className="text-text-secondary leading-relaxed">{cargo.intro}</p>
        </div>
      </Section>

      <Section background="muted" spacing="sm">
        <div className="max-w-3xl">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-2">
            Dato local verificable
          </p>
          <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary mb-3">
            {cargo.localProofTitle}
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed flex items-start gap-2">
            <MapPin size={16} className="text-accent-dark shrink-0 mt-0.5" aria-hidden="true" />
            <span>{cargo.localProof}</span>
          </p>
        </div>
      </Section>

      <LocalFaq
        faqs={cargo.faqs}
        url={url}
        title={`Preguntas locales · ${cargo.city}`}
      />

      <Section background="muted" spacing="md">
        <Container size="md">
          <div className="rounded-lg border border-border-light bg-surface px-6 py-8 md:px-10 md:py-10 text-center">
            <p className="eyebrow-label text-accent-dark">
              {`Evaluación inicial confidencial · ${firstName}`}
            </p>
            <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight mt-3 text-balance tracking-tight">
              {cargo.ctaTitle}
            </h2>
            <p className="mt-3 text-sm md:text-base text-text-secondary max-w-xl mx-auto leading-relaxed text-pretty">
              {cargo.ctaSubtitle}
            </p>
            <div className="mt-6 flex justify-center">
              <CTAGroup
                variant="inline"
                message={cargo.whatsappMsg}
                phone={lawyer.phone}
                phoneDisplay={lawyer.phoneDisplay}
                contactName={firstName}
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="sm">
        <Container size="lg" className="space-y-6">
          {cargo.relatedBlogLinks && cargo.relatedBlogLinks.length > 0 ? (
            <RelatedBlogArticles links={cargo.relatedBlogLinks} />
          ) : null}
          <RelatedServices
            currentSlug={AREA_SERVICE_SLUG[cargo.area]}
            limit={3}
            eyebrow="Áreas relacionadas"
          />
          <RelatedCities
            mentionedCitySlug={cargo.citySlug}
            limit={2}
            eyebrow="Atendemos en el sur de Honduras"
          />
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `${url}/#webpage`,
              url,
              name: cargo.title,
              description: cargo.description,
              inLanguage: 'es-HN',
              isPartOf: { '@id': `${site.url}/#website` },
              about: { '@id': `${site.url}/#legal-service` },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: hub.title, item: `${site.url}${hub.href}` },
                { '@type': 'ListItem', position: 3, name: cargo.h1, item: url },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
