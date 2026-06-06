'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import type { Map as LeafletMap, Marker } from 'leaflet';

interface MapEmbedProps {
  latitude: number;
  longitude: number;
  label: string;
  fullAddress: string;
  zoom?: number;
  className?: string;
}

/**
 * Mapa estático basado en Leaflet + OpenStreetMap.
 *
 * Es deliberadamente fijo: sin arrastre, sin zoom interactivo, sin
 * controles. Solo muestra la ubicación del bufete. El usuario puede
 * abrir Google Maps o Waze con los botones externos para navegación.
 *
 * Reemplaza al iframe de Google Maps (que muestra "contenido bloqueado"
 * sin clave de la Google Maps Embed API). OSM no requiere clave, ni proxy,
 * ni facturación; las baldosas se sirven desde tile.openstreetmap.org.
 *
 * Leaflet accede a `window` durante la inicialización, por lo que el componente
 * es client-only y se monta en useEffect.
 */
export function MapEmbed({
  latitude,
  longitude,
  label,
  fullAddress,
  zoom = 16,
  className,
}: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !containerRef.current) return;
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], zoom);
        return;
      }

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: 'bufete-map-marker',
        html: '<span class="bufete-map-marker__pin" aria-hidden="true"></span>',
        iconSize: [30, 40],
        iconAnchor: [15, 38],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([latitude, longitude], { icon, title: label }).addTo(map);
      marker.bindPopup(
        `<strong>${escapeHtml(label)}</strong><br>${escapeHtml(fullAddress)}`,
      );

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, label, fullAddress, zoom]);

  return (
    <div className={className ?? 'relative w-full h-full'}>
      <div
        ref={containerRef}
        className="w-full h-full"
        role="region"
        aria-label={`Mapa interactivo de ${label}`}
      />
      {/* Pin visual mientras Leaflet carga las baldosas, para que no se vea vacío. */}
      <noscript>
        <div className="flex items-center gap-2 p-3 text-xs text-text-secondary">
          <MapPin size={14} className="text-accent-dark" />
          <span>{fullAddress}</span>
        </div>
      </noscript>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
