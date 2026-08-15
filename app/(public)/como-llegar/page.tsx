import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Car,
  Bus,
  Phone,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { site, absoluteUrl, telHref, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CopyableAddress } from '@/components/marketing/copyable-address';
import { MapEmbed } from '@/components/marketing/map-embed';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { TrackedMapsLink } from '@/components/marketing/tracked-maps-link';

export const metadata: Metadata = {
  title: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department}`,
  description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa, rutas, cómo llegar desde Tegucigalpa, Choluteca y San Lorenzo.`,
  alternates: { canonical: '/como-llegar' },
  keywords: ['cómo llegar Nacaome', 'mapa bufete Valle', 'dirección abogados Nacaome', 'llegar a Nacaome Valle', 'oficina abogados Nacaome', 'ubicación Pineda y Asociados'],
  twitter: {
    card: 'summary_large_image',
    title: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department}`,
    description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa, rutas y referencias para encontrarnos.`,
    images: [`${site.url}/og-image.webp`],
  },
  openGraph: {
    title: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department} | ${site.name}`,
    description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa y rutas desde Tegucigalpa, Choluteca y San Lorenzo.`,
    url: `${site.url}/como-llegar`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.webp`, width: 1200, height: 630, alt: `${site.name} - Ubicación en Nacaome, Valle` }],
  },
};

const REF_POINTS = [
  { name: 'Hondutel Nacaome', distance: '90 m al oeste', desc: 'Punto de referencia principal. Estamos una cuadra y media al este.' },
  { name: 'Clínica Dental Dra. ANDARA', distance: 'Contiguo', desc: 'Nuestra oficina queda contigua a esta clínica dental.' },
  { name: 'Parque Central de Nacaome', distance: '~3 min caminando', desc: 'Camine al este por el boulevard principal.' },
  { name: 'Alcaldía Municipal de Nacaome', distance: '~5 min en vehículo', desc: 'Desde la alcaldía, tome dirección este sobre la calle principal.' },
];

const FROM_CITIES = [
  { from: 'Tegucigalpa', km: '~90 km', time: '1 h 45 min', route: 'Carretera CA-5 sur → desvío a Nacaome' },
  // Distancias verificadas (FASE 1) contra cartografía: Rome2Rio/Travelmath/Toponavi.
  // Valores aproximados por carretera; la distancia real varía según el trazado.
  { from: 'Choluteca', km: '~55 km', time: '1 h', route: 'Carretera Panamericana CA-1 oeste' },
  { from: 'San Lorenzo', km: '~18 km', time: '20 min', route: 'Carretera CA-1 hacia Nacaome' },
  { from: 'Amapala', km: '~45 km', time: '1 h', route: 'Vía Goascorán → Nacaome (cruce en lancha a la Isla del Tigre)' },
];

export default function ComoLlegarPage() {
  const { latitude, longitude } = site.geo;
  const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  const shortAddress = site.address.full;

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Cómo llegar' },
      ]} />
      <PageHero
        eyebrow="Cómo llegar"
        badge="Sede en Nacaome"
        title="Visítenos en Nacaome, Valle"
        subtitle={<>Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA. Use el mapa para orientarse o abra Google Maps/Waze desde aquí.</>}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/corporate/hero_despacho.webp"
      />

      <TrustBar background="light" />

      {/* MAPA */}
      <Section spacing="md">
        <Container size="lg">
          <div className="max-w-3xl mb-8">
            {/* Aclaración sede real vs. zonas atendidas (FASE 2). La sede física
                del bufete está únicamente en Nacaome; las demás localidades son
                zonas de atención habitual, no oficinas. Sin afirmar accesibilidad
                o estacionamiento no confirmados. */}
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 mb-5">
              <p className="text-sm text-text leading-relaxed text-pretty">
                <strong className="text-accent-dark">Sede única:</strong> la oficina
                física de {site.name} está en {site.address.city}, {site.address.department}.
                Las demás localidades que mencionamos en el sitio (San Lorenzo, Choluteca,
                Goascorán y otras) son <strong>zonas de atención habitual</strong>, no
                oficinas del bufete.
              </p>
            </div>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed">
              Nuestro despacho se encuentra en el centro de {site.address.city}, sobre una de las vías
              principales de la ciudad. La oficina está señalizada y es de fácil acceso tanto en
              vehículo particular como en transporte público. Si viene desde otra ciudad, las
              carreteras principales están en buen estado y el trayecto es directo.
            </p>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed mt-3">
              Recomendamos agendar su visita con antelación para garantizar la disponibilidad del
              abogado responsable de su caso. Si prefiere no desplazarse, también ofrecemos consulta
              telefónica y por videollamada. En cualquier caso, la evaluación inicial es confidencial.
            </p>
            {/* Matiz de distancias aproximadas (FASE 2): las distancias y tiempos
                listados abajo son aproximados por carretera y pueden variar según
                la ruta, el tráfico y las condiciones climáticas. */}
            <p className="text-xs text-text-muted leading-relaxed mt-3">
              Las distancias y tiempos indicados más abajo son aproximados por carretera
              y pueden variar según la ruta elegida, el tráfico y las condiciones climáticas.
            </p>
          </div>
        </Container>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card padding="none" className="overflow-hidden">
              <div className="aspect-[16/10] w-full bg-surface-alt relative">
                <MapEmbed />
              </div>
              <div className="p-4 border-t border-border-light flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xxs font-bold uppercase tracking-widest text-text-muted">
                    Coordenadas
                  </p>
                  <p className="text-sm font-semibold text-text tabular-nums">
                    {latitude}°N, {Math.abs(longitude)}°O
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TrackedMapsLink
                    href={gmapsLink}
                    origen="como-llegar-google-maps"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-white text-xs font-bold btn-shadow-primary btn-shadow-primary-hover hover:bg-primary-light transition-colors"
                  >
                    Google Maps
                  </TrackedMapsLink>
                  <Link
                    href="/solicitar-consulta#formulario"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border-light text-text text-xs font-bold btn-shadow-secondary btn-shadow-secondary-hover hover:bg-surface-alt"
                  >
                    <Phone size={14} /> Pedir indicaciones
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          <Card padding="md" className="h-full bg-surface border-border-light">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                <MapPin size={20} />
              </div>
              <h2 className="font-bold text-base text-text">Dirección</h2>
            </div>

            <p className="text-lg font-extrabold text-accent-dark tabular-nums mb-1">
              GGJ7+239
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {site.address.city}, {site.address.department}, {site.address.country}
            </p>

            <div className="border-t border-border-light my-4" />

            <h3 className="text-xxs font-bold uppercase tracking-widest text-text-muted mb-2">
              Referencia
            </h3>
            <p className="text-sm text-text leading-relaxed">
              {site.address.line2}
            </p>

            <div className="border-t border-border-light my-4" />

            <h3 className="text-xxs font-bold uppercase tracking-widest text-text-muted mb-2">
              Copiar dirección
            </h3>
            <CopyableAddress value={shortAddress} variant="default" />

            <div className="border-t border-border-light my-4" />

            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-accent-dark flex-shrink-0" />
                <a href={telHref()} className="text-text font-semibold hover:text-accent-dark tabular-nums">
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-success flex-shrink-0" />
                <a
                  href={whatsappHref('Hola, necesito indicaciones para llegar al bufete.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text font-semibold hover:text-success"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />
                <span className="text-text">Lun a Sáb · 7:00 – 20:00</span>
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* REFERENCE POINTS */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Puntos de referencia"
          title="Cómo encontrarnos fácilmente"
          subtitle="Cuatro puntos clave que le permitirán ubicarnos sin dificultad."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REF_POINTS.map((p) => (
            <Card key={p.name} padding="md" className="h-full">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm text-text leading-tight">{p.name}</p>
                  <p className="text-xs text-accent-dark font-semibold mt-0.5">{p.distance}</p>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* FROM OTHER CITIES */}
      <Section spacing="md">
        <SectionHeader
          eyebrow="Desde otras ciudades"
          title="Rutas y tiempos aproximados"
          subtitle="Distancias y tiempos de viaje por carretera. Considere tráfico y condiciones climáticas."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FROM_CITIES.map((c) => (
            <Card key={c.from} padding="md" className="h-full">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary text-text-inverse flex items-center justify-center flex-shrink-0">
                  <Car size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-bold text-sm text-text leading-tight">Desde {c.from}</p>
                    <span className="text-xxs font-bold text-accent-dark bg-accent/10 rounded-full px-2 py-0.5">
                      {c.km} · {c.time}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{c.route}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card padding="md" className="mt-6 bg-warning-bg border border-warning/30 flex items-start gap-3">
          <Bus size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>Transporte público:</strong> existen buses interurbanos desde Tegucigalpa,
            Choluteca y San Lorenzo hasta la terminal de Nacaome. Desde la terminal, el bufete
            se encuentra a 5 minutos en taxi o 15 minutos caminando.
          </p>
        </Card>
      </Section>

      <ConsultationCTA />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/como-llegar')}#webpage`,
          url: absoluteUrl('/como-llegar'),
          name: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department}`,
          description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa, rutas, cómo llegar desde Tegucigalpa, Choluteca y San Lorenzo.`,
          inLanguage: 'es-HN',
          isPartOf: { '@id': `${site.url}/#website` },
          about: { '@id': `${site.url}/#legal-service` },
        }),
      }} />
    </>
  );
}

