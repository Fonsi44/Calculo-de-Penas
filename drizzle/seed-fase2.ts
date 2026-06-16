// Seed Fase 2/3/4: Supuestos penales, agravantes específicas y remisiones normativas.
// Basado en Código Penal Decreto 130-2017 y reformas.
//
// Este seed es IDEMPOTENTE: borra primero los registros existentes de las tablas
// Fase 2 (agravantes_especificas → supuestos_penales) y remisiones_normativas,
// luego los reinserta. Los delito_id se resuelven desde la BD buscando por artículo,
// para no asumir UUIDs fijos.

import { db } from '../lib/db';
import {
  agravantesEspecificas,
  remisionesNormativas as remisionesNormativasTable,
  supuestosPenales as supuestosPenalesTable,
  delitos,
} from '../lib/schema';
import { eq } from 'drizzle-orm';

// --- Definición de supuestos penales por artículo del CP -------------------
// Cada entrada mapea un artículo (string) a sus modalidades. El seed busca el
// delito por artículo en la BD y crea los supuestos penales vinculados.
interface SupuestoDef {
  numeral: string | null;
  texto_modalidad: string;
  pena_min_meses: number;
  pena_max_meses: number;
  tipo_pena: 'prision' | 'multa' | 'perpetuidad';
  tiene_agravantes_especificas: boolean;
  observaciones?: string | null;
  // Agravantes específicas vinculadas a este supuesto (definición textual).
  agravantes?: Array<{
    articulo_cp: string;
    numeral: string | null;
    texto_agravante: string;
    fraccion_aumento: string;
    obligatoria: boolean;
  }>;
}

const SUPUESTOS_POR_ARTICULO: Record<string, SupuestoDef[]> = {
  // Art. 312 CP — Femicidio (2 modalidades)
  '312': [
    {
      numeral: '1',
      texto_modalidad: 'Femicidio simple',
      pena_min_meses: 192,
      pena_max_meses: 240,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '312', numeral: '1', texto_agravante: 'Por venalidad o premios prometidos', fraccion_aumento: '1/3', obligatoria: true },
        { articulo_cp: '312', numeral: '1', texto_agravante: 'Para preparar o facilitar otro delito', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
    {
      numeral: '2',
      texto_modalidad: 'Femicidio agravado',
      pena_min_meses: 240,
      pena_max_meses: 360,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '312', numeral: '2', texto_agravante: 'Por crueldad o ensañamiento', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
  ],
  // Art. 363 CP — Violación agravada (3 modalidades)
  '363': [
    {
      numeral: '1',
      texto_modalidad: 'Violación de menor de catorce años',
      pena_min_meses: 180,
      pena_max_meses: 240,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '363', numeral: '1', texto_agravante: 'Cuando la víctima sea menor de catorce años', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
    {
      numeral: '2',
      texto_modalidad: 'Violación con sustancias que anulan la voluntad',
      pena_min_meses: 180,
      pena_max_meses: 240,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '363', numeral: '2', texto_agravante: 'Cuando se utilice arma, drogas o sustancias que anulen la voluntad', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
    {
      numeral: '3',
      texto_modalidad: 'Violación por dos o más personas',
      pena_min_meses: 180,
      pena_max_meses: 240,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '363', numeral: '3', texto_agravante: 'Cuando el hecho sea cometido por dos o más personas', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
  ],
  // Art. 366 CP — Abuso sexual agravado (2 modalidades)
  '366': [
    {
      numeral: '1',
      texto_modalidad: 'Abuso sexual a menor de catorce años',
      pena_min_meses: 96,
      pena_max_meses: 120,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '366', numeral: '1', texto_agravante: 'Cuando la víctima sea menor de catorce años', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
    {
      numeral: '2',
      texto_modalidad: 'Abuso sexual con violencia o engaño',
      pena_min_meses: 96,
      pena_max_meses: 120,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '366', numeral: '2', texto_agravante: 'Cuando se use violencia, intimidación o engaño', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
  ],
  // Art. 240 CP — Secuestro (modalidad agravada, numeral 2)
  '240': [
    {
      numeral: '2',
      texto_modalidad: 'Secuestro agravado',
      pena_min_meses: 240,
      pena_max_meses: 360,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '240', numeral: '2', texto_agravante: 'Si el secuestro dura más de quince días', fraccion_aumento: '1/3', obligatoria: true },
        { articulo_cp: '240', numeral: '2', texto_agravante: 'Si la víctima sufre lesiones graves', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
  ],
  // Art. 200 CP — Robo agravado (3 modalidades)
  '200': [
    {
      numeral: '1',
      texto_modalidad: 'Robo con violencia o intimidación',
      pena_min_meses: 72,
      pena_max_meses: 96,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '200', numeral: '1', texto_agravante: 'Cuando se cometa con violencia o intimidación', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
    {
      numeral: '2',
      texto_modalidad: 'Robo por dos o más personas',
      pena_min_meses: 72,
      pena_max_meses: 96,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '200', numeral: '2', texto_agravante: 'Cuando intervengan dos o más personas', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
    {
      numeral: '3',
      texto_modalidad: 'Robo por funcionario público',
      pena_min_meses: 72,
      pena_max_meses: 96,
      tipo_pena: 'prision',
      tiene_agravantes_especificas: true,
      agravantes: [
        { articulo_cp: '200', numeral: '3', texto_agravante: 'Cuando el culpable fuera funcionario público', fraccion_aumento: '1/3', obligatoria: true },
      ],
    },
  ],
};

// --- Remisiones normativas -------------------------------------------------
const REMISIONES_NORMATIVAS = [
  {
    articulo_origen: '370',
    numeral_origen: null,
    articulo_destino: '365',
    numeral_destino: null,
    texto_remision: 'El juez aplicará las penas del artículo 365 (homicidio simple) para el conductor culpable de homicidio culposo en transporte.',
    condicion_aplicacion: 'Culpa del conductor de vehículo de transporte',
  },
  {
    articulo_origen: '370',
    numeral_origen: null,
    articulo_destino: '366',
    numeral_destino: null,
    texto_remision: 'Para lesiones culposas en transporte se aplicarán las penas del artículo 366 con las reducciones por culpa.',
    condicion_aplicacion: 'Lesiones culposas del conductor de transporte',
  },
  {
    articulo_origen: '371',
    numeral_origen: null,
    articulo_destino: '365',
    numeral_destino: null,
    texto_remision: 'Para muertes o lesiones por imprudencia en el manejo de vehículos se aplicarán las penas de los artículos 365 y 366.',
    condicion_aplicacion: 'Imprudencia en manejo de vehículos con resultado muerte/lesiones',
  },
  {
    articulo_origen: '118',
    numeral_origen: null,
    articulo_destino: '112',
    numeral_destino: null,
    texto_remision: 'El homicidio por imprudencia se castigará con pena inferior en uno o dos grados a la del homicidio simple (Art. 112).',
    condicion_aplicacion: 'Homicidio culposo (sin transporte)',
  },
  {
    articulo_origen: '119',
    numeral_origen: null,
    articulo_destino: '128',
    numeral_destino: null,
    texto_remision: 'Cuando el resultado letal sobrepase la intención, se aplicará la pena de las lesiones aumentada hasta en una mitad.',
    condicion_aplicacion: 'Resultado muerte que excede la intención del autor',
  },
  {
    articulo_origen: '200',
    numeral_origen: null,
    articulo_destino: '213',
    numeral_destino: null,
    texto_remision: 'El robo sin las circunstancias del Art. 200 se sancionará conforme al hurto (Art. 213).',
    condicion_aplicacion: 'Robo sin violencia ni circunstancias del Art. 200',
  },
  {
    articulo_origen: '205',
    numeral_origen: null,
    articulo_destino: '240',
    numeral_destino: null,
    texto_remision: 'Si la extorsión se acompaña de privación de libertad, se aplicará la pena del secuestro (Art. 240).',
    condicion_aplicacion: 'Extorsión con privación de libertad',
  },
  {
    articulo_origen: '232',
    numeral_origen: null,
    articulo_destino: '213',
    numeral_destino: null,
    texto_remision: 'La multa por estafa se calculará sobre el valor defraudado aplicando los tramos del hurto (Art. 213).',
    condicion_aplicacion: 'Cálculo de multa por estafa según valor defraudado',
  },
  {
    articulo_origen: '312',
    numeral_origen: null,
    articulo_destino: '112',
    numeral_destino: null,
    texto_remision: 'El femicidio se sanciona con prisión de dieciséis a veinte años, sin perjuicio de las agravantes específicas.',
    condicion_aplicacion: 'Muerte de mujer por razones de género',
  },
  {
    articulo_origen: '363',
    numeral_origen: null,
    articulo_destino: '362',
    numeral_destino: null,
    texto_remision: 'La violación con agravantes se sanciona aumentando el marco de la violación simple (Art. 362) en la fracción del Art. 363.',
    condicion_aplicacion: 'Violación con agravantes específicas del Art. 363',
  },
  {
    articulo_origen: '240',
    numeral_origen: '2',
    articulo_destino: '240',
    numeral_destino: '1',
    texto_remision: 'Las modalidades agravadas del secuestro (numeral 2) parten del marco del secuestro simple (numeral 1).',
    condicion_aplicacion: 'Secuestro en modalidad agravada',
  },
  {
    articulo_origen: '70',
    numeral_origen: null,
    articulo_destino: '69',
    numeral_destino: null,
    texto_remision: 'La aplicación de agravantes/atenuantes (Art. 70) se realiza dentro del marco determinado por el Art. 69.',
    condicion_aplicacion: 'Aplicación de circunstancias modificativas',
  },
  {
    articulo_origen: '69',
    numeral_origen: null,
    articulo_destino: '61',
    numeral_destino: null,
    texto_remision: 'Para la complicidad (Art. 61) se aplica la pena inferior en uno a tres grados a la del autor.',
    condicion_aplicacion: 'Determinación de pena para cómplice',
  },
  {
    articulo_origen: '62',
    numeral_origen: null,
    articulo_destino: '69',
    numeral_destino: null,
    texto_remision: 'La tentativa se castiga con pena inferior en uno o dos grados a la del delito consumado.',
    condicion_aplicacion: 'Determinación de pena por tentativa',
  },
  {
    articulo_origen: '66',
    numeral_origen: null,
    articulo_destino: '40',
    numeral_destino: null,
    texto_remision: 'En el concurso real la pena resultante no podrá exceder del máximo del Art. 40.',
    condicion_aplicacion: 'Límite máximo de cumplimiento en concurso real',
  },
  {
    articulo_origen: '67',
    numeral_origen: null,
    articulo_destino: '40',
    numeral_destino: null,
    texto_remision: 'En el concurso ideal se impone la pena de la infracción más grave en su mitad superior, sin exceder el Art. 40.',
    condicion_aplicacion: 'Determinación de pena en concurso ideal',
  },
  {
    articulo_origen: '68',
    numeral_origen: null,
    articulo_destino: '40',
    numeral_destino: null,
    texto_remision: 'En el delito continuado se impone la pena en su mitad superior, pudiendo elevarse hasta en una tercera parte.',
    condicion_aplicacion: 'Determinación de pena en delito continuado',
  },
  {
    articulo_origen: '38',
    numeral_origen: null,
    articulo_destino: '61',
    numeral_destino: null,
    texto_remision: 'La inhabilitación absoluta acompaña a la prisión de más de diez años conforme al Art. 38.',
    condicion_aplicacion: 'Penas accesorias automáticas según duración de prisión',
  },
];

async function seedFase2() {
  console.log('🌱 Sembrando datos Fase 2/3/4 (idempotente)...\n');

  // 1. Limpiar tablas Fase 2 (orden: agravantes → supuestos → remisiones).
  console.log('🧹 Limpiando tablas Fase 2...');
  await db.delete(agravantesEspecificas);
  await db.delete(supuestosPenalesTable);
  await db.delete(remisionesNormativasTable);
  console.log('   ✅ Tablas limpias\n');

  // 2. Insertar remisiones normativas (no dependen de delitos).
  console.log(`📝 Insertando ${REMISIONES_NORMATIVAS.length} remisiones normativas...`);
  await db.insert(remisionesNormativasTable).values(
    REMISIONES_NORMATIVAS.map(r => ({
      articuloOrigen: r.articulo_origen,
      numeralOrigen: r.numeral_origen,
      articuloDestino: r.articulo_destino,
      numeralDestino: r.numeral_destino,
      textoRemision: r.texto_remision,
      condicionAplicacion: r.condicion_aplicacion,
    })),
  );
  console.log('   ✅ Remisiones normativas insertadas\n');

  // 3. Resolver supuestos penales: buscar cada delito por artículo en la BD.
  let totalSupuestos = 0;
  let totalAgravantes = 0;

  for (const [articulo, definiciones] of Object.entries(SUPUESTOS_POR_ARTICULO)) {
    // Buscar el delito por artículo (puede haber varias variantes; tomamos la primera).
    const candidatos = await db.select().from(delitos).where(eq(delitos.articulo, articulo));
    if (candidatos.length === 0) {
      console.log(`   ⚠️  Art. ${articulo}: no encontrado en la BD — omitiendo`);
      continue;
    }
    const delitoDb = candidatos[0];
    console.log(`🔧 Art. ${articulo} (${delitoDb.nombre}): creando ${definiciones.length} supuesto(s)...`);

    for (const def of definiciones) {
      const [supuesto] = await db.insert(supuestosPenalesTable).values({
        delitoId: delitoDb.id,
        numeral: def.numeral,
        literal: null,
        inciso: null,
        textoModalidad: def.texto_modalidad,
        penaMinMeses: def.pena_min_meses,
        penaMaxMeses: def.pena_max_meses,
        tipoPena: def.tipo_pena,
        tieneAgravantesEspecificas: def.tiene_agravantes_especificas,
        observaciones: def.observaciones ?? null,
      }).returning();
      totalSupuestos++;

      if (def.agravantes && def.agravantes.length > 0) {
        await db.insert(agravantesEspecificas).values(
          def.agravantes.map(a => ({
            supuestoPenalId: supuesto.id,
            articuloCp: a.articulo_cp,
            numeral: a.numeral,
            textoAgravante: a.texto_agravante,
            fraccionAumento: a.fraccion_aumento,
            obligatoria: a.obligatoria,
          })),
        );
        totalAgravantes += def.agravantes.length;
        console.log(`   ✅ Supuesto "${def.texto_modalidad}": ${def.agravantes.length} agravante(s)`);
      } else {
        console.log(`   ✅ Supuesto "${def.texto_modalidad}": sin agravantes`);
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   - Remisiones normativas: ${REMISIONES_NORMATIVAS.length}`);
  console.log(`   - Supuestos penales: ${totalSupuestos}`);
  console.log(`   - Agravantes específicas: ${totalAgravantes}`);
  console.log('\n✅ Seed Fase 2/3/4 completado');
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  seedFase2()
    .then(() => {
      console.log('\n🎉 Seed completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en seed:', error);
      process.exit(1);
    });
}

export { seedFase2 };
