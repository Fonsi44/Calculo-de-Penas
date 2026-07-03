import type { Metadata } from 'next';
import { LegalDocument, LegalSection, LegalList, LegalCallout } from '@/components/marketing/legal-document';
import { site, absoluteUrl } from '@/lib/site';
import { getLegalPageContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
    description:
      'Términos y condiciones de uso del sitio web de Pineda y Asociados en Nacaome, Valle. Reglas de acceso y uso de servicios jurídicos publicados.',
  alternates: { canonical: '/terminos' },
  robots: { index: false, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos y Condiciones | Pineda y Asociados',
    description: 'Términos y condiciones de uso del sitio web del bufete Pineda y Asociados en Nacaome, Valle, Honduras.',
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: 'Términos y Condiciones | Pineda y Asociados',
    description: 'Términos y condiciones de uso del sitio web del bufete jurídico Pineda y Asociados en Nacaome, Valle, Honduras.',
    url: `${site.url}/terminos`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Términos y Condiciones` }],
  },
};

export default async function TerminosPage() {
  const c = await getLegalPageContent('terminos');
  return (
    <>
    <LegalDocument
      eyebrow="Condiciones de uso del servicio"
      title={c.title}
      subtitle={c.subtitle}
      version={c.version}
      lastUpdated={c.lastUpdated}
      validated
    >
      <LegalCallout variant="warning">
        <strong className="font-semibold text-primary">Aviso importante.</strong>{' '}
        La calculadora de penas es una <strong className="font-semibold">herramienta de apoyo</strong>.
        NO constituye asesoramiento legal, NO sustituye la consulta con un
        abogado colegiado en Honduras, y NO garantiza la exactitud de los
        resultados. Cada caso requiere análisis individual por un profesional
        habilitado.
      </LegalCallout>

      <LegalSection number="1" title="Aceptación de los términos">
        <p>
          Al acceder y utilizar este sitio web (en adelante, &ldquo;la
          Plataforma&rdquo;), el usuario acepta íntegramente los presentes
          Términos y Condiciones. Si no está de acuerdo con alguno de ellos,
          debe abstenerse de utilizar la Plataforma.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Descripción del servicio">
        <p>
          La Plataforma es una calculadora jurídica que aplica las reglas
          del <strong className="font-semibold text-primary">Código Penal de Honduras (Decreto 130-2017 y reformas vigentes)</strong> y
          sus reformas vigentes (Decretos 119-2019, 46-2020, 93-2021 y
          59-2024) para estimar la pena correspondiente a uno o varios
          delitos, considerando atenuantes, agravantes, eximentes, grados
          de autoría, ejecución y tipo de concurso.
        </p>
        <p>
          La Plataforma NO emite dictámenes periciales, NO realiza
          clasificación jurídica de hechos ni sustituye el análisis
          particularizado que sólo puede realizar un abogado habilitado.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Cuenta de usuario">
        <p>
          Determinadas funcionalidades requieren registro. El usuario se
          compromete a:
        </p>
        <LegalList
          items={[
            'Proporcionar información veraz, exacta y actualizada.',
            'Mantener la confidencialidad de su contraseña.',
            'Notificar inmediatamente cualquier uso no autorizado de su cuenta.',
            'No compartir sus credenciales con terceros.',
          ]}
        />
      </LegalSection>

      <LegalSection number="4" title="Uso aceptable">
        <p>Está expresamente prohibido:</p>
        <LegalList
          items={[
            'Utilizar la Plataforma para la comisión de delitos, conforme al Código Penal y leyes especiales.',
            'Intentar acceder a cuentas, datos o sistemas de otros usuarios.',
            'Realizar ingeniería inversa, desensamblar o descompilar el software publicado.',
            'Someter la infraestructura a cargas que puedan considerarse ataques de denegación de servicio.',
            'Emplear bots, scrapers o sistemas automatizados sin autorización escrita previa.',
            'Suplantar la identidad de otras personas o del bufete (Art. 234 CP).',
          ]}
        />
      </LegalSection>

      <LegalSection number="5" title="Propiedad intelectual">
        <p>
          La Plataforma, su código fuente, diseño, marca, base de datos de
          delitos y demás contenidos están protegidos por la{' '}
          <strong className="font-semibold text-primary">Ley de Propiedad Intelectual (Decreto 4-99-E)</strong>{' '}
          y por los tratados internacionales suscritos por Honduras. El
          usuario recibe únicamente una licencia limitada, no exclusiva,
          revocable y no transferible de uso.
        </p>
        <p>
          Queda prohibida la reutilización, total o parcial, con fines
          comerciales —incluyendo su inclusión en servicios de inteligencia
          artificial, minería de datos o entrenamiento de modelos— sin
          autorización previa, expresa y por escrito del titular.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Limitación de responsabilidad">
        <p>
          La Plataforma se proporciona &ldquo;TAL CUAL&rdquo;, sin garantías
          de ningún tipo, expresas o implícitas, incluyendo, entre otras,
          garantías de comerciabilidad, idoneidad para un fin determinado
          y no infracción.
        </p>
        <p>El bufete no será responsable por:</p>
        <LegalList
          items={[
            'Errores derivados de datos de entrada incorrectos o incompletos.',
            'Variaciones en la interpretación jurisprudencial.',
            'Errores en la base de datos de delitos del Código Penal.',
            'Cambios normativos posteriores al Decreto 130-2017 y sus reformas.',
            'Daños directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del servicio.',
          ]}
        />
      </LegalSection>

      <LegalSection number="7" title="Enlaces a sitios de terceros">
        <p>
          La Plataforma puede contener enlaces a sitios web de terceros
          (Vercel, Neon, Colegio de Abogados, Poder Judicial, SAR, etc.).
          El bufete no asume responsabilidad por los contenidos, políticas
          o prácticas de dichos sitios. La inclusión de un enlace no
          implica aprobación o respaldo.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Modificaciones">
        <p>
          El bufete se reserva el derecho de modificar los presentes
          Términos en cualquier momento. Los cambios se publicarán en
          esta misma URL con la fecha de actualización. Se notificará a
          los usuarios registrados cuando las modificaciones sean
          sustanciales.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República de
          Honduras. Cualquier controversia se resolverá en los tribunales
          competentes de {site.address.city}, {site.address.department},
          con renuncia expresa a cualquier otro fuero que pudiera
          corresponder.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Contacto">
        <p>
          Para consultas relacionadas con estos Términos, el usuario puede
          escribir a <a href={`mailto:${site.email}`} className="text-accent hover:underline">{site.email}</a>{' '}
          o llamar al {site.phoneDisplay}.
        </p>
      </LegalSection>
    </LegalDocument>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/terminos')}#webpage`,
          url: absoluteUrl('/terminos'),
          name: 'Términos y Condiciones | Pineda y Asociados',
          description: 'Términos y condiciones de uso del sitio web de Pineda y Asociados en Nacaome, Valle. Reglas de acceso y uso de servicios jurídicos publicados.',
          inLanguage: 'es-HN',
          isPartOf: { '@id': `${site.url}/#website` },
          about: { '@id': `${site.url}/#legal-service` },
        }),
      }} />
    </>
  );
}
