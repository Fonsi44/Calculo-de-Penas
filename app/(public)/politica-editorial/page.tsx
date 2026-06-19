import type { Metadata } from 'next';
import { LegalDocument, LegalSection, LegalList, LegalCallout } from '@/components/marketing/legal-document';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política Editorial',
    description:
      'Política editorial del bufete Pineda y Asociados en Nacaome, Valle: criterios de creación, revisión y actualización de contenidos jurídicos del sitio web.',
  alternates: { canonical: '/politica-editorial' },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'Política Editorial | Pineda y Asociados',
    description: 'Criterios editoriales del bufete Pineda y Asociados en Nacaome, Valle, Honduras para la creación y revisión de contenidos jurídicos.',
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: 'Política Editorial | Pineda y Asociados',
    description: 'Política editorial del bufete jurídico Pineda y Asociados: criterios de creación, revisión y actualización de contenidos.',
    url: `${site.url}/politica-editorial`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Política Editorial` }],
  },
};

export default function PoliticaEditorialPage() {
  return (
    <LegalDocument
      eyebrow="Criterios editoriales"
      title="Política Editorial"
      subtitle="Cómo creamos, revisamos y actualizamos los contenidos jurídicos de este sitio"
      version="1.0"
      lastUpdated="Junio 2026"
    >
      <LegalSection number="1" title="Compromiso editorial">
        <p>
          En <strong className="font-semibold text-primary">{site.name}</strong> entendemos la
          información jurídica como un servicio público. Los contenidos publicados
          en este sitio web —artículos del blog, guías, respuestas a preguntas
          frecuentes y descripciones de servicios— se elaboran con rigor técnico,
          claridad expositiva y respeto al marco legal vigente en la República de
          Honduras.
        </p>
        <p>
          Nuestra política editorial se rige por los principios de
          <strong className="font-semibold text-primary"> veracidad, actualización,
          transparencia y utilidad práctica</strong>. Todo el contenido informativo
          se produce con la finalidad de orientar al público general, sin que
          constituya en ningún caso asesoría legal personalizada.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Autores y supervisión">
        <p>
          Los contenidos son elaborados por el equipo legal del bufete,
          compuesto por Abogados colegiados en Honduras. Cada publicación es
          revisada antes de su difusión para garantizar:
        </p>
        <LegalList
          items={[
            'Coherencia con el ordenamiento jurídico hondureño vigente.',
            'Citación correcta de las normas aplicables (Código Penal, leyes especiales, jurisprudencia).',
            'Claridad y accesibilidad del lenguaje para lectores no especializados.',
            'Ausencia de promesas de resultado o afirmaciones que puedan inducir a error.',
          ]}
        />
      </LegalSection>

      <LegalSection number="3" title="Fuentes y veracidad">
        <p>
          Toda la información publicada se sustenta en fuentes legales primarias:
        </p>
        <LegalList
          items={[
            'Constitución de la República de Honduras.',
            'Código Penal Decreto 130-2017 y sus reformas (Decretos 119-2019, 46-2020, 93-2021, 59-2024).',
            'Código Civil, Código de Comercio y leyes especiales vigentes.',
            'Jurisprudencia de la Corte Suprema de Justicia de Honduras.',
            'Doctrina jurídica nacional e internacional de referencia.',
          ]}
        />
        <p>
          Cuando se hace referencia a proyectos de ley, reformas en trámite o
          criterios doctrinales no vinculantes, se indica expresamente su
          carácter no definitivo.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Actualización de contenidos">
        <p>
          El ordenamiento jurídico hondureño está en evolución constante. Nos
          comprometemos a:
        </p>
        <LegalList
          items={[
            'Revisar y actualizar los contenidos publicados cuando se produzcan reformas legislativas relevantes.',
            'Indicar la fecha de la última actualización en cada artículo o guía.',
            'Retirar o corregir la información que haya quedado desfasada por cambios normativos.',
          ]}
        />
        <LegalCallout variant="info">
          Si detecta algún contenido desactualizado o erróneo, le agradecemos
          que nos lo comunique a través de nuestro formulario de contacto para
          proceder a su revisión.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="5" title="Correcciones y transparencia">
        <p>
          Si identificamos un error material en un contenido publicado, lo
          corregiremos sin demora y dejaremos constancia de la corrección
          cuando la naturaleza del error lo requiera. Las correcciones
          sustanciales se notificarán en el propio artículo.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Contenido generado con apoyo de IA">
        <p>
          Parte del contenido publicado puede haberse generado con el apoyo
          de herramientas de inteligencia artificial, siempre bajo supervisión
          y revisión del equipo legal del bufete. La IA se utiliza como
          herramienta de apoyo a la redacción y estructuración, no como
          sustituto del criterio jurídico profesional. Todo el contenido
          publicado es verificado y validado por Abogados colegiados antes de
          su difusión.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Relación con el usuario">
        <p>
          La información publicada en este sitio <strong className="font-semibold text-primary">
          no constituye asesoría legal</strong>. Para recibir orientación
          ajustada a su caso concreto, debe solicitar una consulta profesional.
          El uso del sitio no crea una relación abogado-cliente entre el
          usuario y el bufete.
        </p>
        <p>
          Consulte nuestros <a href="/terminos" className="text-accent hover:underline">Términos y Condiciones</a>,{' '}
          <a href="/aviso-legal" className="text-accent hover:underline">Aviso Legal</a> y{' '}
          <a href="/politica-privacidad" className="text-accent hover:underline">Política de Privacidad</a>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
