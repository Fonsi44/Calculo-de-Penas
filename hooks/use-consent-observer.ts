'use client';

import { useState, useEffect } from 'react';

export function useConsentObserver() {
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const check = () => {
      setConsentOpen(document.body.dataset.consentDialogOpen === 'true');
    };
    check();
    
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-consent-dialog-open'] });
    return () => observer.disconnect();
  }, []);

  return consentOpen;
}
