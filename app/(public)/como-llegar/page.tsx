import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Car,
  Bus,
  Phone,
  MessageCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CopyableAddress } from '@/components/marketing/copyable-address';
import { MapEmbed } from '@/components/marketing/map-embed';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';

export const metadata: Metadata = {
  title: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department}`,
  description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa, rutas, cómo llegar desde Tegucigalpa, Choluteca y San Lorenzo.`,
  alternates: { canonical: '/como-llegar' },
  keywords: ['cómo llegar Nacaome', 'mapa bufete Valle', 'dirección abogados Nacaome', 'llegar a Nacaome Valle', 'oficina abogados Nacaome', 'ubicación Pineda y Asociados'],
  twitter: {
    card: 'summary_large_image',
    title: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department}`,
    description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa, rutas y referencias para encontrarnos.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Cómo Llegar al Bufete en ${site.address.city}, ${site.address.department} | ${site.name}`,
    description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa y rutas desde Tegucigalpa, Choluteca y San Lorenzo.`,
    url: `${site.url}/como-llegar`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Ubicación en Nacaome, Valle` }],
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
  { from: 'Choluteca', km: '~65 km', time: '1 h 10 min', route: 'Carretera Panamericana CA-1 oeste' },
  { from: 'San Lorenzo', km: '~30 km', time: '40 min', route: 'Carretera CA-1 hacia Nacaome' },
  { from: 'Amapala', km: '~50 km', time: '1 h 20 min', route: 'Vía Goascorán → Nacaome' },
];

export default function ComoLlegarPage() {
  const { latitude, longitude } = site.geo;
  const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  const shortAddress = site.address.full;

  return (
    <>
      <section className="bg-primary text-text-inverse">
        <Container size="lg" className="py-12 md:py-16">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            Cómo llegar
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
            Visítenos en Nacaome, Valle
          </h1>
          <p className="mt-4 text-sm md:text-base text-text-inverse/85 leading-relaxed max-w-2xl">
            <strong className="font-bold text-accent tabular-nums">GGJ7+239</strong>
            {' · '}Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA.
            Use el mapa para orientarse o abra Google Maps/Waze desde aquí.
          </p>
        </Container>
      </section>

      {/* MAPA */}
      <Section spacing="md">
        <Container size="lg">
          <div className="max-w-3xl mb-8">
            <p className="text-sm md:text-base text-text-secondary leading-relaxed">
              Nuestro despacho se encuentra en el centro de {site.address.city}, sobre una de las vías
              principales de la ciudad. La oficina está señalizada y es de fácil acceso tanto en
              vehículo particular como en transporte público. Si viene desde otra ciudad, las
              carreteras principales están en buen estado y el trayecto es directo.
            </p>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed mt-3">
              Recomendamos agendar su visita con antelación para garantizar la disponibilidad del
              abogado responsable de su caso. Si prefiere no desplazarse, también ofrecemos consulta
              telefónica y por videollamada. En cualquier caso, la primera consulta es confidencial
              y sin costo.
            </p>
          </div>
        </Container>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card padding="none" className="overflow-hidden">
              <div className="aspect-[16/10] w-full bg-surface-alt relative">
                <MapEmbed
                  latitude={latitude}
                  longitude={longitude}
                  label={site.name}
                  fullAddress={`${site.address.line1} — ${site.address.line2}, ${site.address.city}`}
                  zoom={16}
                  className="w-full h-full"
                />
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
                  <a
                    href={gmapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-white text-xs font-bold btn-shadow-primary btn-shadow-primary-hover hover:bg-primary-light transition-colors"
                  >
                    <Navigation size={14} /> Google Maps
                    <ExternalLink size={11} className="opacity-70" />
                  </a>
                  <a
                    href={osmLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver en OpenStreetMap — mapa libre y gratuito"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-alt text-text text-xs font-bold border border-border-light hover:border-accent/40 hover:text-accent-dark transition-colors"
                  >
                    <MapPin size={14} /> OpenStreetMap
                    <ExternalLink size={11} className="opacity-70" />
                  </a>
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
    </>
  );
}

