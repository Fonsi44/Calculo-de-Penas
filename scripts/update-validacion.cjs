const fs = require('fs');
const path = require('path');

const path_ = path.join(__dirname, '..', 'data', 'delitos-validacion.json');
const data = JSON.parse(fs.readFileSync(path_, 'utf8'));

const updates = {
  'delito-004': {
    estado: 'revisar',
    articulo_correcto: 'Art. 196 CP',
    pena_minima_meses_correcta: 36,
    pena_maxima_meses_correcta: 120,
    fuente: 'https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 196 CP tiene 3 niveles de pena según el caso: 1) consentido 3-6 años; 2) sin consentimiento y sin violencia 6-8 años; 3) con violencia/intimidación/engaño 8-10 años. Pena accesoria: multa 500-1000 días para profesionales. Modelo de datos actual solo permite 1 rango (3-6 años = caso 1). Recomendar separar en 3 delitos o añadir campo "niveles_pena".',
  },
};

let count = 0;
for (const [id, update] of Object.entries(updates)) {
  const entry = data.find(d => d.id === id);
  if (!entry) {
    console.error(`No se encontró ${id}`);
    continue;
  }
  Object.assign(entry, update);
  count++;
  console.log(`Actualizado ${id} (${entry.nombre}) → ${update.estado}`);
}

fs.writeFileSync(path_, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\n${count} entradas actualizadas`);
console.log(`Archivo: ${path_}`);
