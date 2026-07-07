import type { Metadata } from 'next';
import {
  LegalDocument,
  LegalSection,
  LegalSubsection,
  LegalList,
  LegalCallout,
} from '@/components/marketing/legal-document';
import { site, absoluteUrl } from '@/lib/site';
import { getLegalPageContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
    description:
      'Política de privacidad de Pineda y Asociados, bufete en Nacaome, Valle, Honduras. Protección de datos personales conforme al ordenamiento hondureño.',
  alternates: { canonical: '/politica-privacidad' },
  robots: { index: false, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidad | Pineda y Asociados',
    description: 'Cómo protegemos sus datos personales en el sitio web del bufete Pineda y Asociados en Nacaome, Valle, Honduras.',
    images: [`${site.url}/og-image.webp`],
  },
  openGraph: {
    title: 'Política de Privacidad | Pineda y Asociados',
    description: 'Política de privacidad del bufete jurídico Pineda y Asociados en Nacaome, Valle. Compromiso con la protección de datos personales.',
    url: `${site.url}/politica-privacidad`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.webp`, width: 1200, height: 630, alt: `${site.name} — Política de Privacidad` }],
  },
};

export default async function PoliticaPrivacidadPage() {
  const c = await getLegalPageContent('politica-privacidad');
  return (
    <>
    <LegalDocument
      eyebrow="Tratamiento de datos personales"
      title={c.title}
      subtitle={c.subtitle}
      version={c.version}
      lastUpdated={c.lastUpdated}
      validated
    >
      <LegalSection number="1" title="Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales recabados a
          través de este sitio es <strong className="font-semibold text-primary">{site.name}</strong>{' '}
          (en adelante, &ldquo;el bufete&rdquo;), con domicilio profesional
          en {site.address.full}, teléfono {site.phoneDisplay} y correo
          electrónico {site.email}.
        </p>
        <p>
          A la fecha de publicación de esta política, la República de
          Honduras no cuenta con una autoridad regulatoria independiente
          de protección de datos personales. El bufete aplica de forma
          voluntaria los principios generales del derecho a la intimidad
          reconocidos en los <strong className="font-semibold text-primary">Arts. 76 a 80 de la Constitución de la República</strong>{' '}
          y en los tratados internacionales en materia de derechos humanos
          ratificados por Honduras.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Datos que recabamos">
        <LegalSubsection title="2.1. Datos facilitados por el usuario">
          <LegalList
            items={[
              <>Nombre y apellidos.</>,
              <>Correo electrónico de contacto.</>,
              <>Número de teléfono (cuando se solicita consulta).</>,
              <>Descripción del caso o consulta jurídica.</>,
              <>Información del expediente, cuando el usuario decide crear una cuenta en la intranet.</>,
            ]}
          />
        </LegalSubsection>
        <LegalSubsection title="2.2. Datos generados por el uso del servicio">
          <LegalList
            items={[
              'Cálculos de pena realizados y resultados generados.',
              'Fecha y hora de acceso, dirección IP y agente de usuario (navegador, sistema operativo).',
              'Registros de auditoría de las acciones críticas (tabla `auditoria_eventos`).',
            ]}
          />
        </LegalSubsection>
        <LegalSubsection title="2.3. Datos NO recabados">
          <LegalList
            items={[
              'No utilizamos cookies de rastreo publicitario.',
              'No vendemos ni cedemos datos personales a terceros con fines comerciales.',
              'No integramos píxeles de redes sociales de forma predeterminada.',
              'No incorporamos Google Analytics ni servicios equivalentes de seguimiento masivo en este sitio.',
            ]}
          />
        </LegalSubsection>
      </LegalSection>

      <LegalSection number="3" title="Finalidad y base legal del tratamiento">
        <p>Los datos personales recabados se utilizan exclusivamente para:</p>
        <LegalList
          items={[
            'Prestar el servicio de cálculo estimado de penas y, en su caso, atender las solicitudes de consulta.',
            'Gestionar el alta, autenticación y seguridad de la cuenta del usuario en la intranet del bufete.',
            'Cumplir con las obligaciones legales y fiscales del bufete (SAR, RTN, Colegio de Abogados).',
            'Auditoría interna, prevención del fraude y mejora del servicio sobre datos agregados, no individuales.',
            'Atender eventuales requerimientos de autoridades judiciales o administrativas hondureñas competentes.',
          ]}
        />
        <p>
          La base legitimadora es el consentimiento del usuario, otorgado al
          aceptar esta política y, en su caso, el contrato de prestación de
          servicios jurídicos celebrado con el bufete.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Conservación de los datos">
        <LegalList
          items={[
            'Datos de la cuenta: mientras la cuenta permanezca activa. Tras solicitar la baja, se eliminan en un plazo máximo de 30 días.',
            'Cálculos y casos: mientras la cuenta esté activa o hasta que el usuario solicite su supresión.',
            'Registros de auditoría: 1 año, tras el cual se anonimizan o agregan.',
            'Copias de seguridad automatizadas: 7 días (PITR del proveedor de base de datos).',
          ]}
        />
      </LegalSection>

      <LegalSection number="5" title="Encargados de tratamiento y cesiones">
        <p>
          Para prestar el servicio el bufete contrata a proveedores de
          infraestructura que pueden tratar datos personales en calidad de
          encargados de tratamiento. Los principales son:
        </p>
        <LegalList
          items={[
            <>Vercel Inc. (alojamiento y despliegue del sitio web). Ver su <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">política de privacidad</a>.</>,
            <>Neon Inc. (base de datos PostgreSQL serverless, región US-East-1). Ver su <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">política de privacidad</a>.</>,
            <>DeepSeek (proveedor del modelo de IA del asistente virtual de preconsulta). Los mensajes que el usuario envía al chat se transmiten a DeepSeek únicamente para generar la respuesta orientativa; no se almacenan en el sitio. Ver su <a href="https://www.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">información oficial</a>.</>,
          ]}
        />
        <p>
          No se realizan cesiones de datos personales a terceros, salvo en
          los casos previstos por la ley o cuando sea necesario para
          atender requerimientos de autoridades judiciales o administrativas
          hondureñas competentes.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Asistente virtual de preconsulta (IA)">
        <p>
          El sitio dispone de un asistente virtual automatizado basado en
          inteligencia artificial (proveedor DeepSeek) que ofrece
          orientación inicial sobre los servicios del despacho, ayuda a
          identificar el área legal probable y facilita el contacto.
        </p>
        <LegalList
          items={[
            <><strong className="font-semibold text-primary">Naturaleza:</strong> es un sistema automatizado de IA. No es abogado, no emite dictámenes jurídicos, no promete resultados y no sustituye una consulta profesional personalizada.</>,
            <><strong className="font-semibold text-primary">Datos tratados:</strong> el texto de los mensajes que el usuario decide escribir, su dirección IP (para prevención de abuso) y un identificador de sesión aleatorio almacenado en su navegador.</>,
            <><strong className="font-semibold text-primary">Datos NO tratados:</strong> el asistente no exige datos sensibles. Si el usuario los aporta voluntariamente, se le advierte que pueden transmitirse al proveedor de IA y se le insta a minimizar la información sensible.</>,
            <><strong className="font-semibold text-primary">Conservación:</strong> las conversaciones no se almacenan en el sitio. El historial vive únicamente en el navegador del usuario durante la sesión y se pierde al cerrar la página.</>,
            <><strong className="font-semibold text-primary">Transmisión al proveedor:</strong> para generar la respuesta, el mensaje se envía a DeepSeek. El bufete no controla la retention policy del proveedor más allá de no almacenar los datos en sus propios sistemas.</>,
            <><strong className="font-semibold text-primary">Derecho a no usar la IA:</strong> el usuario puede contactar directamente por WhatsApp, teléfono o correo sin interactuar con el asistente.</>,
          ]}
        />
        <LegalCallout variant="info">
          Recomendación: no comparta en el chat datos especialmente sensibles
          (salud, credenciales, datos de menores) salvo que sean estrictamente
          necesarios para que el despacho valore su caso. Para asuntos sensibles,
          prefiera el contacto directo.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="7" title="Seguridad de la información">
        <p>
          El bufete aplica medidas técnicas y organizativas razonables para
          proteger los datos personales:
        </p>
        <LegalList
          items={[
            'Cifrado HTTPS obligatorio en producción (HSTS habilitado).',
            'Contraseñas almacenadas con bcrypt (10 rounds) y nunca en texto plano.',
            'Sesiones mediante cookies `__Host-token` con atributos httpOnly, secure y sameSite=strict.',
            'Cabeceras de seguridad: CSP estricta, X-Content-Type-Options, X-Frame-Options, Referrer-Policy y Permissions-Policy.',
            'Backups cifrados en reposo y rotación periódica de claves.',
          ]}
        />
      </LegalSection>

      <LegalSection number="8" title="Derechos del titular de los datos">
        <p>
          El usuario puede ejercer en cualquier momento los derechos
          previstos en la Constitución y en las leyes aplicables:
        </p>
        <LegalList
          items={[
            'Acceso a sus datos personales.',
            'Rectificación de datos inexactos o incompletos.',
            'Supresión (cancelación) de su cuenta y datos asociados.',
            'Oposición al tratamiento.',
            'Portabilidad, mediante exportación en formato JSON.',
          ]}
        />
        <p>
          Para ejercer cualquiera de estos derechos, el usuario deberá
          enviar una solicitud al correo {site.email} acreditando su
          identidad. El bufete dará respuesta en un plazo máximo de
          15 días hábiles.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Menores de edad">
        <p>
          Este sitio no está dirigido a menores de 18 años. Si el bufete
          detecta que un menor ha facilitado datos personales sin la
          autorización de sus representantes legales, procederá a su
          supresión inmediata, conforme al principio del interés superior
          del menor y a la <strong className="font-semibold text-primary">Convención sobre los Derechos del Niño</strong>{' '}
          ratificada por Honduras mediante Decreto 80-90.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Modificaciones de esta política">
        <p>
          El bufete podrá modificar la presente política para adaptarla a
          novedades legislativas o jurisprudenciales. Las modificaciones se
          publicarán en esta misma URL con la fecha de actualización. Si
          los cambios fueran sustanciales, se notificará a los usuarios
          registrados por los medios habituales de contacto.
        </p>
        <LegalCallout variant="info">
          Se recomienda revisar periódicamente esta política. El uso
          continuado del sitio tras la publicación de cambios supone la
          aceptación de la versión actualizada.
        </LegalCallout>
      </LegalSection>
    </LegalDocument>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${absoluteUrl('/politica-privacidad')}#webpage`,
          url: absoluteUrl('/politica-privacidad'),
          name: 'Política de Privacidad | Pineda y Asociados',
          description: 'Política de privacidad de Pineda y Asociados, bufete en Nacaome, Valle, Honduras. Protección de datos personales conforme al ordenamiento hondureño.',
          inLanguage: 'es-HN',
          isPartOf: { '@id': `${site.url}/#website` },
          about: { '@id': `${site.url}/#legal-service` },
        }),
      }} />
    </>
  );
}
