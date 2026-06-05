const fs = require('fs');
const path = require('path');

const valPath = path.join(__dirname, '..', 'data', 'delitos-validacion.json');
const delitosPath = path.join(__dirname, '..', 'data', 'delitos.json');
const outPath = path.join(__dirname, '..', 'data', 'delitos-estados.json');

const validacion = JSON.parse(fs.readFileSync(valPath, 'utf8'));
const delitos = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));

const counts = { verificados: 0, pendientes_revision: 0, rechazados: 0 };
const entradas = {};

for (let i = 0; i < validacion.length; i++) {
  const v = validacion[i];
  const d = delitos[i] || {};
  const key = `${v.nombre}__${v.articulo_actual}`;
  let estado = 'pendiente_revision';
  if (v.estado === 'validado') {
    estado = 'verificado';
    counts.verificados++;
  } else if (v.estado === 'rechazar') {
    estado = 'rechazado';
    counts.rechazados++;
  } else {
    counts.pendientes_revision++;
  }

  entradas[key] = {
    nombre: v.nombre,
    articulo: v.articulo_actual,
    estado,
    nota: v.notas,
    articulo_sugerido: v.articulo_correcto,
    fecha_validacion: v.fecha_validacion,
    validador: v.validador,
    fuente: v.fuente,
  };
}

const out = {
  generado_en: new Date().toISOString(),
  fuente: 'data/delitos-validacion.json (validación masiva contra CP Honduras Decreto 130-2017)',
  fuente_verificacion: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
  total_registros: validacion.length,
  verificados: counts.verificados,
  pendientes_revision: counts.pendientes_revision,
  rechazados: counts.rechazados,
  entradas,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Estados regenerados:`);
console.log(`  Verificados: ${counts.verificados}`);
console.log(`  Pendientes:  ${counts.pendientes_revision}`);
console.log(`  Rechazados:  ${counts.rechazados}`);
console.log(`Archivo: ${outPath}`);
