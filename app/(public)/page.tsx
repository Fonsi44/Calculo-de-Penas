import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  MapPin,
  CheckCircle2,
  Gavel,
  Award,
} from 'lucide-react';
import Image from 'next/image';
import { site, FOUNDER_PROFILE, LAWYER_PROFILES, ADDITIONAL_TEAM_PROFILES, directTelHref, directWhatsappHref } from '@/lib/site';
import { getPageContent, getEditablePagesMeta } from '@/lib/page-content-db';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { areasGenerales, hubPenal } from '@/data/areas-juridicas';
import { TrustBar } from '@/components/marketing/trust-bar';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import { Reveal } from '@/components/marketing/reveal';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { EditorialBlock } from '@/components/marketing/editorial-block';
import { ProblemSelector } from '@/components/marketing/problem-selector';
import { TOP_ORGANIC_GUIDE_SLUGS } from '@/data/seo/high-intent-guides';

export const metadata: Metadata = {
  // Title absoluto para evitar "Pineda y Asociados — Abogados... Pineda y Asociados".
  // El tagline ya contiene el nombre del bufete (45 chars, óptimo para SERP).
  title: { absolute: site.tagline },
  description: site.description,
  // Canonical de la home. Next.js App Router normaliza el trailing slash de la
  // raíz con `trailingSlash: false` (default): el HTML renderizado sirve
  // `https://www.pinedayasociadoshn.com` (sin slash). Esto es COHERENTE:
  // canonical, og:url y la URL servida son la misma, y Bing Webmaster no
  // reporta errores de canonicalización (3.754 páginas 2xx rastreadas, sin
  // "this page is a redirect" en las 16 priorityUrls). No forzamos
  // `trailingSlash: true` global: impactaría 213 URLs del sitemap, ~60
  // redirects 301 y todos los canonicals. La normalización de Next es segura.
  // Auditoría 2026-07-06 (A-02): decisión documentada, sin cambio de código.
  alternates: { canonical: `${site.url}/` },
  keywords: ['abogados Nacaome', 'bufete jurídico Valle', 'defensa penal Nacaome', 'abogado penalista Valle', 'abogados San Lorenzo', 'abogados Choluteca', 'abogados Goascorán', 'abogados San Marcos de Colón', 'abogados El Triunfo', 'abogados Marcovia', 'abogados Pespire', 'abogados Namasigüe', 'abogados Orocuina', 'abogados sur Honduras', 'abogados zona sur Honduras', 'evaluación legal confidencial Nacaome', 'despacho jurídico Nacaome'],
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

const HIGHLIGHTED_AREAS = ['derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];

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
    { step: 5, title: t('process.step5_title'), desc: t('process.step5_desc') },
  ];

  const WHY_POINTS = [
    { icon: MapPin, title: t('why_us.reason1_title'), description: t('why_us.reason1_desc') },
    { icon: Scale, title: t('why_us.reason2_title'), description: t('why_us.reason2_desc') },
    { icon: ShieldCheck, title: t('why_us.reason3_title'), description: t('why_us.reason3_desc') },
    { icon: HeartHandshake, title: t('why_us.reason4_title'), description: t('why_us.reason4_desc') },
    { icon: BookOpen, title: t('why_us.reason5_title'), description: t('why_us.reason5_desc') },
  ];
  const highlightedAreas = [
    hubPenal,
    ...areasGenerales.filter((area) => HIGHLIGHTED_AREAS.includes(area.slug)),
  ];
  const renderProfileCard = (profile: (typeof LAWYER_PROFILES)[number] | (typeof ADDITIONAL_TEAM_PROFILES)[number]) => (
    <div key={profile.slug} className="group rounded-lg border border-border-light bg-surface p-5 hover:border-accent/50 transition-colors">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-alt mb-4"><Image src={profile.image} alt={profile.imageAlt} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover object-top" /></div>
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark">{profile.jobTitle}</p>
      <h2 className="mt-2 font-serif text-xl font-extrabold text-primary">{profile.name}</h2>
      <p className="mt-3 text-sm text-text-secondary leading-relaxed">{profile.areas.slice(0, 3).join(' · ')}</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href={`/equipo/${profile.slug}`} className="text-sm font-semibold text-accent-dark">Ver perfil</Link>{profile.phone && profile.phoneDisplay && <><a href={directTelHref(profile.phone)} className="text-sm font-semibold text-primary">Llamar</a><a href={directWhatsappHref(profile.phone, `Hola ${profile.name.split(' ')[0]}, necesito orientación. Llegué desde la web de Pineda y Asociados.`)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-success">WhatsApp</a></>}</div>
    </div>
  );

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
                Abogados en Nacaome para defensa penal y asesoría jurídica
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
              <div className="relative rounded-lg border border-accent/25 bg-primary-dark/40 backdrop-blur-md p-5 shadow-xl">
                <div className="absolute inset-0 pointer-events-none rounded-lg bg-grid opacity-40" aria-hidden="true" />
                <div className="relative space-y-3">
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
                  {FOUNDER_PROFILE.cah && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <Award size={13} className="text-accent flex-shrink-0" />
                      <p className="text-xs text-text-inverse/80 font-medium">Abogado colegiado (CAH: {FOUNDER_PROFILE.cah})</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-0.5">
                    <CheckCircle2 size={13} className="text-accent flex-shrink-0" />
                    <p className="text-xs text-text-inverse/80">Evaluación confidencial · Presupuesto por escrito</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TRUST BAR — sellos de autoridad (strip compacto) */}
      <TrustBar background="light" />

      {/* SELECTOR POR PROBLEMA (FASE 2) — accesos comprensibles para usuarios
          que no conocen la rama jurídica. Cada entrada dirige a una página
          real verificada. No sustituye al catálogo de áreas (lo hace la
          sección siguiente), sino que ataja la decisión del usuario. */}
      <Section background="muted" spacing="lg" ariaLabel="Orientación y especialidades">
        <ProblemSelector />

        <div className="divider-soft my-8 md:my-10" aria-hidden="true" />
        <SectionHeader
          eyebrow="Especialidades principales"
          title="Cuatro áreas con presencia constante"
          subtitle={t('specialties.subtitle')}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {highlightedAreas.map((area, index) => {
              const areaSlug = area.slug === 'derecho-penal' ? '/derecho-penal' : `/servicios-juridicos/${area.slug}`;
              return (
                <Reveal key={area.slug} delay={([1, 2, 3, 4] as const)[index % 4]} className="h-full">
                  <ServiceCard
                    href={areaSlug}
                    slug={area.slug}
                    title={area.titulo}
                    description={area.resumen}
                    category="services"
                    tone={('color' in area ? area.color : 'primary') as PlaceholderTone}
                    aspect="4/3"
                    className="h-full"
                  />
                </Reveal>
              );
            })}
        </div>
      </Section>

      {/* POR QUÉ ELEGIRNOS — bloque editorial narrativo (Fase 3.1).
          Razones del bufete en formato editorial, con respiración. Incorpora
          los claims de valor que antes estaban en la card de texto del pilar
          penal (+15 años, estrategia unificada, un solo expediente), ahora
          como puntos editoriales coherentes. El equipo se referencia vía
          enlace a /despacho, dueño canónico de ese contenido. */}
      <Section background="warm" spacing="lg" ariaLabel="Por qué elegirnos" className="section-breath">
        <EditorialBlock
          eyebrow="Por qué elegirnos"
          title={t('why_us.title')}
          intro={t('why_us.subtitle')}
          points={WHY_POINTS}
          cta={{ href: '/despacho', label: 'Conozca el despacho' }}
        />
      </Section>

      <Section spacing="md" ariaLabel="Equipo profesional">
        <SectionHeader
          eyebrow="Equipo"
          title="Profesionales responsables, con perfil público"
          subtitle="Conozca a los abogados que dirigen cada área y al profesional responsable de los servicios digitales del despacho."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LAWYER_PROFILES.map(renderProfileCard)}
          {ADDITIONAL_TEAM_PROFILES.map(renderProfileCard)}
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

      {/* CTA FINAL — llamada a la acción premium (componente compartido).
          Con enlace contextual a /preguntas-frecuentes (antes era una sección
          visual completa FAQ que duplicaba el hub FAQ canónico). */}
      <ConsultationCTA
        variant="closing"
        subtitle="Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones legales disponibles. Atendemos en Nacaome, San Lorenzo, Amapala, Goascorán, Choluteca, San Marcos de Colón y El Triunfo. Presupuesto por escrito antes de cualquier actuación. Sus datos están protegidos por el secreto profesional del abogado."
      />

    </>
  );
}
