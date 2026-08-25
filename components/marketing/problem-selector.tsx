import {
  Gavel,
  HeartHandshake,
  Briefcase,
  Scale,
  Globe,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { NavCardGrid, type NavCardItem } from '@/components/marketing/nav-card-grid';

/**
 * Selector por problema (FASE 2 — Página de inicio).
 *
 * Accesos comprensibles para personas que NO conocen la rama jurídica de su
 * problema. Cada entrada dirige a una página real y adecuada del sitio.
 *
 * Hito 7.2 (FASE 5): delega la presentación en `<NavCardGrid variant='problems'>`,
 * compartida con `ServiceBlocks`. Conserva exactamente las 6 entradas, sus
 * rutas, iconos, hints y la cabecera explicativa. No cambia enlaces ni
 * contenido.
 *
 * Restricciones (AGENTS.md R5):
 *  - Reutiliza el design system existente (Section, IconBadge, tokens canónicos R16).
 *  - No introduce nuevos estilos visuales; solo estructura y jerarquía.
 *  - No afirma especialidades no confirmadas; usa redacción prudente.
 *
 * Las rutas se verifican contra el árbol `app/(public)` en cada cambio.
 */
interface ProblemEntry {
  /** Texto comprensible del problema (perspectiva del usuario). */
  label: string;
  /** Ruta interna real y verificada. */
  href: string;
  icon: LucideIcon;
  /** Descripción breve de qué encontrará al seguir el enlace. */
  hint: string;
}

const PROBLEM_ENTRIES: readonly ProblemEntry[] = [
  {
    label: 'Me han detenido, denunciado o citado',
    href: '/derecho-penal',
    icon: Gavel,
    hint: 'Defensa penal desde la primera actuación procesal.',
  },
  {
    label: 'Necesito ayuda con divorcio, custodia o alimentos',
    href: '/servicios-juridicos/derecho-de-familia',
    icon: HeartHandshake,
    hint: 'Derecho de familia: medidas urgentes, acuerdos y juicio.',
  },
  {
    label: 'Tengo un problema laboral o un despido',
    href: '/servicios-juridicos/derecho-laboral',
    icon: Briefcase,
    hint: 'Prestaciones, despidos y conflictos en el trabajo.',
  },
  {
    label: 'Necesito revisar una propiedad, contrato o herencia',
    href: '/servicios-juridicos/derecho-civil-y-notarial',
    icon: Scale,
    hint: 'Derecho civil y notarial: contratos, bienes y sucesiones.',
  },
  {
    label: 'Vivo en España y necesito una gestión en Honduras',
    href: '/hondurenos-en-espana',
    icon: Globe,
    hint: 'Coordinación documental y legal entre España y Honduras.',
  },
  {
    label: 'No sé qué tipo de abogado necesito',
    href: '/solicitar-consulta',
    icon: HelpCircle,
    hint: 'Cuéntenos su caso: le orientamos sobre el área adecuada.',
  },
] as const;

const ITEMS: NavCardItem[] = PROBLEM_ENTRIES.map((e) => ({
  title: e.label,
  description: e.hint,
  icon: e.icon,
  href: e.href,
}));

export function ProblemSelector() {
  return (
    <nav aria-label="Seleccione su problema jurídico">
      <div className="mb-6 md:mb-8">
        <p className="eyebrow-rule text-accent-dark mb-2">
          ¿Cuál es su situación?
        </p>
        <h2 className="font-serif font-bold text-2xl md:text-3xl lg:text-4xl text-primary text-balance">
          Empiece por su problema, no por la rama del derecho
        </h2>
        <p className="mt-3 text-sm md:text-base text-text-secondary max-w-2xl text-pretty">
          No necesita conocer el nombre técnico del área. Seleccione la opción
          que mejor describa su situación y le llevamos a la información correcta.
        </p>
      </div>
      <NavCardGrid items={ITEMS} variant="problems" columns={3} />
    </nav>
  );
}
