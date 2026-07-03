import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Scale,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Phone,
  Briefcase,
  Clock,
  Gavel,
  Handshake,
  Building,
  BriefcaseBusiness,
  Users,
  Landmark,
} from 'lucide-react';
import { site, telHref, FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from '@/lib/site';
import { getPageContent, getEditablePagesMeta } from '@/lib/page-content-db';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { GoogleReviews } from '@/components/marketing/google-reviews';
import { MapEmbed } from '@/components/marketing/map-embed';
import { areasGenerales } from '@/data/areas-juridicas';
import { getFeaturedLandings } from '@/data/landings-locales';
import { TrustBar } from '@/components/marketing/trust-bar';
import { CoverageCityGrid } from '@/components/marketing/coverage-city-grid';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { SocialShare } from '@/components/marketing/social-share';
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
        url: `${site.url}/og-image.png`,
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
    images: [`${site.url}/og-image.png`],
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

  const WHY = [
    { icon: MapPin, title: t('why_us.reason1_title'), desc: t('why_us.reason1_desc') },
    { icon: Scale, title: t('why_us.reason2_title'), desc: t('why_us.reason2_desc') },
    { icon: ShieldCheck, title: t('why_us.reason3_title'), desc: t('why_us.reason3_desc') },
    { icon: HeartHandshake, title: t('why_us.reason4_title'), desc: t('why_us.reason4_desc') },
    { icon: BookOpen, title: t('why_us.reason5_title'), desc: t('why_us.reason5_desc') },
  ];

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

  const featuredCoverage = getFeaturedLandings();

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
        <Container size="lg" className="relative py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <HeroOfficeBadge />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light/50 border border-primary-light/40 text-text-inverse/90 backdrop-blur-sm">
                  <span className="text-xxs font-bold tracking-wider">{t('hero.badge')}</span>
                </span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight text-text-inverse text-balance">
                Defensa penal y asesoría jurídica en Nacaome y Honduras
              </h1>
              <p className="mt-5 text-base md:text-lg text-text-inverse/90 leading-relaxed max-w-2xl text-pretty">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7">
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/85">
                  <CheckCircle2 size={14} className="text-accent" /> {t('hero.check1')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/85">
                  <CheckCircle2 size={14} className="text-accent" /> {t('hero.check2')}
                </span>
              </div>
              <CTAGroup variant="inverse" className="mt-8" />
            </div>
            {/* Panel visual complementario (lg:col-span-5): equilibra la
                composición del hero con datos verificados (site, áreas), sin
                inventar métricas (R4). Panel translúcido con textura de marca. */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="relative rounded-2xl border border-accent/25 bg-primary-dark/40 backdrop-blur-md p-6 shadow-[0_24px_60px_-24px_rgba(6,14,32,0.6)]">
                <div className="absolute inset-0 pointer-events-none rounded-2xl bg-grid opacity-40" aria-hidden="true" />
                <div className="relative space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30">
                      <Gavel size={20} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-inverse leading-tight">Defensa penal como pilar</p>
                      <p className="text-xs text-text-inverse/75 leading-relaxed mt-1">
                        Abogados de Pineda y Asociados con presencia activa en juzgados del sur de Honduras para defensa penal y asesoría jurídica.
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-text-inverse/10" />
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex items-center gap-2 pt-1">
                    <CheckCircle2 size={14} className="text-accent flex-shrink-0" />
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

      {/* ÁREAS DESTACADAS — 4 especialidades principales.
          Grid de 4 columnas en desktop con tarjetas estrechas e imágenes
          contenidas (aspect 4/3), equilibradas y no dominantes. Antes eran
          2 columnas con aspect 3/2 = imágenes excesivamente grandes. */}
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
                  priority={area.slug === 'derecho-penal'}
                />
              );
            })}
        </div>
      </Section>

      {/* POR QUÉ ELEGIRNOS + VISIÓN MULTIDISCIPLINAR (sección fusionada).
          Antes eran dos secciones "Por qué..." consecutivas con el mismo
          fondo warm y tarjetas — se sentían repetitivas. Ahora es una sola
          sección: 5 razones (grid) + sub-bloque multidisciplinar (split). */}
      <Section background="warm" spacing="md" ariaLabel="Por qué elegirnos" className="relative overflow-hidden">
        <SectionHeader
          eyebrow="Por qué elegirnos"
          title={t('why_us.title')}
          subtitle={t('why_us.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {WHY.map((w) => (
            <div key={w.title} className="card-dark p-5">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-accent/15 border border-accent/30 text-accent-dark flex items-center justify-center flex-shrink-0">
                  <w.icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <strong className="font-bold text-sm leading-tight text-text text-balance block">
                    {w.title}
                  </strong>
                  <p className="text-sm leading-relaxed text-text-secondary mt-1.5 text-pretty">
                    {w.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sub-bloque: visión multidisciplinar dentro de la misma sección */}
        <div className="mt-10 md:mt-12">
          <div className="divider-accent mb-8" aria-hidden="true" />
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-5">
              <p className="eyebrow-rule text-accent-dark mb-3">
                {t('multidisciplinary.title')}
              </p>
              <p className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight text-balance">
                {t('multidisciplinary.subtitle')}
              </p>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed text-pretty">
                {t('multidisciplinary.description')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xxs font-bold uppercase tracking-wider">
                  <Handshake size={12} /> Estrategia unificada
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xxs font-bold uppercase tracking-wider">
                  <BriefcaseBusiness size={12} /> Un solo expediente
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xxs font-bold uppercase tracking-wider">
                  <Users size={12} /> Equipo coordinado
                </span>
              </div>
              <Link href="/despacho" title="Conozca el bufete Pineda y Asociados en Nacaome, Valle" className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
                sobre nuestro bufete <ArrowRight size={14} />
              </Link>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                { icon: Gavel, title: t('multidisciplinary.combo1_title'), desc: t('multidisciplinary.combo1_desc') },
                { icon: Briefcase, title: t('multidisciplinary.combo2_title'), desc: t('multidisciplinary.combo2_desc') },
                { icon: Building, title: t('multidisciplinary.combo3_title'), desc: t('multidisciplinary.combo3_desc') },
                { icon: Landmark, title: t('multidisciplinary.combo4_title'), desc: t('multidisciplinary.combo4_desc') },
              ].map((it) => (
                <Card key={it.title} padding="sm" className="h-full flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-11 h-11 rounded-lg bg-accent/15 border border-accent/30 text-accent-dark flex items-center justify-center flex-shrink-0">
                      <it.icon size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="font-bold text-sm text-text leading-tight text-balance block">{it.title}</strong>
                      <p className="text-sm text-text-secondary leading-relaxed mt-1 text-pretty">
                        {it.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* CONOZCA A SU EQUIPO —3 socios del bufete con su retrato y
          especialidades. Refuerza E-E-A-T (múltiples autores Person
          identificados) y alimenta el Knowledge Graph de Google para las
          entidades «abogado penalista/familia/laboral Nacaome». */}
      <Section spacing="md" ariaLabel="Conozca a su equipo">
        <SectionHeader
          eyebrow="Su equipo"
          title="Conozca a los abogados que llevarán su caso"
          subtitle="Tres socios con especialidades complementarias. Atención directa del abogado responsable en cada área, con respaldo multidisciplinar para asuntos que cruzan varias ramas del derecho."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: FOUNDER_PROFILE.name,
              jobTitle: FOUNDER_PROFILE.jobTitle,
              image: FOUNDER_PROFILE.image,
              imageAltText: FOUNDER_PROFILE.imageAltText ?? 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)',
              tagline: 'Penal · Pilar histórico del bufete',
              description: 'Más de 15 años de ejercicio profesional. Colegiado en Honduras. Defensa penal, audiencias y recursos en Valle y la zona sur.',
              href: '/derecho-penal',
              cta: 'Defensa penal',
            },
            {
              name: THANIA_PROFILE.name,
              jobTitle: THANIA_PROFILE.jobTitle,
              image: THANIA_PROFILE.image,
              imageAltText: THANIA_PROFILE.imageAltText,
              tagline: 'Familia · Mercantil · Civil · Administrativo',
              description: 'Socia fundadora del bufete. Atención directa en derecho de familia, civil y notarial, mercantil y empresarial, y administrativo.',
              href: '/servicios-juridicos/derecho-de-familia',
              cta: 'Derecho de familia',
            },
            {
              name: EMIL_PROFILE.name,
              jobTitle: EMIL_PROFILE.jobTitle,
              image: EMIL_PROFILE.image,
              imageAltText: EMIL_PROFILE.imageAltText,
              tagline: 'Laboral · Civil y Notarial',
              description: 'Socio del bufete. Despidos, prestaciones, accidentes de trabajo, juicio oral laboral y recursos de casación laboral.',
              href: '/servicios-juridicos/derecho-laboral',
              cta: 'Derecho laboral',
            },
          ].map((p) => (
            <Card key={p.name} padding="md" className="card-premium border-accent/30 h-full flex flex-col">
              <div className="relative mx-auto mb-4">
                <div className="absolute -inset-2 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-28 h-28 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src={p.image}
                    alt={p.imageAltText}
                    width={224}
                    height={224}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 70vw, 112px"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark text-center mb-1">
                  {p.tagline}
                </p>
                <h3 className="font-serif font-bold text-base text-text leading-tight text-center text-balance">
                  {p.name}
                </h3>
                <p className="text-sm text-text-secondary leading-snug mt-0.5 text-center">
                  {p.jobTitle}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed text-pretty mt-3 text-center">
                  {p.description}
                </p>
              </div>
              <Link
                href={p.href}
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-accent-dark hover:text-primary transition-colors self-center"
              >
                {p.cta} <ArrowRight size={14} />
              </Link>
            </Card>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link
            href="/despacho"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border-light bg-surface text-text text-sm font-bold hover:border-accent/40 transition-colors"
          >
            Conozca el despacho <ArrowRight size={14} />
          </Link>
        </div>
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
          CTA integrado al blog dentro del propio componente; antes existía
          un bloque CTA BLOG redundante justo debajo, ya eliminado. */}
      <BlogHighlights
        background="muted"
        eyebrow="Guías jurídicas destacadas"
        title="Recursos legales para entender su caso"
        subtitle="Guías prácticas sobre las consultas más frecuentes de nuestros clientes en derecho penal, laboral, familiar y notarial."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
        slugs={[...TOP_ORGANIC_GUIDE_SLUGS]}
      />

      {/* PREFIERE VERNOS EN PERSONA — sección de cercanía premium.
          Sustituye a las antiguas secciones "Contact Strip" + "Ubicación",
          que estaban separadas y se sentían repetitivas. Ahora es un único
          bloque humano: mensaje + datos de contacto (iconografía unificada)
          + CTAs claros + mapa contenido. El rail flotante ya ofrece
          WhatsApp/teléfono en toda la web, por lo que no se duplica aquí. */}
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

      {/* COBERTURA REGIONAL — enlazado interno a landings locales (SEO local).
          Tarjetas con escudo decorativo traslúcido + badge departamento. */}
      <Section background="muted" spacing="md" ariaLabel="Cobertura regional">
        <SectionHeader
          eyebrow="Cobertura jurídica en el sur de Honduras"
          title="Abogados en las principales ciudades de Valle y Choluteca"
          subtitle="Atendemos en Nacaome, San Lorenzo, Choluteca, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire, Namasigüe y Orocuina. Conozca nuestra cobertura por ciudad."
          align="center"
        />
        <CoverageCityGrid cities={featuredCoverage} />
        <div className="mt-8 md:mt-10 text-center">
          <div className="inline-block max-w-2xl mx-auto">
            <p className="font-serif font-extrabold text-lg md:text-xl text-primary leading-tight text-balance">
              ¿Necesita asistencia legal en su ciudad?
            </p>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed text-pretty">
              Cuéntenos su caso y le orientaremos con claridad sobre los pasos legales disponibles.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
              <CTAGroup variant="inline" />
            </div>
          </div>
        </div>
      </Section>

      {/* PREGUNTAS FRECUENTES — FAQ con schema FAQPage.
          Se eliminó la sección "Preguntas reales" (grid de 6 preguntas sin
          respuesta) que duplicaba conceptualmente este bloque y enlazaba a
          la misma ruta /preguntas-frecuentes. Se conserva el FAQ con
          respuestas + JSON-LD, que es más útil para el usuario y para SEO. */}
      <Section spacing="md" ariaLabel="Preguntas frecuentes">
        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <SectionHeader
              eyebrow="FAQ"
              title={t('faq.title')}
              subtitle={t('faq.subtitle')}
            />
            <Link href="/preguntas-frecuentes" title="Explorar preguntas frecuentes sobre defensa penal y derecho en Honduras" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark">
              explorar preguntas frecuentes <ArrowRight size={14} />
            </Link>
            <Link href="/blog" title="Leer el blog jurídico de Pineda y Asociados — guías y análisis legal" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
              leer el blog jurídico <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-md border border-border-light bg-surface card-premium open:border-accent/40 faq-anim"
              >
                <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm text-text leading-snug text-balance">{f.q}</span>
                  <span className="w-6 h-6 rounded-full bg-surface-alt group-open:bg-accent/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <ArrowRight size={12} className="text-text-secondary group-open:rotate-90 group-open:text-accent-dark transition-transform" />
                  </span>
                </summary>
                <div className="faq-content px-4 pb-4 -mt-1 text-sm text-text-secondary leading-relaxed text-pretty" dangerouslySetInnerHTML={{ __html: f.a }} />
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA FINAL — llamada a la acción premium (componente compartido) */}
      <ConsultationCTA />

      {/* COMPARTIR — strip social compacto */}
      <Section spacing="sm" ariaLabel="Compartir sitio">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <SocialShare />
        </div>
      </Section>

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
