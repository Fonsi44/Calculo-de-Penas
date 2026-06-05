import Link from 'next/link';
import { Scale, Phone, MessageCircle, Mail, MapPin, Clock, Lock } from 'lucide-react';
import { site, telHref, whatsappHref, mailtoHref } from '@/lib/site';

const AREAS = [
  { label: 'Defensa Penal', href: '/areas-de-practica/defensa-penal' },
  { label: 'Delitos contra la vida', href: '/areas-de-practica/delitos-contra-la-vida' },
  { label: 'Delitos contra la propiedad', href: '/areas-de-practica/delitos-contra-la-propiedad' },
  { label: 'Drogas', href: '/areas-de-practica/drogas' },
  { label: 'Violencia doméstica', href: '/areas-de-practica/violencia-domestica' },
  { label: 'Delitos sexuales', href: '/areas-de-practica/delitos-sexuales' },
  { label: 'Delitos económicos', href: '/areas-de-practica/delitos-economicos' },
  { label: 'Asistencia a detenidos', href: '/areas-de-practica/asistencia-detenidos' },
  { label: 'Audiencias', href: '/areas-de-practica/audiencias' },
  { label: 'Recursos', href: '/areas-de-practica/recursos' },
  { label: 'Asesoría preventiva', href: '/areas-de-practica/asesoria-preventiva' },
  { label: 'Atención a víctimas', href: '/areas-de-practica/atencion-victimas' },
];

const DESPACHO = [
  { label: 'El Despacho', href: '/despacho' },
  { label: 'Cómo llegar', href: '/como-llegar' },
  { label: 'Derecho Penal Hondureño', href: '/derecho-penal-hondureno' },
  { label: 'Proceso Penal', href: '/proceso-penal' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Identidad */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4 focus-visible:outline-none" aria-label={site.name}>
              <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                <Scale size={20} className="text-primary" strokeWidth={2.4} />
              </div>
              <div>
                <p className="font-extrabold text-sm leading-none">{site.shortName}</p>
                <p className="text-[10px] text-accent/90 leading-none mt-1 tracking-wider uppercase">Abogados penalistas</p>
              </div>
            </Link>
            <p className="text-[13px] text-text-inverse/80 leading-relaxed">
              Defensa penal técnica y confidencial en Nacaome, Valle. Aplicación rigurosa del Código Penal de Honduras.
            </p>
          </div>

          {/* Áreas */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-accent mb-3">Áreas de práctica</h3>
            <ul className="space-y-1.5">
              {AREAS.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="text-[13px] text-text-inverse/80 hover:text-accent transition-colors">
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Despacho */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-accent mb-3">El Despacho</h3>
            <ul className="space-y-1.5">
              {DESPACHO.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} className="text-[13px] text-text-inverse/80 hover:text-accent transition-colors">
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-accent mb-3">Contacto</h3>
            <ul className="space-y-2.5 text-[13px]">
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

        <div className="border-t border-primary-light/40 mt-10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[12px] text-text-inverse/70">
            © {year} {site.name}. Todos los derechos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGALES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[12px] text-text-inverse/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/intranet" className="inline-flex items-center gap-1 text-[12px] text-text-inverse/70 hover:text-accent">
                <Lock size={11} /> Intranet
              </Link>
            </li>
          </ul>
        </div>
        <p className="text-[11px] text-text-inverse/50 mt-3 italic">
          La información publicada en este sitio es de carácter general y orientativo. No sustituye la asesoría legal personalizada. Cada caso requiere análisis individual por un abogado habilitado.
        </p>
      </div>
    </footer>
  );
}
