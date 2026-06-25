// Script para vincular data/delitos.json con supuestos_penales
// Identifica delitos con múltiples modalidades y crea los supuestos penales correspondientes

import { db } from '../lib/db';
import { delitos, supuestosPenales as supuestosPenalesTable } from '../lib/schema';
import { eq, and } from 'drizzle-orm';
import delitosJson from '../data/delitos.json';

interface DelitoJson {
  id: string;
  nombre: string;
  articulo: string;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tipo_pena_principal: string;
  prision_min_valor?: number;
  prision_max_valor?: number;
  prision_unidad?: string;
  multa_min_valor?: number;
  multa_max_valor?: number;
  multa_unidad?: string;
  reglas_especiales_pena?: string;
  // ... otros campos
}

async function vincularSupuestosPenales() {
  console.log('🔗 Vinculando delitos.json con supuestos_penales...');

  // Agrupar delitos por artículo para detectar múltiples modalidades
  const delitosPorArticulo: Record<string, DelitoJson[]> = {};

  for (const delito of delitosJson as DelitoJson[]) {
    if (!delitosPorArticulo[delito.articulo]) {
      delitosPorArticulo[delito.articulo] = [];
    }
    delitosPorArticulo[delito.articulo].push(delito);
  }

  console.log(`📊 Total de artículos únicos: ${Object.keys(delitosPorArticulo).length}`);

  // Identificar artículos con múltiples modalidades
  const articulosConModalidades = Object.entries(delitosPorArticulo)
    .filter(([_, delitos]) => delitos.length > 1)
    .map(([articulo, delitos]) => ({
      articulo,
      cantidad: delitos.length,
      modalidades: delitos,
    }));

  console.log(`📝 Artículos con múltiples modalidades: ${articulosConModalidades.length}`);

  // Mostrar detalles
  for (const { articulo, cantidad, modalidades } of articulosConModalidades) {
    console.log(`\n  📌 ${articulo} (${cantidad} modalidades):`);
    for (let i = 0; i < modalidades.length; i++) {
      const mod = modalidades[i];
      console.log(`    ${i + 1}. ${mod.pena_minima_meses}-${mod.pena_maxima_meses} meses ${mod.tipo_pena_principal}`);
    }
  }

  // Para cada artículo con múltiples modalidades, crear supuestos_penales
  let totalCreados = 0;

  for (const { articulo, cantidad, modalidades } of articulosConModalidades) {
    console.log(`\n🔧 Procesando ${articulo}...`);

    // Buscar el delito base en la DB (usamos el primero como referencia)
    const delitoBase = await db.query.delitos.findFirst({
      where: eq(delitos.articulo, articulo),
    });

    if (!delitoBase) {
      console.log(`  ⚠️  No se encontró delito base para ${articulo} en la DB`);
      continue;
    }

    console.log(`  📍 Delito base encontrado: ${delitoBase.nombre} (${delitoBase.id})`);

    // Crear un supuesto penal para cada modalidad
    for (let i = 0; i < modalidades.length; i++) {
      const modalidad = modalidades[i];
      const numeral = cantidad > 1 ? String(i + 1) : null;
      const tipoPena = modalidad.tipo_pena_principal === 'privacion_libertad'
        ? (modalidad.pena_maxima_meses >= 480 ? 'perpetuidad' : 'prision')
        : 'multa';

      // Determinar si tiene agravantes específicas
      const tieneAgravantes = ['Art. 312', 'Art. 363', 'Art. 366', 'Art. 240', 'Art. 200']
        .some(agr => articulo.includes(agr));

      const nuevoSupuesto = {
        delitoId: delitoBase.id,
        numeral,
        literal: null,
        inciso: null,
        textoModalidad: `Modalidad ${numeral || 'única'}: ${modalidad.pena_minima_meses}-${modalidad.pena_maxima_meses} meses`,
        penaMinMeses: modalidad.pena_minima_meses,
        penaMaxMeses: modalidad.pena_maxima_meses,
        tipoPena,
        tieneAgravantesEspecificas: tieneAgravantes,
        observaciones: modalidad.reglas_especiales_pena || null,
      };

      try {
        await db.insert(supuestosPenalesTable).values(nuevoSupuesto);
        console.log(`  ✅ Supuesto penal creado: ${numeral || 'única'} (${tipoPena}, ${modalidad.pena_minima_meses}-${modalidad.pena_maxima_meses}m)`);
        totalCreados++;
      } catch (error) {
        console.error(`  ❌ Error creando supuesto penal para ${articulo} modalidad ${numeral || 'única'}:`, error);
      }
    }
  }

  // Para delitos sin modalidades (única penalidad), crear un supuesto penal único
  const delitosSinModalidades = Object.entries(delitosPorArticulo)
    .filter(([_, delitos]) => delitos.length === 1)
    .map(([_, delitos]) => delitos[0]);

  console.log(`\n📝 Delitos con modalidad única: ${delitosSinModalidades.length}`);

  // Crear supuestos penales para muestra (primeros 10)
  const muestra = delitosSinModalidades.slice(0, 10);
  console.log(`🔧 Procesando muestra de ${muestra.length} delitos con modalidad única...`);

  for (const delitoJson of muestra) {
    const delitoDb = await db.query.delitos.findFirst({
      where: eq(delitos.articulo, delitoJson.articulo),
    });

    if (!delitoDb) {
      console.log(`  ⚠️  No se encontró delito base para ${delitoJson.articulo} en la DB`);
      continue;
    }

    const tipoPena = delitoJson.tipo_pena_principal === 'privacion_libertad'
      ? (delitoJson.pena_maxima_meses >= 480 ? 'perpetuidad' : 'prision')
      : 'multa';

    const tieneAgravantes = ['Art. 312', 'Art. 363', 'Art. 366', 'Art. 240', 'Art. 200']
      .some(agr => delitoJson.articulo.includes(agr));

    const nuevoSupuesto = {
      delitoId: delitoDb.id,
      numeral: null,
      literal: null,
      inciso: null,
      textoModalidad: 'Modalidad única',
      penaMinMeses: delitoJson.pena_minima_meses,
      penaMaxMeses: delitoJson.pena_maxima_meses,
      tipoPena,
      tieneAgravantesEspecificas: tieneAgravantes,
      observaciones: delitoJson.reglas_especiales_pena || null,
    };

    try {
      await db.insert(supuestosPenalesTable).values(nuevoSupuesto);
      console.log(`  ✅ Supuesto penal creado: ${delitoJson.articulo} (${tipoPena}, ${delitoJson.pena_minima_meses}-${delitoJson.pena_maxima_meses}m)`);
      totalCreados++;
    } catch (error) {
      console.error(`  ❌ Error creando supuesto penal para ${delitoJson.articulo}:`, error);
    }
  }

  console.log(`\n✅ Vinculación completada. Total supuestos penales creados: ${totalCreados}`);
  console.log(`📊 Quedan ${delitosSinModalidades.length - 10} delitos por procesar (ejecutar script nuevamente para completar)`);
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  vincularSupuestosPenales()
    .then(() => {
      console.log('🎉 Vinculación completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en vinculación:', error);
      process.exit(1);
    });
}

export { vincularSupuestosPenales };
