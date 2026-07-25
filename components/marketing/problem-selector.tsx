import Link from 'next/link';
import {
  Gavel,
  HeartHandshake,
  Briefcase,
  Scale,
  Globe,
  HelpCircle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/marketing/section';

/**
 * Selector por problema (FASE 2 — Página de inicio).
 *
 * Accesos comprensibles para personas que NO conocen la rama jurídica de su
 * problema. Cada entrada dirige a una página real y adecuada del sitio.
 *
 * Restricciones (AGENTS.md R5):
 *  - Reutiliza el design system existente (Section, Card, tokens canónicos R16).
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

export function ProblemSelector() {
  return (
    <nav aria-label="Seleccione su problema jurídico" className="py-2">
      <Container size="lg">
        <div className="text-center mb-6">
          <p className="eyebrow-rule text-accent-dark text-xs font-bold uppercase tracking-eyebrow mb-2">
            ¿Cuál es su situación?
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary text-balance">
            Empiece por su problema, no por la rama del derecho
          </h2>
          <p className="mt-3 text-sm md:text-base text-text-secondary max-w-2xl mx-auto text-pretty">
            No necesita conocer el nombre técnico del área. Seleccione la opción
            que mejor describa su situación y le llevamos a la información correcta.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROBLEM_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="group flex items-start gap-3.5 rounded-lg border border-border-light bg-surface p-4 hover:border-accent/40 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 h-full"
                >
                  <span className="w-11 h-11 rounded-lg bg-accent/10 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/20 group-hover:bg-accent/15 transition-colors">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text leading-snug text-pretty">
                      {entry.label}
                    </span>
                    <span className="block text-xs text-text-secondary mt-1 leading-relaxed">
                      {entry.hint}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-text-muted flex-shrink-0 mt-1 group-hover:text-accent-dark group-hover:translate-x-0.5 transition-all"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
