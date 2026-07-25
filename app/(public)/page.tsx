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
  Gavel,
  Award,
  BriefcaseBusiness,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { site, FOUNDER_PROFILE, telHref, whatsappHref } from '@/lib/site';
import { getPageContent, getEditablePagesMeta } from '@/lib/page-content-db';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { GoogleReviews } from '@/components/marketing/google-reviews';
import { areasGenerales } from '@/data/areas-juridicas';
import { TrustBar } from '@/components/marketing/trust-bar';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { EditorialBlock } from '@/components/marketing/editorial-block';
import { ProblemSelector } from '@/components/marketing/problem-selector';
import { TrustLimits } from '@/components/marketing/trust-limits';
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

  // FAQ i18n home — LEGACY STRUCTURED-DATA (no UI, no fuente canónica).
  // Único rol: alimentar el schema JSON-LD FAQPage (rich result) de la home.
  // No se renderiza visible en la home (ver transformación Fase 3.1); la FAQ
  // visible vive en /preguntas-frecuentes. La fuente canónica de FAQ comercial
  // es lib/faq-unified.ts (getFaqsForHub). Estas 6 Q/A i18n se conservan
  // únicamente para sostener el rich result de la home sin introducir
  // duplicación visual. Marcar como LEGACY: no ampliar ni usar como modelo.
  const FAQ_HOME_LEGACY = [
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
    mainEntity: FAQ_HOME_LEGACY.map((f) => ({
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
                  {FOUNDER_PROFILE.cah && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <Award size={13} className="text-accent flex-shrink-0" />
                      <p className="text-xs text-text-inverse/80 font-medium">Abogado colegiado (CAH: {FOUNDER_PROFILE.cah})</p>
                    </div>
                  )}
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

      {/* SELECTOR POR PROBLEMA (FASE 2) — accesos comprensibles para usuarios
          que no conocen la rama jurídica. Cada entrada dirige a una página
          real verificada. No sustituye al catálogo de áreas (lo hace la
          sección siguiente), sino que ataja la decisión del usuario. */}
      <Section background="muted" spacing="md" ariaLabel="Selector por problema">
        <ProblemSelector />
      </Section>

      {/* ÁREAS DESTACADAS — 4 especialidades principales en grid uniforme
          (Fase 3.1 revisada). Penal, familia, laboral y civil: las 4 como
          ServiceCard idénticas, con foto, alineadas en grid de 4 columnas.
          Antes había una card de texto "pilar histórico" separada que rompía
          el ritmo y duplicaba la ServiceCard de penal. Eliminada; los claims
          de valor (estrategia unificada, un solo expediente) viven
          en el EditorialBlock "Por qué elegirnos" que sigue. */}
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
      </Section>

      {/* POR QUÉ ELEGIRNOS — bloque editorial narrativo (Fase 3.1).
          Razones del bufete en formato editorial, con respiración. Incorpora
          los claims de valor que antes estaban en la card de texto del pilar
          penal (estrategia unificada, un solo expediente), ahora
          como puntos editoriales coherentes. El equipo se referencia vía
          enlace a /despacho, dueño canónico de ese contenido. */}
      <Section background="warm" spacing="lg" ariaLabel="Por qué elegirnos" className="section-breath">
        <EditorialBlock
          eyebrow="Por qué elegirnos"
          title={t('why_us.title')}
          intro={t('why_us.subtitle')}
          points={[
            ...WHY_POINTS,
            { icon: Award, title: 'Cobertura en el sur de Honduras', description: 'Atención coordinada desde nuestra sede en Nacaome para asuntos en Valle, Choluteca y otras zonas.' },
            { icon: BriefcaseBusiness, title: 'Estrategia unificada, un solo expediente', description: 'Coordinación interna entre especialistas cuando un caso cruza varias ramas del derecho. Un único punto de contacto, sin gestionar varios despachos.' },
          ]}
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

      {/* EQUIPO Y DESPACHO — referencia al dueño canónico (Hito 9.7).
          Bloque breve que conecta al /despacho sin duplicar su contenido. */}
      <Section background="muted" spacing="sm" ariaLabel="El equipo">
        <div className="max-w-3xl mx-auto text-center">
          <p className="eyebrow-rule text-accent-dark text-xs font-bold uppercase tracking-eyebrow mb-2">
            El despacho
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight text-balance">
            Un equipo con especialidades complementarias
          </h2>
          <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed text-pretty">
            Tres socios con especialidades complementarias, atención directa del abogado
            responsable y coordinación interna cuando su caso cruza varias ramas del derecho.
          </p>
          <Link
            href="/despacho"
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            Conozca el despacho <ArrowRight size={14} />
          </Link>
        </div>
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

      {/* COBERTURA TERRITORIAL, ESPAÑA Y VISITA — fusionado (Hito 9.7).
          Combina Hondureños en España + Visítenos en una sección única con
          tres columnas, evitando repetir la información de sede del hero. */}
      <Section background="warm" spacing="md" ariaLabel="Cobertura y visita">
        <SectionHeader
          eyebrow="Cobertura y visita"
          title="Le atendemos en Nacaome, en el sur de Honduras y desde España"
          subtitle="Atención presencial en el despacho, coordinación remota para otros puntos del país y asistencia exprés desde España para trámites en Honduras."
          align="center"
        />
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-5 rounded-lg bg-surface border border-border/30">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-accent/15 text-accent-dark border border-accent/30 mb-3">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <h3 className="font-bold text-sm text-text">Presencial en Nacaome</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Con cita previa. {site.address.line1}, {site.address.city}.</p>
            <Link href="/como-llegar" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark hover:text-primary transition-colors">
              Cómo llegar <ArrowRight size={12} />
            </Link>
          </div>
          <div className="text-center p-5 rounded-lg bg-surface border border-border/30">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-accent/15 text-accent-dark border border-accent/30 mb-3">
              <Globe size={20} aria-hidden="true" />
            </span>
            <h3 className="font-bold text-sm text-text">Hondureños en España</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">Poderes, divorcios, sucesiones y trámites documentales entre España y Honduras.</p>
            <Link href="/hondurenos-en-espana" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark hover:text-primary transition-colors">
              Ver servicios <ArrowRight size={12} />
            </Link>
          </div>
          <div className="text-center p-5 rounded-lg bg-surface border border-border/30">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-accent/15 text-accent-dark border border-accent/30 mb-3">
              <Phone size={20} aria-hidden="true" />
            </span>
            <h3 className="font-bold text-sm text-text">Contacto directo</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{site.phoneDisplay} · {site.hours}</p>
            <div className="flex gap-2 justify-center mt-3">
              <a href={telHref()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors">
                <Phone size={12} /> Llamar
              </a>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-success text-white text-xs font-bold hover:opacity-90 transition-colors">
                <MessageCircle size={12} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* CONFIANZA Y LÍMITES (FASE 2) — elementos confirmados del bufete
          (sede, atención directa, confidencialidad, presupuesto, equipo) más
          un bloque explícito de lo que NO se garantiza. Sin contadores
          ficticios ni resultados no comprobados (R4, R12). */}
      <Section background="muted" spacing="md" ariaLabel="Confianza y límites">
        <TrustLimits />
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
