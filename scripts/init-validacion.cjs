const fs = require('fs');
const path = require('path');

const delitosPath = path.join(__dirname, '..', 'data', 'delitos.json');
const outputPath = path.join(__dirname, '..', 'data', 'delitos-validacion.json');

const delitos = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));

const validacion = delitos.map((d, i) => ({
  id: `delito-${String(i + 1).padStart(3, '0')}`,
  nombre: d.nombre,
  articulo_actual: d.articulo,
  rama_id: d.rama_id || null,
  estado: 'pendiente',
  articulo_correcto: null,
  pena_minima_meses_actual: d.pena_minima_meses,
  pena_maxima_meses_actual: d.pena_maxima_meses,
  pena_minima_meses_correcta: null,
  pena_maxima_meses_correcta: null,
  tiene_pena_alternativa_actual: d.tiene_pena_alternativa || false,
  pena_alternativa_min_actual: d.pena_alternativa_min || 0,
  pena_alternativa_max_actual: d.pena_alternativa_max || 0,
  fuente: null,
  fuente_verificada: false,
  fecha_validacion: null,
  validador: 'agente',
  notas: null,
}));

fs.writeFileSync(outputPath, JSON.stringify(validacion, null, 2) + '\n', 'utf8');

const counts = {
  pendiente: validacion.filter(v => v.estado === 'pendiente').length,
  validado: validacion.filter(v => v.estado === 'validado').length,
  rechazar: validacion.filter(v => v.estado === 'rechazar').length,
  revisar: validacion.filter(v => v.estado === 'revisar').length,
};

console.log(`Generado ${outputPath}`);
console.log(`Total: ${validacion.length} delitos`);
console.log(`Pendientes: ${counts.pendiente}`);
console.log(`Validados: ${counts.validado}`);
console.log(`A rechazar: ${counts.rechazar}`);
console.log(`A revisar: ${counts.revisar}`);
