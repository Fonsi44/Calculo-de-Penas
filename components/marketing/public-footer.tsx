import Link from 'next/link';
import { Scale, Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react';
import { site, telHref, whatsappHref, mailtoHref } from '@/lib/site';

const AREAS = [
  { label: 'Derecho Penal', href: '/derecho-penal' },
  { label: 'Derecho de Familia', href: '/servicios-juridicos/derecho-de-familia' },
  { label: 'Derecho Laboral', href: '/servicios-juridicos/derecho-laboral' },
  { label: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  { label: 'Derecho Mercantil', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  { label: 'Derecho Tributario', href: '/servicios-juridicos/tributario-fiscal' },
  { label: 'Derecho Bancario', href: '/servicios-juridicos/derecho-bancario-y-financiero' },
  { label: 'Administrativo', href: '/servicios-juridicos/derecho-administrativo-y-servicio-civil' },
  { label: 'Regulación Sanitaria', href: '/servicios-juridicos/regulacion-sanitaria' },
  { label: 'Extranjería', href: '/servicios-juridicos/extranjeria-en-honduras' },
  { label: 'Propiedad Intelectual', href: '/servicios-juridicos/propiedad-intelectual' },
  { label: 'Ambiental Regulatorio', href: '/servicios-juridicos/ambiental-regulatorio' },
  { label: 'Conciliación y Arbitraje', href: '/servicios-juridicos/conciliacion-y-arbitraje' },
];

const DESPACHO = [
  { label: 'El Despacho', href: '/despacho' },
  { label: 'Cómo llegar', href: '/como-llegar' },
  { label: 'Servicios Jurídicos', href: '/servicios-juridicos' },
  { label: 'Hondureños en España', href: '/hodurenos-en-espana' },
  { label: 'Preguntas Frecuentes', href: '/preguntas-frecuentes' },
];

const LEGALES = [
  { label: 'Aviso Legal', href: '/aviso-legal' },
  { label: 'Política de Privacidad', href: '/politica-privacidad' },
  { label: 'Política de Cookies', href: '/politica-cookies' },
  { label: 'Términos de Uso', href: '/terminos' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary text-text-inverse">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Identidad */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4 focus-visible:outline-none" aria-label={site.name}>
              <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                <Scale size={20} className="text-primary" strokeWidth={2.4} />
              </div>
              <div>
                <p className="font-extrabold text-sm leading-none">{site.shortName}</p>
                <p className="text-xxs text-accent/90 leading-none mt-1 tracking-wider uppercase">Bufete multidisciplinario</p>
              </div>
            </Link>
            <p className="text-sm text-text-inverse/80 leading-relaxed text-pretty">
              <strong className="font-semibold text-text-inverse">Bufete jurídico</strong> en {site.address.city}, {site.address.department},
              con más de 15 años de ejercicio profesional y <strong className="font-semibold text-accent">defensa penal</strong> como
              pilar fundacional. Atención directa con presencia activa en juzgados del sur de Honduras.
            </p>
            <p className="text-xs text-text-inverse/65 leading-relaxed mt-3 text-pretty">
              Aplicación rigurosa del Código Penal · Decreto 130-2017 y sus reformas vigentes.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent/20">
              <h3 className="text-xxs font-extrabold uppercase tracking-footer text-accent">
                Servicios Jurídicos
              </h3>
            </div>
            <ul className="space-y-1.5">
              {AREAS.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="text-sm text-text-inverse/80 hover:text-accent transition-colors">
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Despacho */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent/20">
              <h3 className="text-xxs font-extrabold uppercase tracking-footer text-accent">
                El Despacho
              </h3>
            </div>
            <ul className="space-y-1.5">
              {DESPACHO.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} className="text-sm text-text-inverse/80 hover:text-accent transition-colors">
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent/20">
              <h3 className="text-xxs font-extrabold uppercase tracking-footer text-accent">
                Contacto
              </h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-text-inverse/80 leading-relaxed">
                  {site.address.line1}<br />
                  {site.address.line2}<br />
                  {site.address.city}, {site.address.department}<br />
                  {site.address.country}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-accent flex-shrink-0" aria-hidden="true" />
                <a href={telHref()} className="text-text-inverse/80 hover:text-accent tabular-nums">{site.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-accent flex-shrink-0" aria-hidden="true" />
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="text-text-inverse/80 hover:text-accent">WhatsApp</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-accent flex-shrink-0" aria-hidden="true" />
                <a href={mailtoHref()} className="text-text-inverse/80 hover:text-accent break-all">{site.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-text-inverse/80 leading-relaxed">{site.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider-accent mt-10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs text-text-inverse/70">
            © {year} {site.name}. Todos los derechos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGALES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-xs text-text-inverse/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}

          </ul>
        </div>
        <p className="text-xxs text-text-inverse/50 mt-3 italic text-pretty">
          La información publicada en este sitio es de carácter general y orientativo. No sustituye la asesoría legal personalizada. Cada caso requiere análisis individual por un abogado habilitado.
        </p>
      </div>
    </footer>
  );
}
