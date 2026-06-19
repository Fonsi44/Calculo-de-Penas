import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
const sql = neon(process.env.DATABASE_URL!);

const expands: Record<string, string> = {
  'mediacion-familiar-cuando-funciona-honduras': '<h3>¿Qué diferencia hay entre mediación y conciliación judicial?</h3><p>La mediación privada se realiza antes del proceso judicial y permite mantener el control del resultado. La conciliación judicial es convocada por el juez dentro del proceso y tiene un carácter más formal. En ambos casos, el objetivo es evitar el juicio.</p>',
  'importar-mercancias-guia-legal-aduanera-honduras': '<h3>Agentes aduaneros: por qué son obligatorios</h3><p>Todo importador debe contratar un agente aduanero autorizado. El agente es responsable de presentar la DUA, calcular los tributos y gestionar el despacho. Sus honorarios suelen ser entre 1% y 3% del valor CIF. Elegir un agente con experiencia en su tipo de mercancía evita retrasos y costos adicionales.</p>',
  'responsabilidad-medica-mala-praxis-honduras': '<h3>Qué hacer inmediatamente después de sospechar una negligencia</h3><p>Solicite copia completa de su expediente clínico por escrito. Conserve todos los medicamentos, facturas y documentos. Busque un segundo médico que evalúe el daño. Contacte a un abogado con experiencia en responsabilidad médica antes de que pasen los primeros meses.</p>',
  'centro-conciliacion-arbitraje-ccic-guia-honduras': '<h3>Ventajas del arbitraje institucional frente al ad hoc</h3><p>El arbitraje institucional a través del CCIC ofrece reglas predeterminadas, supervisión de plazos y designación de árbitros si las partes no se ponen de acuerdo. El ad hoc puede ser más flexible pero también más propenso a estancarse. Para la mayoría de conflictos, el institucional es más seguro.</p>',
  'codigo-aduanero-centroamericano-basico-honduras': '<h3>Relación del CAC con la legislación nacional</h3><p>El CAC es de aplicación preferente sobre las leyes aduaneras nacionales en operaciones de comercio exterior. Honduras mantiene legislación complementaria en sanciones y procedimientos administrativos. Conocer ambas normas es esencial para importar sin riesgos.</p>',
  'zonas-libres-zoli-beneficios-fiscales-honduras': '<h3>Sectores que califican para ZOLI</h3><p>Los sectores más comunes son: maquila textil, manufactura, procesamiento de alimentos, logística, centros de llamadas y servicios tecnológicos. Cada proyecto se evalúa individualmente por la Comisión de Zonas Libres.</p>',
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras': '<h3>Etiquetado obligatorio según RTCA</h3><p>El Reglamento Técnico Centroamericano exige: nombre del producto, lista de ingredientes, contenido neto, fabricante, país de origen, lote, fecha de vencimiento, instrucciones de conservación y tabla nutricional. El incumplimiento del etiquetado es causa frecuente de rechazo del registro.</p>',
  'sanciones-administrativas-como-defenderse-honduras': '<h3>Errores frecuentes al recurrir</h3><p>El error más común es confiar en que una llamada telefónica resuelve la sanción. La única forma válida de impugnar es mediante recurso escrito dentro de 10 días hábiles. Otro error es no adjuntar pruebas documentales al recurso.</p>',
  'importar-desde-china-guia-legal-aduanera-honduras': '<h3>Formas de pago recomendadas</h3><p>Las más seguras son carta de crédito (L/C), que garantiza el pago solo si se cumplen las condiciones, y transferencia bancaria con pago parcial contra documentos. Se desaconseja el pago total anticipado sin relación comercial consolidada.</p>',
  'expropiacion-forzosa-derechos-propietario-honduras': '<h3>Qué hacer al recibir la notificación</h3><p>No firme ningún documento sin consultar a un abogado. Reúna escritura de propiedad, certificación registral, avalúo catastral y documentos que demuestren el valor real. Contacte a un perito para una valoración independiente que sirva para impugnar la oferta.</p>',
  'sar-notifica-fiscalizacion-que-hacer-honduras': '<h3>Derechos del contribuyente durante la fiscalización</h3><p>Usted tiene derecho a: ser notificado formalmente, conocer el alcance de la revisión, presentar documentación, solicitar prórrogas, ser asistido por contador o abogado durante las visitas, e impugnar liquidaciones incorrectas. El SAR no puede fiscalizar sin notificación previa.</p>',
  'calcular-liquidacion-laboral-honduras': '<h3>Plazo para reclamar la liquidación</h3><p>Si el empleador no paga voluntariamente, el trabajador tiene 2 meses desde el despido para reclamar judicialmente. Este plazo es de caducidad: si se deja pasar, se pierde el derecho. No espere. Inicie el reclamo ante la Secretaría de Trabajo o el Juzgado Laboral si pasan más de 15 días sin pago.</p>',
};

async function main() {
  for (const [slug, extra] of Object.entries(expands)) {
    await sql`UPDATE blog_posts SET body = body || ${extra}::text, updated_at = NOW() WHERE slug = ${slug}`;
    console.log('✓ ' + slug);
  }
  console.log('\nExpansión completada: ' + Object.keys(expands).length + ' posts');
}
main().catch((e: any) => console.error(e));
