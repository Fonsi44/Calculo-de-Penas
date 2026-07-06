import { db } from '../../lib/db';
import { blogPosts } from '../../lib/schema';
import { eq } from 'drizzle-orm';

const postId = 'ad19fe36-743c-4c7a-97d6-e50136c01514';

const newBody = `<p>El registro de medicamentos en Honduras es un proceso esencial regulado por la Agencia de Regulación Sanitaria (ARSA), entidad creada por mandato presidencial mediante Decreto PCM-032-2017. Su objetivo es garantizar que los medicamentos comercializados en el país cumplan con los estándares de seguridad, eficacia y calidad. Ningún producto farmacéutico puede ser comercializado sin un registro sanitario vigente.</p>

<h2>¿Cuál es el marco legal para el registro de medicamentos en Honduras?</h2>
<p>La normativa principal que rige el registro de medicamentos en Honduras es el <strong>Código de Salud</strong> y el <strong>Decreto Ejecutivo PCM-032-2017</strong>. Adicionalmente, se aplican los Reglamentos Técnicos Centroamericanos (RTCA) relacionados con medicamentos. La ARSA emite disposiciones técnicas y acuerdos ministeriales que actualizan el Reglamento para el Control Sanitario de Productos Farmacéuticos y Otros Productos del Ramo de Interés Sanitario.</p>

<h2>¿Qué requisitos técnicos exige la ARSA para el registro de un medicamento?</h2>
<p>La ARSA requiere un expediente técnico completo para evaluar las solicitudes de registro sanitario. Los documentos clave incluyen:</p>
<ul>
<li><strong>Formulario oficial de solicitud</strong>: Debe estar debidamente completado con los datos del producto, fabricante y representante legal en Honduras, y firmado por el regente farmacéutico colegiado responsable.</li>
<li><strong>Certificado de producto farmacéutico tipo OMS</strong>: Emitido por la autoridad sanitaria del país de origen para medicamentos importados, con una vigencia no mayor a 2 años al momento de la presentación.</li>
<li><strong>Certificado de Buenas Prácticas de Manufactura (BPM)</strong>: Vigente de la planta fabricante. La ARSA puede requerir inspección por autoridades reconocidas o realizarla directamente.</li>
<li><strong>Estudios de estabilidad</strong>: Adaptados a la zona climática IV (cálido y húmedo de Honduras) para demostrar la calidad durante toda la vida útil del producto.</li>
<li><strong>Comprobante de pago (TGR-1)</strong>: Recibo oficial del pago de los aranceles correspondientes.</li>
<li><strong>Acreditación del Regente</strong>: Constancia de estar inscrito y activo en el Colegio Químico Farmacéutico de Honduras.</li>
</ul>

<p><strong>¿Busca simplificar este trámite? <a href="/contacto">Contrate nuestro servicio de regencia farmacéutica y asesoría legal en Honduras</a>.</strong></p>

<h2>¿Cuáles son las categorías de productos y vías de registro?</h2>
<p>La ARSA clasifica los productos en medicamentos de síntesis química, biológicos, fitoterapéuticos y homeopáticos, cada uno con requisitos específicos. Los medicamentos genéricos deben demostrar bioequivalencia con el producto de referencia.</p>
<p>Para productos biológicos, se exigen estudios de comparabilidad y, en algunos casos, ensayos clínicos, además de un plan de farmacovigilancia. Existen vías aceleradas de evaluación para medicamentos huérfanos o de interés sanitario excepcional.</p>

<h2>¿Cuál es el proceso y costo estimado para registrar un medicamento importado?</h2>
<p>El proceso de registro de un medicamento importado implica la preparación de un expediente completo, presentación ante la ARSA, y una evaluación que puede durar hasta 60 días hábiles, con posibilidad de solicitar aclaraciones. El costo total puede ascender a aproximadamente <strong>L. 45,000</strong>, incluyendo tasas de la ARSA y honorarios profesionales.</p>
<p>El tiempo total del trámite puede variar entre 4 y 8 meses. Las tasas de recuperación por servicios se establecen en acuerdos ministeriales oficiales.</p>

<h2>¿Qué errores comunes pueden retrasar el registro sanitario?</h2>
<p>Los errores frecuentes que causan demoras incluyen:</p>
<ul>
<li>Presentar estudios de estabilidad no acordes a la zona climática IV.</li>
<li>Documentación incompleta o sin la legalización/apostilla requerida para documentos extranjeros.</li>
<li>Etiquetado que no cumple con la normativa hondureña (idioma español, información completa).</li>
<li>Ausencia de un regente farmacéutico del Colegio Químico Farmacéutico de Honduras.</li>
<li>No adjuntar el comprobante de pago TGR-1 de las tasas de registro.</li>
</ul>

<h2>¿Cuánto tiempo dura el registro de un medicamento en Honduras?</h2>
<p>El registro sanitario otorgado por la ARSA tiene una vigencia de <strong>5 años</strong> y es renovable. La solicitud de renovación debe presentarse diez días hábiles antes de su vencimiento.</p>

<h2>¿Se puede comercializar un medicamento mientras la solicitud está en trámite?</h2>
<p>No. La comercialización, distribución o publicidad de un medicamento solo está permitida una vez que la ARSA haya emitido el registro sanitario correspondiente. Realizar actividades previas constituye una infracción sancionable.</p>

<h2>¿Es posible transferir el registro sanitario a otra empresa?</h2>
<p>Sí, el registro sanitario puede ser transferido a otro titular mediante un procedimiento de cesión autorizado previamente por la ARSA. El nuevo titular debe cumplir con los mismos requisitos y responsabilidades.</p>`;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Registro de Medicamentos en Honduras: Guía ARSA Paso a Paso",
      "about": [
        {
          "@type": "Thing",
          "name": "Agencia de Regulación Sanitaria (ARSA)"
        },
        {
          "@type": "Thing",
          "name": "Decreto Ejecutivo PCM-032-2017"
        },
        {
          "@type": "Thing",
          "name": "Colegio Químico Farmacéutico de Honduras"
        }
      ]
    },
    {
      "@type": "GovernmentService",
      "name": "Registro Sanitario de Medicamentos",
      "provider": {
        "@type": "GovernmentOrganization",
        "name": "Agencia de Regulación Sanitaria (ARSA)",
        "areaServed": "Honduras"
      }
    },
    {
      "@type": "LegalService",
      "name": "Regencia Farmacéutica y Trámites ante ARSA",
      "areaServed": "Honduras"
    }
  ]
};

async function main() {
  await db.update(blogPosts)
    .set({
      title: "Registro de medicamentos en Honduras: Guía completa ARSA",
      body: newBody,
      metaTitle: "Registro de Medicamentos en Honduras: Guía ARSA Paso a Paso",
      metaDescription: "Descubra los requisitos técnicos, costos y plazos reales para obtener un registro sanitario ante ARSA en Honduras. Asesoría legal experta."
    })
    .where(eq(blogPosts.id, postId));
  console.log("Updated ID ad19fe36-743c-4c7a-97d6-e50136c01514");
  process.exit(0);
}

main().catch(console.error);
