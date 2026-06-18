import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';

const landing = getLandingBySlug('choluteca')!;

export const metadata: Metadata = landingMetadata(landing);

export default function AbogadosEnCholutecaPage() {
  return <LandingLocalView landing={landing} />;
}
