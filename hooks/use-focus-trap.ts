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
  const onEscapeRef = useRef(options?.onEscape);
  const returnFocusRefRef = useRef(options?.returnFocusRef);

  useEffect(() => {
    onEscapeRef.current = options?.onEscape;
    returnFocusRefRef.current = options?.returnFocusRef;
  }, [options]);

  useEffect(() => {
    if (!active) return;

    const root = ref.current;
    if (!root) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () => {
      const allFocusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
      );

      return allFocusable.filter(el => {
        if (el.hasAttribute('disabled') || el.hasAttribute('inert')) return false;

        let parent: HTMLElement | null = el;
        while (parent && parent !== root) {
          if (parent.getAttribute('aria-hidden') === 'true') return false;
          parent = parent.parentElement;
        }
        if (root.getAttribute('aria-hidden') === 'true') return false;

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const rect = el.getBoundingClientRect();
        const hasNoDimensions = rect.width === 0 && rect.height === 0;
        if (hasNoDimensions) return false;

        return true;
      });
    };

    const initialFocusable = getFocusable();
    if (initialFocusable.length > 0) {
      initialFocusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onEscapeRef.current) {
          e.preventDefault();
          e.stopPropagation();
          onEscapeRef.current();
        }
        return;
      }

      if (e.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      if (items.length === 1) {
        e.preventDefault();
        items[0].focus();
        return;
      }

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      
      e.preventDefault();
      
      if (e.shiftKey) {
        if (currentIndex <= 0) {
          items[items.length - 1].focus();
        } else {
          items[currentIndex - 1].focus();
        }
      } else {
        if (currentIndex === -1 || currentIndex >= items.length - 1) {
          items[0].focus();
        } else {
          items[currentIndex + 1].focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      const targetToFocus = returnFocusRefRef.current?.current || previouslyFocused;
      if (targetToFocus && typeof targetToFocus.focus === 'function') {
        targetToFocus.focus();
      }
    };
  }, [active]);

  return ref;
}
