import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CATEGORY_SERVICE_MAP: Record<string, { name: string; href: string }> = {
  'derecho-penal': { name: 'Defensa Penal', href: '/derecho-penal' },
  'proceso-penal': { name: 'Defensa Penal', href: '/derecho-penal' },
  'defensa-penal': { name: 'Defensa Penal', href: '/derecho-penal' },
  'derecho-de-familia': { name: 'Derecho de Familia', href: '/servicios-juridicos/derecho-de-familia' },
  'derecho-familia': { name: 'Derecho de Familia', href: '/servicios-juridicos/derecho-de-familia' },
  'derecho-laboral': { name: 'Derecho Laboral', href: '/servicios-juridicos/derecho-laboral' },
  'derecho-civil': { name: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  'derecho-civil-y-notarial': { name: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  'derecho-mercantil': { name: 'Derecho Mercantil y Empresarial', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  'derecho-mercantil-y-empresarial': { name: 'Derecho Mercantil y Empresarial', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  'hondurenos-en-espana': { name: 'Hondureños en España', href: '/hondurenos-en-espana' },
  'derecho-tributario': { name: 'Derecho Tributario', href: '/servicios-juridicos/tributario-fiscal' },
  'tributario-fiscal': { name: 'Derecho Tributario', href: '/servicios-juridicos/tributario-fiscal' },
  'noticias-legales': { name: 'Actualidad Legal', href: '/blog' },
  'actualidad-legal': { name: 'Actualidad Legal', href: '/blog' },
  'guias-legales': { name: 'Guías Legales', href: '/blog' },
  'derecho-bancario': { name: 'Derecho Bancario', href: '/servicios-juridicos/derecho-bancario-y-financiero' },
  'derecho-aduanero': { name: 'Derecho Aduanero', href: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior' },
  'propiedad-intelectual': { name: 'Propiedad Intelectual', href: '/servicios-juridicos/propiedad-intelectual' },
  'conciliacion-arbitraje': { name: 'Conciliación y Arbitraje', href: '/servicios-juridicos/conciliacion-y-arbitraje' },
};

type Props = {
  category: string;
};

export function RelatedService({ category }: Props) {
  const service = CATEGORY_SERVICE_MAP[category];
  if (!service) return null;

  return (
    <div className="mt-8 p-5 rounded-xl border border-accent/30 bg-white">
      <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-2">Servicio relacionado</p>
      <p className="text-sm text-text leading-relaxed">
        Este artículo pertenece al área de <strong>{service.name}</strong>.
      </p>
      <Link
        href={service.href}
        className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
      >
        Ver servicios de {service.name.toLowerCase()} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
