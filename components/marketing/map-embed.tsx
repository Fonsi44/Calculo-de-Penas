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
 * Mapa embebido con OpenStreetMap (gratuito, sin API key).
 *
 * Usa el export embed de OpenStreetMap, que no requiere clave,
 * no tiene cuotas y no bloquea por referrer.
 * Incluye un enlace directo visible sin JavaScript.
 */
export function MapEmbed({
  latitude,
  longitude,
  label,
  fullAddress,
  zoom = 16,
  className,
}: MapEmbedProps) {
  const offset = 0.004;
  const minLon = longitude - offset;
  const minLat = latitude - offset;
  const maxLon = longitude + offset;
  const maxLat = latitude + offset;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className={className ?? 'relative w-full h-full'}>
      <iframe
        title={`Mapa de ${label} — ${fullAddress}`}
        src={src}
        className="w-full h-full border-0"
        loading="lazy"
        sandbox="allow-scripts"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-[10px] text-center text-text-tertiary py-0.5 px-2 leading-tight">
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent-dark"
        >
          OpenStreetMap
        </a>
        {' contributors'}
      </div>
      <noscript>
        <div className="flex items-center gap-2 p-3 text-xs text-text-secondary">
          <MapPin size={14} className="text-accent-dark" />
          <span>{fullAddress}</span>
        </div>
      </noscript>
    </div>
  );
}
