import type { Metadata } from 'next';
import { LegalDocument, LegalSection, LegalList, LegalCallout } from '@/components/marketing/legal-document';
import { site } from '@/lib/site';
import { getLegalPageContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Aviso Legal',
  description:
    'Aviso legal e identificación del titular de la web de LEX Honduras conforme a la legislación de la República de Honduras.',
  alternates: { canonical: '/aviso-legal' },
  robots: { index: true, follow: true },
};

export default async function AvisoLegalPage() {
  const c = await getLegalPageContent('aviso-legal');
  return (
    <LegalDocument
      eyebrow="Identificación del titular"
      title={c.title}
      subtitle={c.subtitle}
      version={c.version}
      lastUpdated={c.lastUpdated}
    >
      <LegalSection number="1" title="Datos identificativos del titular">
        <p>
          En cumplimiento del deber de información general establecido por el
          ordenamiento jurídico hondureño, se ponen a disposición del
          usuario los siguientes datos identificativos del titular de este
          sitio web:
        </p>
        <LegalList
          items={[
            <>Titular: <strong className="font-semibold text-primary">{site.name}</strong></>,
            <>Domicilio profesional: {site.address.full}</>,
            <>Teléfono: {site.phoneDisplay}</>,
            <>Correo electrónico: {site.email}</>,
            <>Actividad: Bufete multidisciplinario de servicios jurídicos (asesoría, consultoría y litigio en las principales ramas del derecho).</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="2" title="Objeto y alcance">
        <p>
          El presente aviso legal regula el acceso, la navegación y el uso de
          los contenidos publicados en el dominio <strong className="font-semibold text-primary">{site.url}</strong>{' '}
          y sus subdominios, así como en las direcciones que en el futuro los
          sustituyan. La utilización del sitio atribuye la condición de
          usuario y comporta la aceptación íntegra de todas las cláusulas
          contenidas en este aviso en la versión publicada en cada momento.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Marco normativo aplicable">
        <p>
          La actividad del bufete y el contenido de este sitio se rigen, entre
          otras, por las siguientes normas de la República de Honduras:
        </p>
        <LegalList
          items={[
            <>Constitución de la República (1982), en particular los Arts. 76 a 80 sobre derechos al honor, intimidad personal y familiar, imagen y privacidad.</>,
            <>Código Civil y Código de Comercio vigentes.</>,
            <>Código Penal, Decreto 130-2017, con sus reformas (Decretos 119-2019, 46-2020, 93-2021 y 59-2024), en lo relativo a los Arts. 215-219 (delitos informáticos) y 234 (suplantación).</>,
            <>Ley de Propiedad Intelectual, Decreto 4-99-E.</>,
            <>Ley de Firma Electrónica, Decreto 149-2013, y su Reglamento.</>,
            <>Ley de Transparencia y Acceso a la Información Pública, Decreto 170-2006.</>,
            <>Ley Orgánica del Colegio de Abogados de Honduras y su normativa complementaria.</>,
            <>Ley de Procedimiento Administrativo.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="4" title="Condiciones de uso del portal">
        <p>
          El usuario se compromete a utilizar el sitio y sus contenidos de
          forma diligente, lícita y conforme al ordenamiento jurídico
          hondureño. En particular, se abstendrá de:
        </p>
        <LegalList
          items={[
            'Introducir programas, virus, macros, applets, controles ActiveX o cualquier secuencia lógica que pueda causar alteraciones en los sistemas informáticos.',
            'Suplantar la identidad de otros usuarios, del bufete o de terceros, conforme al Art. 234 CP (suplantación).',
            'Realizar actos de ingeniería inversa, desensamblado o descompilación del software publicado.',
            'Someter la plataforma a cargas que puedan calificarse como ataques de denegación de servicio.',
            'Reproducir, copiar, distribuir, transformar o comunicar públicamente los contenidos protegidos por derechos de propiedad intelectual sin autorización expresa.',
          ]}
        />
        <LegalCallout variant="warning">
          El incumplimiento de estas obligaciones podrá dar lugar a la
          aplicación de las responsabilidades civiles, administrativas y
          penales previstas en el Código Penal y demás leyes especiales
          hondureñas.
        </LegalCallout>
      </LegalSection>

      <LegalSection number="5" title="Propiedad intelectual e industrial">
        <p>
          Todos los contenidos del sitio —textos, fotografías, gráficos,
          imágenes, vídeos, marcos sonoros, animaciones, software, ilustraciones,
          diseño gráfico y código fuente, así como las marcas, nombres
          comerciales y signos distintivos en él incluidos— son propiedad del
          bufete o de los terceros que han autorizado su cesión, y están
          protegidos por la <strong className="font-semibold text-primary">Ley de Propiedad Intelectual (Decreto 4-99-E)</strong>{' '}
          y por los tratados internacionales suscritos por Honduras.
        </p>
        <p>
          La reutilización con fines comerciales —incluyendo su inclusión en
          servicios de inteligencia artificial, minería de datos o
          entrenamiento de modelos— requiere autorización previa, expresa y
          por escrito del titular.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Régimen de responsabilidad">
        <p>
          El titular no garantiza la disponibilidad ininterrumpida ni la
          ausencia total de errores en el funcionamiento del sitio, ni
          responderá de los daños o perjuicios derivados de:
        </p>
        <LegalList
          items={[
            'Interrupciones del servicio, retrasos o anomalías técnicas ajenas a la voluntad del titular.',
            'La presencia de virus u otros elementos lesivos introducidos por terceros.',
            'El uso indebido del sitio por parte de los usuarios.',
            'La interpretación o aplicación que el usuario haga de los contenidos publicados.',
          ]}
        />
        <p>
          Los contenidos tienen carácter <strong className="font-semibold text-primary">informativo general</strong> y
          en ningún caso sustituyen al asesoramiento legal personalizado
          que sólo puede prestarse tras el estudio individual del caso por
          un abogado colegiado en Honduras.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Enlaces a sitios de terceros">
        <p>
          El sitio puede contener enlaces (links) a otras páginas web de
          terceros. El bufete no ejerce control alguno sobre dichos sitios y
          no asume responsabilidad por sus contenidos, políticas de
          privacidad o prácticas. La inclusión de cualquier enlace no
          implica aprobación, respaldo o garantía respecto del sitio
          enlazado.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Legislación aplicable y jurisdicción">
        <p>
          Las controversias que pudieran derivarse del acceso o uso del
          presente sitio web se regirán por la legislación de la República
          de Honduras y serán competencia de los tribunales ordinarios de
          la ciudad de <strong className="font-semibold text-primary">{site.address.city}</strong>,{' '}
          departamento de {site.address.department}, con renuncia expresa a
          cualquier otro fuero que pudiera corresponder.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
