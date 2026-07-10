import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let content = fs.readFileSync(path.join(__dirname, 'prescripcion_original.html'), 'utf8');

// Change 1: Fix Civil 5 years to 10 years
content = content.replace(
  /Las acciones personales, como las derivadas de contratos de prestación de servicios \(honorarios profesionales\) o compraventas no registradas, suelen prescribir en <strong>cinco \(5\) años<\/strong>\./,
  `Las acciones personales que no tengan un término especial prescrito por la ley prescriben en <strong>diez (10) años</strong>, de acuerdo con las disposiciones generales del Código Civil hondureño.`
);

// Change 2: Clarify Bank debts (tarjetas de crédito)
content = content.replace(
  /En ausencia de interrupción, el plazo general de <strong>cinco \(5\) años<\/strong> para las acciones personales es comúnmente aplicado\./,
  `Si la deuda está amparada por un pagaré (título valor mercantil), la acción ejecutiva suele prescribir a los <strong>tres (3) años</strong>. Sin embargo, si esa vía caduca, las instituciones financieras pueden recurrir a la vía ordinaria civil, apelando al plazo general de <strong>diez (10) años</strong>.`
);

// Change 3: Update Case Study to 10 years
content = content.replace(
  /y el plazo de prescripción aplicable es de <strong>cinco \(5\) años<\/strong>, la deuda habría prescrito en enero de 2023\./,
  `y el plazo aplicable fuera la acción personal ordinaria de <strong>diez (10) años</strong>, la deuda prescribiría hasta enero de 2028.`
);

// Change 4: Update FAQ Civil 5 years to 10 years
content = content.replace(
  /Las acciones personales, como las deudas por servicios profesionales, prescriben generalmente en <strong>cinco \(5\) años<\/strong>\./,
  `Las acciones personales sin término especial prescriben en <strong>diez (10) años</strong>.`
);

// Change 5: Warning about call centers (Interrupción)
content = content.replace(
  /<li><strong>Ignorar el efecto de un pago parcial:<\/strong> Realizar un pago parcial sobre una deuda antigua interrumpe la prescripción y reinicia el plazo, por lo que debe hacerse con asesoría legal\.<\/li>/,
  `<li><strong>Ignorar el efecto de un pago parcial (gestión de cobros):</strong> Muchas agencias de cobranza extrajudicial solicitan "abonos simbólicos" para detener llamadas. Legalmente, cualquier pago parcial o firma de arreglo constituye un reconocimiento de la deuda que interrumpe la prescripción, reiniciando el contador a cero. Es crucial informarse legalmente antes de firmar o pagar si se cree que la deuda es muy antigua.</li>`
);

fs.writeFileSync(path.join(__dirname, 'prescripcion_modified.html'), content);
console.log('prescripcion_modified.html created');
