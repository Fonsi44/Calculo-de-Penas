import { MapPin } from 'lucide-react';
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
 * - Sin recursos externos en carga inicial (cero requests extra).
 * - Accesible: aria-label, focus visible, texto descriptivo.
 *
 * Los botones para abrir el mapa interactivo (Google Maps, OpenStreetMap)
 * viven en la sección de coordenadas de cada página (/como-llegar), no aquí.
 */
export function MapEmbed({
  label,
  fullAddress,
  className,
}: MapEmbedProps) {
  return (
    <div className={className ?? 'relative w-full h-full'}>
      <div
        className="relative w-full h-full bg-gradient-to-br from-primary/5 via-surface-alt to-primary/10 flex flex-col items-center justify-center p-6"
        role="img"
        aria-label={`Mapa de ${label} — ${fullAddress}`}
      >
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

        {/* Grid decorativo de fondo */}
        <div className="absolute inset-0 pointer-events-none bg-grid opacity-[0.03]" aria-hidden="true" />
      </div>
    </div>
  );
}
