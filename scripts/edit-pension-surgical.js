import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let content = fs.readFileSync(path.join(__dirname, 'pension_original.html'), 'utf8');

// Change 1: Refactor the "práctica judicial" H2 to explain proportionality and 50% limit.
content = content.replace(
  /<h2>¿Cuál es la práctica judicial sobre el porcentaje de pensión alimenticia en Honduras\?<\/h2>[\s\S]*?(?=<h2>Factores clave)/,
  `<h2>El Principio de Proporcionalidad y Límites Legales</h2>
<p>En lugar de una tarifa fija, los juzgados de familia aplican el <strong>Principio de Proporcionalidad</strong>. Esto significa que la pensión debe ser justa: suficiente para cubrir las necesidades del alimentario (sustento, habitación, vestido, asistencia médica, formación integral y educación), pero acorde a los ingresos y el nivel de vida del obligado a darla.</p>
<p>Es muy común que exista confusión entre el cálculo de la pensión y el embargo salarial. El Poder Judicial de Honduras aclara que, en caso de incumplimiento, la ley permite el <strong>embargo de hasta un 50% del salario</strong> del obligado para garantizar el pago de alimentos. Sin embargo, este es el límite máximo de retención para ejecución, no una regla fija para calcular la pensión inicial en un juicio.</p>`
);

// Change 2: Remove the "Ejemplo práctico" completely as it gives exact math that looks like advice.
content = content.replace(
  /<h2>Ejemplo práctico de fijación de pensión para 2 hijos en Honduras<\/h2>[\s\S]*?(?=<h2>¿Cómo solicitar la fijación)/,
  ``
);

// Change 3: Update FAQ 2 hijos
content = content.replace(
  /<h3>¿Cuánto se paga de pensión alimenticia por 2 hijos en Honduras\?<\/h3>\s*<p>La práctica judicial hondureña suele situar la pensión entre el 25% y el 35%.*?<\/p>/,
  `<h3>¿Cuánto se paga de pensión alimenticia por 2 hijos en Honduras?</h3>\n<p>No existe un monto ni un porcentaje preestablecido para dos hijos. El juez de familia sumará las necesidades acreditadas de ambos menores (educación, salud, vivienda) y las contrastará con los ingresos comprobados del obligado, fijando un monto proporcional que garantice su subsistencia sin empobrecer al demandado.</p>`
);

// Change 4: Update FAQ 1 hijo
content = content.replace(
  /<h3>¿Cuánto es la pensión alimenticia por hijo en Honduras\?<\/h3>\s*<p>Para un solo hijo, la práctica judicial suele fijar el monto entre el 20% y el 30%.*?<\/p>/,
  `<h3>¿Cuánto es la pensión alimenticia por hijo en Honduras?</h3>\n<p>Al igual que en casos de múltiples hijos, la ley no dicta un porcentaje mínimo oficial (como el 20% o 30%). La cifra exacta dependerá estrictamente de la carga probatoria presentada ante el Juzgado de Letras de Familia sobre los gastos del menor y los ingresos del progenitor.</p>`
);

fs.writeFileSync(path.join(__dirname, 'pension_modified.html'), content);
console.log('pension_modified.html created');
