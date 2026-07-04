import Link from 'next/link';
import { ArrowRight, MapPin, Clock, Phone, MessageCircle, Scale, BookOpen } from 'lucide-react';
import { site, absoluteUrl, telHref, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { type LandingLocal } from '@/data/landings-locales';

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
  'derecho ambiental': '/servicios-juridicos/derecho-ambiental-regulatorio',
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
  const whatsappMsg = `Hola, soy de ${landing.ciudad} y necesito una consulta jurídica. Vi su sitio web.`;

  // Schema: FAQPage + BreadcrumbList específicos de la landing.
  // NOTA: LegalService/Organization/WebSite ya los inyecta el layout público
  // (con areaServed de 10 ciudades prioritarias). Aquí solo añadimos lo específico de la
  // página para no duplicar entidades con el mismo @id.
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
      about: { '@id': `${site.url}/#legal-service` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${url}#faqpage`,
      url,
      mainEntity: landing.faqs.map((f) => ({
        '@type': 'Question',
        name: f.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
      })),
    },
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
        <Container size="lg" className="relative py-10 md:py-14">
          <div className="max-w-3xl">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
              {landing.heroEyebrow}
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {landing.heroTitle}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {landing.heroSubtitle}
            </p>

            {/* NAP rápido para SEO local */}
            <dl className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
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

            <div className="mt-7">
              <CTAGroup variant="inverse" message={whatsappMsg} />
            </div>
          </div>
        </Container>
      </section>

      {/* Intro + contexto local */}
      <Section background="default" spacing="md">
        <div className="max-w-3xl">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight">
            {`Bufete de abogados con cobertura en ${landing.ciudad}`}
          </h2>
          <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed">
            {landing.intro}
          </p>
          {!landing.sedeFisica && (
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              {`Nuestra sede principal está en Nacaome, Valle, a ${landing.distanciaKm} km de ${landing.ciudad}. Coordinamos atención presencial y seguimiento de diligencias según su caso.`}
            </p>
          )}
        </div>
      </Section>

      {/* Servicios */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios jurídicos"
          title={`Áreas de práctica en ${landing.ciudad}`}
          subtitle="Atención legal multidisciplinaria con respaldo del Código Penal y la legislación hondureña vigente."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {landing.servicios.map((s, i) => {
            // Internal linking: enlazar cada servicio a su landing de área
            // dedicada en /servicios-juridicos/{slug}. Antes eran H3 mudos sin
            // href, rompiendo el clúster temático ciudad×área.
            const servicioHref = SERVICIO_SLUG_MAP[s.titulo.trim().toLowerCase()];
            const inner = (
              <>
                <span className="w-11 h-11 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Scale size={20} className="text-accent-dark" aria-hidden="true" />
                </span>
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
      </Section>

      {/* FAQ local */}
      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title={`Dudas comunes sobre abogados en ${landing.ciudad}`}
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {landing.faqs.map((faq, i) => (
            <Card key={i} padding="md" className="border-l-4 border-l-accent">
              <h3 className="font-bold text-sm text-text leading-tight mb-1.5">{faq.pregunta}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.respuesta}</p>
            </Card>
          ))}
        </div>
      </Section>

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
                  <div className="w-11 h-11 rounded-lg bg-accent/10 text-accent-dark flex items-center justify-center mb-3 border border-accent/20">
                    <BookOpen size={20} aria-hidden="true" />
                  </div>
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

      {/* CTA final — un único bloque, dinámico por ciudad */}
      <Section background="muted" spacing="md">
        <Card padding="lg" className="max-w-3xl mx-auto text-center border-accent/30">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">
            {`Consulta confidencial sin costo en ${landing.ciudad}`}
          </p>
          <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight mb-2">
            {`¿Necesita un abogado en ${landing.ciudad}?`}
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {`Cada caso es único. Cuéntenos el suyo y le orientamos sin compromiso. Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones legales. Atendemos en ${landing.ciudad}${landing.sedeFisica ? '' : ` y toda la zona sur`} de Honduras. Presupuesto por escrito antes de cualquier actuación.`}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <a
              href={whatsappHref(whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-success text-white text-sm font-bold btn-shadow-success btn-shadow-success-hover hover:opacity-95 transition-opacity focus-visible:outline-none"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp: {site.whatsappDisplay}
            </a>
            <Link
              href="/solicitar-consulta#formulario"
              className="btn-shimmer inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-white text-sm font-bold btn-shadow-primary btn-shadow-primary-hover hover:bg-primary-light transition-colors"
            >
              Solicitar consulta <ArrowRight size={16} />
            </Link>
            <a
              href={telHref()}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-surface border border-border-strong text-primary text-sm font-bold btn-shadow-secondary btn-shadow-secondary-hover hover:border-accent transition-colors focus-visible:outline-none"
            >
              <Phone size={18} aria-hidden="true" />
              Llamar ahora
            </a>
          </div>
        </Card>
      </Section>

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
