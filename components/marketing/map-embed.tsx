import { MapPin, ExternalLink } from 'lucide-react';
import { site } from '@/lib/site';

interface MapEmbedProps {
  latitude: number;
  longitude: number;
  label: string;
  fullAddress: string;
  zoom?: number;
  className?: string;
}

/**
 * Representación estática de la ubicación del bufete.
 *
 * SUSTITUYE al antiguo iframe de OpenStreetMap, que lastraba el rendimiento
 * (CWV), no aportaba contenido indexable y requería una conexión externa.
 *
 * Beneficios SEO:
 * - Sin iframe: Google no indexa contenido de iframes, y estos degradan LCP.
 * - Texto de dirección indexable por Google (georreferenciación local).
 * - Enlace directo a OpenStreetMap para el usuario que necesita el mapa interactivo.
 * - Sin recursos externos en carga inicial (cero requests extra).
 * - Accesible: aria-label, focus visible, texto descriptivo.
 *
 * El mapa interactivo sigue disponible con un clic (OpenStreetMap en nueva
 * pestaña). No se pierde funcionalidad, solo se elimina el embed automático.
 */
export function MapEmbed({
  latitude,
  longitude,
  label,
  fullAddress,
  zoom = 16,
  className,
}: MapEmbedProps) {
  const osmHref = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
  const googleMapsHref = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className={className ?? 'relative w-full h-full'}>
      {/* Fondo decorativo con indicador visual de mapa */}
      <div className="relative w-full h-full bg-gradient-to-br from-primary/5 via-surface-alt to-primary/10 flex flex-col items-center justify-center p-6" role="img" aria-label={`Mapa de ${label} — ${fullAddress}`}>
        {/* Icono de ubicación destacado */}
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 border border-accent/30 shadow-lg">
          <MapPin size={32} className="text-accent-dark" strokeWidth={1.8} />
        </div>

        {/* Dirección completa */}
        <p className="font-bold text-sm text-text text-center leading-tight max-w-xs">
          {label}
        </p>
        <p className="text-sm text-text-secondary text-center leading-relaxed mt-1.5 max-w-xs text-pretty">
          {fullAddress}
        </p>
        <p className="text-xs text-text-muted text-center mt-1">
          {site.address.city}, {site.address.department}, {site.address.country}
        </p>

        {/* Separador */}
        <div className="w-12 h-px bg-accent/30 my-4" aria-hidden="true" />

        {/* Botones de mapa interactivo */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <a
            href={osmHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Ver ubicación de ${label} en OpenStreetMap — ${fullAddress}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors focus-visible:outline-none"
          >
            <MapPin size={14} aria-hidden="true" />
            Abrir en OpenStreetMap
            <ExternalLink size={12} aria-hidden="true" />
          </a>
          <a
            href={googleMapsHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Ver ubicación de ${label} en Google Maps`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/25 text-primary text-xs font-semibold hover:bg-primary/8 transition-colors focus-visible:outline-none"
          >
            <MapPin size={14} aria-hidden="true" />
            Google Maps
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>

        {/* Grid decorativo de fondo */}
        <div className="absolute inset-0 pointer-events-none bg-grid opacity-[0.03]" aria-hidden="true" />
      </div>
    </div>
  );
}
