// Seed Fase 2: Agravantes específicas y remisiones normativas
// Basado en Código Penal Decreto 130-2017 y reformas

import { db } from '../lib/db';
import { agravantesEspecificas, remisionesNormativas } from '../lib/schema';

async function seedFase2() {
  console.log('🌱 Sembrando datos Fase 2...');

  // Agravantes específicas Art. 312 CP (Femicidio agravado)
  const agravantes312 = [
    {
      articuloCp: '312',
      numeral: '1',
      textoAgravante: 'Por venalidad o premios prometidos',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '312',
      numeral: '2',
      textoAgravante: 'Por crueldad o ensañamiento',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '312',
      numeral: '3',
      textoAgravante: 'Para preparar o facilitar otro delito',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
  ];

  // Agravantes específicas Art. 363 CP (Violación agravada)
  const agravantes363 = [
    {
      articuloCp: '363',
      numeral: '1',
      textoAgravante: 'Cuando la víctima sea menor de catorce años',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '363',
      numeral: '2',
      textoAgravante: 'Cuando se utilize arma, drogas o sustancias que anulen la voluntad',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '363',
      numeral: '3',
      textoAgravante: 'Cuando el hecho sea cometido por dos o más personas',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
  ];

  // Agravantes específicas Art. 366 CP (Abuso sexual agravado)
  const agravantes366 = [
    {
      articuloCp: '366',
      numeral: '1',
      textoAgravante: 'Cuando la víctima sea menor de catorce años',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '366',
      numeral: '2',
      textoAgravante: 'Cuando se use violencia, intimidación o engaño',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
  ];

  // Agravantes específicas Art. 240.2 CP (Secuestro agravado - modalidad 2)
  const agravantes240 = [
    {
      articuloCp: '240',
      numeral: '2',
      textoAgravante: 'Si el secuestro dura más de quince días',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '240',
      numeral: '2',
      textoAgravante: 'Si la víctima sufre lesiones graves',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
  ];

  // Agravantes específicas Art. 200 CP (Robo agravado)
  const agravantes200 = [
    {
      articuloCp: '200',
      numeral: '1',
      textoAgravante: 'Cuando se cometa con violencia o intimidación',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '200',
      numeral: '2',
      textoAgravante: 'Cuando intervengan dos o más personas',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
    {
      articuloCp: '200',
      numeral: '3',
      textoAgravante: 'Cuando el culpable fuera funcionario público',
      fraccionAumento: '1/3',
      obligatoria: true,
    },
  ];

  // Combinar todos los agravantes específicos (placeholder - requieren supuesto_penal_id)
  const allAgravantes = [
    ...agravantes312.map(a => ({ ...a })),
    ...agravantes363.map(a => ({ ...a })),
    ...agravantes366.map(a => ({ ...a })),
    ...agravantes240.map(a => ({ ...a })),
    ...agravantes200.map(a => ({ ...a })),
  ];

  // Remisiones normativas Arts. 370-371 CP (Homicidio/lesiones culposos en transporte)
  const remisionesNormativas = [
    {
      articuloOrigen: '370',
      numeralOrigen: null,
      articuloDestino: '365',
      numeralDestino: null,
      textoRemision: 'El juez aplicará las penas establecidas en el artículo 365 (homicidio simple) para el conductor culpable de homicidio culposo en transporte.',
      condicionAplicacion: 'Culpa del conductor de vehículo de transporte',
    },
    {
      articuloOrigen: '370',
      numeralOrigen: null,
      articuloDestino: '366',
      numeralDestino: null,
      textoRemision: 'Para lesiones culposas en transporte, se aplicarán las penas del artículo 366 (abusos sexuales) con las reducciones por culpa establecidas.',
      condicionAplicacion: 'Lesiones culposas del conductor de transporte',
    },
    {
      articuloOrigen: '371',
      numeralOrigen: null,
      articuloDestino: '365',
      numeralDestino: null,
      textoRemision: 'Para muertes o lesiones causadas por imprudencia en el manejo de vehículos, se aplicarán las penas de los artículos 365 y 366 según corresponda.',
      condicionAplicacion: 'Imprudencia en manejo de vehículos con resultado muerte/lesiones',
    },
  ];

  try {
    console.log(`📝 Insertando ${remisionesNormativas.length} remisiones normativas...`);
    await db.insert(remisionesNormativas).values(remisionesNormativas);
    console.log('✅ Remisiones normativas insertadas');

    console.log(`📝 Preparados ${allAgravantes.length} agravantes específicas (requieren supuestos_penales para vincular)`);
    console.log('⚠️  Los agravantes específicos necesitan que se creen primero los supuestos_penales correspondientes');

    console.log('✅ Seed Fase 2 completado');
  } catch (error) {
    console.error('❌ Error ejecutando seed Fase 2:', error);
    throw error;
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  seedFase2()
    .then(() => {
      console.log('🎉 Seed completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en seed:', error);
      process.exit(1);
    });
}

export { seedFase2 };
