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
  MessageCircle,
  Calendar,
  Briefcase,
  Clock,
  Gavel,
  Handshake,
  Building,
  BriefcaseBusiness,
  Users,
  Landmark,
} from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { getPageContent, getEditablePagesMeta } from '@/lib/page-content-db';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { MapEmbed } from '@/components/marketing/map-embed';
import { areasGenerales } from '@/data/areas-juridicas';
import { TrustBar } from '@/components/marketing/trust-bar';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';

export const metadata: Metadata = {
  title: { absolute: `${site.name} — Bufete multidisciplinario en ${site.address.city}, ${site.address.department}` },
  description: site.description,
  alternates: { canonical: '/' },
};

export const revalidate = 3600;

const HIGHLIGHTED_AREAS = ['derecho-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];

export default async function HomePage() {
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

  const heroLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${site.name} — Inicio`,
    url: site.url,
    inLanguage: 'es-HN',
  };
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
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        {/* Capas de fondo no fotográficas: grid sutil + halos dorados radiales. */}
        <div className="absolute inset-0 pointer-events-none bg-grid opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 opacity-95 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-dark/15 blur-[100px]" />
        </div>
        <div
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <Container size="lg" className="relative py-14 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <HeroOfficeBadge />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light/40 border border-primary-light/30 text-text-inverse/85">
                  <span className="text-xxs font-bold tracking-wider">{t('hero.badge')}</span>
                </span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tighter text-text-inverse text-balance">
                <span className="block">{t('hero.title_line1')}</span>
                <span className="block text-gradient-accent mt-1">{t('hero.title_line2')}</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed max-w-2xl text-pretty">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> {t('hero.check1')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> {t('hero.check2')}
                </span>
              </div>
              <CTAGroup variant="inverse" className="mt-7" />
            </div>
            <div className="lg:col-span-5">
              <div className="halo-accent rounded-md">
                <Card padding="md" className="bg-surface text-text border-accent/30 border-2 shadow-2xl card-premium">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone size={16} className="text-primary" />
                    <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">{t('contact_card.title')}</p>
                  </div>
                  <a href={telHref()} className="block text-2xl md:text-3xl font-extrabold text-primary tabular-nums leading-tight hover:text-primary-light transition-colors">
                    {site.phoneDisplay}
                  </a>
                  <p className="text-sm text-text-secondary mt-1">{site.hours}</p>
                  <div className="divider-accent my-4" />
                  <a
                    href={whatsappHref(t('contact_card.whatsapp_msg'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-md bg-success/10 hover:bg-success/15 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-success flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={16} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-success">WhatsApp directo</p>
                      <p className="text-xxs text-text-secondary">Respuesta durante horario de atención</p>
                    </div>
                  </a>
                  <Link
                    href="/solicitar-consulta"
                    className="mt-3 flex items-center gap-3 p-3 rounded-md bg-primary/8 hover:bg-primary/12 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-text-inverse" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary">{t('contact_card.form_text')}</p>
                      <p className="text-xxs text-text-secondary">{t('contact_card.form_hint')}</p>
                    </div>
                  </Link>
                  <div className="divider-accent my-4" />
                  <div className="flex items-start gap-2 text-xs text-text-secondary">
                    <MapPin size={14} className="text-accent-dark flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{site.address.line1}, {site.address.line2}</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TRUST BAR — sellos de autoridad */}
      <TrustBar background="dark" />

      {/* REAL QUESTIONS */}
      <Section spacing="md" ariaLabel="Preguntas reales">
        <SectionHeader
          eyebrow={t('questions.eyebrow')}
          title={t('questions.title')}
          subtitle={t('questions.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
            Ver todas las preguntas frecuentes <ArrowRight size={14} />
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
                />
              );
            })}
        </div>
      </Section>

      {/* 13 ÁREAS — GRID CON IMAGEN */}
      <Section spacing="md" ariaLabel="Todas las Servicios Jurídicos">
        <SectionHeader
          eyebrow="Cobertura integral"
          title={t('services.title')}
          subtitle={t('services.subtitle')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areasGenerales.map((area) => (
            <ServiceCard
              key={area.slug}
              href={`/servicios-juridicos/${area.slug}`}
              slug={area.slug}
              title={area.titulo}
              description={area.resumen}
              category="services"
              tone={area.color as PlaceholderTone}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/servicios-juridicos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
            Explorar todas las áreas <ArrowRight size={14} />
          </Link>
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
      <Section background="primary" spacing="md" ariaLabel="Por qué elegirnos">
        <div className="text-text-inverse">
          <SectionHeader
            eyebrow="Por qué elegirnos"
            title={t('why_us.title')}
            subtitle={t('why_us.subtitle')}
            invert
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="rounded-md border border-primary-light/40 bg-primary-light/20 p-5 backdrop-blur-sm card-premium"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                <w.icon size={22} aria-hidden="true" />
              </div>
              <div className="mt-2.5">
                <h3 className="font-bold text-sm leading-tight text-text-inverse text-balance">
                  {w.title}
                </h3>
                <p className="text-xs leading-relaxed text-text-inverse/80 mt-1.5 text-pretty">
                  {w.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* POR QUÉ MULTIDISCIPLINAR */}
      <Section spacing="md" ariaLabel="Por qué un bufete multidisciplinar">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
              {t('multidisciplinary.title')}
            </p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-text leading-tight text-balance">
              {t('multidisciplinary.subtitle')}
            </h2>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed text-pretty">
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
            <Link href="/despacho" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
              Conozca nuestro despacho <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
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
              <Card key={it.title} padding="md" className="h-full card-premium">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                    <it.icon size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-text leading-tight text-balance">{it.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1.5 text-pretty">
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
                Ver indicaciones para llegar <ArrowRight size={14} />
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
              Cómo llegar y ver indicaciones <ArrowRight size={12} />
            </Link>
          </div>
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
              Ver todas las preguntas <ArrowRight size={14} />
            </Link>
            <Link href="/blog" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
              Visitar nuestro blog <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-md border border-border-light bg-surface faq-anim open:border-accent/40"
              >
                <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm text-text leading-snug text-balance">{f.q}</span>
                  <span className="w-6 h-6 rounded-full bg-surface-alt group-open:bg-accent/15 flex items-center justify-center flex-shrink-0 transition-colors">
                    <ArrowRight size={12} className="text-text-secondary group-open:rotate-90 transition-transform" />
                  </span>
                </summary>
                <div className="faq-content px-4 pb-4 -mt-1 text-sm text-text-secondary leading-relaxed text-pretty" dangerouslySetInnerHTML={{ __html: f.a }} />
              </details>
            ))}
          </div>
        </div>
      </Section>

      <ConsultationCTA />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(heroLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}

