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
  'delito-051': {
    estado: 'revisar',
    articulo_correcto: 'Art. 201 CP',
    pena_minima_meses_correcta: 72,
    pena_maxima_meses_correcta: 144,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 201 CP vigente (Decreto 130-2017) tiene 2 niveles: párr.1 miembro/órgano principal 8-12 años (96-144 meses); párr.2 no principal o deformidad 6-8 años (72-96 meses). Pena en data/delitos.json (72-120 = 6-10 años) NO coincide con ninguno de los 2 niveles: es un promedio. Recomendar separar Lesiones graves en 2 delitos (párr.1 y párr.2).',
  },
  'delito-091': {
    estado: 'revisar',
    articulo_correcto: 'Art. 199 párr. 2 CP',
    pena_minima_meses_correcta: 6,
    pena_maxima_meses_correcta: 12,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 202 CP vigente NO es "lesiones leves", es "lesiones imprudentes". Las lesiones leves reales están en Art. 199 párr. 2 (pena 6 meses a 1 año). Pena en data/delitos.json (6-24 meses) es incorrecta. Recomendar: 1) renombrar este delito a "Lesiones imprudentes" y reubicarlo en Art. 202; 2) crear nuevo delito "Lesiones leves" con Art. 199 párr. 2 y pena 6-12 meses.',
  },
  'delito-092': {
    estado: 'revisar',
    articulo_correcto: 'Art. 202 CP',
    pena_minima_meses_correcta: 1,
    pena_maxima_meses_correcta: 48,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 203 CP vigente NO es "lesiones imprudentes", es "lesiones al feto". Lesiones imprudentes reales están en Art. 202 CP con 3 niveles: 1) remisión Art. 201 párr.1 → 1-4 años prisión; 2) remisión Art. 201 párr.2 → 1-3 años prisión; 3) remisión Art. 199 → arresto domiciliario 6m-1a. Pena accesoria si imprudencia profesional o armas/vehículo: inhabilitación 2-6 años. Pena en data/delitos.json (3-12 meses) NO coincide con ningún nivel. Recomendar separar en 3 delitos según nivel.',
  },
  'delito-093': {
    estado: 'revisar',
    articulo_correcto: 'Art. 201 párr. 1 CP',
    pena_minima_meses_correcta: 96,
    pena_maxima_meses_correcta: 144,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 200 CP vigente NO es "mutilación", es "Tipos agravados de lesiones" (4-6 años si concurren 6 circunstancias específicas: alevosía, ensañamiento, precio, armas, vulnerabilidad, género). La "mutilación" como conducta está subsumida en Art. 201 párr. 1 ("mutila o inutiliza un miembro u órgano principal") con pena 8-12 años (96-144 meses). Pena en data/delitos.json (120-180 = 10-15 años) excede el máximo legal. Recomendar: o bien fundir este delito con delito-296 (pérdida de órgano), o bien renombrar a "Lesiones agravadas Art. 200" con pena 48-72 meses.',
  },
  'delito-248': {
    estado: 'revisar',
    articulo_correcto: 'NO EXISTE en CP vigente',
    pena_minima_meses_correcta: 0,
    pena_maxima_meses_correcta: 0,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 207 CP vigente NO es "contagio venéreo", es "Omisión de los deberes de impedir delitos o de promover su persecución" (pena 6 meses a 1 año, pertenece al Título IV Deber de socorro ciudadano, NO a lesiones). Búsqueda exhaustiva en CP vigente: NO existe ningún artículo sobre contagio de enfermedad venérea/ETS/VIH/sida. La única coincidencia de "infecci" está en Art. 305 (adulteración de agua/alimentos). Pena en data/delitos.json (12-48 meses) es inventada. Recomendar RECHAZAR este delito (no existe tipo penal vigente) o consultarlo con abogado.',
  },
  'delito-295': {
    estado: 'revisar',
    articulo_correcto: 'Art. 201 párr. 2 CP',
    pena_minima_meses_correcta: 72,
    pena_maxima_meses_correcta: 96,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 201 CP párr. 2 incluye expresamente "deformidad" como supuesto: "enfermedad o deformidad no previstas en el párrafo anterior" → pena 6-8 años (72-96 meses). Pérdida de 2+ piezas dentales = deformidad. Pena en data/delitos.json (96-144 = 8-12 años) es la del párr. 1, no del párr. 2. Recomendar corregir pena_minima=72, pena_maxima=96.',
  },
  'delito-296': {
    estado: 'revisar',
    articulo_correcto: 'Art. 201 párr. 1 CP',
    pena_minima_meses_correcta: 96,
    pena_maxima_meses_correcta: 144,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 201 CP párr. 1 incluye expresamente "mutila o inutiliza un miembro u órgano principal" → pena 8-12 años (96-144 meses). Pena en data/delitos.json (120-180 = 10-15 años) excede el máximo legal. Recomendar corregir pena_maxima=144. NOTA: este delito y delito-093 (Mutilar) se solapan; uno debería absorver al otro.',
  },
  'delito-297': {
    estado: 'revisar',
    articulo_correcto: 'Art. 201 párr. 1 CP',
    pena_minima_meses_correcta: 96,
    pena_maxima_meses_correcta: 144,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 200 CP vigente es "Tipos agravados de lesiones", NO trata sobre "pérdida de sentido". Pérdida de sentido (ej: ceguera, sordera) es un supuesto de lesión grave encuadrable en Art. 201 párr. 1 (órgano principal que afecta función relevante para salud/desenvolvimiento) → pena 8-12 años (96-144 meses). Pena en data/delitos.json (60-120 = 5-10 años) NO coincide. Recomendar: cambiar artículo a Art. 201 párr. 1 y corregir pena.',
  },
  'delito-303': {
    estado: 'revisar',
    articulo_correcto: 'NO EXISTE en CP vigente',
    pena_minima_meses_correcta: 0,
    pena_maxima_meses_correcta: 0,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Idéntico a delito-248: Art. 207 CP vigente NO es "contagio de ETS". NO existe tipo penal de contagio venéreo/ETS en el CP Decreto 130-2017. Pena en data/delitos.json (6-24 meses) es inventada. Recomendar RECHAZAR o consultar con abogado.',
  },
  'delito-411': {
    estado: 'revisar',
    articulo_correcto: 'Art. 202 CP (nivel 1)',
    pena_minima_meses_correcta: 12,
    pena_maxima_meses_correcta: 48,
    fuente: 'https://dpej.rae.es/eli/hn/d/2018/01/18/130',
    fuente_verificada: true,
    fecha_validacion: '2026-06-04',
    notas: 'Art. 203 CP vigente NO es "lesiones culposas", es "lesiones al feto". "Lesiones culposas graves" se corresponde con Art. 202 CP nivel 1 (imprudencia grave que causa lesiones del Art. 201 párr. 1) → pena 1-4 años (12-48 meses). Pena en data/delitos.json (6-24 meses) está entre nivel 2 y 3. Recomendar: cambiar artículo a Art. 202 y corregir pena_minima=12, pena_maxima=48.',
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
