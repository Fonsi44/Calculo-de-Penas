// Verificación rápida del estado de la BD (tablas Fase 2)
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function checkDbState() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log('🔍 Verificando estado de la BD...\n');

  // Contar delitos
  const delitos = await sql`SELECT COUNT(*)::int as count FROM delitos`;
  console.log(`📊 Delitos: ${delitos[0].count}`);

  // Contar supuestos_penales
  const supuestos = await sql`SELECT COUNT(*)::int as count FROM supuestos_penales`;
  console.log(`📊 Supuestos penales: ${supuestos[0].count}`);

  // Contar agravantes_especificas
  const agravantes = await sql`SELECT COUNT(*)::int as count FROM agravantes_especificas`;
  console.log(`📊 Agravantes específicas: ${agravantes[0].count}`);

  // Contar remisiones_normativas
  const remisiones = await sql`SELECT COUNT(*)::int as count FROM remisiones_normativas`;
  console.log(`📊 Remisiones normativas: ${remisiones[0].count}`);

  // Mostrar algunos delitos de muestra (los 10 de prueba)
  console.log('\n📋 Primeros 10 delitos:');
  const muestra = await sql`SELECT id, nombre, articulo, pena_minima_meses, pena_maxima_meses FROM delitos ORDER BY articulo LIMIT 10`;
  for (const d of muestra) {
    console.log(`   ${d.articulo} - ${d.nombre} (${d.pena_minima_meses}-${d.pena_maxima_meses}m) [${d.id}]`);
  }

  // Si hay supuestos penales, mostrarlos
  if (supuestos[0].count > 0) {
    console.log('\n📋 Supuestos penales existentes:');
    const sp = await sql`
      SELECT sp.id, sp.numeral, sp.texto_modalidad, sp.pena_min_meses, sp.pena_max_meses, d.nombre, d.articulo
      FROM supuestos_penales sp
      JOIN delitos d ON d.id = sp.delito_id
      ORDER BY d.articulo LIMIT 20
    `;
    for (const s of sp) {
      console.log(`   Art.${s.articulo} ${s.nombre} | num ${s.numeral || '-'} | ${s.pena_min_meses}-${s.pena_max_meses}m | ${s.texto_modalidad} [${s.id}]`);
    }
  }

  console.log('\n✅ Verificación completada');
}

checkDbState().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
