import { db } from '../../lib/db';
import { blogPosts } from '../../lib/schema';
import { eq } from 'drizzle-orm';

const postId = '25ac79ea-5a61-4409-acb1-a89c618f70a1';

const newBody = `<h2>¿Cuáles son las etapas del juicio oral en Honduras?</h2>
<p>El juicio oral en Honduras es la fase crucial del proceso penal donde se presentan y debaten las pruebas ante un tribunal. Está regulado por el <strong>Código Procesal Penal de Honduras</strong> (Decreto 9-99-E), específicamente en los <strong>Artículos 331 al 370</strong>. Esta etapa garantiza los principios de oralidad, publicidad, inmediación, contradicción, concentración y presunción de inocencia, fundamentales para una sentencia válida.</p>

<h2>¿Cómo se desarrolla el juicio oral según la ley hondureña?</h2>
<p>El juicio oral constituye un debate público en el que el Ministerio Público expone las pruebas contra el acusado, y la defensa tiene la oportunidad de refutarlas. Un juez o tribunal escucha los argumentos y emite una decisión sobre la culpabilidad o inocencia. El proceso se realiza verbalmente ante el juez, quien debe estar presente durante toda la audiencia. El acusado tiene el derecho a no declarar y a ser asistido por un abogado. La víctima puede participar como parte acusadora.</p>

<h3>Preparación y apertura del juicio oral</h3>
<p>La fase de apertura, regulada en el <strong>Artículo 333 del Código Procesal Penal</strong>, inicia con la verificación de la presencia de todas las partes: fiscal, defensor, imputado, víctima (si se ha constituido como tal), testigos y peritos. Si faltan intervinientes esenciales, el juicio puede suspenderse.</p>
<ul>
<li><strong>Alegato inicial del fiscal:</strong> Presenta el delito imputado y las pruebas que sustentan la acusación (Art. 334).</li>
<li><strong>Teoría del caso de la defensa:</strong> Expone cómo refutará la evidencia y argumentará a favor de la absolución o una pena menor.</li>
<li><strong>Resolución de incidentes:</strong> El tribunal resuelve cuestiones como impugnaciones a la admisibilidad de pruebas o recusaciones de jueces (Art. 335).</li>
<li><strong>Exclusión probatoria:</strong> La defensa puede plantear la exclusión de pruebas obtenidas con violación de derechos fundamentales, como allanamientos ilegales (Art. 187).</li>
</ul>

<p><strong>¿Necesita defensa penal inmediata? <a href="/solicitar-consulta">Contacte a un abogado penalista experto hoy mismo</a>.</strong></p>

<h3>Desarrollo de la práctica de pruebas</h3>
<p>Esta es la fase central del juicio, donde se presentan las pruebas de manera sucesiva, conforme al <strong>Título IV, Capítulo II del Código Procesal Penal</strong>. El orden de la práctica incluye:</p>
<ul>
<li><strong>Declaración del imputado:</strong> Si decide declarar, ejerciendo su derecho a guardar silencio (Artículo 82, numeral 3 de la Constitución de la República).</li>
<li><strong>Testigos y peritos:</strong> Testigos de cargo, de descargo y peritos. Cada uno es interrogado y contrainterrogado por la parte contraria (Art. 347).</li>
<li><strong>Prueba documental y material:</strong> Se incorpora mediante su lectura o exhibición (Art. 354).</li>
<li><strong>Intervención del juez:</strong> Los peritos rinden su dictamen y pueden recibir preguntas aclaratorias del juez (Art. 357).</li>
<li><strong>Objeciones:</strong> La ley prohíbe preguntas capciosas o impertinentes. La defensa debe objetar oportunamente para evitar su convalidación (Art. 349).</li>
</ul>

<h3>Alegatos finales y conclusión del debate</h3>
<p>Una vez concluida la práctica de pruebas, el fiscal y la defensa presentan sus alegatos finales, analizando la evidencia presentada y argumentando a favor de sus respectivas posiciones, conforme al <strong>Artículo 361 del Código Procesal Penal</strong>. La defensa debe destacar las contradicciones en la prueba de cargo y las dudas razonables que impiden una condena. El imputado tiene derecho a la última palabra antes de que el tribunal se retire a deliberar, según el <strong>Artículo 362 del Código Procesal Penal</strong>.</p>

<h3>Deliberación y pronunciamiento de la sentencia</h3>
<p>El tribunal se retira a deliberar en sesión secreta. La sentencia puede dictarse al finalizar la audiencia o diferirse para los días siguientes, dentro del plazo legal establecido en el <strong>Artículo 363 del Código Procesal Penal</strong>. La sentencia debe ser motivada, explicando la valoración de cada prueba y la aplicación de la norma jurídica, de acuerdo con el <strong>Artículo 365 del Código Procesal Penal</strong>. Una sentencia sin motivación suficiente es nula y puede ser recurrida en apelación ante la Corte de Apelaciones correspondiente.</p>
<p>La sentencia puede ser absolutoria o condenatoria. Si es condenatoria, se fijará la pena concreta aplicando las reglas del <strong>Código Penal de Honduras</strong> (Decreto 130-2017), considerando circunstancias agravantes y atenuantes, grado de participación y reglas de concurso. Si es absolutoria, el imputado queda en libertad inmediata, conforme al <strong>Artículo 369 del Código Procesal Penal</strong>.</p>

<h2>Principios rectores del juicio oral en Honduras</h2>
<ul>
<li><strong>Oralidad:</strong> Todo el debate se desarrolla verbalmente, con los escritos sirviendo de soporte, según el <strong>Artículo 331 del Código Procesal Penal</strong>.</li>
<li><strong>Publicidad:</strong> El juicio es público, salvo excepciones establecidas en el <strong>Artículo 332 del Código Procesal Penal</strong> (menores de edad, delitos sexuales, seguridad nacional, o cuando la publicidad afecte gravemente a la víctima).</li>
<li><strong>Inmediación:</strong> El juez o tribunal presencia directamente la producción de las pruebas, sin intermediarios, conforme al <strong>Artículo 331 del Código Procesal Penal</strong>.</li>
<li><strong>Contradicción:</strong> Cada parte tiene derecho a interrogar, repreguntar y rebatir las pruebas presentadas por la otra, asegurando el debate probatorio, según el <strong>Artículo 331 del Código Procesal Penal</strong>.</li>
<li><strong>Concentración:</strong> El juicio se desarrolla en sesiones continuas y sucesivas hasta su conclusión, evitando dilaciones innecesarias, de acuerdo con el <strong>Artículo 331 del Código Procesal Penal</strong>.</li>
<li><strong>Presunción de inocencia:</strong> El imputado es inocente hasta que una sentencia firme demuestre lo contrario. La carga de la prueba recae en el Ministerio Público, conforme al <strong>Artículo 12 de la Constitución de la República</strong> y el <strong>Artículo 1 del Código Procesal Penal</strong>.</li>
</ul>

<h2>Roles de los participantes en el juicio oral</h2>
<p>El <strong>juez o tribunal</strong> dirige la audiencia, resuelve las incidencias, vela por la legalidad y emite la sentencia. Su rol es imparcial. El <strong>Ministerio Público</strong> sostiene la acusación y debe probar los hechos imputados. La <strong>defensa</strong> representa al imputado, presenta pruebas de descargo y argumenta a favor de la absolución. La <strong>víctima</strong> puede constituirse como parte acusadora (querellante) y ofrecer pruebas, buscando reparación.</p>

<h2>Ejemplo práctico de juicio oral en Honduras</h2>
<p>Juan Pérez fue acusado de robo con violencia. La fiscalía presentó un testigo que afirmó haber visto a Juan forcejear con la víctima. Sin embargo, la defensa, mediante contrainterrogatorio, demostró que el testigo se encontraba a gran distancia y en condiciones de poca visibilidad, lo que ponía en duda su identificación. Adicionalmente, la defensa aportó un video de una cámara de seguridad que situaba a Juan en otro lugar al momento del delito. Ante la insuficiencia de pruebas y la aplicación del principio de presunción de inocencia, el tribunal absolvió a Juan.</p>

<h2>Errores comunes sobre el juicio oral en Honduras</h2>
<p>Contrario a la creencia popular, el juicio oral no se basa en revelaciones sorpresivas, sino en la presentación planificada de pruebas conocidas desde la etapa de preparación. El imputado tiene derecho a guardar silencio, y su inacción no puede interpretarse como admisión de culpa. El juez no investiga de oficio; su rol es pasivo, valorando únicamente las pruebas presentadas por las partes.</p>

<h2>Preguntas frecuentes sobre el juicio oral</h2>

<h3>¿Cuánto tiempo puede durar un juicio oral en Honduras?</h3>
<p>No existe un plazo fijo. El <strong>Código Procesal Penal (Decreto 9-99-E)</strong> exige sesiones continuas en los Tribunales de Sentencia de Honduras. La duración varía según la complejidad, desde un día hasta varias semanas.</p>

<h3>¿Es posible apelar una sentencia condenatoria en Honduras?</h3>
<p>Sí, la sentencia puede ser apelada mediante un recurso de Casación o Apelación Especial ante la Corte Suprema de Justicia, fundamentándose en errores de hecho o derecho en la aplicación de la ley.</p>

<h3>¿Qué sucede si no cuento con un abogado para el juicio oral?</h3>
<p>Tiene derecho a un abogado. Si no puede costear uno, el Estado asignará un defensor público, según el <strong>Artículo 82 de la Constitución de la República</strong>. Contar con un abogado penalista experto es crucial.</p>

<h2>Fuente oficial y vigencia</h2>
<p>La normativa procesal principal es el <strong>Código Procesal Penal de Honduras</strong> (Decreto 9-99-E). Los <strong>Artículos 331 a 370</strong> regulan el juicio oral. La <strong>Constitución de la República de Honduras</strong> también establece principios aplicables.</p>

<h2>Preparación para declarar como testigo en un juicio oral</h2>
<p>Si es citado como testigo, declare únicamente lo que sabe de primera mano. Si no sabe o no recuerda algo, indíquelo. La veracidad y naturalidad son valoradas por el tribunal. Si existen documentos que respalden su declaración, preséntelos. Evite memorizar un discurso; la autenticidad es más importante que la precisión ensayada.</p>
<p>Si usted o un familiar enfrenta un juicio oral, contar con un abogado penalista con experiencia en litigación es fundamental. <strong><a href="/solicitar-consulta">Solicite una consulta</a></strong> para evaluar su caso.</p>`;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Juicio Oral en Honduras: Etapas, Plazos y Guía Legal (2026)",
      "about": [
        {
          "@type": "Thing",
          "name": "Tribunal de Sentencia de Honduras"
        },
        {
          "@type": "Thing",
          "name": "Código Procesal Penal de Honduras (Decreto 9-99-E)"
        },
        {
          "@type": "Thing",
          "name": "Ministerio Público de Honduras"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Cuánto tiempo puede durar un juicio oral en Honduras?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No existe un plazo fijo. El Código Procesal Penal (Decreto 9-99-E) exige sesiones continuas en los Tribunales de Sentencia de Honduras. La duración varía según la complejidad, desde un día hasta varias semanas."
          }
        },
        {
          "@type": "Question",
          "name": "¿Es posible apelar una sentencia condenatoria en Honduras?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, la sentencia puede ser apelada mediante un recurso de Casación o Apelación Especial ante la Corte Suprema de Justicia, fundamentándose en errores de hecho o derecho en la aplicación de la ley."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué sucede si no cuento con un abogado para el juicio oral?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tiene derecho a un abogado. Si no puede costear uno, el Estado asignará un defensor público, según el Artículo 82 de la Constitución de la República. Contar con un abogado penalista experto es crucial."
          }
        }
      ]
    },
    {
      "@type": "LegalService",
      "name": "Defensa Penal en Juicios Orales",
      "areaServed": "Honduras"
    }
  ]
};

async function main() {
  await db.update(blogPosts)
    .set({
      body: newBody,
      metaTitle: "Juicio Oral en Honduras: Etapas, Plazos y Guía Legal (2026)",
      metaDescription: "¿Afronta un juicio oral en Honduras? Conozca las etapas, cómo funciona la presentación de pruebas y el rol de un abogado penalista experto."
    })
    .where(eq(blogPosts.id, postId));

  console.log("Post updated successfully");
  process.exit(0);
}

main().catch(console.error);
