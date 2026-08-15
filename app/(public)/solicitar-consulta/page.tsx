import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Clock,
  ChevronRight,
  MapPin,
  Building,
  Users,
} from 'lucide-react';
import { telHref, whatsappHref, site } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { webpageSchema } from '@/lib/seo-schema';
import { HubFaq } from '@/components/marketing/hub-faq';
import { FAQ_SOLICITAR_CONSULTA } from '@/data/faqs-hubs';

export const metadata: Metadata = buildMetadata({
  title: 'Consulte a un Abogado en Nacaome, Valle',
  // 152 chars. Antes 162.
  description: 'Solicite una evaluación legal confidencial. Respuesta en horario hábil. Abogados en Nacaome, Valle para asuntos penales, familiares, laborales y civiles.',
  canonicalPath: '/solicitar-consulta',
  keywords: ['evaluación legal Nacaome', 'abogado consulta Valle', 'asesoría legal sur Honduras', 'consulta penal confidencial Nacaome', 'contactar abogado San Lorenzo', 'cita legal Choluteca', 'abogado Goascorán consulta', 'contactar abogado Amapala', 'cita legal Pespire', 'contactar abogado sur de Honduras'],
  ogImageAlt: `${site.name} - Solicitar Consulta Legal`,
});

export default async function SolicitarConsultaPage() {
  const content = await getPageContent('solicitar-consulta');
  const heroTitle = content['hero.title'] || 'Cuéntenos su caso. Le escuchamos con discreción.';
  const heroSubtitle = (
    content['hero.subtitle']
    || 'Complete el formulario o contáctenos directamente. La información que comparta está protegida por el secreto profesional.'
  ).replace(/toda comunicación es estrictamente confidencial/gi, 'la información que comparta está protegida por el secreto profesional');

  const REASONS = [
    content['reasons.r1'] || 'Familiar detenido',
    content['reasons.r2'] || 'Citaciones o audiencias próximas',
    content['reasons.r3'] || 'Investigación en curso',
    content['reasons.r4'] || 'Querella o denuncia',
    content['reasons.r5'] || 'Recurso o apelación',
    content['reasons.r6'] || 'Asesoría preventiva',
  ];

  const GUARANTEES = [
    { icon: ShieldCheck, title: 'Secreto profesional', desc: 'La información que comparta se trata conforme al deber de confidencialidad profesional.' },
    { icon: CheckCircle2, title: content['guarantees.g2_title'] || 'Sin obligación de contratar', desc: content['guarantees.g2_desc'] || 'La evaluación inicial no le obliga a contratar nuestros servicios.' },
    { icon: Calendar, title: 'Atención en horario hábil', desc: 'Revisamos cada solicitud y respondemos por el canal indicado durante el horario de atención.' },
  ];
  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Solicitar consulta' },
      ]} />
      <PageHero
        eyebrow="Solicitar consulta"
        badge="Evaluación confidencial"
        title={heroTitle}
        subtitle={<>{heroSubtitle}</>}
      />

      <Section spacing="lg">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card id="formulario" padding="md" className="border-l-4 border-l-accent">
              <h2 className="font-bold text-base text-primary">Formulario de consulta</h2>
              <p className="text-sm text-text-secondary mt-1 mb-5">
                Nombre y teléfono bastan para contactarle. El resto es opcional.
                No envíe confesiones ni documentos sensibles hasta que el despacho
                confirme el canal. Sus datos quedan cubiertos por el secreto profesional.
              </p>
              <SolicitarConsultaForm />
            </Card>
          </div>

          {/* RAIL DERECHO — reducido a 3 agrupaciones (Hito 9.5).
              Antes: 6 tarjetas independientes. Ahora: 3 bloques temáticos
              que agrupan la misma información con menos saturación visual. */}
          <div className="lg:col-span-2 space-y-4">

            {/* 1. CONTACTO Y HORARIO — equipo + teléfono + WhatsApp + horario */}
            <Card padding="md" className="border-l-4 border-l-accent">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/30">
                <div className="w-11 h-11 rounded-lg border border-accent/30 bg-accent/10 text-accent-dark flex items-center justify-center flex-shrink-0">
                  <Users size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xxs font-medium uppercase tracking-wider text-accent-dark mb-0.5">
                    Su equipo
                  </p>
                  <p className="font-bold text-sm text-text leading-tight">
                    Tres socios, atención directa
                  </p>
                  <p className="text-xs text-text-secondary leading-snug mt-0.5">
                    Abogado responsable en cada área.
                  </p>
                </div>
                <Link
                  href="/despacho"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-primary transition-colors flex-shrink-0"
                >
                  Ver <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-2.5">
                <a
                  href={telHref()}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-alt transition-colors group"
                >
                  <span className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Phone size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Teléfono</p>
                    <p className="text-sm font-semibold text-text leading-tight mt-0.5 tabular-nums">{site.phoneDisplay}</p>
                  </div>
                </a>
                <a
                  href={whatsappHref('Hola, necesito una consulta jurídica.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-alt transition-colors group"
                >
                  <span className="w-11 h-11 rounded-lg bg-success/15 text-success flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-colors">
                    <MessageCircle size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">WhatsApp</p>
                    <p className="text-sm font-semibold text-text leading-tight mt-0.5">Atención en horario hábil</p>
                  </div>
                </a>
                <div className="flex items-center gap-2.5 p-2.5">
                  <Clock size={16} className="text-text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-text">Horario de atención</p>
                    <p className="text-xxs text-text-muted">{site.hours}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. PRIVACIDAD Y FUNCIONAMIENTO — garantías + motivos frecuentes */}
            <Card padding="md">
              <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                <ShieldCheck size={15} className="text-accent-dark" />
                Nuestras garantías
              </h3>
              <div className="space-y-2.5">
                {GUARANTEES.map((g) => (
                  <div key={g.title} className="flex items-start gap-2.5">
                    <div className="w-11 h-11 rounded-lg bg-success/15 text-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <g.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text leading-tight">{g.title}</p>
                      <p className="text-xxs text-text-secondary leading-relaxed mt-0.5">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/30">
                <h4 className="text-xs font-bold text-text mb-2 flex items-center gap-2">
                  <Calendar size={13} className="text-accent-dark" />
                  Motivos frecuentes de consulta
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {REASONS.map((r) => (
                    <div key={r} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-primary/5 text-xs text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-dark flex-shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 3. URGENCIAS Y LÍMITES — emergencia + privacidad */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-aggravation/10 to-aggravation/5 border border-aggravation/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-aggravation flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-aggravation leading-tight">¿Emergencia con detenido?</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Si hay una detención en curso o una audiencia inminente, contacte por teléfono o WhatsApp e indique que se trata de una urgencia penal.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <a
                  href={telHref()}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-aggravation text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <Phone size={15} /> Llamar ahora
                </a>
                <a
                  href={whatsappHref('Emergencia: necesito asistencia legal inmediata.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-success text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
              <p className="text-xxs text-text-secondary leading-relaxed">
                Evaluación inicial confidencial · Sus datos están protegidos por el secreto profesional.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <Container size="lg">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">Visítenos</p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary">
              ¿Prefiere vernos en persona?
            </h2>
            <p className="mt-2 text-sm text-text-secondary max-w-lg mx-auto">
              Con cita previa. Estaremos encantados de atenderle en nuestro despacho.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center p-5 rounded-lg bg-surface border border-border/30">
              <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center mb-3 flex-shrink-0">
                <MapPin size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Dirección</p>
              <p className="text-sm font-semibold text-text leading-snug">{site.address.line1}</p>
              <p className="text-xs text-text-secondary mt-0.5">{site.address.line2}</p>
              <a href={site.googleBusiness} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-primary transition-colors mt-1">
                Ver en Google Maps <ArrowRight size={12} />
              </a>
            </div>
            <div className="flex flex-col items-center text-center p-5 rounded-lg bg-surface border border-border/30">
              <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center mb-3 flex-shrink-0">
                <Clock size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Horario</p>
              <p className="text-sm font-semibold text-text leading-snug">Lun–sáb 7:00–20:00</p>
              <p className="text-xs text-text-secondary mt-0.5">Con cita previa</p>
            </div>
            <div className="flex flex-col items-center text-center p-5 rounded-lg bg-surface border border-border/30">
              <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center mb-3 flex-shrink-0">
                <Building size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Despacho</p>
              <p className="text-sm font-semibold text-text leading-snug">Pineda y Asociados</p>
              <Link
                href="/como-llegar"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-primary transition-colors mt-1"
              >
                Ver cómo llegar <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link
              href="/como-llegar"
              className="btn-shimmer inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-white text-sm font-bold btn-shadow-primary btn-shadow-primary-hover hover:bg-primary-light transition-colors"
            >
              <MapPin size={16} /> Indicaciones para llegar
            </Link>
          </div>
        </Container>
      </Section>

      <HubFaq
        faqs={FAQ_SOLICITAR_CONSULTA}
        url={`${site.url}/solicitar-consulta`}
        eyebrow="Antes de contactar"
        title="Preguntas frecuentes sobre la consulta"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify([
          webpageSchema(
            'Solicitar Consulta Legal — Pineda y Asociados',
            'Solicite una consulta confidencial con un abogado penalista en Nacaome, Valle.',
            '/solicitar-consulta'
          ),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Solicitar Evaluación Legal — Pineda y Asociados',
            description: 'Solicite una consulta confidencial con un abogado penalista en Nacaome, Valle. Le respondemos en horario hábil.',
            url: `${site.url}/solicitar-consulta`,
            inLanguage: 'es-HN',
            mainEntity: {
              '@type': 'ContactPoint',
              telephone: site.phone,
              contactType: 'customer service',
              areaServed: 'HN',
              availableLanguage: ['es-HN', 'es-ES'],
              hoursAvailable: site.hoursStructured.map((h) => ({
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: h.dayOfWeek,
                opens: h.opens,
                closes: h.closes,
              })),
            },
          },
        ]),
      }} />
    </>
  );
}

import { SolicitarConsultaForm } from '@/components/marketing/solicitar-consulta-form';
