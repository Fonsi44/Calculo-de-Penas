import Link from 'next/link';
import {
  HeartHandshake,
  Briefcase,
  ShieldCheck,
  Gavel,
  Globe,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/marketing/section';

/**
 * Bloques de servicios por necesidad (FASE 2 — /servicios-juridicos).
 *
 * Agrupa las áreas del bufete por intención de necesidad (no por rama técnica),
 * para que usuarios no jurídicos encuentren su caso sin conocer el nombre del
 * área. Cada bloque lista problemas y enlaza a la página real del área.
 *
 * Restricciones (AGENTS.md R5, R7):
 *  - No modifica las páginas individuales ni elimina servicios.
 *  - Reutiliza el design system existente.
 *  - Cuando un servicio está pendiente de evidencia profesional, se describe de
 *    forma prudente y no se destaca como especialidad principal.
 *
 * Los slugs se verifican contra data/areas-juridicas.ts en cada cambio:
 *  - derecho-penal (hub /derecho-penal)
 *  - derecho-de-familia, derecho-laboral, derecho-civil-y-notarial
 *  - derecho-mercantil-empresarial, derecho-bancario-y-financiero,
 *    tributario-fiscal, derecho-administrativo-y-servicio-civil,
 *    derecho-aduanero-y-comercio-exterior
 *  - regulacion-sanitaria, ambiental-regulatorio, propiedad-intelectual
 *  - conciliacion-y-arbitraje
 *  - extranjeria-en-honduras (subárea de /hondurenos-en-espana)
 */

interface ServiceLink {
  label: string;
  href: string;
}

interface ServiceBlock {
  id: string;
  icon: LucideIcon;
  title: string;
  /** Problema/necesidad que atiende el bloque. */
  need: string;
  /** Tipo de cliente habitual. */
  audience: string;
  services: ServiceLink[];
}

const SERVICE_BLOCKS: readonly ServiceBlock[] = [
  {
    id: 'personas-y-familia',
    icon: HeartHandshake,
    title: 'Personas y familia',
    need: 'Conflictos personales, familiares y patrimoniales de individuos.',
    audience: 'Personas y familias.',
    services: [
      { label: 'Penal', href: '/derecho-penal' },
      { label: 'Familia', href: '/servicios-juridicos/derecho-de-familia' },
      { label: 'Laboral', href: '/servicios-juridicos/derecho-laboral' },
      { label: 'Civil', href: '/servicios-juridicos/derecho-civil-y-notarial' },
      { label: 'Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
    ],
  },
  {
    id: 'empresas-y-actividad-economica',
    icon: Briefcase,
    title: 'Empresas y actividad económica',
    need: 'Sociedades, contratos comerciales, impuestos, banca y relaciones con la Administración.',
    audience: 'Empresas, emprendedores y autónomos.',
    services: [
      { label: 'Mercantil', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
      { label: 'Bancario', href: '/servicios-juridicos/derecho-bancario-y-financiero' },
      { label: 'Tributario', href: '/servicios-juridicos/tributario-fiscal' },
      { label: 'Administrativo', href: '/servicios-juridicos/derecho-administrativo-y-servicio-civil' },
      { label: 'Aduanero', href: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior' },
    ],
  },
  {
    id: 'sectores-regulados',
    icon: ShieldCheck,
    title: 'Sectores regulados',
    need: 'Cumplimiento sectorial, propiedad intelectual y materia ambiental.',
    audience: 'Empresas reguladas, profesionales y titulares de derechos.',
    services: [
      { label: 'Sanitario', href: '/servicios-juridicos/regulacion-sanitaria' },
      { label: 'Ambiental', href: '/servicios-juridicos/ambiental-regulatorio' },
      { label: 'Propiedad intelectual', href: '/servicios-juridicos/propiedad-intelectual' },
    ],
  },
  {
    id: 'resolucion-de-conflictos',
    icon: Gavel,
    title: 'Resolución de conflictos',
    need: 'Vías alternativas y judicial para resolver disputas.',
    audience: 'Cualquier parte en un conflicto jurídico.',
    services: [
      { label: 'Conciliación y arbitraje', href: '/servicios-juridicos/conciliacion-y-arbitraje' },
    ],
  },
  {
    id: 'hondurenos-en-espana',
    icon: Globe,
    title: 'Hondureños en España',
    need: 'Gestiones y trámites entre España y Honduras.',
    audience: 'Hondureños residentes en España y sus familias.',
    services: [
      { label: 'Asistencia transnacional', href: '/hondurenos-en-espana' },
    ],
  },
] as const;

export function ServiceBlocks() {
  return (
    <nav aria-label="Servicios por tipo de necesidad" className="py-2">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {SERVICE_BLOCKS.map((block) => {
            const Icon = block.icon;
            return (
              <article
                key={block.id}
                className="flex flex-col rounded-lg border border-border-light bg-surface p-5 h-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-11 h-11 rounded-lg bg-accent/10 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/20">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="font-serif font-bold text-base text-text leading-tight">
                    {block.title}
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-1 text-pretty">
                  <span className="font-semibold text-text">Atiende:</span> {block.need}
                </p>
                <p className="text-xs text-text-muted leading-relaxed mb-4 text-pretty">
                  <span className="font-semibold text-text-secondary">Cliente:</span> {block.audience}
                </p>
                <ul className="mt-auto flex flex-wrap gap-2">
                  {block.services.map((svc) => (
                    <li key={`${block.id}-${svc.href}-${svc.label}`}>
                      <Link
                        href={svc.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/5 border border-border-light text-xs font-semibold text-text hover:border-accent/40 hover:text-accent-dark transition-colors"
                      >
                        {svc.label}
                        <ArrowRight size={11} className="opacity-60" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}
