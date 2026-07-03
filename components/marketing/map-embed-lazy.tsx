'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

/**
 * Wrapper lazy del mapa embebido de Google Maps.
 *
 * MapEmbed es un Client Component que monta un iframe de terceros; cargarlo en
 * el first paint de la home (sección "Visítenos") penaliza LCP/TBT por la
 * hidratación + iframe. Con dynamic(ssr:false) el mapa solo se carga cuando
 * llega al viewport del usuario o tras la hidratación inicial.
 *
 * Placeholder mostrado mientras tanto: ligero, server-rendered, sin JS.
 */
const MapEmbed = dynamic(() => import('./map-embed').then((m) => m.MapEmbed), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full min-h-[300px] bg-surface-alt rounded-lg border border-border-light flex items-center justify-center"
      aria-hidden="true"
    >
      <MapPin size={28} className="text-accent/60 animate-pulse" />
    </div>
  ),
});

export function MapEmbedLazy() {
  return <MapEmbed />;
}
