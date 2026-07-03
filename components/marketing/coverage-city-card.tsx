import Link from 'next/link';
import { ArrowRight, MapPin, Scale, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { whatsappHref } from '@/lib/site';
import type { LandingLocal } from '@/data/landings-locales';

/**
 * Chips de servicios destacados por ciudad.
 * Mapa slug → array de etiquetas cortas (chips). Si una ciudad no aparece,
 * se usa un fallback genérico de 4 servicios.
 */
const CITY_SERVICE_CHIPS: Record<string, string[]> = {
  nacaome: ['Penal', 'Familia', 'Laboral', 'Civil'],
  choluteca: ['Penal', 'Laboral', 'Familia', 'Civil'],
  'san-lorenzo': ['Mercantil', 'Aduanero', 'Laboral', 'Penal'],
  goascoran: ['Penal', 'Civil', 'Familia'],
  amapala: ['Penal', 'Laboral', 'Mercantil', 'Familia'],
  'san-marcos-de-colon': ['Penal', 'Familia', 'Laboral', 'Civil'],
  marcovia: ['Penal', 'Laboral', 'Familia', 'Civil'],
  'el-triunfo': ['Penal', 'Familia', 'Laboral', 'Civil'],
  pespire: ['Penal', 'Familia', 'Laboral', 'Civil'],
  langue: ['Penal', 'Familia', 'Laboral', 'Civil'],
  caridad: ['Penal', 'Familia', 'Laboral', 'Civil'],
  namasigue: ['Penal', 'Familia', 'Laboral', 'Civil'],
  orocuina: ['Penal', 'Familia', 'Laboral', 'Civil'],
};

/**
 * Descripción corta (1-2 líneas) por ciudad.
 * Si la ciudad no aparece, se genera una descripción genérica contextual.
 */
const CITY_DESCRIPTIONS: Record<string, string> = {
  nacaome: 'Sede principal del despacho. Atención directa en derecho penal, familia, laboral, civil y notarial.',
  choluteca: 'Cobertura jurídica para clientes de Choluteca y el corredor sur, con atención en procesos penales, familiares, laborales y civiles.',
  'san-lorenzo': 'Puerto y zona comercial. Asesoría mercantil, aduanera, laboral y defensa penal para empresas y particulares.',
  goascoran: 'Atención legal para clientes de Goascorán y la zona fronteriza, con orientación clara y consulta inicial sin compromiso.',
  amapala: 'Isla del Tigre y Golfo de Fonseca. Asesoría jurídica para el sector pesquero, portuario, familiar y penal.',
  'san-marcos-de-colon': 'Asistencia jurídica para clientes de San Marcos de Colón y la frontera sur, con enfoque penal, familiar, laboral y civil.',
  marcovia: 'Cobertura legal para Marcovia y la zona agroindustrial: conflictos laborales, penales, familiares y civiles.',
  'el-triunfo': 'Atención jurídica integral para El Triunfo y el sur de Choluteca, con defensa penal y asesoría familiar.',
  pespire: 'Asesoría legal para Pespire y el corredor de la Panamericana: derecho penal, laboral, familiar y civil.',
  langue: 'Cercanía y cobertura jurídica para Langue y el centro de Valle: penal, familia, laboral y notarial.',
  caridad: 'Atención legal para Caridad y el centro de Valle, con consulta inicial sin compromiso.',
};

function getDescription(landing: LandingLocal): string {
  return CITY_DESCRIPTIONS[landing.slug] ?? `Atención jurídica integral para clientes de ${landing.ciudad} y la zona sur de Honduras.`;
}

function getChips(slug: string): string[] {
  return CITY_SERVICE_CHIPS[slug] ?? ['Penal', 'Familia', 'Laboral', 'Civil'];
}

/**
 * Tarjeta de ciudad de cobertura mejorada.
 *
 * Funciona como mini-landing: muestra ciudad, departamento, descripción
 * contextual, chips de servicios principales, señal de confianza y CTA
 * hacia la landing local. Incluye CTA secundario de WhatsApp.
 *
 * Es un Server Component (sin estado). Reutilizable en Home, páginas de
 * cobertura (ciudades cercanas) y cualquier sección de Cobertura.
 */
export function CoverageCityCard({ landing }: { landing: LandingLocal }) {
  const href = `/abogados-en-${landing.slug}`;
  const description = getDescription(landing);
  const chips = getChips(landing.slug);
  const whatsappMsg = `Hola, soy de ${landing.ciudad} y necesito una consulta jurídica.`;

  return (
    <Card
      variant="elevated"
      premium
      padding="md"
      className="h-full flex flex-col"
    >
      {/* Badge departamento + icono */}
      <div className="flex items-center justify-between mb-3">
        <span className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0">
          <MapPin size={20} aria-hidden="true" />
        </span>
        <span className="text-xxs font-bold uppercase tracking-widest text-accent-dark bg-accent/10 border border-accent/20 px-2 py-1 rounded-full">
          {landing.departamento}
        </span>
      </div>

      {/* Título */}
      <h3 className="font-bold text-base text-text leading-tight">
        {`Abogados en ${landing.ciudad}`}
      </h3>

      {/* Descripción breve */}
      <p className="text-sm text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Chips de servicios */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 text-xxs font-semibold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded"
          >
            <Scale size={10} aria-hidden="true" />
            {chip}
          </span>
        ))}
      </div>

      {/* Separador sutil */}
      <div className="border-t border-border-light my-4" aria-hidden="true" />

      {/* Señal de confianza */}
      <p className="text-xs text-text-tertiary leading-relaxed">
        Consulta inicial sin compromiso
      </p>

      {/* CTAs */}
      <div className="mt-auto pt-3 flex items-center gap-2">
        <Link
          href={href}
          aria-label={`Ver cobertura jurídica en ${landing.ciudad}, ${landing.departamento}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
        >
          Ver cobertura <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <a
          href={whatsappHref(whatsappMsg)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar por WhatsApp sobre abogados en ${landing.ciudad}`}
          className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-lg bg-success/10 border border-success/30 text-success hover:bg-success hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/50"
        >
          <MessageCircle size={16} aria-hidden="true" />
        </a>
      </div>
    </Card>
  );
}

/**
 * Grid de tarjetas de cobertura.
 * Renderiza un array de landings usando `CoverageCityCard`.
 */
export function CoverageCityGrid({
  cities,
  maxCities,
}: {
  cities: LandingLocal[];
  maxCities?: number;
}) {
  const list = maxCities ? cities.slice(0, maxCities) : cities;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {list.map((c) => (
        <CoverageCityCard key={c.slug} landing={c} />
      ))}
    </div>
  );
}

/**
 * Devuelve las ciudades relacionadas (mismo departamento primero, luego
 * las más cercanas por distancia), excluyendo la ciudad actual.
 */
export function getRelatedCities(currentSlug: string, max = 4): LandingLocal[] {
  // Importación dinámica para evitar dependencia circular si este archivo
  // termina siendo importado por data/landings-locales.ts en el futuro.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { landingsLocales } = require('@/data/landings-locales') as {
    landingsLocales: LandingLocal[];
  };
  const current = landingsLocales.find((l) => l.slug === currentSlug);
  if (!current) return [];
  const otras = landingsLocales.filter((l) => l.slug !== currentSlug);
  const mismoDepto = otras
    .filter((l) => l.departamento === current.departamento)
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
  const otrasDepto = otras
    .filter((l) => l.departamento !== current.departamento)
    .sort(
      (a, b) =>
        Math.abs(a.distanciaKm - current.distanciaKm) -
        Math.abs(b.distanciaKm - current.distanciaKm),
    );
  return [...mismoDepto, ...otrasDepto].slice(0, max);
}
