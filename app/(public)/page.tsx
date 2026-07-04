import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Scale,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Phone,
  Clock,
  Gavel,
} from 'lucide-react';
import { site, telHref } from '@/lib/site';
import { getPageContent, getEditablePagesMeta } from '@/lib/page-content-db';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { GoogleReviews } from '@/components/marketing/google-reviews';
import { MapEmbedLazy as MapEmbed } from '@/components/marketing/map-embed-lazy';
import { areasGenerales } from '@/data/areas-juridicas';
import { TrustBar } from '@/components/marketing/trust-bar';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { EditorialBlock } from '@/components/marketing/editorial-block';
import { TOP_ORGANIC_GUIDE_SLUGS } from '@/data/seo/high-intent-guides';

export const metadata: Metadata = {
  // Title absoluto para evitar "Pineda y Asociados — Abogados... Pineda y Asociados".
  // El tagline ya contiene el nombre del bufete (45 chars, óptimo para SERP).
  title: { absolute: site.tagline },
  description: site.description,
  // Canonical absoluto CON slash final. Si se usa '/' (relativo), Next lo
  // resuelve contra metadataBase y en la home genera '...com' sin slash,
  // lo que Bing interpreta como canonical mismatch ("this page is a redirect").
  // El absoluto garantiza 'https://www.pinedayasociadoshn.com/' exacto.
  alternates: { canonical: `${site.url}/` },
  keywords: ['abogados Nacaome', 'bufete jurídico Valle', 'defensa penal Nacaome', 'abogado penalista Valle', 'abogados San Lorenzo', 'abogados Choluteca', 'abogados Goascorán', 'abogados San Marcos de Colón', 'abogados El Triunfo', 'abogados Marcovia', 'abogados Pespire', 'abogados Namasigüe', 'abogados Orocuina', 'abogados sur Honduras', 'abogados zona sur Honduras', 'consulta legal gratuita Nacaome', 'despacho jurídico Nacaome'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    // OG/Twitter con guion simple (-) para evitar mojibake del em-dash en parsers.
    title: site.tagline,
    description: site.description,
    url: `${site.url}/`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [
      {
        url: `${site.url}/og-image.webp`,
        width: 1200,
        height: 630,
        alt: `${site.name} - Bufete jurídico en ${site.address.city}, ${site.address.department}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.tagline,
    description: site.description,
    images: [`${site.url}/og-image.webp`],
  },
};

export const revalidate = 3600;

const HIGHLIGHTED_AREAS = ['derecho-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];

export default async function HomePage() {
  // NOTA: el índice de búsqueda (searchIndex) se eliminó de la home para
  // reducir el RSC payload (~74 posts serializados). El buscador completo
  // vive en /blog. La home ahora ofrece un CTA ligero al blog.
  let contentMap: Record<string, string> = {};
  let homeMeta: { page: string; label: string; sections: { key: string; label: string; fields: { key: string; label: string; type: string; default?: string }[] }[] } | undefined;
  try {
    const [cm, ml] = await Promise.all([
      getPageContent('home'),
      getEditablePagesMeta(),
    ]);
    contentMap = cm;
    homeMeta = ml.find(m => m.page === 'home');
  } catch {
    // DB unavailable — use defaults only
  }

  const defaults: Record<string, string> = {};
  if (homeMeta) {
    for (const section of homeMeta.sections) {
      for (const field of section.fields) {
        const key = `${section.key}.${field.key}`;
        if ((field as { default?: string }).default !== undefined) {
          defaults[key] = (field as { default?: string }).default!;
        }
      }
    }
  }
  const merged: Record<string, string> = { ...defaults, ...contentMap };
  const t = (k: string): string => merged[k] ?? '';

  const PROCESS = [
    { step: 1, title: t('process.step1_title'), desc: t('process.step1_desc') },
    { step: 2, title: t('process.step2_title'), desc: t('process.step2_desc') },
    { step: 3, title: t('process.step3_title'), desc: t('process.step3_desc') },
    { step: 4, title: t('process.step4_title'), desc: t('process.step4_desc') },
  ];

  const WHY_POINTS = [
    { icon: MapPin, title: t('why_us.reason1_title'), description: t('why_us.reason1_desc') },
    { icon: Scale, title: t('why_us.reason2_title'), description: t('why_us.reason2_desc') },
    { icon: ShieldCheck, title: t('why_us.reason3_title'), description: t('why_us.reason3_desc') },
    { icon: HeartHandshake, title: t('why_us.reason4_title'), description: t('why_us.reason4_desc') },
    { icon: BookOpen, title: t('why_us.reason5_title'), description: t('why_us.reason5_desc') },
  ];

  // FAQ i18n: se conserva como datos para el schema JSON-LD (rich result
  // FAQPage), pero el render visual se mueve a /preguntas-frecuentes para
  // evitar la triplicación (home + despacho + página FAQ). Mismo SEO AEO,
  // UI más limpia. Ver Fase 3.1 del plan maestro.
  const FAQ = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      {/* HERO — potente pero equilibrado: texto (7 col) + panel informativo (5 col).
          Sin imágenes dominantes; capas de fondo no fotográficas (grid + halos). */}
      <section className="relative bg-hero-gradient text-text-inverse overflow-hidden">
        {/* Foto de fondo translúcida (litigio / tribunal) sobre el gradiente
            azul del hero: aporta profundidad y textura sin competir con el
            texto. Opacidad baja para mantener la legibilidad del contenido. */}
        <div
          className="absolute inset-0 pointer-events-none bg-no-repeat bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/penal/litigio-complejo.webp')",
            opacity: 0.22,
          }}
          aria-hidden="true"
        />
        {/* Veladura azul que preserva el contraste del texto inverso sobre la
            foto: más densa a la izquierda (donde va el copy, col-span-7) y
            algo más abierta en el centro para que se aprecie la textura. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(100deg, rgba(13,27,62,0.80) 0%, rgba(13,27,62,0.42) 55%, rgba(13,27,62,0.66) 100%)' }}
          aria-hidden="true"
        />
        {/* Capas de fondo no fotográficas: grid sutil + halos dorados radiales. */}
        <div className="absolute inset-0 pointer-events-none bg-grid opacity-40" aria-hidden="true" />
        <div className="absolute inset-0 opacity-80 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-[24rem] h-[24rem] rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute -bottom-32 -left-24 w-[20rem] h-[20rem] rounded-full bg-accent-dark/15 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-primary-light/20 blur-[100px]" />
        </div>
        <div
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <Container size="lg" className="relative py-8 md:py-12 lg:py-16">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <HeroOfficeBadge />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light/50 border border-primary-light/40 text-text-inverse/90 backdrop-blur-sm">
                  <span className="text-xxs font-bold tracking-wider">{t('hero.badge')}</span>
                </span>
              </div>
              <h1 className="font-serif font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight text-text-inverse text-balance">
                Defensa penal y asesoría jurídica en Nacaome y Honduras
              </h1>
              <p className="mt-4 text-base md:text-lg text-text-inverse/90 leading-relaxed max-w-2xl text-pretty">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/85">
                  <CheckCircle2 size={13} className="text-accent" /> {t('hero.check1')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/85">
                  <CheckCircle2 size={13} className="text-accent" /> {t('hero.check2')}
                </span>
              </div>
              <CTAGroup variant="inverse" className="mt-6" />
            </div>
            {/* Panel visual complementario (lg:col-span-5): equilibra la
                composición del hero con datos verificados (site, áreas), sin
                inventar métricas (R4). Panel translúcido con textura de marca. */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="relative rounded-2xl border border-accent/25 bg-primary-dark/40 backdrop-blur-md p-5 shadow-[0_24px_60px_-24px_rgba(6,14,32,0.6)]">
                <div className="absolute inset-0 pointer-events-none rounded-2xl bg-grid opacity-40" aria-hidden="true" />
                <div className="relative space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30">
                      <Gavel size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-inverse leading-tight">Defensa penal como pilar</p>
                      <p className="text-xs text-text-inverse/75 leading-relaxed mt-1">
                        Abogados de Pineda y Asociados con presencia activa en juzgados del sur de Honduras para defensa penal y asesoría jurídica.
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-text-inverse/10" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xxs font-bold uppercase tracking-wider text-accent">Cobertura</p>
                      <p className="text-sm font-semibold text-text-inverse mt-1">{site.address.city}, {site.address.department}</p>
                      <p className="text-xs text-text-inverse/70 mt-0.5">San Lorenzo · Choluteca · Goascorán y más</p>
                    </div>
                    <div>
                      <p className="text-xxs font-bold uppercase tracking-wider text-accent">Horario</p>
                      <p className="text-sm font-semibold text-text-inverse mt-1">Lun a Sáb</p>
                      <p className="text-xs text-text-inverse/70 mt-0.5 tabular-nums">{site.hours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <CheckCircle2 size={13} className="text-accent flex-shrink-0" />
                    <p className="text-xs text-text-inverse/80">Consulta inicial sin costo · Presupuesto por escrito</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TRUST BAR — sellos de autoridad (strip compacto) */}
      <TrustBar background="light" />

      {/* ÁREAS DESTACADAS + PILAR PENAL (Fase 3.1 revisada).
          Las 4 áreas principales en grid + la card del pilar penal como cierre
          narrativo de la sección, integrada y con contexto. Antes la card del
          pilar estaba en una sección separada ("Por qué elegirnos") donde en
          móvil/tablet quedaba flotando sin conexión visual con las áreas. */}
      <Section background="muted" spacing="md" ariaLabel="Áreas destacadas">
        <SectionHeader
          eyebrow="Especialidades principales"
          title={t('specialties.title')}
          subtitle={t('specialties.subtitle')}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {areasGenerales
            .filter((a) => HIGHLIGHTED_AREAS.includes(a.slug))
            .map((area) => {
              const areaSlug = area.slug === 'derecho-penal' ? '/derecho-penal' : `/servicios-juridicos/${area.slug}`;
              return (
                <ServiceCard
                  key={area.slug}
                  href={areaSlug}
                  slug={area.slug}
                  title={area.titulo}
                  description={area.resumen}
                  category="services"
                  tone={area.color as PlaceholderTone}
                  aspect="4/3"
                />
              );
            })}
        </div>
        {/* Pilar penal — cierre narrativo de la sección de áreas.
            Contextualiza por qué defensa penal encabeza el grid. */}
        <div className="mt-6">
          <Card padding="md" className="card-premium border-accent/20">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-accent/15 border border-accent/30 text-accent-dark flex items-center justify-center flex-shrink-0">
                <Gavel size={20} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <strong className="font-bold text-sm text-text leading-tight block">
                  Defensa penal como pilar histórico del bufete
                </strong>
                <p className="text-sm text-text-secondary leading-relaxed mt-1.5 text-pretty">
                  Bufete fundado en Nacaome con presencia activa en juzgados del sur de Honduras.
                  Atención directa del abogado responsable en cada área, coordinación interna
                  cuando un caso cruza varias ramas del derecho, y presupuesto por escrito antes
                  de cualquier actuación.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <CheckCircle2 size={12} className="text-accent-dark" /> +15 años de ejercicio
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <CheckCircle2 size={12} className="text-accent-dark" /> Estrategia unificada
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <CheckCircle2 size={12} className="text-accent-dark" /> Un solo expediente
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* POR QUÉ ELEGIRNOS — bloque editorial narrativo (Fase 3.1).
          Cinco razones del bufete en formato editorial, con respiración.
          El claim multidisciplinar y el equipo se referencian vía enlace a
          /despacho, dueño canónico de ese contenido. */}
      <Section background="warm" spacing="lg" ariaLabel="Por qué elegirnos" className="section-breath">
        <EditorialBlock
          eyebrow="Por qué elegirnos"
          title={t('why_us.title')}
          intro={t('why_us.subtitle')}
          points={WHY_POINTS}
          cta={{ href: '/despacho', label: 'Conozca el despacho' }}
        />
      </Section>

      {/* CÓMO TRABAJAMOS — proceso de atención (stepper) */}
      <Section spacing="md" ariaLabel="Proceso de atención">
        <SectionHeader
          eyebrow="Cómo trabajamos"
          title={t('process.title')}
          subtitle={t('process.subtitle')}
        />
        <ProcessStepper steps={PROCESS} withConnector />
      </Section>

      {/* GOOGLE REVIEWS — reseñas reales verificadas del perfil de Google Business */}
      <GoogleReviews />

      {/* GUÍAS DESTACADAS — enlazado interno home→blog (crawl path).
          layout="list" (Fase 2.2) para diferenciar visualmente de los grids
          de tarjetas anteriores y dar respiración. */}
      <BlogHighlights
        background="muted"
        layout="list"
        eyebrow="Guías jurídicas destacadas"
        title="Recursos legales para entender su caso"
        subtitle="Guías prácticas sobre las consultas más frecuentes de nuestros clientes en derecho penal, laboral, familiar y notarial."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
        slugs={[...TOP_ORGANIC_GUIDE_SLUGS]}
      />

      {/* VISÍTENOS — bloque de cercanía con datos de contacto + mapa.
          Conserva el rol de la sección original pero más compacto. */}
      <Section spacing="md" ariaLabel="Visítenos">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          <div className="flex flex-col">
            <p className="eyebrow-rule text-accent-dark mb-4">Visítenos</p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight text-balance">
              Prefiere vernos en persona
            </h2>
            <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed max-w-xl text-pretty">
              Con cita previa, le recibimos en nuestro despacho de Nacaome con la confidencialidad
              y el tiempo que su caso merece. Si prefiere no desplazarse, también le atendemos por
              teléfono o WhatsApp en horario hábil.
            </p>
            <ul className="mt-6 space-y-2.5">
              <li>
                <Link
                  href="/como-llegar"
                  title="Dirección y mapa del bufete Pineda y Asociados en Nacaome, Valle"
                  className="group flex items-start gap-3.5 rounded-lg p-2 -mx-2 hover:bg-surface transition-colors focus-visible:outline-none"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">Dirección</p>
                    <p className="text-sm font-semibold text-text leading-snug mt-0.5">{site.address.line1}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{site.address.line2}</p>
                    <p className="text-xs text-text-secondary">{site.address.city}, {site.address.department}, {site.address.country}</p>
                  </div>
                </Link>
              </li>
              <li>
                <a
                  href={telHref()}
                  title="Llamar a Pineda y Asociados — abogados en Nacaome, Valle"
                  className="group flex items-start gap-3.5 rounded-lg p-2 -mx-2 hover:bg-surface transition-colors focus-visible:outline-none"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <Phone size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">Teléfono</p>
                    <p className="text-sm font-semibold text-primary leading-snug mt-0.5 tabular-nums group-hover:text-accent-dark transition-colors">{site.phoneDisplay}</p>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3.5 rounded-lg p-2 -mx-2">
                <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">Horario</p>
                  <p className="text-sm font-semibold text-text leading-snug mt-0.5">{site.hours}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Con cita previa</p>
                </div>
              </li>
            </ul>
            <div className="mt-7">
              <CTAGroup variant="inline" />
            </div>
            <Link href="/como-llegar" title="Indicaciones para llegar al bufete Pineda y Asociados en Nacaome, Valle" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
              indicaciones para llegar al bufete <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col">
            <Card padding="none" className="overflow-hidden aspect-[4/3] lg:aspect-auto lg:flex-1 bg-surface-alt">
              <MapEmbed />
            </Card>
          </div>
        </div>
      </Section>

      {/* CTA FINAL — llamada a la acción premium (componente compartido).
          Con enlace contextual a /preguntas-frecuentes (antes era una sección
          visual completa FAQ que duplicaba el hub FAQ canónico). */}
      <ConsultationCTA
        variant="closing"
        subtitle="Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones legales disponibles. Atendemos en Nacaome, San Lorenzo, Amapala, Langue, Goascorán, Choluteca, Pespiré, San Marcos de Colón, Marcovia y El Triunfo. Presupuesto por escrito antes de cualquier actuación. Sus datos están protegidos por el secreto profesional del abogado."
      />

      {/* Schema.org JSON-LD — FAQPage (las 6 preguntas i18n se conservan
          para rich results AEO/GEO; el render visual vive en
          /preguntas-frecuentes para evitar triplicación). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
