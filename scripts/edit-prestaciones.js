import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let content = fs.readFileSync(path.join(__dirname, 'prestaciones_original.html'), 'utf8');

// Change 1: Clarify Derechos Adquiridos vs Indemnizaciones (Visual structure)
content = content.replace(
  /<h2>¿Cómo se calcula la cesantía en Honduras\?<\/h2>/,
  `<h2>1. Derechos Adquiridos (Se pagan por despido o renuncia)</h2>
<p>Los derechos adquiridos (Aguinaldo, Catorceavo y Vacaciones) son inalienables. Se pagan siempre al terminar la relación laboral, sin importar si el trabajador renunció o fue despedido con causa justificada.</p>
<h2>2. Indemnizaciones (Se pagan por despido injustificado)</h2>
<p>La indemnización principal es la <strong>Cesantía</strong> y el pago del <strong>Preaviso</strong>, los cuales proceden cuando el patrono despide al trabajador sin justificar legalmente la causa.</p>
<h2>¿Cómo se calcula la cesantía en Honduras?</h2>`
);

// Change 2: Add strong disclaimer to the practical example
content = content.replace(
  /<h2>Ejemplo práctico de liquidación de prestaciones<\/h2>\s*<p>María ha trabajado durante 5 años continuos con un salario mensual fijo de <strong>L10,000<\/strong>\./,
  `<h2>Ejemplo orientativo de liquidación de prestaciones</h2>
<div class="bg-amber-50 p-4 border-l-4 border-amber-500 my-4 text-amber-900 rounded-r-lg">
  <strong>Aviso Legal Importante:</strong> El siguiente ejemplo es estrictamente orientativo y didáctico. Todo cálculo real de prestaciones varía sustancialmente por factores como salario real promedio, comisiones, horas extras, bonos, forma de terminación del contrato y criterios administrativos. <strong>Este ejemplo no sustituye el cálculo oficial de la Secretaría de Trabajo ni la asesoría de un abogado.</strong>
</div>
<p>María ha trabajado durante 5 años continuos con un salario mensual fijo de <strong>L10,000</strong>.`
);

// Change 3: Fix the prescription time (60 days vs 1 year)
content = content.replace(
  /<p>El plazo de prescripción para reclamar las prestaciones laborales en Honduras es de <strong>un año<\/strong>, contado a partir de la fecha de terminación del contrato de trabajo, según lo establece el Artículo 42 del Código del Trabajo\./,
  `<p>Es vital no dejar pasar el tiempo. Según el Código de Trabajo de Honduras, las acciones para reclamar por <strong>despido injustificado</strong> (para exigir indemnizaciones o reintegro) prescriben a los <strong>60 días hábiles</strong> desde la separación. Otros derechos genéricos pueden tener el plazo de un año, pero para proteger la totalidad de la liquidación, se debe citar al patrono ante la Secretaría de Trabajo antes de los dos meses.`
);

fs.writeFileSync(path.join(__dirname, 'prestaciones_modified.html'), content);
console.log('prestaciones_modified.html created');
