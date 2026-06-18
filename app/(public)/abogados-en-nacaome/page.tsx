import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';

const landing = getLandingBySlug('nacaome')!;

export const metadata: Metadata = landingMetadata(landing);

export default function AbogadosEnNacaomePage() {
  return <LandingLocalView landing={landing} />;
}
