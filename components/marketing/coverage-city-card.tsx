import Link from 'next/link';
import { ArrowRight, MapPin, Scale, MessageCircle, Clock } from 'lucide-react';
import { whatsappHref } from '@/lib/site';
import type { LandingLocal } from '@/data/landings-locales';
import { Reveal } from '@/components/marketing/reveal';

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

/** Marca visual para la ciudad sede (distinción jerárquica). */
const HEADQUARTER_SLUGS = new Set<string>(['nacaome']);

function getDescription(landing: LandingLocal): string {
  return CITY_DESCRIPTIONS[landing.slug] ?? `Atención jurídica integral para clientes de ${landing.ciudad} y la zona sur de Honduras.`;
}

function getChips(slug: string): string[] {
  return CITY_SERVICE_CHIPS[slug] ?? ['Penal', 'Familia', 'Laboral', 'Civil'];
}

/**
 * Tarjeta de ciudad de cobertura — ficha profesional premium.
 *
 * Refinamiento (Jul 2026): transformada de "grid genérico de tarjetas" a
 * ficha de oficina jurídica. Mayor jerarquía del nombre de ciudad, badge de
 * departamento refinado, chips modernos, separación elegante, hover spring
 * discreto y elevación progresiva. Mantiene contenido, datos y SEO intactos.
 *
 * Server Component (sin estado). El wrapper reveal/escalonado lo aplica
 * `CoverageCityGrid` vía <Reveal>.
 */
export function CoverageCityCard({ landing }: { landing: LandingLocal }) {
  const href = `/abogados-en-${landing.slug}`;
  const description = getDescription(landing);
  const chips = getChips(landing.slug);
  const whatsappMsg = `Hola, soy de ${landing.ciudad} y necesito una consulta jurídica.`;
  const isHQ = HEADQUARTER_SLUGS.has(landing.slug);

  return (
    <article className="city-card focus-ring h-full flex flex-col p-5 md:p-6" tabIndex={-1}>
      {/* Cabecera: icono + departamento + marca HQ */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/12 to-primary/6 border border-primary/15 text-primary flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <MapPin size={20} />
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <span className="badge-refined">{landing.departamento}</span>
          {isHQ && (
            <span className="inline-flex items-center text-xxs font-bold uppercase tracking-widest text-accent-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5" aria-hidden="true" />
              Sede
            </span>
          )}
        </div>
      </div>

      {/* Título — jerarquía máxima, serif, tracking ajustado */}
      <h3 className="font-serif font-bold text-lg md:text-xl text-text leading-tight tracking-tight">
        {landing.ciudad}
      </h3>
      <p className="text-xxs font-semibold uppercase tracking-widest text-text-muted mt-1">
        Abogados en {landing.departamento}
      </p>

      {/* Descripción breve */}
      <p className="text-sm text-text-secondary mt-3 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Chips de servicios — especialidades modernas */}
      <div className="flex flex-wrap gap-1.5 mt-4">
        {chips.map((chip) => (
          <span key={chip} className="chip-specialty">
            <Scale size={10} className="text-accent-dark" aria-hidden="true" />
            {chip}
          </span>
        ))}
      </div>

      {/* Separador elegante */}
      <hr className="divider-soft my-5" aria-hidden="true" />

      {/* Señal de confianza + horario */}
      <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
        <Clock size={12} aria-hidden="true" />
        <span>Lun a Sáb 7:00 – 20:00</span>
      </div>

      {/* CTAs — pegados al fondo */}
      <div className="mt-auto pt-4 flex items-center gap-2">
        <Link
          href={href}
          aria-label={`Ver cobertura jurídica en ${landing.ciudad}, ${landing.departamento}`}
          className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors rounded-md"
        >
          Ver cobertura <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <a
          href={whatsappHref(whatsappMsg)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar por WhatsApp sobre abogados en ${landing.ciudad}`}
          className="focus-ring ml-auto inline-flex items-center justify-center w-9 h-9 rounded-lg bg-success/10 border border-success/30 text-success hover:bg-success hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-success/30"
        >
          <MessageCircle size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

/**
 * Grid de tarjetas de cobertura — con reveal escalonado.
 *
 * Renderiza un array de landings usando `CoverageCityCard`, envuelto en
 * <Reveal> para aparición progresiva con delays escalonados (0-360ms).
 * Respeta prefers-reduced-motion (CSS desactiva la animación).
 */
export function CoverageCityGrid({
  cities,
  maxCities,
}: {
  cities: LandingLocal[];
  maxCities?: number;
}) {
  const list = maxCities ? cities.slice(0, maxCities) : cities;
  // Import dinámico para evitar problemas de bundling en Server Components.
  // Reveal es 'use client', CoverageCityGrid es Server Component.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {list.map((c, i) => (
        <RevealItem key={c.slug} index={i}>
          <CoverageCityCard landing={c} />
        </RevealItem>
      ))}
    </div>
  );
}

/**
 * Wrapper client para reveal escalonado por índice.
 * Separado para mantener CoverageCityGrid como Server Component.
 */
function RevealItem({ index, children }: { index: number; children: React.ReactNode }) {
  // Ciclo de delays 1-6 (60ms, 120ms, 180ms, 240ms, 300ms, 360ms)
  const delay = ((index % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  return <Reveal delay={delay}>{children}</Reveal>;
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
