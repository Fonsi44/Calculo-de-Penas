import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
import { telHref, whatsappHref, site, FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
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
  description: 'Solicite consulta confidencial sin costo. Respuesta en horario hábil. Abogados en Nacaome, Valle — defensa penal, familia, laboral y civil.',
  canonicalPath: '/solicitar-consulta',
  keywords: ['consulta legal gratuita Nacaome', 'abogado consulta Valle', 'asesoría legal sin costo sur Honduras', 'consulta penal confidencial Nacaome', 'contactar abogado San Lorenzo', 'cita legal Choluteca', 'abogado Goascorán consulta', 'contactar abogado Amapala', 'cita legal Pespire', 'contactar abogado sur de Honduras'],
  ogImageAlt: `${site.name} - Solicitar Consulta Legal`,
});

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
            {/* SU EQUIPO —3 socios del bufete en tarjetas individuales.
                Presencia humana en el momento de mayor intención de conversión.
                Estructura individual para facilitar añadir teléfono directo de
                cada abogado en el futuro. */}
            {[
              {
                name: FOUNDER_PROFILE.name,
                jobTitle: FOUNDER_PROFILE.jobTitle,
                image: FOUNDER_PROFILE.image,
                imageAltText: FOUNDER_PROFILE.imageAltText ?? 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)',
                tagline: 'Defensa penal',
                href: '/derecho-penal',
              },
              {
                name: THANIA_PROFILE.name,
                jobTitle: THANIA_PROFILE.jobTitle,
                image: THANIA_PROFILE.image,
                imageAltText: THANIA_PROFILE.imageAltText,
                tagline: 'Familia · Mercantil · Civil',
                href: '/servicios-juridicos/derecho-de-familia',
              },
              {
                name: EMIL_PROFILE.name,
                jobTitle: EMIL_PROFILE.jobTitle,
                image: EMIL_PROFILE.image,
                imageAltText: EMIL_PROFILE.imageAltText,
                tagline: 'Laboral · Civil y Notarial',
                href: '/servicios-juridicos/derecho-laboral',
              },
            ].map((p) => (
              <Card key={p.name} padding="md" className="border-l-4 border-l-accent">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 rounded-lg bg-accent/15 blur-md" aria-hidden="true" />
                    <div className="relative w-14 h-14 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                      <Image
                        src={p.image}
                        alt={p.imageAltText}
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                        sizes="56px"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xxs font-medium uppercase tracking-wider text-accent-dark mb-0.5">
                      {p.tagline}
                    </p>
                    <p className="font-serif font-bold text-base text-text leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-text-secondary leading-snug mt-0.5">
                      {p.jobTitle}
                    </p>
                  </div>
                </div>
              </Card>
            ))}

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
            <div className="p-4 rounded-lg bg-gradient-to-br from-aggravation/10 to-aggravation/5 border border-aggravation/20">
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
                  <div key={r} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-primary/5 text-xs text-text-secondary">
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
