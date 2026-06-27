import type { Metadata } from 'next';
import PortalCargaClient from './portal-carga-client';

/**
 * Portal público de carga documental por enlace mágico.
 *
 * NO INDEXABLE (noindex). El cliente no tiene cuenta; el token es su credencial.
 * No revela datos del expediente más allá de lo estrictamente necesario.
 * Referencia: pinedayasociados.md §22.1 (/cargar/{token}).
 */
export const metadata: Metadata = {
  title: 'Carga de documentos — Pineda y Asociados',
  description: 'Portal seguro para la entrega de documentos solicitados por su abogado.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function PortalCargaPage({ params }: { params: Promise<{ token: string }> }) {
  return <PortalCargaClient params={params} />;
}
