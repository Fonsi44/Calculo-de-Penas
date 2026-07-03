import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, MessageCircle } from 'lucide-react';
import { site, absoluteUrl, whatsappHref, FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from '@/lib/site';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { areasGenerales, getAreaBySlug, type AreaStandalone } from '@/data/areas-juridicas';
import { areaHref, areaSchemas } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { sanitizeHtml } from '@/lib/sanitize';
import { LeadMagnetCTA } from '@/components/marketing/lead-magnet-cta';
import { getLeadMagnetByArea } from '@/lib/lead-magnets';
import { getPostsByCategory, formatDate } from '@/lib/blog';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { RelatedCities } from '@/components/marketing/related-links';

/**
 * Mapa de slug de área → abogado/a especialista que la dirige.
 * Drive el bloque «Su abogado/a» y refuerza E-E-A-T alineando title↔H1↔autor.
 * Los perfiles (Person @id) se definen en lib/site.ts y se inyectan vía
 * JSON-LD global en app/(public)/layout.tsx.
 */
type LawyerProfile = {
  name: string;
  jobTitle: string;
  image: string;
  imageAltText: string;
  tagline: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
};

const AREA_LAWYER: Record<string, LawyerProfile> = {
  'derecho-penal': {
    name: FOUNDER_PROFILE.name,
    jobTitle: FOUNDER_PROFILE.jobTitle,
    image: FOUNDER_PROFILE.imageAlt,
    imageAltText: FOUNDER_PROFILE.imageAltText ?? 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)',
    tagline: 'Defensa penal como pilar histórico del bufete',
    description: 'Más de 15 años de ejercicio profesional. Audiencias iniciales, preliminares, de sobreseimiento, juicio oral y recursos de casación en el departamento de Valle y la zona sur.',
    ctaHref: '/derecho-penal',
    ctaLabel: 'Ver defensa penal',
  },
  'derecho-de-familia': {
    name: THANIA_PROFILE.name,
    jobTitle: THANIA_PROFILE.jobTitle,
    image: THANIA_PROFILE.image,
    imageAltText: THANIA_PROFILE.imageAltText,
    tagline: 'Derecho de Familia · Civil y Notarial · Mercantil · Administrativo',
    description: 'Socia fundadora del bufete. Atiende divorcios, custodia, pensión de alimentos, sucesiones, violencia intrafamiliar y mediación familiar en Nacaome, Valle y la zona sur.',
    ctaHref: whatsappHref('Hola, necesito consultar sobre un caso de derecho de familia.'),
    ctaLabel: 'Hablar con ella por WhatsApp',
  },
  'derecho-laboral': {
    name: EMIL_PROFILE.name,
    jobTitle: EMIL_PROFILE.jobTitle,
    image: EMIL_PROFILE.image,
    imageAltText: EMIL_PROFILE.imageAltText,
    tagline: 'Derecho Laboral · Penal · Civil y Notarial',
    description: 'Socio del bufete. Despidos injustificados, prestaciones, accidentes de trabajo, acoso laboral, juicio oral laboral y recursos de casación laboral en Valle y la zona sur.',
    ctaHref: whatsappHref('Hola, necesito consultar sobre un caso de derecho laboral.'),
    ctaLabel: 'Hablar con él por WhatsApp',
  },
  'derecho-civil-y-notarial': {
    name: THANIA_PROFILE.name,
    jobTitle: THANIA_PROFILE.jobTitle,
    image: THANIA_PROFILE.image,
    imageAltText: THANIA_PROFILE.imageAltText,
    tagline: 'Civil y Notarial · Mercantil · Familia · Administrativo',
    description: 'Socia fundadora del bufete. Compraventas, donaciones, hipotecas, poderes notariales, sociedades civiles, fideicomisos, prescripción adquisitiva y daños y perjuicios.',
    ctaHref: whatsappHref('Hola, necesito consultar sobre un caso de derecho civil o notarial.'),
    ctaLabel: 'Hablar con ella por WhatsApp',
  },
  'derecho-mercantil-empresarial': {
    name: THANIA_PROFILE.name,
    jobTitle: THANIA_PROFILE.jobTitle,
    image: THANIA_PROFILE.image,
    imageAltText: THANIA_PROFILE.imageAltText,
    tagline: 'Mercantil y Empresarial · Civil · Administrativo · Familia',
    description: 'Socia fundadora del bufete. Constitución de sociedades, contratos mercantiles, gobierno corporativo, compliance, protección al consumidor, propiedad industrial y quiebras.',
    ctaHref: whatsappHref('Hola, necesito consultar sobre un caso de derecho mercantil o empresarial.'),
    ctaLabel: 'Hablar con ella por WhatsApp',
  },
  'derecho-administrativo-y-servicio-civil': {
    name: THANIA_PROFILE.name,
    jobTitle: THANIA_PROFILE.jobTitle,
    image: THANIA_PROFILE.image,
    imageAltText: THANIA_PROFILE.imageAltText,
    tagline: 'Administrativo y Servicio Civil · Mercantil · Civil · Familia',
    description: 'Socia fundadora del bufete. Recursos administrativos, nulidad de actos, servicio civil, contratación del Estado, sanciones y litigio administrativo en Honduras.',
    ctaHref: whatsappHref('Hola, necesito consultar sobre un caso de derecho administrativo.'),
    ctaLabel: 'Hablar con ella por WhatsApp',
  },
};

/** Mapa de slug de servicio a slug de categoría de blog */
const SERVICE_TO_BLOG_CATEGORY: Record<string, string> = {
  'derecho-penal': 'derecho-penal',
  'derecho-de-familia': 'derecho-de-familia',
  'derecho-laboral': 'derecho-laboral',
  'derecho-civil-y-notarial': 'derecho-civil',
  'derecho-mercantil-empresarial': 'derecho-mercantil',
  'derecho-bancario-y-financiero': 'derecho-bancario',
  'derecho-administrativo-y-servicio-civil': 'derecho-administrativo',
  'derecho-aduanero-y-comercio-exterior': 'derecho-aduanero',
  'regulacion-sanitaria': 'regulacion-sanitaria',
  'extranjeria-en-honduras': 'extranjeria-migracion',
  'propiedad-intelectual': 'propiedad-intelectual',
  'tributario-fiscal': 'tributario',
  'ambiental-regulatorio': 'derecho-ambiental',
  'conciliacion-y-arbitraje': 'conciliacion-arbitraje',
};

export function generateStaticParams() {
  return areasGenerales.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};

  const descPlain = stripHtml(area.descripcion);

  const OG_IMAGES: Record<string, string> = {
    'derecho-de-familia': '/og/familia.webp',
    'derecho-laboral': '/og/laboral.webp',
    'derecho-civil-y-notarial': '/og/civil.webp',
    'derecho-penal': '/og/penal.webp',
  };
  const ogImage = OG_IMAGES[slug];

  const canonical = `/servicios-juridicos/${slug}`;
  return {
    title: area.titulo,
    description: `${descPlain.substring(0, 100)} Consulta confidencial en ${site.name}, Nacaome, Valle.`,
    alternates: { canonical },
    keywords: area.keywords,
    twitter: {
      card: 'summary_large_image',
      title: `${area.titulo} | ${site.name}`,
      description: descPlain.substring(0, 155),
      images: [`${site.url}${ogImage || '/og-image.webp'}`],
    },
    openGraph: {
      title: `${area.titulo} | ${site.name}`,
      description: descPlain.substring(0, 155),
      url: `${site.url}${canonical}`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}${ogImage || '/og-image.png'}`, width: 1200, height: 630, alt: area.titulo }],
    },
  };
}

export default async function AreaStandalonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();

  const url = areaHref(slug);
  const Icon = getIcon(area.icono);

  const related = area.areasRelacionadas
    .map((rSlug) => areasGenerales.find((a) => a.slug === rSlug))
    .filter((a): a is AreaStandalone => Boolean(a));

  const ldSchemas = areaSchemas({
    service: {
      slug,
      name: `${area.titulo} — ${site.name}`,
      description: area.descripcion,
      // serviceType describe la categoría textual del servicio (no el @type
      // de la organización). Antes era 'LegalService', que es el tipo de
      // entidad del provider, no del servicio en sí → error de structured data.
      serviceType: area.titulo,
      keywords: area.keywords,
      url,
    },
    faqs: area.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Servicios Jurídicos', url: absoluteUrl('/servicios-juridicos') },
      { name: area.titulo, url },
    ],
    url,
  });

  const blogCategory = SERVICE_TO_BLOG_CATEGORY[slug];
  const blogPosts = blogCategory ? (await getPostsByCategory(blogCategory)).slice(0, 3) : [];

  return (
    <>
      <Container>
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Servicios Jurídicos', href: '/servicios-juridicos' },
          { label: area.titulo },
        ]} />
      </Container>
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-10 md:py-14">
          <div className="max-w-3xl">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
              {area.heroEyebrow}
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {area.heroTitle}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {area.heroSubtitle}
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      {/* SU ABOGADO/A —bloque condicional por slug. Refuerza E-E-A-T
          alineando title↔H1↔entidad visible. Solo se renderiza si el área
          tiene abogado/a asignado en AREA_LAWYER. Retrato tamaño contenido
          para no dominar visualmente la página. */}
      {(() => {
        const lawyer = AREA_LAWYER[slug];
        if (!lawyer) return null;
        const isWhatsapp = lawyer.ctaHref.startsWith('https://wa.me/');
        return (
          <Section spacing="md">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start">
              <div className="flex-shrink-0 w-40 sm:w-44 lg:w-48">
                <div className="relative mx-auto max-w-[12rem]">
                  <div className="absolute -inset-4 rounded-2xl bg-accent/10 blur-3xl" aria-hidden="true" />
                  <div className="relative rounded-lg border border-accent/30 overflow-hidden bg-surface-alt aspect-[3/4]">
                    <Image
                      src={lawyer.image}
                      alt={lawyer.imageAltText}
                      width={400}
                      height={500}
                      className="w-full h-full object-cover"
                      sizes="(max-width: 1024px) 70vw, 192px"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <p className="eyebrow-rule text-accent-dark mb-3">Su abogado/a</p>
                <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight text-balance">
                  {lawyer.name}
                </h2>
                <p className="mt-2 text-sm font-bold uppercase tracking-eyebrow text-text-muted">
                  {lawyer.jobTitle}
                </p>
                <p className="mt-1 text-sm text-text-secondary leading-snug">
                  {lawyer.tagline}
                </p>
                <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed text-pretty max-w-xl">
                  {lawyer.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
                  {isWhatsapp ? (
                    <a
                      href={lawyer.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-success text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle size={16} /> {lawyer.ctaLabel}
                    </a>
                  ) : (
                    <Link
                      href={lawyer.ctaHref}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
                    >
                      {lawyer.ctaLabel} <ArrowRight size={14} />
                    </Link>
                  )}
                  <Link
                    href="/despacho"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border-light bg-surface text-text text-sm font-bold hover:border-accent/40 transition-colors"
                  >
                    Conozca el equipo <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </Section>
        );
      })()}

      <Section background="default" spacing="md">
        <div className="max-w-3xl">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Qué hacemos
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight">
            Servicios de {area.titulo.toLowerCase()}
          </h2>
          <div className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed [&_a]:text-accent-dark [&_a]:underline [&_a]:font-medium [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: sanitizeHtml(area.descripcion) }} />
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {area.subservicios.map((s, i) => (
            <div key={i} className="flex items-start gap-4 bg-surface rounded-lg border border-border-light p-5 hover:border-accent/40 transition-colors">
              <span className="w-11 h-11 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={20} className="text-accent-dark" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm md:text-base text-primary leading-snug">
                  {s.titulo}
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed mt-1">
                  {s.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title={`Dudas comunes sobre ${area.titulo.toLowerCase()}`}
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {area.faqs.map((faq, i) => (
            <Card key={i} padding="md" className="border-l-4 border-l-accent">
              <h3 className="font-bold text-sm text-text leading-tight mb-1.5">
                {faq.pregunta}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {faq.respuesta}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CLUSTER GEOGRÁFICO (Jul 2026): conecta cada servicio con las
          ciudades del sur. Antes los servicios no enlazaban a ninguna
          ciudad — era un cluster desconectado. Ahora cada servicio
          distribuye autoridad hacia las landings locales prioritarias. */}
      <Section spacing="sm">
        <div className="max-w-4xl">
          <RelatedCities limit={8} />
        </div>
      </Section>

      {related.length > 0 && (
        <Section background="muted" spacing="md">
          <SectionHeader
            eyebrow="Áreas relacionadas"
            title="Otros servicios que pueden interesarle"
            subtitle="Estas áreas complementan o están vinculadas con los servicios descritos."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((r) => {
              const RIcon = getIcon(r.icono);
              return (
                <Link key={r.slug} href={areaHref(r.slug)} className="group block focus-visible:outline-none">
                  <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/15">
                      <RIcon size={20} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                      {r.titulo}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                      {r.resumen}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                      Conocer más <ArrowRight size={12} />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {blogPosts.length > 0 && (
        <Section spacing="md">
          <SectionHeader
            eyebrow="Artículos relacionados"
            title={`Aprenda más sobre ${area.titulo.toLowerCase()}`}
            subtitle="Guías, consejos y análisis legales escritos por nuestro equipo."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.category}/${post.slug}`} className="group block focus-visible:outline-none">
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 text-accent-dark flex items-center justify-center mb-3 border border-accent/20">
                    <BookOpen size={20} aria-hidden="true" />
                  </div>
                  <p className="text-xxs font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                    {formatDate(post.publishedAt)}
                  </p>
                  <h3 className="font-bold text-sm text-text leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                    Leer artículo <ArrowRight size={12} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href={`/blog/${blogCategory}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver todos los artículos de {area.titulo.toLowerCase()} <ArrowRight size={16} />
            </Link>
          </div>
        </Section>
      )}

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          {area.destacado && (
            <Card padding="md" className="border-l-4 border-l-accent mb-6 text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-accent-dark mb-1">
                Dato destacado
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {area.destacado}
              </p>
            </Card>
          )}

        </div>
      </Section>

      {/* CTA de captación (lead magnet cuando existe el área) + cierre.
          Reducido de 4 a 2 bloques CTA: eliminado ContactStrip (redundante con
          ConsultationCTA y con el header global) para evitar saturación visual. */}
      {(() => {
        const magnet = getLeadMagnetByArea(slug);
        if (magnet) {
          return (
            <Section spacing="md">
              <LeadMagnetCTA
                area={magnet.area}
                titulo={magnet.titulo}
                descripcion={magnet.descripcion}
              />
            </Section>
          );
        }
        return null;
      })()}

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ConsultationCTA />
    </>
  );
}

