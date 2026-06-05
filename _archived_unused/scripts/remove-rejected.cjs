const fs = require('fs');
const path = require('path');

const delitosPath = path.join(__dirname, '..', 'data', 'delitos.json');
const valPath = path.join(__dirname, '..', 'data', 'delitos-validacion.json');
const estadosPath = path.join(__dirname, '..', 'data', 'delitos-estados.json');

const delitos = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));
const validacion = JSON.parse(fs.readFileSync(valPath, 'utf8'));

// IDs a eliminar (basado en el orden de delitos.json: delito-250, 299, 413)
const idsEliminar = new Set(['delito-250', 'delito-299', ' delito-413'.trim(), 'delito-413']);

const nombresEliminar = new Set(['Duelo', 'Provocación al duelo', 'Provocación directa al duelo']);

const before = { delitos: delitos.length, validacion: validacion.length };

// Filtrar
const delitosNew = delitos.filter((x, i) => {
  const numId = i + 1;
  const id = 'delito-' + numId.toString().padStart(3, '0');
  if (idsEliminar.has(id)) return false;
  if (nombresEliminar.has(x.nombre)) return false;
  return true;
});

const validacionNew = validacion.filter((x, i) => {
  if (idsEliminar.has(x.id)) return false;
  if (nombresEliminar.has(x.nombre)) return false;
  return true;
});

console.log('Eliminados de delitos.json:', before.delitos - delitosNew.length);
console.log('Eliminados de validacion.json:', before.validacion - validacionNew.length);

// Renumerar IDs en validacion.json para mantener secuencia limpia
validacionNew.forEach((x, i) => {
  x.id = 'delito-' + (i + 1).toString().padStart(3, '0');
});

fs.writeFileSync(delitosPath, JSON.stringify(delitosNew, null, 2) + '\n', 'utf8');
fs.writeFileSync(valPath, JSON.stringify(validacionNew, null, 2) + '\n', 'utf8');

console.log('IDs renumerados en validacion.json: 1..' + validacionNew.length);

// Regenerar estados.json
const counts = { verificados: 0, pendientes_revision: 0, rechazados: 0 };
const entradas = {};

for (let i = 0; i < validacionNew.length; i++) {
  const v = validacionNew[i];
  const d = delitosNew[i] || {};
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
  fuente: 'data/delitos-validacion.json (catalogo sin delitos rechazados)',
  fuente_verificacion: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
  total_registros: validacionNew.length,
  verificados: counts.verificados,
  pendientes_revision: counts.pendientes_revision,
  rechazados: counts.rechazados,
  entradas,
};

fs.writeFileSync(estadosPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('Estados regenerados:', counts);
