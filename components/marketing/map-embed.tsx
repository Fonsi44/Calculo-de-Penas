import { MapPin } from 'lucide-react';

interface MapEmbedProps {
  latitude: number;
  longitude: number;
  label: string;
  fullAddress: string;
  zoom?: number;
  className?: string;
}

/**
 * Mapa embebido de Google Maps.
 *
 * Se utiliza la URL pública `https://maps.google.com/maps?q=lat,lng&z=...&output=embed`
 * que Google sirve sin necesidad de clave de la Google Maps Embed API
 * (es la misma vista que se obtiene al pulsar "Compartir > Insertar un mapa"
 * en Google Maps). Funciona tanto con coordenadas como con una dirección
 * textual.
 *
 * Reemplaza al mapa Leaflet + OpenStreetMap anterior, que mostraba un
 * marcador de la marca propio pero una cartografía menos reconocible
 * para los usuarios finales. Google Maps es la referencia visual que
 * todo el mundo espera ver en un sitio de bufete jurídico.
 */
export function MapEmbed({
  latitude,
  longitude,
  label,
  fullAddress,
  zoom = 16,
  className,
}: MapEmbedProps) {
  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&hl=es&output=embed`;

  return (
    <div className={className ?? 'relative w-full h-full'}>
      <iframe
        title={`Mapa de ${label} — ${fullAddress}`}
        src={src}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <noscript>
        <div className="flex items-center gap-2 p-3 text-xs text-text-secondary">
          <MapPin size={14} className="text-accent-dark" />
          <span>{fullAddress}</span>
        </div>
      </noscript>
    </div>
  );
}
