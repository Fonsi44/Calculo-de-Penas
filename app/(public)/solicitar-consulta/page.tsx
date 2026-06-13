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
} from 'lucide-react';
import { telHref, whatsappHref, site } from '@/lib/site';
import { Section, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { webpageSchema } from '@/lib/seo-schema';

export const metadata: Metadata = {
  title: 'Solicitar Consulta Legal Gratuita | Abogados en Nacaome, Valle',
  description: 'Solicite una consulta legal confidencial y sin costo con un abogado en Nacaome, Valle. Evaluación inicial de su caso penal, de familia, laboral o civil. Le respondemos en horario hábil con presupuesto por escrito.',
  alternates: { canonical: '/solicitar-consulta' },
  keywords: ['consulta legal gratuita Nacaome', 'abogado consulta Valle', 'asesoría legal sin costo sur Honduras', 'consulta penal confidencial Nacaome', 'contactar abogado San Lorenzo', 'cita legal Choluteca'],
  twitter: {
    card: 'summary_large_image',
    title: 'Consulta Legal Gratuita — Abogados en Nacaome, Valle',
    description: 'Solicite una consulta confidencial sin costo. Abogados penalistas en Nacaome, Valle. Le respondemos en horario hábil.',
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: 'Solicitar Consulta Legal Gratuita | Abogados en Nacaome, Valle | Pineda y Asociados',
    description: 'Solicite una consulta confidencial con un abogado penalista en Nacaome, Valle. Le respondemos en horario hábil.',
    url: `${site.url}/solicitar-consulta`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Solicitar Consulta Legal` }],
  },
};

export default async function SolicitarConsultaPage() {
  const content = await getPageContent('solicitar-consulta');
  const heroTitle = content['hero.title'] || 'Cuéntenos su caso. Le escuchamos con discreción.';
  const heroSubtitle = content['hero.subtitle'] || 'Complete el formulario o contáctenos directamente. Toda comunicación es estrictamente confidencial.';

  const REASONS = [
    content['reasons.r1'] || 'Familiar detenido',
    content['reasons.r2'] || 'Citaciones o audiencias próximas',
    content['reasons.r3'] || 'Investigación en curso',
    content['reasons.r4'] || 'Querella o denuncia',
    content['reasons.r5'] || 'Recurso o apelación',
    content['reasons.r6'] || 'Asesoría preventiva',
  ];

  const GUARANTEES = [
    { icon: ShieldCheck, title: content['guarantees.g1_title'] || 'Confidencialidad absoluta', desc: content['guarantees.g1_desc'] || 'Su información está protegida por el secreto profesional.' },
    { icon: CheckCircle2, title: content['guarantees.g2_title'] || 'Sin compromiso', desc: content['guarantees.g2_desc'] || 'La consulta inicial no le obliga a contratar nuestros servicios.' },
    { icon: Calendar, title: content['guarantees.g3_title'] || 'Respuesta en horario hábil', desc: content['guarantees.g3_desc'] || 'Le respondemos el mismo día hábil por el canal que prefiera.' },
  ];
  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Solicitar consulta' },
      ]} />
      <PageHero
        eyebrow="Solicitar consulta"
        title={heroTitle}
        subtitle={<>{heroSubtitle}</>}
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

      <Section spacing="md">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card id="formulario" padding="md" className="border-l-4 border-l-accent">
              <h2 className="font-bold text-base text-primary">Formulario de consulta</h2>
              <p className="text-sm text-text-secondary mt-1 mb-5">
                Los campos marcados con * son obligatorios. Por seguridad, no incluya
                contraseñas, números de tarjeta ni documentos de identidad completos.
              </p>
              <SolicitarConsultaForm />
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Contacto directo */}
            <Card padding="md">
              <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                <Phone size={15} className="text-accent-dark" />
                Contacto directo
              </h3>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Si prefiere hablar con nosotros directamente, estamos disponibles en horario hábil.
              </p>
              <div className="space-y-2.5">
                <a
                  href={telHref()}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Teléfono</p>
                    <p className="text-sm font-semibold text-text leading-tight mt-0.5 tabular-nums">{site.phoneDisplay}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0 group-hover:text-accent-dark transition-colors" />
                </a>
                <a
                  href={whatsappHref('Hola, necesito una consulta jurídica.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/15 text-success flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-colors">
                    <MessageCircle size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">WhatsApp</p>
                    <p className="text-sm font-semibold text-text leading-tight mt-0.5">Respuesta inmediata</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0 group-hover:text-accent-dark transition-colors" />
                </a>
              </div>
            </Card>

            {/* Emergencia */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-aggravation/10 to-aggravation/5 border border-aggravation/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-aggravation flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-aggravation leading-tight">¿Emergencia con detenido?</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Si un familiar está siendo detenido o necesita asistencia inmediata, no espere un minuto.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
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
            </div>

            {/* Motivos frecuentes */}
            <Card padding="sm">
              <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                <Calendar size={15} className="text-accent-dark" />
                Motivos frecuentes
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {REASONS.map((r) => (
                  <div key={r} className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-primary/5 text-xs text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-dark flex-shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </Card>

            {/* Garantías */}
            <Card padding="sm">
              <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                <ShieldCheck size={15} className="text-accent-dark" />
                Nuestras garantías
              </h3>
              <div className="space-y-2.5">
                {GUARANTEES.map((g) => (
                  <div key={g.title} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-success/15 text-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <g.icon size={13} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text leading-tight">{g.title}</p>
                      <p className="text-xxs text-text-secondary leading-relaxed mt-0.5">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Horario */}
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-border/30 bg-surface-alt">
              <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Clock size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-text">Horario de atención</p>
                <p className="text-xxs text-text-muted">Lun–sáb 7:00–20:00 · Nacaome, Valle</p>
              </div>
            </div>
          </div>
        </div>
      </Section>


      <Section background="muted" spacing="md">
        <Container size="lg">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">Visítenos</p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary">
              Prefiere vernos en persona
            </h2>
            <p className="mt-2 text-sm text-text-secondary max-w-lg mx-auto">
              Con cita previa. Estaremos encantados de atenderle en nuestro despacho.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-surface border border-border/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <MapPin size={18} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Dirección</p>
              <p className="text-sm font-semibold text-text leading-snug">{site.address.line1}</p>
              <p className="text-xs text-text-secondary mt-0.5">{site.address.line2}</p>
            </div>
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-surface border border-border/30">
              <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center mb-3">
                <Clock size={18} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Horario</p>
              <p className="text-sm font-semibold text-text leading-snug">Lun–sáb 7:00–20:00</p>
              <p className="text-xs text-text-secondary mt-0.5">Con cita previa</p>
            </div>
            <div className="flex flex-col items-center text-center p-5 rounded-xl bg-surface border border-border/30">
              <div className="w-10 h-10 rounded-lg bg-success/15 text-success flex items-center justify-center mb-3">
                <Building size={18} />
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
              className="btn-shimmer inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
            >
              <MapPin size={16} /> Indicaciones para llegar
            </Link>
          </div>
        </Container>
      </Section>

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
            name: 'Solicitar Consulta Legal Gratuita — Pineda y Asociados',
            description: 'Solicite una consulta confidencial con un abogado penalista en Nacaome, Valle. Le respondemos en horario hábil.',
            url: `${site.url}/solicitar-consulta`,
            inLanguage: 'es-HN',
            mainEntity: {
              '@type': 'ContactPoint',
              telephone: site.phone,
              contactType: 'customer service',
              areaServed: 'HN',
              availableLanguage: ['Spanish'],
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
