'use client';

/**
 * Registra el service worker (/sw.js) en producción. En dev no se registra
 * para evitar cacheo molesto durante el desarrollo (HMR, cambios frecuentes).
 *
 * No renderiza nada (devuelve null). Se monta una vez en el layout público.
 * Cualquier fallo de registro es silencioso: la web sigue funcionando sin SW.
 */

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* Registro fallido: no degrada la web. */
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
