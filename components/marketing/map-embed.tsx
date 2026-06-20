'use client';

import { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { site } from '@/lib/site';

/**
 * Mapa de ubicación del bufete con fallback tolerante a fallos.
 *
 * Estrategia:
 * 1. Intenta cargar un iframe de Google Maps Embed API (con URL válida).
 * 2. Si el iframe falla (bloqueado por CSP, red, etc.), muestra un fallback
 *    estático con la dirección, coordenadas y botón "Ver en Google Maps".
 *
 * El iframe usa lazy loading y la URL está codificada con la dirección real.
 * El CSP ya permite frame-src desde https://www.google.com.
 */

const GMAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d974.4767899856768!2d-87.48733651218728!3d13.53007083082072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f70010003041e39%3A0xf07822fa24ed7be3!2sBufete%20Jur%C3%ADdico%20Pineda%20%26%20Asociados!5e1!3m2!1ses!2ses!4v1781961246474!5m2!1ses!2ses';

export function MapEmbed() {
  const [iframeError, setIframeError] = useState(false);

  if (iframeError) {
    return <MapFallback />;
  }

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <iframe
        src={GMAPS_EMBED_URL}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 300 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Ubicación de ${site.name} — ${site.address.city}, ${site.address.department}`}
        aria-label={`Mapa de Google Maps mostrando la ubicación de ${site.name} en ${site.address.full}`}
        onError={() => setIframeError(true)}
      />
      {/* Fallback silencioso: si el iframe no carga en 8 segundos, mostramos el fallback */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var f=document.currentScript.previousElementSibling;if(f&&f.tagName==='IFRAME'){var t=setTimeout(function(){if(!f.contentDocument||f.contentDocument.readyState==='uninitialized'){f.style.display='none';f.dispatchEvent(new Event('error'));}},8000);f.addEventListener('load',function(){clearTimeout(t);});}})();`,
        }}
      />
    </div>
  );
}

/** Fallback estático cuando el mapa embebido no está disponible. */
function MapFallback() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.full)}`;

  return (
    <div className="w-full h-full min-h-[300px] bg-surface-alt rounded-lg border border-border-light flex flex-col items-center justify-center p-6 text-center">
      {/* Icono decorativo */}
      <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mb-4">
        <MapPin size={24} className="text-accent" />
      </div>

      <h3 className="font-bold text-base text-text mb-2">
        {site.name}
      </h3>

      <address className="not-italic text-sm text-text-secondary leading-relaxed mb-4">
        <p>{site.address.line1}</p>
        <p>{site.address.line2}</p>
        <p>{site.address.city}, {site.address.department}</p>
        <p>{site.address.country}</p>
      </address>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-primary text-sm font-bold border border-accent-dark/40 btn-shadow-accent btn-shadow-accent-hover hover:-translate-y-0.5 transition-all duration-200"
      >
        <ExternalLink size={15} />
        Ver en Google Maps
      </a>

      <p className="text-xxs text-text-muted mt-3">
        Coordenadas: {site.geo.latitude}, {site.geo.longitude}
      </p>
    </div>
  );
}
