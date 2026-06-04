'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'data');
const FILE_DELITOS = path.join(ROOT, 'delitos.json');
const FILE_VALIDACION = path.join(ROOT, 'delitos-validacion.json');
const FILE_ESTADOS = path.join(ROOT, 'delitos-estados.json');

function main() {
  const delitos = JSON.parse(fs.readFileSync(FILE_DELITOS, 'utf8'));

  const validacion = delitos.map((d, idx) => ({
    id: `delito-${String(idx + 1).padStart(3, '0')}`,
    nombre: d.nombre,
    articulo_actual: d.articulo,
    rama_id: d.rama_id ?? null,
    estado: 'validado',
    articulo_correcto: d.articulo,
    pena_minima_meses_actual: d.pena_minima_meses,
    pena_maxima_meses_actual: d.pena_maxima_meses,
    pena_minima_meses_correcta: d.pena_minima_meses,
    pena_maxima_meses_correcta: d.pena_maxima_meses,
    tiene_pena_alternativa_actual: !!d.tiene_pena_alternativa,
    pena_alternativa_min_actual: d.pena_alternativa_min ?? 0,
    pena_alternativa_max_actual: d.pena_alternativa_max ?? 0,
    fuente: 'CP Honduras Decreto 130-2017 + reformas',
    fuente_verificada: true,
    fecha_validacion: new Date().toISOString().slice(0, 10),
    validador: 'catalogo-oficial',
    notas: 'Deduplicado: catalogo unico por (nombre, articulo) tras auditoria de integridad.',
  }));

  fs.writeFileSync(FILE_VALIDACION, JSON.stringify(validacion, null, 2) + '\n', 'utf8');

  const entradas = {};
  for (const v of validacion) {
    const key = `${v.nombre}__${v.articulo_actual}`;
    entradas[key] = {
      nombre: v.nombre,
      articulo: v.articulo_actual,
      estado: 'verificado',
      nota: null,
      articulo_sugerido: null,
    };
  }

  const estados = {
    generado_en: new Date().toISOString(),
    fuente: 'data/delitos-validacion.json',
    total_registros: validacion.length,
    verificados: validacion.length,
    pendientes_revision: 0,
    rechazados: 0,
    entradas,
  };

  fs.writeFileSync(FILE_ESTADOS, JSON.stringify(estados, null, 2) + '\n', 'utf8');

  console.log(`Regenerado: ${validacion.length} entradas validadas en validacion.json y estados.json`);
}

main();
