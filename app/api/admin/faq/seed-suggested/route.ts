import { db } from '@/lib/db';
import { faqEntries } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { eq, and, sql } from 'drizzle-orm';

const SUGGESTED_FAQS = [
  {
    category: 'derecho-penal-general',
    question: '¿Qué debo hacer si recibo una citación del Ministerio Público?',
    answer: 'Lo primero es no ignorarla. Lea atentamente la citación: indica el motivo, la fecha y la autoridad requirente. No declare sin asistencia letrada. Contacte a un abogado penalista de inmediato para que revise su situación, le acompañe a la diligencia y garantice que se respeten sus derechos. Si no puede localizar a un abogado con tiempo, puede solicitar la designación de un defensor público. Nunca altere, oculte o destruya elementos relacionados con la citación.',
    sortOrder: 8,
    published: true,
  },
  {
    category: 'derecho-penal-general',
    question: '¿Cuál es la diferencia entre un delito grave y un delito menos grave en Honduras?',
    answer: 'Según el Código Penal de Honduras (Decreto 130-2017), la diferencia principal radica en la pena prevista. Los delitos menos graves son aquellos sancionados con penas de prisión de hasta tres años, mientras que los delitos graves conllevan penas superiores a tres años. Esta distinción afecta al tribunal competente, los plazos de prescripción, la procedencia de medidas cautelares y la posibilidad de suspensión condicional de la pena. Un abogado penalista puede analizar la calificación jurídica y determinar la estrategia de defensa más adecuada.',
    sortOrder: 9,
    published: true,
  },
  {
    category: 'bufete-honorarios',
    question: '¿Qué áreas geográficas cubren en Honduras?',
    answer: 'Pineda y Asociados tiene su sede en Nacaome, Valle, y cubre principalmente el sur de Honduras: departamentos de Valle, Choluteca y zonas circunvecinas. Comparecemos ante juzgados y tribunales en toda esta región. Para asuntos en otras ciudades como Tegucigalpa, San Pedro Sula o La Ceiba, podemos coordinar la representación, gestionar trámites administrativos y trabajar con colegas de confianza. Contáctenos para confirmar la cobertura en su localidad específica.',
    sortOrder: 7,
    published: true,
  },
  {
    category: 'bufete-honorarios',
    question: '¿Cuál es la diferencia entre consulta inicial y representación legal?',
    answer: 'La consulta inicial es una reunión confidencial sin costo donde evaluamos su caso y le orientamos sobre sus opciones legales. No implica ningún compromiso. La representación legal comienza cuando usted decide contratar nuestros servicios profesionales, lo cual se formaliza mediante un acuerdo de honorarios por escrito. A partir de ese momento asumimos su defensa o gestión activa ante juzgados, autoridades administrativas o la contraparte, con todas las obligaciones profesionales que ello conlleva.',
    sortOrder: 8,
    published: true,
  },
  {
    category: 'bufete-honorarios',
    question: '¿Qué documentación necesito para iniciar un caso penal?',
    answer: 'Para una primera consulta penal, traiga consigo cualquier documento relacionado con su caso: citaciones, notificaciones judiciales, denuncias, actas de detención, resoluciones o cualquier papel que haya recibido de autoridades. También es útil traer una lista cronológica de los hechos tal como usted los recuerda, y los nombres y datos de contacto de posibles testigos. Si tiene abogado anterior, traiga el expediente si está en su poder. Toda la información que nos proporcione está protegida por el secreto profesional.',
    sortOrder: 9,
    published: true,
  },
];

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);

    // Verificar que los slugs existen y no hay duplicados
    const existingFaqs = await db
      .select({ question: faqEntries.question, category: faqEntries.category })
      .from(faqEntries)
      .where(
        sql`${faqEntries.category} IN ('derecho-penal-general', 'bufete-honorarios')`,
      );

    const existingQuestions = new Set(existingFaqs.map((f) => f.question.trim().toLowerCase()));

    const toInsert = SUGGESTED_FAQS.filter(
      (faq) => !existingQuestions.has(faq.question.trim().toLowerCase()),
    );

    if (toInsert.length === 0) {
      return Response.json({
        message: 'Todas las FAQs sugeridas ya existen. Nada que insertar.',
        inserted: 0,
      });
    }

    await db.insert(faqEntries).values(toInsert);

    // Revalidar caché
    try {
      revalidatePath('/preguntas-frecuentes');
      revalidatePath('/intranet/admin/faq');
    } catch {}

    await logAudit({
      usuarioId: auth.userId,
      accion: 'faq_created',
      recurso: 'faq',
      recursoId: 'seed-suggested',
      metadata: {
        insertedCount: toInsert.length,
        categories: [...new Set(toInsert.map((f) => f.category))],
      },
      request,
    });

    return Response.json({
      message: `${toInsert.length} FAQs añadidas correctamente.`,
      inserted: toInsert.length,
      skipped: SUGGESTED_FAQS.length - toInsert.length,
      added: toInsert.map((f) => ({ category: f.category, question: f.question })),
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
