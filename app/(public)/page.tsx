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
  Briefcase,
  Clock,
  Gavel,
  Handshake,
  Building,
  BriefcaseBusiness,
  Users,
  Landmark,
} from 'lucide-react';
import { site, telHref } from '@/lib/site';
import { getPageContent, getEditablePagesMeta } from '@/lib/page-content-db';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { MapEmbed } from '@/components/marketing/map-embed';
import { areasGenerales } from '@/data/areas-juridicas';
import { landingsLocales } from '@/data/landings-locales';
import { TrustBar } from '@/components/marketing/trust-bar';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { LazyBlogSearch } from '@/components/blog/lazy-blog-search';
import { getAllPosts } from '@/lib/blog';
import { SocialShare } from '@/components/marketing/social-share';

export const metadata: Metadata = {
  // Title absoluto para evitar "Pineda y Asociados — Abogados... Pineda y Asociados".
  // El tagline ya contiene el nombre del bufete (45 chars, óptimo para SERP).
  title: { absolute: site.tagline },
  description: site.description,
  alternates: { canonical: '/' },
  keywords: ['abogados Nacaome', 'bufete jurídico Valle', 'defensa penal Nacaome', 'abogado penalista Valle', 'abogados San Lorenzo', 'abogados Choluteca', 'abogados sur Honduras', 'abogados zona sur Honduras', 'consulta legal gratuita Nacaome', 'despacho jurídico Nacaome'],
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
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [
      {
        url: `${site.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${site.name} — Bufete jurídico en ${site.address.city}, ${site.address.department}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Bufete multidisciplinario en ${site.address.city}, ${site.address.department}`,
    description: site.description,
    images: [`${site.url}/og-image.png`],
  },
};

export const revalidate = 3600;

const HIGHLIGHTED_AREAS = ['derecho-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];

export default async function HomePage() {
  let searchIndex: { slug: string; title: string; description: string; category: string; tags: string[]; publishedAt: string; readingTime: string; coverImage?: string }[] = [];
  try {
    const allPosts = await getAllPosts();
    searchIndex = allPosts.map(p => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category,
      tags: p.tags,
      publishedAt: p.publishedAt,
      readingTime: p.readingTime,
      coverImage: p.coverImage,
    }));
  } catch {}
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

  const REAL_QUESTIONS = [
    { q: t('questions.q1'), badge: t('questions.q1_badge') },
    { q: t('questions.q2'), badge: t('questions.q2_badge') },
    { q: t('questions.q3'), badge: t('questions.q3_badge') },
    { q: t('questions.q4'), badge: t('questions.q4_badge') },
    { q: t('questions.q5'), badge: t('questions.q5_badge') },
    { q: t('questions.q6'), badge: t('questions.q6_badge') },
  ];

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

  return (
    <>
      {/* HERO */}
      <section className="relative bg-hero-gradient text-text-inverse overflow-hidden">
        {/* Capas de fondo no fotográficas: grid sutil + halos dorados radiales. */}
        <div className="absolute inset-0 pointer-events-none bg-grid opacity-50" aria-hidden="true" />
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
              <p className="mt-5 text-base md:text-lg text-text-inverse/90 leading-relaxed max-w-3xl text-pretty">
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
          </div>
        </Container>
      </section>

      {/* TRUST BAR — sellos de autoridad */}
      <TrustBar background="light" />

      {/* BUSCADOR GLOBAL */}
      {searchIndex.length > 0 && (
        <div className="bg-background py-6 md:py-8">
          <div className="mx-auto px-4 sm:px-6 max-w-7xl">
            <LazyBlogSearch posts={searchIndex} scope="toda la web" />
          </div>
        </div>
      )}

      {/* REAL QUESTIONS */}
      <Section spacing="md" ariaLabel="Preguntas reales">
        <SectionHeader
          eyebrow={t('questions.eyebrow')}
          title={t('questions.title')}
          subtitle={t('questions.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REAL_QUESTIONS.map((item, i) => (
            <Link
              key={i}
              href="/preguntas-frecuentes"
              className="group block focus-visible:outline-none"
            >
              <Card padding="sm" className="h-full card-premium">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary text-text-inverse flex items-center justify-center text-xs font-extrabold flex-shrink-0 group-hover:bg-accent-dark group-hover:text-primary transition-colors">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text leading-snug text-balance">{item.q}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xxs font-bold uppercase tracking-wider text-accent-dark">
                      <span className="w-1 h-1 rounded-full bg-accent" aria-hidden="true" />
                      {item.badge}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
            consultar preguntas frecuentes <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* ÁREAS DESTACADAS */}
      <Section background="muted" spacing="md" ariaLabel="Áreas destacadas">
        <SectionHeader
          eyebrow="Especialidades principales"
          title={t('specialties.title')}
          subtitle={t('specialties.subtitle')}
        />
        <div className="grid md:grid-cols-2 gap-4">
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
                  aspect="3/2"
                  priority={area.slug === 'derecho-penal'}
                />
              );
            })}
        </div>
      </Section>

      {/* TESTIMONIOS */}
      <TestimonialsSection
        title={t('testimonials.title')}
        subtitle={t('testimonials.subtitle')}
        columns={3}
        items={[
          {
            name: t('testimonials.testimonial1_name'),
            rating: 5,
            body: t('testimonials.testimonial1_body'),
            date: '2025',
            source: 'CASO ANONIMIZADO',
          },
          {
            name: t('testimonials.testimonial2_name'),
            rating: 5,
            body: t('testimonials.testimonial2_body'),
            date: '2025',
            source: 'CASO ANONIMIZADO',
          },
          {
            name: t('testimonials.testimonial3_name'),
            rating: 5,
            body: t('testimonials.testimonial3_body'),
            date: '2024',
            source: 'CASO ANONIMIZADO',
          },
        ]}
      />

      {/* PROCESS */}
      <Section spacing="md" ariaLabel="Proceso de atención">
        <SectionHeader
          eyebrow="Cómo trabajamos"
          title={t('process.title')}
          subtitle={t('process.subtitle')}
        />
        <ProcessStepper steps={PROCESS} withConnector />
      </Section>

      {/* WHY US */}
      <Section background="warm" spacing="md" ariaLabel="Por qué elegirnos" className="relative overflow-hidden">
        <div className="relative">
          <SectionHeader
            eyebrow="Por qué elegirnos"
            title={t('why_us.title')}
            subtitle={t('why_us.subtitle')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="card-dark p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30">
                  <w.icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <strong className="font-bold text-sm leading-tight text-text text-balance block">
                    {w.title}
                  </strong>
                  <p className="text-xs leading-relaxed text-text-secondary mt-1 text-pretty">
                    {w.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* POR QUÉ MULTIDISCIPLINAR */}
      <Section background="warm" spacing="md" ariaLabel="Por qué un bufete multidisciplinar">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="eyebrow-rule text-accent-dark mb-4">
              {t('multidisciplinary.title')}
            </p>
            <p className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight text-balance">
              {t('multidisciplinary.subtitle')}
            </p>
            <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed text-pretty">
              {t('multidisciplinary.description')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
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
            <Link href="/despacho" className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
              sobre nuestro bufete <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 auto-rows-fr">
            {[
              {
                icon: Gavel,
                title: t('multidisciplinary.combo1_title'),
                desc: t('multidisciplinary.combo1_desc'),
              },
              {
                icon: Briefcase,
                title: t('multidisciplinary.combo2_title'),
                desc: t('multidisciplinary.combo2_desc'),
              },
              {
                icon: Building,
                title: t('multidisciplinary.combo3_title'),
                desc: t('multidisciplinary.combo3_desc'),
              },
              {
                icon: Landmark,
                title: t('multidisciplinary.combo4_title'),
                desc: t('multidisciplinary.combo4_desc'),
              },
            ].map((it) => (
              <Card key={it.title} padding="sm" className="h-full flex">
                <div className="flex items-start gap-2.5 w-full">
                  <div className="w-8 h-8 rounded-md bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                    <it.icon size={15} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="font-bold text-sm text-text leading-tight text-balance block">{it.title}</strong>
                    <p className="text-xs text-text-secondary leading-relaxed mt-0.5 text-pretty">
                      {it.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* CONTACT STRIP */}
      <Section spacing="md" ariaLabel="Canales de contacto">
        <SectionHeader
          eyebrow="Contáctenos"
          title="Cuatro canales, una sola atención"
          subtitle="Elija el que prefiera. Le respondemos en horario hábil y con la confidencialidad que su caso requiere."
        />
        <ContactStrip />
      </Section>

      {/* UBICACIÓN */}
      <Section background="muted" spacing="md" ariaLabel="Ubicación">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <SectionHeader
              eyebrow="Dónde estamos"
              title="Nacaome, Valle — Honduras"
              subtitle="Visítenos con cita previa. Estaremos encantados de recibirle."
            />
            <Card padding="md">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text">{site.address.line1}</p>
                    <p className="text-text-secondary">{site.address.line2}</p>
                    <p className="text-text-secondary">{site.address.city}, {site.address.department}, {site.address.country}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={18} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text">Teléfono</p>
                    <a href={telHref()} className="text-primary hover:underline tabular-nums">{site.phoneDisplay}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={18} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text">Horario</p>
                    <p className="text-text-secondary">{site.hours}</p>
                  </div>
                </li>
              </ul>
              <Link href="/como-llegar" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:text-accent-dark">
                indicaciones para llegar al bufete <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
          <div>
            <Card padding="none" className="overflow-hidden aspect-[4/3] bg-surface-alt">
              <MapEmbed
                latitude={site.geo.latitude}
                longitude={site.geo.longitude}
                label={site.name}
                fullAddress={site.address.full}
                zoom={15}
                className="w-full h-full"
              />
            </Card>
            <Link href="/como-llegar" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:text-accent-dark">
              cómo llegar a Nacaome <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </Section>

      {/* Cobertura regional — enlazado interno a landings locales (SEO local) */}
      <Section background="muted" spacing="md" ariaLabel="Cobertura regional">
        <SectionHeader
          eyebrow="Cobertura"
          title="Abogados en el sur de Honduras"
          subtitle="Atendemos en Nacaome, San Lorenzo, Choluteca y la zona sur. Conozca nuestra cobertura por ciudad."
          align="center"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {landingsLocales.map((c) => (
            <Link
              key={c.slug}
              href={`/abogados-en-${c.slug}`}
              className="group block focus-visible:outline-none"
            >
              <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <MapPin size={20} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                  {`Abogados en ${c.ciudad}`}
                </h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                  {c.departamento}, Honduras
                </p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                  Ver cobertura <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section spacing="md" ariaLabel="Preguntas frecuentes">
        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <SectionHeader
              eyebrow="FAQ"
              title={t('faq.title')}
              subtitle={t('faq.subtitle')}
            />
            <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark">
              explorar preguntas frecuentes <ArrowRight size={14} />
            </Link>
            <Link href="/blog" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
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

      {/* SOCIAL SHARE */}
      <Section spacing="sm" ariaLabel="Compartir sitio">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <SocialShare />
        </div>
      </Section>

      <ConsultationCTA />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}

