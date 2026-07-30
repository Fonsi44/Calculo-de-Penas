'use client';

import { useEffect, useRef } from 'react';

export interface FocusTrapOptions {
  onEscape?: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  options?: FocusTrapOptions,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () => {
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && !el.hasAttribute('inert');
      });
    };

    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options?.onEscape) {
        e.preventDefault();
        options.onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options?.onEscape) {
        e.preventDefault();
        options.onEscape();
      }
    };

    root.addEventListener('keydown', handle);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      root.removeEventListener('keydown', handle);
      document.removeEventListener('keydown', handleDocumentKeyDown);
      if (options?.returnFocusRef?.current) {
        options.returnFocusRef.current.focus();
      } else {
        previouslyFocused?.focus?.();
      }
    };
  }, [active, options]);

  return ref;
}
