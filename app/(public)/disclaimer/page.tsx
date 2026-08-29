import type { Metadata } from 'next';
import { LegalDocument, LegalSection, LegalList, LegalCallout } from '@/components/marketing/legal-document';
import { site, absoluteUrl } from '@/lib/site';
import { getLegalPageContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Exención de Responsabilidad',
  description:
    'Exención de responsabilidad de Pineda y Asociados, bufete en Nacaome, Valle, sobre contenidos publicados y servicios legales.',
  alternates: { canonical: '/disclaimer' },
  robots: { index: false, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'Disclaimer | Pineda y Asociados',
    description: 'Exención de responsabilidad sobre la información publicada en el sitio web del bufete Pineda y Asociados en Nacaome, Valle, Honduras.',
    images: [`${site.url}/og-image.webp`],
  },
  openGraph: {
    title: 'Disclaimer | Pineda y Asociados',
    description: 'Exención de responsabilidad del bufete jurídico Pineda y Asociados sobre contenidos publicados y servicios legales.',
    url: `${site.url}/disclaimer`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.webp`, width: 1200, height: 630, alt: `${site.name} — Disclaimer` }],
  },
};

export default async function DisclaimerPage() {
  const c = await getLegalPageContent('disclaimer');
  return (
    <>
    <LegalDocument
      eyebrow="Exención de responsabilidad"
      title={c.title}
      subtitle={c.subtitle}
      version={c.version}
      lastUpdated={c.lastUpdated}
      validated
    >
      <LegalCallout variant="danger">
        <strong className="font-semibold text-primary">Mensaje principal.</strong>{' '}
        La información publicada en este sitio web tiene carácter
        <strong className="font-semibold"> estrictamente orientativo</strong> y
        NO sustituye el asesoramiento legal personalizado que sólo puede
        prestarse tras el análisis individual del caso por un abogado
        colegiado en Honduras.
      </LegalCallout>

      <LegalSection number="1" title="Sobre los contenidos publicados">
        <p>
          Los artículos, guías, FAQ y demás contenidos del blog tienen
          carácter <strong className="font-semibold text-primary">informativo general</strong> y
          reflejan la normativa y doctrina vigentes en la fecha de
          publicación. La aplicación concreta a un caso particular
          requiere el estudio individual por un abogado colegiado.
        </p>
        <p>
          El bufete no garantiza la exactitud exhaustiva de los
          contenidos, especialmente en áreas del derecho con cambios
          normativos frecuentes (tributario, aduanero, sanitario,
          migratorio).
        </p>
      </LegalSection>

      <LegalSection number="2" title="Sobre las referencias al Código Penal">
        <p>
          Las referencias a delitos y artículos del{' '}
          <strong className="font-semibold text-primary">Código Penal de Honduras (Decreto 130-2017 y reformas vigentes)</strong>{' '}
          publicadas en el sitio se basan en fuentes canónicas internas.
          Si bien se ha puesto especial cuidado en su actualización,
          pueden existir errores materiales. El bufete agradece las
          correcciones que los usuarios cualificados quieran reportar a
          través del formulario de contacto.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Sobre los servicios jurídicos">
        <p>
          La información publicada en este sitio web NO constituye una
          oferta de servicios jurídicos vinculante. La contratación
          efectiva de servicios requiere:
        </p>
        <LegalList
          items={[
            'Una entrevista previa de valoración.',
            'La firma de una hoja de encargo profesional (contrato de servicios jurídicos).',
            'La verificación de la habilitación profesional del abogado asignado (colegiado activo en el Colegio de Abogados de Honduras).',
            'La emisión del comprobante fiscal correspondiente (RTN/SAR).',
          ]}
        />
        <LegalCallout variant="info">
          Ningún contenido del blog ni comunicación con el bufete a
          través de este sitio genera por sí solo una relación
          abogado-cliente. Esta sólo se perfecciona con la firma de la
          hoja de encargo.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="4" title="Sobre los enlaces externos">
        <p>
          El sitio puede incluir enlaces a recursos oficiales
          (Congreso Nacional, Poder Judicial, SAR, ARSA, INM, Colegio de
          Abogados) o a proveedores (Vercel, Neon). El bufete no
          controla ni se responsabiliza de la disponibilidad, exactitud
          o contenido de dichos sitios de terceros.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Sobre la ausencia de garantía de resultados">
        <p>
          En materia jurídica, ningún resultado judicial puede
          garantizarse. La defensa penal, civil, laboral o administrativa
          que el bufete pueda asumir está sujeta a múltiples variables
          (hechos, pruebas, jurisprudencia, criterio del juez o tribunal)
          que escapan al control del profesional. La contratación de
          servicios jurídicos no genera derecho alguno a un resultado
          favorable.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Sobre la responsabilidad del usuario">
        <p>
          El usuario es el único responsable del uso que haga de la
          información publicada. En particular:
        </p>
        <LegalList
          items={[
            'De las decisiones que adopte basándose —exclusivamente— en contenidos informativos del sitio.',
            'De la verificación posterior con un abogado habilitado antes de cualquier actuación procesal.',
          ]}
        />
      </LegalSection>

      <LegalSection number="7" title="Aceptación del disclaimer">
        <p>
          El uso continuado de este sitio web implica la aceptación
          íntegra del presente disclaimer. Si el usuario no está de
          acuerdo con alguno de sus términos, debe abstenerse de
          utilizarlo.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Contacto">
        <p>
          Para cualquier duda o aclaración, el bufete está disponible en{' '}
          <a href={`mailto:${site.email}`} className="text-accent hover:underline">{site.email}</a> y en el teléfono {site.phoneDisplay}.
        </p>
      </LegalSection>
    </LegalDocument>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/disclaimer')}#webpage`,
          url: absoluteUrl('/disclaimer'),
          name: 'Exención de Responsabilidad | Pineda y Asociados',
          description: 'Exención de responsabilidad de Pineda y Asociados, bufete en Nacaome, Valle, sobre contenidos publicados y servicios legales.',
          inLanguage: 'es-HN',
          isPartOf: { '@id': `${site.url}/#website` },
          about: { '@id': `${site.url}/#legal-service` },
        }),
      }} />
    </>
  );
}
