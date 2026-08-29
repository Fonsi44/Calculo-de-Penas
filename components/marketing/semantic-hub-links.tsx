import Link from 'next/link';
import { semanticLinkProps } from '@/lib/semantic-link';
import { cn } from '@/lib/ui';

export type SemanticHubVariant =
  | 'home'
  | 'local-nacaome'
  | 'local-choluteca'
  | 'local-regional'
  | 'blog'
  | 'despacho'
  | 'guia'
  | 'servicios';

interface SemanticHubLinksProps {
  variant: SemanticHubVariant;
  /** Slug de la landing local actual (para excluir auto-enlace en variant regional). */
  citySlug?: string;
  className?: string;
}

interface HubLink {
  href: string;
  label: string;
}

const LINK_CLASS =
  'font-semibold text-accent-dark hover:text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm';

const REGIONAL_CITIES: HubLink[] = [
  { href: '/abogados-en-nacaome', label: 'Nacaome' },
  { href: '/abogados-en-choluteca', label: 'Choluteca' },
  { href: '/abogados-en-san-lorenzo', label: 'San Lorenzo' },
  { href: '/abogados-en-goascoran', label: 'Goascorán' },
  { href: '/abogados-en-san-marcos-de-colon', label: 'San Marcos de Colón' },
  { href: '/abogados-en-el-triunfo', label: 'El Triunfo' },
];

const VARIANT_LINKS: Record<SemanticHubVariant, HubLink[]> = {
  home: [
    { href: '/blog', label: 'blog jurídico' },
    { href: '/despacho', label: 'el despacho' },
    { href: '/guia-legal-abogados-honduras', label: 'guía para contratar abogado' },
    { href: '/preguntas-frecuentes', label: 'preguntas frecuentes' },
    { href: '/solicitar-consulta', label: 'solicitar consulta' },
    { href: '/como-llegar', label: 'cómo llegar a la oficina' },
    { href: '/hondurenos-en-espana', label: 'hondureños en España' },
  ],
  'local-nacaome': [
    { href: '/abogado-penalista-nacaome', label: 'abogado penalista en Nacaome' },
    { href: '/abogado-laboralista-nacaome', label: 'abogado laboralista en Nacaome' },
    { href: '/abogado-de-familia-nacaome', label: 'abogada de familia en Nacaome' },
    { href: '/abogado-civil-nacaome', label: 'abogado civil en Nacaome' },
    { href: '/como-llegar', label: 'cómo llegar a la oficina' },
    ...REGIONAL_CITIES.filter((c) => c.href !== '/abogados-en-nacaome'),
  ],
  'local-choluteca': [
    { href: '/abogado-penalista-choluteca', label: 'abogado penalista en Choluteca' },
    { href: '/abogados-en-nacaome', label: 'oficina en Nacaome' },
    ...REGIONAL_CITIES.filter((c) => c.href !== '/abogados-en-choluteca'),
  ],
  'local-regional': REGIONAL_CITIES,
  blog: [
    { href: '/despacho', label: 'conozca el despacho' },
    { href: '/guia-legal-abogados-honduras', label: 'guía para contratar abogado' },
    { href: '/solicitar-consulta', label: 'solicitar consulta' },
    { href: '/preguntas-frecuentes', label: 'preguntas frecuentes' },
  ],
  despacho: [
    { href: '/como-llegar', label: 'cómo llegar' },
    { href: '/solicitar-consulta', label: 'solicitar consulta' },
    { href: '/preguntas-frecuentes', label: 'preguntas frecuentes' },
    { href: '/guia-legal-abogados-honduras', label: 'guía para contratar abogado' },
    { href: '/blog', label: 'blog jurídico' },
  ],
  guia: [
    { href: '/despacho', label: 'el despacho' },
    { href: '/blog', label: 'blog jurídico' },
    { href: '/solicitar-consulta', label: 'solicitar consulta' },
    { href: '/preguntas-frecuentes', label: 'preguntas frecuentes' },
    { href: '/hondurenos-en-espana', label: 'hondureños en España' },
  ],
  servicios: [
    { href: '/hondurenos-en-espana', label: 'hondureños en España' },
    { href: '/guia-legal-abogados-honduras', label: 'guía para contratar abogado' },
    { href: '/blog', label: 'blog jurídico' },
    { href: '/solicitar-consulta', label: 'solicitar consulta' },
    { href: '/preguntas-frecuentes', label: 'preguntas frecuentes' },
  ],
};

const INTRO: Record<SemanticHubVariant, string> = {
  home: 'Recursos útiles del bufete:',
  'local-nacaome': 'Especialistas y cobertura regional desde Nacaome:',
  'local-choluteca': 'Penal en Choluteca y cobertura regional:',
  'local-regional': 'Otras ciudades con cobertura del bufete:',
  blog: 'Más allá del blog:',
  despacho: 'Información práctica del bufete:',
  guia: 'Recursos complementarios:',
  servicios: 'También puede consultar:',
};

function resolveLinks(variant: SemanticHubVariant, citySlug?: string): HubLink[] {
  const base = VARIANT_LINKS[variant];
  if (variant !== 'local-regional' || !citySlug) return base;
  return base.filter((link) => link.href !== `/abogados-en-${citySlug}`);
}

export function SemanticHubLinks({ variant, citySlug, className }: SemanticHubLinksProps) {
  const links = resolveLinks(variant, citySlug);
  if (links.length === 0) return null;

  return (
    <p className={cn('text-sm text-text-secondary leading-relaxed', className)}>
      <span className="text-text-tertiary">{INTRO[variant]} </span>
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 && (index === links.length - 1 ? ' y ' : ', ')}
          <Link href={link.href} className={LINK_CLASS} {...semanticLinkProps(link.href)}>
            {link.label}
          </Link>
        </span>
      ))}
      .
    </p>
  );
}
