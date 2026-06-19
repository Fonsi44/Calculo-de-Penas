import type { Metadata } from 'next';
import { LegalDocument, LegalSection, LegalList, LegalCallout } from '@/components/marketing/legal-document';
import { site } from '@/lib/site';
import { getLegalPageContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Exención de Responsabilidad',
  description:
    'Exención de responsabilidad de Pineda y Asociados, bufete en Nacaome, Valle, sobre la calculadora de penas, contenidos publicados y servicios legales.',
  alternates: { canonical: '/disclaimer' },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'Disclaimer | Pineda y Asociados',
    description: 'Exención de responsabilidad sobre la información publicada en el sitio web del bufete Pineda y Asociados en Nacaome, Valle, Honduras.',
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: 'Disclaimer | Pineda y Asociados',
    description: 'Exención de responsabilidad del bufete jurídico Pineda y Asociados sobre la calculadora de penas y contenidos publicados.',
    url: `${site.url}/disclaimer`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Disclaimer` }],
  },
};

export default async function DisclaimerPage() {
  const c = await getLegalPageContent('disclaimer');
  return (
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
        La información publicada en este sitio web —incluyendo los
        resultados generados por la calculadora de penas— tiene carácter
        <strong className="font-semibold"> estrictamente orientativo</strong> y
        NO sustituye el asesoramiento legal personalizado que sólo puede
        prestarse tras el análisis individual del caso por un abogado
        colegiado en Honduras.
      </LegalCallout>

      <LegalSection number="1" title="Sobre la calculadora de penas">
        <p>
          La calculadora aplica las reglas del <strong className="font-semibold text-primary">Código Penal de Honduras (Decreto 130-2017 y reformas vigentes)</strong> y
          sus reformas vigentes. Está diseñada como herramienta de apoyo
          para que abogados, estudiantes de derecho y usuarios informados
          puedan estimar la pena correspondiente a uno o varios delitos
          en escenarios idealizados.
        </p>
        <p>La calculadora <strong className="font-semibold text-primary">NO</strong> realiza:</p>
        <LegalList
          items={[
            'Calificación jurídica de hechos ni subsunción penal.',
            'Valoración probatoria de los indicios o pruebas del caso.',
            'Análisis de la jurisprudencia vinculante de la Corte Suprema de Justicia.',
            'Aplicación de circunstancias especiales, grados de ejecución incompletos o figuras concursales complejas.',
            'Atenuantes o agravantes que requieran valoración subjetiva del juez.',
          ]}
        />
        <p>
          La estimación puede diferir —incluso significativamente— del
          fallo judicial definitivo. <strong className="font-semibold text-primary">El resultado no es vinculante</strong> para ninguna
          autoridad jurisdiccional.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Sobre los contenidos publicados">
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

      <LegalSection number="3" title="Sobre la base de datos de delitos">
        <p>
          La base de datos incluida en la calculadora contiene{' '}
          <strong className="font-semibold text-primary">483 delitos del Código Penal</strong>{' '}
          validados contra el Decreto 130-2017 y las reformas vigentes
          (119-2019, 46-2020, 93-2021 y 59-2024). Si bien se ha puesto
          especial cuidado en su actualización, pueden existir errores
          materiales. El bufete agradece las correcciones que los
          usuarios cualificados quieran reportar a través del formulario
          de contacto.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Sobre los servicios jurídicos">
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
          Ningún resultado de la calculadora, contenido del blog o
          comunicación con el bufete a través de este sitio genera por
          sí solo una relación abogado-cliente. Esta sólo se perfecciona
          con la firma de la hoja de encargo.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="5" title="Sobre los enlaces externos">
        <p>
          El sitio puede incluir enlaces a recursos oficiales
          (Congreso Nacional, Poder Judicial, SAR, ARSA, INM, Colegio de
          Abogados) o a proveedores (Vercel, Neon). El bufete no
          controla ni se responsabiliza de la disponibilidad, exactitud
          o contenido de dichos sitios de terceros.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Sobre la ausencia de garantía de resultados">
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

      <LegalSection number="7" title="Sobre la responsabilidad del usuario">
        <p>
          El usuario es el único responsable del uso que haga de la
          información y herramientas publicadas. En particular:
        </p>
        <LegalList
          items={[
            'De la veracidad de los datos introducidos en la calculadora.',
            'De las decisiones que adopte basándose —exclusivamente— en los resultados obtenidos.',
            'De la verificación posterior con un abogado habilitado antes de cualquier actuación procesal.',
          ]}
        />
      </LegalSection>

      <LegalSection number="8" title="Aceptación del disclaimer">
        <p>
          El uso continuado de este sitio web y de la calculadora de
          penas implica la aceptación íntegra del presente disclaimer.
          Si el usuario no está de acuerdo con alguno de sus términos,
          debe abstenerse de utilizarlos.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Contacto">
        <p>
          Para cualquier duda o aclaración, el bufete está disponible en{' '}
          <a href={`mailto:${site.email}`} className="text-accent hover:underline">{site.email}</a> y en el teléfono {site.phoneDisplay}.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
