import {
  HeartHandshake,
  Briefcase,
  ShieldCheck,
  Gavel,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/marketing/section';
import { NavCardGrid, type NavCardItem } from '@/components/marketing/nav-card-grid';

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
  const items: NavCardItem[] = SERVICE_BLOCKS.map((block) => ({
    title: block.title,
    description: block.need,
    primaryLabel: 'Atiende',
    category: block.audience,
    icon: block.icon,
    href: block.services[0]?.href ?? '/servicios-juridicos',
    links: block.services.map((svc) => ({ label: svc.label, href: svc.href })),
  }));

  return (
    <nav aria-label="Servicios por tipo de necesidad" className="py-2">
      <Container size="lg">
        <NavCardGrid items={items} variant="services" columns={3} />
      </Container>
    </nav>
  );
}
