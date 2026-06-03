'use client';

import { useEffect, useRef } from 'react';

export function useUnsavedChanges(active: boolean): void {
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
