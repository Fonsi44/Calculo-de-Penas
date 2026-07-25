import Link from 'next/link';
import { ArrowRight, MapPin, Clock, Phone, Scale, BookOpen } from 'lucide-react';
import { site, absoluteUrl, telHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { HubFaq } from '@/components/marketing/hub-faq';
import { IconBadge } from '@/components/marketing/icon-badge';
import { type LandingLocal } from '@/data/landings-locales';
import { ViewLocalPageTracker } from '@/components/marketing/view-local-page-tracker';

/**
 * Mapa de títulos de servicio (en landings-locales.ts) → slug de área en
 * /servicios-juridicos/{slug}. Permite enlazar cada servicio listado en las
 * landings locales a su landing de área dedicada, cerrando el clúster temático
 * ciudad×área y mejorando el internal linking.
 *
 * Las claves se normalizan a minúsculas sin tildes para tolerar variantes.
 * Si un título no está aquí, el servicio se renderiza sin enlace (no rompe).
 */
const SERVICIO_SLUG_MAP: Record<string, string> = {
  'defensa penal': '/derecho-penal',
  'derecho penal': '/derecho-penal',
  'derecho de familia': '/servicios-juridicos/derecho-de-familia',
  'derecho laboral': '/servicios-juridicos/derecho-laboral',
  'derecho civil y notarial': '/servicios-juridicos/derecho-civil-y-notarial',
  'derecho civil': '/servicios-juridicos/derecho-civil-y-notarial',
  'derecho mercantil': '/servicios-juridicos/derecho-mercantil-empresarial',
  'derecho mercantil y empresarial': '/servicios-juridicos/derecho-mercantil-empresarial',
  'derecho bancario': '/servicios-juridicos/derecho-bancario-y-financiero',
  'derecho bancario y financiero': '/servicios-juridicos/derecho-bancario-y-financiero',
  'derecho administrativo': '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
  'derecho aduanero': '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
  'derecho aduanero y comercio exterior': '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
  'regulacion sanitaria': '/servicios-juridicos/regulacion-sanitaria',
  'regulación sanitaria': '/servicios-juridicos/regulacion-sanitaria',
  'extrtranjeria en honduras': '/servicios-juridicos/extranjeria-en-honduras',
  'extranjeria en honduras': '/servicios-juridicos/extranjeria-en-honduras',
  'propiedad intelectual': '/servicios-juridicos/propiedad-intelectual',
  'derecho tributario': '/servicios-juridicos/tributario-fiscal',
  'tributario fiscal': '/servicios-juridicos/tributario-fiscal',
  // Corregido (A-04, auditoría 2026-07-06): el slug canónico es
  // `ambiental-regulatorio` (sin prefijo `derecho-`), coherente con
  // data/areas-juridicas.ts, lib/internal-links.ts, public-footer.tsx y
  // data/seo/canonical-paths.json. Antes apuntaba a una ruta 404.
  'derecho ambiental': '/servicios-juridicos/ambiental-regulatorio',
  'conciliacion y arbitraje': '/servicios-juridicos/conciliacion-y-arbitraje',
  'conciliación y arbitraje': '/servicios-juridicos/conciliacion-y-arbitraje',
};

/**
 * Renderiza una landing local de SEO ("/abogados-en-{ciudad}").
 * Es un Server Component reutilizable: cada página estática
 * (`app/(public)/abogados-en-{slug}/page.tsx`) lo invoca con su landing.
 */
export function LandingLocalView({ landing }: { landing: LandingLocal }) {
  const canonical = landing.path ?? `/abogados-en-${landing.slug}`;
  const url = absoluteUrl(canonical);
  // Mensaje contextual para el CTAGroup del hero (Whats App pre-llenado).
  const whatsappMsg = `Hola, soy de ${landing.ciudad} y necesito una consulta jurídica. Vi su sitio web.`;

  // Schema: WebPage + Service (con areaServed por ciudad) + FAQPage +
  // BreadcrumbList específicos de la landing.
  // NOTA: LegalService/Organization/WebSite ya los inyecta el layout público
  // (con areaServed de 10 ciudades prioritarias). Aquí solo añadimos lo específico de la
  // página para no duplicar entidades con el mismo @id.
  // FASE 4 (§18): se usa Service (no LocalBusiness) para representar el área
  // atendida sin sugerir una sede local distinta de Nacaome. El proveedor
  // enlaza al LegalService canónico único.
  const ldSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: landing.title,
      description: landing.description,
      inLanguage: 'es-HN',
      isPartOf: { '@id': `${site.url}/#website` },
      about: { '@id': `${url}#service` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      name: `Servicios jurídicos para clientes de ${landing.ciudad}`,
      serviceType: 'Asesoría y representación jurídica',
      areaServed: [
        { '@type': 'City', name: landing.ciudad },
        { '@type': 'AdministrativeArea', name: landing.departamento },
      ],
      provider: { '@id': `${site.url}/#legal-service` },
      url,
    },
    // FASE 5: el schema FAQPage (@id `${url}#faqpage`) lo emite ahora <HubFaq>
    // más abajo en el JSX. Antes se duplicaba aquí y en el componente manual.
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl('/') },
        {
          '@type': 'ListItem',
          position: 2,
          name: `Abogados en ${landing.ciudad}`,
          item: url,
        },
      ],
    },
  ];

  return (
    <>
      <ViewLocalPageTracker locationSlug={landing.slug} />
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: `Abogados en ${landing.ciudad}` },
      ]} />
      {/* Hero */}
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-6 md:py-10">
          <div className="max-w-3xl">
            <p className="eyebrow-rule text-accent mb-2.5">
              {landing.heroEyebrow}
            </p>
            <h1 className="font-serif font-extrabold text-xl md:text-2xl lg:text-3xl leading-tight">
              {landing.heroTitle}
            </h1>
            <p className="mt-3 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {landing.heroSubtitle}
            </p>

            {/* NAP rápido para SEO local */}
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  {landing.sedeFisica
                    ? `${landing.ciudad}, ${landing.departamento}`
                    : `Atendemos ${landing.ciudad}`}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{site.hoursShort}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                <a href={telHref()} className="hover:underline">
                  {site.phoneDisplay}
                </a>
              </div>
            </dl>

            <div className="mt-4">
              <CTAGroup variant="inverse" message={whatsappMsg} />
            </div>
          </div>
        </Container>
      </section>

      {/* Intro + contexto local */}
      <Section background="default" spacing="md">
        <div className="max-w-3xl">
          <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight">
            {`Bufete de abogados con cobertura en ${landing.ciudad}`}
          </h2>
          <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
            {landing.intro}
          </p>
          {!landing.sedeFisica && (
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              {`Nuestra sede principal está en Nacaome, Valle, a ${landing.distanciaKm} km de ${landing.ciudad}. Coordinamos atención presencial y seguimiento de diligencias según su caso.`}
            </p>
          )}
          <Link
            href="/guia-legal-abogados-honduras"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            Guía para contratar abogado en Honduras <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* Servicios */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios jurídicos"
          title={`Áreas de práctica en ${landing.ciudad}`}
          subtitle="Atención legal multidisciplinaria con respaldo del Código Penal y la legislación hondureña vigente."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {landing.servicios.map((s, i) => {
            // Internal linking: enlazar cada servicio a su landing de área
            // dedicada en /servicios-juridicos/{slug}. Antes eran H3 mudos sin
            // href, rompiendo el clúster temático ciudad×área.
            const servicioHref = SERVICIO_SLUG_MAP[s.titulo.trim().toLowerCase()];
            const inner = (
              <>
                <IconBadge icon={Scale} variant="accent" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm md:text-base text-primary leading-snug group-hover:text-accent-dark transition-colors">{s.titulo}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mt-1">{s.descripcion}</p>
                </div>
              </>
            );
            return servicioHref ? (
              <Link
                key={i}
                href={servicioHref}
                className="group flex items-start gap-4 bg-surface rounded-lg border border-border-light p-5 hover:border-accent/40 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={i}
                className="flex items-start gap-4 bg-surface rounded-lg border border-border-light p-5"
              >
                {inner}
              </div>
            );
          })}
        </div>
        <div className="mt-5">
          <Link
            href="/servicios-juridicos"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            Ver las 14 áreas del derecho que atendemos <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* FAQ local — FASE 5: delega en HubFaq canónico (acordeón + JSON-LD).
          Antes eran Cards border-l-accent siempre abiertas + FAQPage manual
          duplicado en ldSchemas. HubFaq emite el FAQPage con mismo @id. */}
      <HubFaq
        faqs={landing.faqs}
        url={url}
        id="preguntas-frecuentes"
        eyebrow="Preguntas frecuentes"
        title={`Dudas comunes sobre abogados en ${landing.ciudad}`}
      />

      {/* Artículos relacionados (enlazado interno landing ↔ blog) */}
      {landing.postsRelacionados && landing.postsRelacionados.length > 0 && (
        <Section background="default" spacing="md">
          <SectionHeader
            eyebrow="Artículos relacionados"
            title={`Más información para ${landing.ciudad}`}
            subtitle="Guías prácticas escritas por nuestro equipo sobre trámites y asuntos legales en la región."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {landing.postsRelacionados.map((p) => (
              <Link
                key={`${p.categoria}/${p.slug}`}
                href={`/blog/${p.categoria}/${p.slug}`}
                className="group block focus-visible:outline-none"
              >
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                  <IconBadge icon={BookOpen} variant="accent" className="mb-3" />
                  <h3 className="font-bold text-sm text-text leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {p.titulo}
                  </h3>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                    {`Ver guía de ${landing.ciudad}`} <ArrowRight size={12} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* CTA final — coherente con el resto del sitio (Fase 3.6).
          Antes era una card manual personalizada con 3 botones que rompía el
          patrón de cierre de las demás páginas. Ahora usa ConsultationCTA
          variant='inline' con título contextualizado por ciudad; los CTAs
          duales (WhatsApp + Llamar) los aporta el componente compartido. */}
      <ConsultationCTA
        variant="inline"
        eyebrow={`Consulta confidencial sin costo en ${landing.ciudad}`}
        title={`¿Necesita un abogado en ${landing.ciudad}?`}
        subtitle={`Cada caso es único. Cuéntenos el suyo y le orientamos sin compromiso. Atendemos en ${landing.ciudad}${landing.sedeFisica ? '' : ' y toda la zona sur'} de Honduras, con presupuesto por escrito antes de cualquier actuación.`}
      />

      {ldSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
