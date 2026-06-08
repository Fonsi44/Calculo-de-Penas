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
  title: 'Cómo llegar al bufete',
  description: `Indicaciones para llegar a ${site.name} en Nacaome, Valle. Dirección exacta, mapa, rutas y referencias para encontrarnos.`,
  alternates: { canonical: '/como-llegar' },
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
  const wazeLink = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

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
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors"
                  >
                    <Navigation size={14} /> Google Maps
                    <ExternalLink size={11} className="opacity-70" />
                  </a>
                  <a
                    href={wazeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-info text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    <Car size={14} /> Waze
                    <ExternalLink size={11} className="opacity-70" />
                  </a>
                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-light text-text text-xs font-bold hover:bg-surface-alt"
                  >
                    <Phone size={14} /> Pedir indicaciones
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          <Card padding="md" className="!bg-primary text-text-inverse h-full">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-accent" />
              <h2 className="font-bold text-base text-text-inverse">Dirección</h2>
            </div>

            <p className="text-lg font-bold text-accent tabular-nums mb-1">
              GGJ7+239
            </p>
            <p className="text-sm text-text-inverse/95 leading-relaxed">
              {site.address.city}, {site.address.department}, {site.address.country}
            </p>

            <div className="border-t border-primary-light/30 my-4" />

            <h3 className="text-xxs font-bold uppercase tracking-widest text-accent mb-2">
              Referencia
            </h3>
            <p className="text-sm text-text-inverse/85 leading-relaxed">
              {site.address.line2}
            </p>

            <div className="border-t border-primary-light/30 my-4" />

            <h3 className="text-xxs font-bold uppercase tracking-widest text-accent mb-2">
              Copiar dirección
            </h3>
            <CopyableAddress value={shortAddress} variant="inverse" />

            <div className="border-t border-primary-light/30 my-4" />

            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-accent flex-shrink-0" />
                <a href={telHref()} className="hover:text-accent tabular-nums">
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-accent flex-shrink-0" />
                <a
                  href={whatsappHref('Hola, necesito indicaciones para llegar al bufete.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-accent flex-shrink-0 mt-0.5" />
                <span>Lun a Sáb · 7:00 – 20:00</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REF_POINTS.map((p) => (
            <Card key={p.name} padding="md" className="h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FROM_CITIES.map((c) => (
            <Card key={c.from} padding="md" className="h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary text-text-inverse flex items-center justify-center flex-shrink-0">
                  <Car size={18} />
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

