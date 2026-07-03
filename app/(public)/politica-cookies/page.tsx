import type { Metadata } from 'next';
import { LegalDocument, LegalSection, LegalList, LegalCallout } from '@/components/marketing/legal-document';
import { site, absoluteUrl } from '@/lib/site';
import { getLegalPageContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description:
    'Política de cookies del sitio web de Pineda y Asociados, bufete jurídico en Nacaome, Valle. Información sobre cookies técnicas y de análisis utilizadas.',
  alternates: { canonical: '/politica-cookies' },
  robots: { index: false, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Cookies | Pineda y Asociados',
    description: 'Gestión y control de cookies en el sitio web del bufete Pineda y Asociados en Nacaome, Valle, Honduras.',
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: 'Política de Cookies | Pineda y Asociados',
    description: 'Política de cookies del bufete jurídico Pineda y Asociados en Nacaome, Valle. Información sobre cookies técnicas y de análisis.',
    url: `${site.url}/politica-cookies`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Política de Cookies` }],
  },
};

export default async function PoliticaCookiesPage() {
  const c = await getLegalPageContent('politica-cookies');
  return (
    <>
    <LegalDocument
      eyebrow="Almacenamiento local del navegador"
      title={c.title}
      subtitle={c.subtitle}
      version={c.version}
      lastUpdated={c.lastUpdated}
      validated
    >
      <LegalSection number="1" title="¿Qué son las cookies?">
        <p>
          Las cookies son pequeños archivos de texto que los sitios web
          almacenan en el dispositivo del usuario cuando visita sus
          páginas. Su finalidad principal es permitir el funcionamiento
          técnico del sitio, recordar las preferencias del usuario entre
          visitas y, en su caso, obtener estadísticas anonimizadas de uso.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Cookies utilizadas por este sitio">
        <p>
          Este sitio utiliza exclusivamente cookies técnicas
          estrictamente necesarias para su funcionamiento. No se utilizan
          cookies de rastreo publicitario, de analítica masiva de terceros
          ni de seguimiento entre sitios.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border-light bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-primary text-text-inverse">
              <tr>
                <th className="text-left font-bold px-3 py-2.5">Nombre</th>
                <th className="text-left font-bold px-3 py-2.5">Tipo</th>
                <th className="text-left font-bold px-3 py-2.5">Finalidad</th>
                <th className="text-left font-bold px-3 py-2.5">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              <tr>
                <td className="px-3 py-2.5 font-mono text-xs text-primary">__Host-token</td>
                <td className="px-3 py-2.5">Técnica (sesión)</td>
                <td className="px-3 py-2.5">
                  Autenticación del usuario en la intranet del bufete.
                </td>
                <td className="px-3 py-2.5">Sesión</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-mono text-xs text-primary">__Host-theme</td>
                <td className="px-3 py-2.5">Técnica (preferencia)</td>
                <td className="px-3 py-2.5">
                  Recordar la preferencia de modo claro u oscuro del visitante.
                </td>
                <td className="px-3 py-2.5">1 año</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-mono text-xs text-primary">__Host-cookie-consent</td>
                <td className="px-3 py-2.5">Técnica (consentimiento)</td>
                <td className="px-3 py-2.5">
                  Registrar la decisión del usuario sobre cookies no esenciales.
                </td>
                <td className="px-3 py-2.5">1 año</td>
              </tr>
            </tbody>
          </table>
        </div>
        <LegalCallout variant="info">
          Las cookies con prefijo <code className="px-1 py-0.5 rounded bg-surface-alt font-mono text-xs">__Host-</code>{' '}
          son establecidas con el atributo <code className="px-1 py-0.5 rounded bg-surface-alt font-mono text-xs">Secure</code>,{' '}
          <code className="px-1 py-0.5 rounded bg-surface-alt font-mono text-xs">HttpOnly</code> y sin{' '}
          <code className="px-1 py-0.5 rounded bg-surface-alt font-mono text-xs">Domain</code>, lo que
          impide suplantaciones entre sitios.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="3" title="Almacenamiento local del navegador">
        <p>
          Además de las cookies descritas, este sitio puede utilizar
          tecnologías equivalentes de almacenamiento local del navegador
          (localStorage, sessionStorage) con las mismas finalidades
          técnicas. Estos datos no abandonan el dispositivo del usuario
          y no son accesibles por terceros. Se emplean exclusivamente
          para preservar preferencias de interfaz durante la navegación
          y para el funcionamiento de la calculadora de penas, que
          almacena temporalmente los datos del cálculo en curso sin
          transmitirlos a ningún servidor externo.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Cookies de terceros">
        <p>
          Este sitio no incorpora de forma predeterminada cookies
          publicitarias, píxeles de redes sociales ni servicios de
          analítica masiva. En caso de que el administrador del sitio
          active Google Analytics 4 mediante la variable de entorno
          correspondiente, se informará al usuario y se solicitará el
          consentimiento expreso con carácter previo a la instalación
          de cualquier cookie no esencial. Esta política se actualizará
          para reflejar cualquier cambio en el uso de servicios de
          terceros.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Cómo administrar las cookies">
        <p>
          El usuario puede en cualquier momento configurar su navegador
          para aceptar, rechazar o eliminar las cookies instaladas en su
          dispositivo. A continuación se indican los enlaces a la
          documentación oficial de los navegadores más utilizados:
        </p>
        <LegalList
          items={[
            <><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Chrome</a></>,
            <><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Mozilla Firefox</a></>,
            <><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Apple Safari</a></>,
            <><a href="https://support.microsoft.com/es-es/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Microsoft Edge</a></>,
          ]}
        />
        <LegalCallout variant="warning">
          El bloqueo total de las cookies técnicas puede impedir el
          correcto funcionamiento del sitio, especialmente del inicio de
          sesión y de la calculadora de penas.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="6" title="Marco normativo">
        <p>
          Esta política se adapta a las buenas prácticas internacionales
          en materia de cookies y al principio de minimización de datos
          previsto en los Arts. 76 a 80 de la Constitución de la
          República de Honduras.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Contacto">
        <p>
          Para cualquier duda sobre el uso de cookies en este sitio, el
          usuario puede escribir a <a href={`mailto:${site.email}`} className="text-accent hover:underline">{site.email}</a>.
        </p>
      </LegalSection>
    </LegalDocument>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/politica-cookies')}#webpage`,
          url: absoluteUrl('/politica-cookies'),
          name: 'Política de Cookies | Pineda y Asociados',
          description: 'Política de cookies del sitio web de Pineda y Asociados, bufete jurídico en Nacaome, Valle. Información sobre cookies técnicas y de análisis utilizadas.',
          inLanguage: 'es-HN',
          isPartOf: { '@id': `${site.url}/#website` },
          about: { '@id': `${site.url}/#legal-service` },
        }),
      }} />
    </>
  );
}
