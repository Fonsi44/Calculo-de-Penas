'use client';

import { useEffect } from 'react';

export type ShortcutHandler = (e: KeyboardEvent) => void;

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description?: string;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isFormField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      for (const s of shortcuts) {
        if (s.enabled === false) continue;
        if (s.key.toLowerCase() !== e.key.toLowerCase()) continue;
        if (Boolean(s.ctrl) !== (e.ctrlKey || e.metaKey)) continue;
        if (Boolean(s.meta) !== e.metaKey) continue;
        if (Boolean(s.shift) !== e.shiftKey) continue;
        if (isFormField && s.key !== 'Escape') continue;
        e.preventDefault();
        s.handler(e);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
