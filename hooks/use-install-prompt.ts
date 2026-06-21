'use client';

/**
 * Hook PWA: encapsula toda la lógica del prompt de instalación para que el
 * componente que lo usa (rail flotante) quede limpio.
 *
 * - Captura `beforeinstallprompt` (Chrome/Edge/Android) y guarda el evento.
 * - Detecta "ya instalada" vía `display-mode: standalone` (y fallback iOS
 *   `navigator.standalone`).
 * - Detecta iOS (Safari NO dispara `beforeinstallprompt`; la instalación es
 *   manual vía Compartir → Añadir a pantalla de inicio). En iOS el botón
 *   abre instrucciones en vez del prompt nativo.
 * - Persistencia de rechazo en `localStorage` (`pwa-install-dismissed` con
 *   timestamp) → no molestar 30 días.
 * - Escucha `appinstalled` para ocultar el botón tras instalar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Evento `beforeinstallprompt` del navegador (no tipado en TS DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari expone `navigator.standalone` (legacy, no estándar).
  const nav = navigator as Navigator & { standalone?: boolean };
  if (typeof nav.standalone === 'boolean') return nav.standalone;
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  // iPad en iOS 13+ reporta `userAgent` como macOS y no contiene "iPad";
  // `maxTouchPoints > 1` + macOS es el workaround habitual.
  const ua = navigator.userAgent || '';
  // Boolean() coerce el cortocircuito de `&&` (que puede devolver number)
  // a boolean para satisfacer el tipo de retorno.
  const isIPadOS = Boolean(/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
  return /iPhone|iPad|iPod/.test(ua) || isIPadOS;
}

function readDismissedAt(): number {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    // localStorage puede no estar disponible (modo privado, SSR).
    return 0;
  }
}

export interface UseInstallPromptResult {
  /** true si el navegador disparó `beforeinstallprompt` y aún no se usó. */
  canInstall: boolean;
  /** true si la web ya está instalada (display-mode: standalone). */
  isInstalled: boolean;
  /** true en iOS: el botón debe mostrar instrucciones, no el prompt nativo. */
  isIOS: boolean;
  /** true si el botón debe renderizarse (instalable o iOS, no instalada, no descartado <30d). */
  showButton: boolean;
  /** Lanza el diálogo nativo de instalación. No-op si no hay evento capturado. */
  promptInstall: () => Promise<void>;
  /** Descarta el botón durante 30 días (persistido). */
  dismiss: () => void;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissedRecently, setDismissedRecently] = useState(false);

  // Estado inicial seguro para SSR (todo false) + hidratación coherente.
  // isIOS()/isStandalone()/localStorage solo existen en cliente; se leen
  // tras montar (no en render) para evitar mismatch de hidratación y mantener
  // el componente puro. Date.now() se confina al efecto (regla purity).
  /* eslint-disable react-hooks/set-state-in-effect -- sincronización one-shot
     desde APIs de navegador (solo cliente) para inicializar estado PWA. */
  useEffect(() => {
    setIos(isIOS());
    setIsInstalled(isStandalone());
    const at = readDismissedAt();
    setDismissedRecently(at > 0 && Date.now() - at < DISMISS_TTL_MS);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstall = (e: Event) => {
      // Prevenir el mini-infobar automático de Chrome para mostrar el nuestro.
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      deferredRef.current = evt;
      setCanInstall(true);
    };

    const onInstalled = () => {
      deferredRef.current = null;
      setCanInstall(false);
      setIsInstalled(true);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* noop */
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const evt = deferredRef.current;
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      /* El usuario puede cancelar o el prompt fallar; nada que hacer. */
    } finally {
      deferredRef.current = null;
      setCanInstall(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setDismissedRecently(true);
  }, []);

  // En iOS Safari no dispara `beforeinstallprompt`: el botón muestra
  // instrucciones manuales, por eso basta con `ios` (sin requerir canInstall).
  // `isInstalled` ya refleja display-mode: standalone (leído en el efecto).
  const showButton = !isInstalled && !dismissedRecently && (ios || canInstall);

  return { canInstall, isInstalled, isIOS: ios, showButton, promptInstall, dismiss };
}
