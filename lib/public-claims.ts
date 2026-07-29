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
  { key: 'firstConsultationFree', subject: 'legal-service', value: true, status: 'confirmed_by_owner', source: 'Copy público canónico', public: true },
  { key: 'priceRange', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
  { key: 'paymentAccepted', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
  { key: 'currenciesAccepted', subject: 'legal-service', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
  { key: 'numberOfEmployees', subject: 'organization', value: null, status: 'unconfirmed', source: 'Sin evidencia aportada', public: false },
] as const;

function uniqueHttps(urls: (string | null | undefined)[]): string[] {
  return [...new Set(urls.filter((value): value is string => {
    if (!value) return false;
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }))]
    .map((value) => {
      const parsed = new URL(value);
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    });
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
