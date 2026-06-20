import Link from 'next/link';
import { Scale, Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react';
import { site, telHref, whatsappHref, mailtoHref } from '@/lib/site';
import { LEGAL_DISCLAIMER_SHORT, LEGAL_FRAME_BADGE } from '@/lib/legal-disclaimer';

const AREAS = [
  { label: 'Derecho Penal', title: 'Abogados penalistas en Nacaome, Valle — defensa penal técnica', href: '/derecho-penal' },
  { label: 'Derecho de Familia', title: 'Abogados de familia en Nacaome: divorcios, custodias, alimentos', href: '/servicios-juridicos/derecho-de-familia' },
  { label: 'Derecho Laboral', title: 'Abogados laborales en Nacaome: despidos, indemnizaciones, acoso laboral', href: '/servicios-juridicos/derecho-laboral' },
  { label: 'Derecho Civil y Notarial', title: 'Abogados civiles y notariales en Nacaome, Valle', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  { label: 'Derecho Mercantil', title: 'Abogados mercantiles en Nacaome: sociedades, contratos, compliance', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  { label: 'Derecho Tributario', title: 'Asesoría tributaria y fiscal en Nacaome, Valle', href: '/servicios-juridicos/tributario-fiscal' },
  { label: 'Derecho Bancario', title: 'Abogados bancarios y financieros en Nacaome', href: '/servicios-juridicos/derecho-bancario-y-financiero' },
  { label: 'Administrativo', title: 'Derecho administrativo y servicio civil en Nacaome, Valle', href: '/servicios-juridicos/derecho-administrativo-y-servicio-civil' },
  { label: 'Regulación Sanitaria', title: 'Asesoría en regulación sanitaria en la zona sur de Honduras', href: '/servicios-juridicos/regulacion-sanitaria' },
  { label: 'Extranjería', title: 'Trámites de extranjería y migración en Nacaome, Valle', href: '/servicios-juridicos/extranjeria-en-honduras' },
  { label: 'Propiedad Intelectual', title: 'Registro de marcas, patentes y propiedad intelectual', href: '/servicios-juridicos/propiedad-intelectual' },
  { label: 'Ambiental Regulatorio', title: 'Derecho ambiental y regulatorio: licencias, cumplimiento y litigio', href: '/servicios-juridicos/ambiental-regulatorio' },
  { label: 'Conciliación y Arbitraje', title: 'Conciliación y arbitraje: resolución extrajudicial de conflictos', href: '/servicios-juridicos/conciliacion-y-arbitraje' },
];

const DESPACHO = [
  { label: 'El Despacho', title: 'Conozca el bufete Pineda y Asociados en Nacaome, Valle', href: '/despacho' },
  { label: 'Servicios Jurídicos', title: 'Servicios jurídicos en Nacaome: todas las ramas del derecho', href: '/servicios-juridicos' },
  { label: 'Derecho Penal', title: 'Defensa penal en Nacaome, Valle, San Lorenzo y Choluteca', href: '/derecho-penal' },
  { label: 'Blog Jurídico', title: 'Artículos y guías legales para la zona sur de Honduras', href: '/blog' },
  { label: 'Preguntas Frecuentes', title: 'Respuestas a dudas legales frecuentes', href: '/preguntas-frecuentes' },
  { label: 'Solicitar Consulta', title: 'Solicite una consulta legal gratuita y confidencial', href: '/solicitar-consulta#formulario' },
  { label: 'Hondureños en España', title: 'Asistencia legal para hondureños residentes en España', href: '/hondurenos-en-espana' },
  { label: 'Cómo llegar', title: 'Indicaciones para llegar al bufete en Nacaome, Valle', href: '/como-llegar' },
];

// Landings de SEO local — enlazadas desde todas las páginas (footer) para
// transferir autoridad interna y facilitar el descubrimiento por Google.
const COBERTURA = [
  { label: 'Abogados en Nacaome', title: 'Abogados en Nacaome, Valle — sede principal del bufete', href: '/abogados-en-nacaome' },
  { label: 'Abogados en Choluteca', title: 'Abogados en Choluteca, Honduras — defensa y asesoría legal', href: '/abogados-en-choluteca' },
  { label: 'Abogados en San Lorenzo', title: 'Abogados en San Lorenzo, Valle — zona portuaria del sur', href: '/abogados-en-san-lorenzo' },
];

const LEGALES = [
  { label: 'Aviso Legal', href: '/aviso-legal' },
  { label: 'Política Editorial', href: '/politica-editorial' },
  { label: 'Política de Privacidad', href: '/politica-privacidad' },
  { label: 'Política de Cookies', href: '/politica-cookies' },
  { label: 'Términos de Uso', href: '/terminos' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-primary text-text-inverse overflow-hidden glow-accent-top">
      {/* Capas de fondo: gradiente sutil + grid */}
      <div className="absolute inset-0 pointer-events-none bg-grid opacity-50" aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none bg-radial-accent-footer"
        aria-hidden="true"
      />
      <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Identidad */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5 focus-visible:outline-none" aria-label={site.name}>
              <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center shadow-[0_0_0_1px_rgba(154,122,34,0.45),0_4px_10px_-2px_rgba(212,175,55,0.45)]">
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
              Aplicación rigurosa del {LEGAL_FRAME_BADGE}.
            </p>
            <p className="text-xs text-accent/80 leading-relaxed mt-2 text-pretty">
              Abogado colegiado en Honduras · Registro profesional vigente.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-accent/20">
              <h3 className="text-xxs font-extrabold uppercase tracking-footer text-accent">
                Servicios Jurídicos
              </h3>
            </div>
            <ul className="space-y-1.5">
              {AREAS.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} title={a.title} className="text-sm text-text-inverse/80 hover:text-accent transition-colors">
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Despacho */}
          <div>
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-accent/20">
              <h3 className="text-xxs font-extrabold uppercase tracking-footer text-accent">
                El Despacho
              </h3>
            </div>
            <ul className="space-y-1.5">
              {DESPACHO.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} title={d.title} className="text-sm text-text-inverse/80 hover:text-accent transition-colors">
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cobertura (SEO local) */}
          <div>
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-accent/20">
              <h3 className="text-xxs font-extrabold uppercase tracking-footer text-accent">
                Cobertura
              </h3>
            </div>
            <ul className="space-y-1.5">
              {COBERTURA.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} title={c.title} className="text-sm text-text-inverse/80 hover:text-accent transition-colors">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-accent/20">
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
                {/* Email no expuesto en texto plano para reducir scraping de bots simples.
                    El mailto: abre el cliente de correo al hacer clic (UX preservada). */}
                <a href={mailtoHref()} className="text-text-inverse/80 hover:text-accent" aria-label={`Enviar correo a ${site.name}`}>
                  Enviar correo
                </a>
              </li>
              {site.social.facebook && (
                <li className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-accent flex-shrink-0" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="text-text-inverse/80 hover:text-accent" aria-label={`Página de Facebook de ${site.name}`}>
                    Facebook
                  </a>
                </li>
              )}
              {site.social.x && (
                <li className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-accent flex-shrink-0" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <a href={site.social.x} target="_blank" rel="noopener noreferrer" className="text-text-inverse/80 hover:text-accent" aria-label={`Perfil de X de ${site.name}`}>
                    X (Twitter)
                  </a>
                </li>
              )}
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
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGALES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-xs text-text-inverse/70 hover:text-accent transition-colors py-1 block">
                  {l.label}
                </Link>
              </li>
            ))}

          </ul>
        </div>
        <div className="mt-4 pt-4 border-t border-accent/10 text-xs text-text-inverse/50">
          <p className="text-pretty">
            Contenido elaborado por el <strong className="text-text-inverse/70">Equipo legal de Pineda y Asociados</strong> — abogados en Nacaome, Valle, Honduras.{' '}
            {LEGAL_DISCLAIMER_SHORT}
          </p>
        </div>
      </div>
    </footer>
  );
}


