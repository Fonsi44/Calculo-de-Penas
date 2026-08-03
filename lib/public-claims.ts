export type PublicClaim = {
  key: string;
  subject: 'organization' | 'legal-service' | 'danilo' | 'thania' | 'emil';
  value: string | number | boolean | null;
  status: 'confirmed_by_owner' | 'confirmed_by_canonical_data' | 'unconfirmed';
  source: string;
  public: boolean;
};

export const PUBLIC_CLAIMS: readonly PublicClaim[] = [
  { key: 'foundingDate', subject: 'organization', value: 2010, status: 'confirmed_by_owner', source: 'Confirmación del titular', public: true },
  // Decisión 2026-08-03: el propietario no ha confirmado que todas las
  // consultas sean gratuitas. La formulación canónica es «Evaluación inicial
  // confidencial» (lib/marketing-policy.ts). El claim de gratuidad pasa a
  // UNCONFIRMED y no público hasta confirmación contractual expresa.
  { key: 'firstConsultationFree', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'No confirmado por el propietario (decisión 2026-08-03)', public: false },
  { key: 'priceRange', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
  { key: 'paymentAccepted', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
  { key: 'currenciesAccepted', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
  { key: 'numberOfEmployees', subject: 'organization', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
] as const;

function uniqueHttps(urls: (string | null | undefined)[]): string[] {
  const trackingParameters = new Set([
    'fbclid',
    'gclid',
    'dclid',
    'msclkid',
    'mc_cid',
    'mc_eid',
  ]);

  const normalized = urls.flatMap((value) => {
    if (!value) return [];
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:') return [];
      for (const key of [...parsed.searchParams.keys()]) {
        if (key.startsWith('utm_') || trackingParameters.has(key)) {
          parsed.searchParams.delete(key);
        }
      }
      parsed.hash = '';
      return [parsed.toString()];
    } catch {
      return [];
    }
  });

  return [...new Set(normalized)];
}

export function organizationSameAs(
  corporateUrls: (string | null | undefined)[],
): string[] {
  return uniqueHttps(corporateUrls);
}

export function personSameAs(
  personalUrls: (string | null | undefined)[],
): string[] {
  return uniqueHttps(personalUrls);
}
