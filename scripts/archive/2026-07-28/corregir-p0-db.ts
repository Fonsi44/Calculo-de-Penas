import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  const isApply = process.argv.includes('--aplicar');
  console.log(isApply ? '🚀 EJECUTANDO EN MODO APLICAR (MODIFICANDO BASE DE DATOS)' : '🔍 EJECUTANDO EN MODO DRY-RUN (SOLO LECTURA)');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.error('❌ DATABASE_URL no configurada.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // 1. cuando-prescribe-delito-en-honduras (Rango 20 a 30 años)
  const [postPrescribe] = await sql`SELECT id, body FROM blog_posts WHERE slug = 'cuando-prescribe-delito-en-honduras'`;
  if (postPrescribe) {
    const wrong = '<li>Un delito con una pena máxima de 20 a 30 años de prisión prescribirá en <strong>quince años</strong> (el máximo legal).</li>';
    const correct = '<li>Un delito con una pena máxima superior a quince años de prisión prescribirá en <strong>quince años</strong> (el máximo legal).</li>';
    if (postPrescribe.body.includes(wrong)) {
      console.log('✓ Encontrado rango erróneo en "cuando-prescribe-delito-en-honduras"');
      if (isApply) {
        const newBody = postPrescribe.body.replace(wrong, correct);
        await sql`UPDATE blog_posts SET body = ${newBody} WHERE id = ${postPrescribe.id}`;
        console.log('  -> Actualizado correctamente en DB.');
      }
    } else {
      console.log('ℹ No se encontró la cadena errónea en "cuando-prescribe-delito-en-honduras" (¿ya corregida?).');
    }
  }

  // 2. cuando-necesito-abogado-penalista-honduras (Decreto 189-1999)
  const [postPenal] = await sql`SELECT id, body FROM blog_posts WHERE slug = 'cuando-necesito-abogado-penalista-honduras'`;
  if (postPenal) {
    const wrong = '<li><strong>Código Procesal Penal de Honduras (Decreto 189-1999 y sus reformas):</strong> Artículos 2, 4, 85 y siguientes';
    const correct = '<li><strong>Código Procesal Penal de Honduras (Decreto 9-99-E y sus reformas):</strong> Artículos 2, 4, 85 y siguientes';
    if (postPenal.body.includes(wrong)) {
      console.log('✓ Encontrado decreto erróneo en "cuando-necesito-abogado-penalista-honduras"');
      if (isApply) {
        const newBody = postPenal.body.replace(wrong, correct);
        await sql`UPDATE blog_posts SET body = ${newBody} WHERE id = ${postPenal.id}`;
        console.log('  -> Actualizado correctamente en DB.');
      }
    } else {
      console.log('ℹ No se encontró la cadena errónea en "cuando-necesito-abogado-penalista-honduras".');
    }
  }

  // 3. como-preparar-demanda-guia-no-abogados-honduras (Decreto 130-2004, Decreto 77-94)
  const [postDemanda] = await sql`SELECT id, body FROM blog_posts WHERE slug = 'como-preparar-demanda-guia-no-abogados-honduras'`;
  if (postDemanda) {
    const wrong = '<p>Esta guía se fundamenta en la legislación hondureña vigente, incluyendo el Código Procesal Civil (Decreto 130-2004), el Código de Trabajo (Decreto 189 de 1959 y sus reformas) y la Ley de Procedimiento de Familia (Decreto 77-94 y sus reformas).';
    const correct = '<p>Esta guía se fundamenta en la legislación hondureña vigente, incluyendo el Código Procesal Civil (Decreto 211-2006), el Código de Trabajo (Decreto 189-1959 y sus reformas) y el Código de Familia (Decreto 76-84 y sus reformas).';
    if (postDemanda.body.includes(wrong)) {
      console.log('✓ Encontrados decretos erróneos en "como-preparar-demanda-guia-no-abogados-honduras"');
      if (isApply) {
        const newBody = postDemanda.body.replace(wrong, correct);
        await sql`UPDATE blog_posts SET body = ${newBody} WHERE id = ${postDemanda.id}`;
        console.log('  -> Actualizado correctamente en DB.');
      }
    } else {
      console.log('ℹ No se encontró la cadena errónea en "como-preparar-demanda-guia-no-abogados-honduras".');
    }
  }

  // 4. pension-alimenticia-porcentaje-honduras-2026 (Metas fijas de porcentajes)
  const [postPensionPorc] = await sql`SELECT id, title, description, meta_description FROM blog_posts WHERE slug = 'pension-alimenticia-porcentaje-honduras-2026'`;
  if (postPensionPorc) {
    console.log('✓ Encontrado "pension-alimenticia-porcentaje-honduras-2026"');
    if (isApply) {
      const newTitle = 'Pensión Alimenticia en Honduras 2026: Proporcionalidad y Cálculo';
      const newDesc = '¿Cómo se determina la pensión alimenticia por hijo en Honduras en 2026? Conozca cómo se aplica el principio de proporcionalidad, las necesidades del menor y la capacidad de pago.';
      const newMetaDesc = 'Guía sobre la pensión alimenticia en Honduras para 2026: aprenda cómo el juez calcula la cuota según las necesidades del menor y los ingresos del progenitor sin porcentajes fijos.';
      await sql`
        UPDATE blog_posts
        SET title = ${newTitle}, description = ${newDesc}, meta_description = ${newMetaDesc}
        WHERE id = ${postPensionPorc.id}
      `;
      console.log('  -> Título, descripción y meta_descripción actualizados.');
    }
  }

  // 5. pension-alimenticia-honduras-guia-completa (Metas fijas de porcentajes)
  const [postPensionGuia] = await sql`SELECT id, description FROM blog_posts WHERE slug = 'pension-alimenticia-honduras-guia-completa'`;
  if (postPensionGuia) {
    console.log('✓ Encontrado "pension-alimenticia-honduras-guia-completa"');
    if (isApply) {
      const newDesc = 'Guía completa 2026 sobre la pensión alimenticia en Honduras: cómo se determina, documentos necesarios, juzgado de familia y cómo exigir el cumplimiento.';
      await sql`
        UPDATE blog_posts
        SET description = ${newDesc}
        WHERE id = ${postPensionGuia.id}
      `;
      console.log('  -> Descripción actualizada.');
    }
  }

  // 6. Limpieza de firmas de IA o Auditoría en reviewed_by
  console.log('Analizando firmas de revisor en la base de datos...');
  const iaReviewers = await sql`
    SELECT id, slug, reviewed_by, review_status FROM blog_posts
    WHERE reviewed_by ILIKE '%IA%' OR reviewed_by ILIKE '%Auditor%'
  `;
  
  if (iaReviewers.length > 0) {
    console.log(`✓ Encontrados ${iaReviewers.length} posts con firma de revisor IA o automática:`);
    for (const post of iaReviewers) {
      console.log(`  - ${post.slug} (Revisor: "${post.reviewed_by}", Estado: "${post.review_status}")`);
    }
    if (isApply) {
      await sql`
        UPDATE blog_posts
        SET reviewed_by = NULL, review_status = 'published'
        WHERE reviewed_by ILIKE '%IA%' OR reviewed_by ILIKE '%Auditor%'
      `;
      console.log('  -> Firmas de revisores IA eliminadas y estados devueltos a "published" correctamente.');
    }
  } else {
    console.log('ℹ No se encontraron posts con firmas de revisores automáticos o de IA.');
  }

  console.log('¡Proceso completado!');
}

main().catch(err => {
  console.error('Error:', err);
});
