import Link from 'next/link';
import { FileText, MapPin } from 'lucide-react';
import { Section, SectionHeader } from '@/components/marketing/section';
import { InstitutionsBlock } from '@/components/marketing/institutions-block';
import { Card } from '@/components/ui/card';
import { DISTANCIA_APROX_NOTA, type LandingLocal } from '@/data/landings-locales';
import { site } from '@/lib/site';

/**
 * Bloques presentacionales reutilizables por las páginas locales prioritarias
 * (FASE 4 §7). Consumen campos opcionales del modelo territorial de
 * `LandingLocal`. Cada bloque se renderiza solo si recibe datos, evitando
 * secciones vacías y respetando el diseño canónico (rounded-lg, design tokens).
 *
 * Reglas (AGENTS.md R5): SEO y contenido, sin rediseño visual. Sin inventar
 * instituciones, distancias o competencias. Todo proviene de la fuente única
 * `data/landings-locales.ts`.
 */

/** Modalidad de atención y distancia aproximada, con aviso orientativo.
 *  Refuerza la transparencia sobre la sede de Nacaome (FASE 4 §7.2/§7.4). */
export function LocalAtencionBlock({ landing }: { landing: LandingLocal }) {
  const modos: Record<string, string> = {
    office: 'Atención presencial en Nacaome',
    remote: 'Primera revisión por teléfono, WhatsApp o videollamada',
    travel: 'Coordinación de desplazamiento cuando el caso lo requiere',
  };
  const modosTexto = (landing.serviceModes ?? [])
    .map((m) => modos[m])
    .filter(Boolean)
    .join(' · ');

  return (
    <Section background="default" spacing="md">
      <div className="max-w-3xl">
        <SectionHeader
          eyebrow="Modalidad de atención"
          title={`Cómo atendemos a clientes de ${landing.ciudad}`}
          align="left"
        />
        <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
          {landing.sedeFisica
            ? `Pineda y Asociados tiene su sede principal en ${landing.ciudad}, ${landing.departamento}. La atención puede ser presencial en la oficina o iniciarse por medios remotos según el tipo de asunto.`
            : `Pineda y Asociados atiende a clientes de ${landing.ciudad} desde ${landing.servedFrom ?? 'nuestra oficina en Nacaome'}. La primera revisión puede realizarse por teléfono o medios remotos, y el desplazamiento o la comparecencia presencial se determina según el tipo de asunto, la autoridad competente y la documentación disponible.`}
        </p>
        {!landing.sedeFisica && (
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            <strong className="text-text">Distancia aproximada:</strong>{' '}
            {landing.distanciaKm} km desde Nacaome
            {landing.approximateTravelTime ? ` (${landing.approximateTravelTime})` : ''}.
            {modosTexto ? ` ${modosTexto}.` : ''}
          </p>
        )}
        <p className="mt-2 text-xs text-text-muted leading-relaxed">{DISTANCIA_APROX_NOTA}</p>
        {!landing.sedeFisica && (
          <Link
            href="/como-llegar"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            Cómo llegar a la oficina en Nacaome <MapPin size={14} />
          </Link>
        )}
      </div>
    </Section>
  );
}

/** Instituciones reales con competencia en la zona, en texto general.
 *  No atribuye responsabilidades exclusivas ni inventa organismos.
 *
 *  Hito 7.4 (FASE 5): delega el render en el componente canónico
 *  `<InstitutionsBlock>` de `institutions-block.tsx`, preservando el título
 *  específico de la ciudad y la variante 'cards' (grid con icono). */
export function LocalInstitutionsBlock({ landing }: { landing: LandingLocal }) {
  if (!landing.institutions || landing.institutions.length === 0) return null;
  return (
    <InstitutionsBlock
      items={landing.institutions.map((inst) => ({ name: inst.name, role: inst.role }))}
      eyebrow="Autoridades e instituciones"
      title={`Instituciones relevantes para trámites en ${landing.ciudad}`}
      subtitle="Referencias generales sobre organismos con competencia en la zona; la autoridad concreta depende del tipo de asunto."
      variant="cards"
    />
  );
}

/** Ficha única por ciudad: sede o distancia, institución y acceso. */
export function LocalCitySnapshot({ landing }: { landing: LandingLocal }) {
  const institution = landing.institutions?.[0];
  const contextLead = landing.localContext?.[0];

  return (
    <aside className="mt-6 rounded-lg border border-border-light bg-surface p-5 md:p-6">
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark">
        {landing.sedeFisica ? 'Sede física' : `Atención a ${landing.ciudad}`}
      </p>
      <p className="mt-2 font-serif text-lg font-bold text-primary">
        {landing.sedeFisica
          ? `${site.address.line1}, ${landing.ciudad}`
          : `Desde Nacaome · ${landing.distanciaKm} km`}
      </p>
      {!landing.sedeFisica && landing.approximateTravelTime && (
        <p className="mt-1 text-sm text-text-secondary">
          Tiempo aproximado de viaje: {landing.approximateTravelTime}.
        </p>
      )}
      {contextLead && (
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">{contextLead}</p>
      )}
      {institution && (
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          <span className="font-semibold text-text">{institution.name}.</span> {institution.role}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/como-llegar"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary"
        >
          Cómo llegar a Nacaome <MapPin size={14} aria-hidden="true" />
        </Link>
        {landing.sedeFisica && (
          <a
            href={site.googleBusiness}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:text-accent-dark"
          >
            Ver en Google Maps
          </a>
        )}
      </div>
    </aside>
  );
}

/** Cuándo es necesario acudir presencialmente y cómo enviar documentación.
 *  Contenido genérico, prudente y reutilizable (FASE 4 §7.8/§7.7). */
export function LocalDocumentLogistics({ landing }: { landing: LandingLocal }) {
  return (
    <Section background="default" spacing="md">
      <div className="max-w-3xl">
        <SectionHeader
          eyebrow="Documentación y comparecencia"
          title="Cuándo es necesaria la presencia física"
          align="left"
        />
        <div className="mt-4 space-y-4">
          <Card padding="md">
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <FileText size={16} className="text-accent-dark" aria-hidden="true" />
              Envío de documentación
            </h3>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              Para iniciar la revisión puede enviar copias legibles por WhatsApp al{' '}
              <a href={`tel:${site.phone}`} className="text-accent-dark hover:underline">
                {site.phoneDisplay}
              </a>
              {' '}o mediante el formulario. No envíe documentos originales en el primer contacto:
              con copias claras basta para una primera evaluación.
            </p>
          </Card>
          <Card padding="md">
            <h3 className="font-bold text-sm text-text">Casos en los que suele requerirse presencia</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-text-secondary leading-relaxed list-disc pl-5">
              <li>Audiencias judiciales y comparecencias ante la autoridad competente.</li>
              <li>Otorgamiento de poderes y firmas notariales que exigen comparecencia.</li>
              <li>Diligencias registrales o trámites que no admiten representación.</li>
            </ul>
            <p className="mt-2 text-xs text-text-muted leading-relaxed">
              {landing.sedeFisica
                ? ''
                : `En estos casos coordinamos la comparecencia desde ${landing.servedFrom ?? 'nuestra oficina en Nacaome'} o el desplazamiento a ${landing.ciudad} cuando proceda.`}
            </p>
          </Card>
        </div>
        <Link
          href="/solicitar-consulta"
          className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
        >
          Solicitar consulta desde {landing.ciudad} <MapPin size={14} />
        </Link>
      </div>
    </Section>
  );
}
