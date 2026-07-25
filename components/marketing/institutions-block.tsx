import { Building2 } from 'lucide-react';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/marketing/icon-badge';

/**
 * Bloque unificado de instituciones/autoridades (Hito 7.4 — FASE 5).
 *
 * Unifica los dos componentes que existían:
 *  - `InstitutionsBlock` (`service-detail-blocks.tsx`): lista de strings como
 *    chips en `<ul>`, para páginas de detalle de área.
 *  - `LocalInstitutionsBlock` (`local-context-blocks.tsx`): tarjetas con
 *    icono + nombre + role, para landings locales.
 *
 * El tipo `InstitutionItem` permite los dos casos:
 *  - { name } → chip simple (cuando solo se conoce el nombre).
 *  - { name, role?, note? } → tarjeta con descripción (cuando hay más detalle).
 *
 * El componente elige el layout automáticamente según los items:
 *  - Si NINGÚN item tiene `role`/`note` → chips compactos (lista densa).
 *  - Si ALGÚN item tiene `role`/`note` → tarjetas con icono (grid 2-col).
 *
 * Conserva íntegramente: nombres, roles, notas jurídicas, eyebrow/title/
 * subtitle y la semántica accesible (iconos `aria-hidden`, headings correctos).
 *
 * Es **Server Component** (sin tracking propio).
 */
export interface InstitutionItem {
  name: string;
  role?: string;
  note?: string;
}

export interface InstitutionsBlockProps {
  items: InstitutionItem[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Variante forzada (si no se indica, se infiere de los items). */
  variant?: 'chips' | 'cards';
}

export function InstitutionsBlock({
  items,
  eyebrow = 'Autoridades e instituciones',
  title = 'Ante quién puede actuar el despacho',
  subtitle,
  variant,
}: InstitutionsBlockProps) {
  if (!items.length) return null;

  // Inferir variante: 'cards' si algún item tiene role o note; 'chips' si no.
  const hasDetails = items.some((i) => i.role || i.note);
  const layout = variant ?? (hasDetails ? 'cards' : 'chips');

  return (
    <Section spacing="sm">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={
          subtitle ??
          'La intervención concreta depende del asunto. Algunos trámites requieren varias autoridades de forma coordinada.'
        }
        align="left"
      />

      {layout === 'chips' ? (
        <ul className="mt-4 flex flex-wrap gap-2 max-w-4xl list-none p-0 m-0">
          {items.map((item) => (
            <li
              key={item.name}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-alt border border-border-light text-xs md:text-sm text-text-secondary"
            >
              <Building2 size={14} className="text-accent-dark" aria-hidden="true" />
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card
              key={item.name}
              padding="md"
              className="h-full border-l-4 border-l-primary/40"
            >
              <div className="flex items-start gap-3">
                <IconBadge icon={Building2} />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-primary leading-snug">{item.name}</h3>
                  {item.role && (
                    <p className="text-sm text-text-secondary leading-relaxed mt-1">{item.role}</p>
                  )}
                  {item.note && (
                    <p className="text-xs text-text-muted leading-relaxed mt-1">{item.note}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
