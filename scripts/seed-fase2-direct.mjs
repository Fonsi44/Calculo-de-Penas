// Script de seed directo usando @neondatabase/serverless (sin depender de dotenv/drizzle).
// Lee .env manualmente para evitar el lock de OneDrive sobre node_modules.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Leer DATABASE_URL desde .env manualmente.
const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!match) {
  console.error('❌ No se encontró DATABASE_URL en .env');
  process.exit(1);
}
const DATABASE_URL = match[1];
const sql = neon(DATABASE_URL);

console.log('🌱 Seed Fase 2/3/4 — conexión directa a Neon\n');

// --- Limpiar tablas ---------------------------------------------------------
console.log('🧹 Limpiando tablas Fase 2...');
await sql`DELETE FROM agravantes_especificas`;
await sql`DELETE FROM supuestos_penales`;
await sql`DELETE FROM remisiones_normativas`;
console.log('   ✅ Tablas limpias\n');

// --- Insertar remisiones normativas ----------------------------------------
const remisiones = [
  ['370', null, '365', null, 'El juez aplicará las penas del artículo 365 (homicidio simple) para el conductor culpable de homicidio culposo en transporte.', 'Culpa del conductor de vehículo de transporte'],
  ['370', null, '366', null, 'Para lesiones culposas en transporte se aplicarán las penas del artículo 366 con las reducciones por culpa.', 'Lesiones culposas del conductor de transporte'],
  ['371', null, '365', null, 'Para muertes o lesiones por imprudencia en el manejo de vehículos se aplicarán las penas de los artículos 365 y 366.', 'Imprudencia en manejo de vehículos con resultado muerte/lesiones'],
  ['118', null, '112', null, 'El homicidio por imprudencia se castigará con pena inferior en uno o dos grados a la del homicidio simple (Art. 112).', 'Homicidio culposo (sin transporte)'],
  ['119', null, '128', null, 'Cuando el resultado letal sobrepase la intención, se aplicará la pena de las lesiones aumentada hasta en una mitad.', 'Resultado muerte que excede la intención del autor'],
  ['200', null, '213', null, 'El robo sin las circunstancias del Art. 200 se sancionará conforme al hurto (Art. 213).', 'Robo sin violencia ni circunstancias del Art. 200'],
  ['205', null, '240', null, 'Si la extorsión se acompaña de privación de libertad, se aplicará la pena del secuestro (Art. 240).', 'Extorsión con privación de libertad'],
  ['232', null, '213', null, 'La multa por estafa se calculará sobre el valor defraudado aplicando los tramos del hurto (Art. 213).', 'Cálculo de multa por estafa según valor defraudado'],
  ['312', null, '112', null, 'El femicidio se sanciona con prisión de dieciséis a veinte años, sin perjuicio de las agravantes específicas.', 'Muerte de mujer por razones de género'],
  ['363', null, '362', null, 'La violación con agravantes se sanciona aumentando el marco de la violación simple (Art. 362) en la fracción del Art. 363.', 'Violación con agravantes específicas del Art. 363'],
  ['240', '2', '240', '1', 'Las modalidades agravadas del secuestro (numeral 2) parten del marco del secuestro simple (numeral 1).', 'Secuestro en modalidad agravada'],
  ['70', null, '69', null, 'La aplicación de agravantes/atenuantes (Art. 70) se realiza dentro del marco determinado por el Art. 69.', 'Aplicación de circunstancias modificativas'],
  ['69', null, '61', null, 'Para la complicidad (Art. 61) se aplica la pena inferior en uno a tres grados a la del autor.', 'Determinación de pena para cómplice'],
  ['62', null, '69', null, 'La tentativa se castiga con pena inferior en uno o dos grados a la del delito consumado.', 'Determinación de pena por tentativa'],
  ['66', null, '40', null, 'En el concurso real la pena resultante no podrá exceder del máximo del Art. 40.', 'Límite máximo de cumplimiento en concurso real'],
  ['67', null, '40', null, 'En el concurso ideal se impone la pena de la infracción más grave en su mitad superior, sin exceder el Art. 40.', 'Determinación de pena en concurso ideal'],
  ['68', null, '40', null, 'En el delito continuado se impone la pena en su mitad superior, pudiendo elevarse hasta en una tercera parte.', 'Determinación de pena en delito continuado'],
  ['38', null, '61', null, 'La inhabilitación absoluta acompaña a la prisión de más de diez años conforme al Art. 38.', 'Penas accesorias automáticas según duración de prisión'],
];

console.log(`📝 Insertando ${remisiones.length} remisiones normativas...`);
for (const r of remisiones) {
  await sql`INSERT INTO remisiones_normativas (articulo_origen, numeral_origen, articulo_destino, numeral_destino, texto_remision, condicion_aplicacion)
           VALUES (${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}, ${r[4]}, ${r[5]})`;
}
console.log('   ✅ Remisiones normativas insertadas\n');

// --- Supuestos penales por artículo ----------------------------------------
// El campo `articulo` en la BD usa formato "Art. XXX CP".
const supuestosPorArticulo = {
  'Art. 312 CP': [
    { numeral: '1', texto: 'Femicidio simple', min: 192, max: 240, agrav: [
      ['312', '1', 'Por venalidad o premios prometidos', '1/3'],
      ['312', '1', 'Para preparar o facilitar otro delito', '1/3'],
    ]},
    { numeral: '2', texto: 'Femicidio agravado', min: 240, max: 360, agrav: [
      ['312', '2', 'Por crueldad o ensañamiento', '1/3'],
    ]},
  ],
  'Art. 363 CP': [
    { numeral: '1', texto: 'Violación de menor de catorce años', min: 180, max: 240, agrav: [
      ['363', '1', 'Cuando la víctima sea menor de catorce años', '1/3'],
    ]},
    { numeral: '2', texto: 'Violación con sustancias que anulan la voluntad', min: 180, max: 240, agrav: [
      ['363', '2', 'Cuando se utilice arma, drogas o sustancias que anulen la voluntad', '1/3'],
    ]},
    { numeral: '3', texto: 'Violación por dos o más personas', min: 180, max: 240, agrav: [
      ['363', '3', 'Cuando el hecho sea cometido por dos o más personas', '1/3'],
    ]},
  ],
  'Art. 366 CP': [
    { numeral: '1', texto: 'Abuso sexual a menor de catorce años', min: 96, max: 120, agrav: [
      ['366', '1', 'Cuando la víctima sea menor de catorce años', '1/3'],
    ]},
    { numeral: '2', texto: 'Abuso sexual con violencia o engaño', min: 96, max: 120, agrav: [
      ['366', '2', 'Cuando se use violencia, intimidación o engaño', '1/3'],
    ]},
  ],
  'Art. 240 CP': [
    { numeral: '2', texto: 'Secuestro agravado', min: 240, max: 360, agrav: [
      ['240', '2', 'Si el secuestro dura más de quince días', '1/3'],
      ['240', '2', 'Si la víctima sufre lesiones graves', '1/3'],
    ]},
  ],
};

let totalSupuestos = 0;
let totalAgravantes = 0;

for (const [articulo, definiciones] of Object.entries(supuestosPorArticulo)) {
  // Buscar el delito por artículo.
  const candidatos = await sql`SELECT id, nombre FROM delitos WHERE articulo = ${articulo} LIMIT 1`;
  if (candidatos.length === 0) {
    console.log(`   ⚠️  Art. ${articulo}: no encontrado en la BD — omitiendo`);
    continue;
  }
  const delitoId = candidatos[0].id;
  const delitoNombre = candidatos[0].nombre;
  console.log(`🔧 Art. ${articulo} (${delitoNombre}): creando ${definiciones.length} supuesto(s)...`);

  for (const def of definiciones) {
    const [supuesto] = await sql`
      INSERT INTO supuestos_penales (delito_id, numeral, texto_modalidad, pena_min_meses, pena_max_meses, tipo_pena, tiene_agravantes_especificas)
      VALUES (${delitoId}, ${def.numeral}, ${def.texto}, ${def.min}, ${def.max}, 'prision', true)
      RETURNING id
    `;
    totalSupuestos++;

    if (def.agrav && def.agrav.length > 0) {
      for (const a of def.agrav) {
        await sql`
          INSERT INTO agravantes_especificas (supuesto_penal_id, articulo_cp, numeral, texto_agravante, fraccion_aumento, obligatoria)
          VALUES (${supuesto.id}, ${a[0]}, ${a[1]}, ${a[2]}, ${a[3]}, true)
        `;
      }
      totalAgravantes += def.agrav.length;
      console.log(`   ✅ "${def.texto}": ${def.agrav.length} agravante(s)`);
    } else {
      console.log(`   ✅ "${def.texto}": sin agravantes`);
    }
  }
}

// --- Verificación final ----------------------------------------------------
const countRem = await sql`SELECT COUNT(*)::int as c FROM remisiones_normativas`;
const countSup = await sql`SELECT COUNT(*)::int as c FROM supuestos_penales`;
const countAgr = await sql`SELECT COUNT(*)::int as c FROM agravantes_especificas`;

console.log(`\n📊 Resumen final:`);
console.log(`   - Remisiones normativas: ${countRem[0].c}`);
console.log(`   - Supuestos penales: ${countSup[0].c} (esperados: ${totalSupuestos})`);
console.log(`   - Agravantes específicas: ${countAgr[0].c} (esperadas: ${totalAgravantes})`);
console.log('\n🎉 Seed completado exitosamente');
