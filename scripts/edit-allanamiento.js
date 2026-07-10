import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let content = fs.readFileSync(path.join(__dirname, 'allanamiento_original.html'), 'utf8');

// Change 1: Insert exact answer at the top for Snippet/IA
content = content.replace(
  /<h2>¿Qué es un allanamiento de morada en Honduras\?<\/h2>\s*<p>El allanamiento de morada consiste en el ingreso de autoridades policiales o militares a un domicilio particular con el fin de realizar un registro, capturar a una persona o incautar evidencias\./,
  `<h2>¿A qué hora es legal un allanamiento en Honduras?</h2>
<p>El horario legal establecido para realizar un allanamiento de morada ordinario en Honduras es entre las <strong>6:00 a.m. y las 6:00 p.m.</strong>, según lo dictamina taxativamente el <strong>Artículo 212 del Código Procesal Penal (CPP)</strong> vigente. Fuera de este horario, el domicilio es inviolable y un allanamiento nocturno solo es legal si cuenta con una autorización judicial fundamentada expresamente por razones de urgencia.</p>
<h2>¿Qué es un allanamiento de morada y cuándo es ilegal?</h2>
<p>El allanamiento consiste en el ingreso de autoridades a un domicilio particular para realizar un registro, capturar a una persona o incautar evidencias.`
);

// Change 2: Remove the duplicated horario in the list below to avoid redundancy, but keep the emphasis
content = content.replace(
  /<li><strong>Horario Específico:<\/strong> Los allanamientos ordinarios deben realizarse entre las 6:00 a\.m\. y las 6:00 p\.m\. Las excepciones \(allanamientos nocturnos\) requieren autorización especial y justificada del juez\.<\/li>/,
  `<li><strong>Horario Específico:</strong> Exclusivamente entre las 6:00 a.m. y las 6:00 p.m. (Art. 212 del CPP), salvo orden nocturna justificada por urgencia.</li>`
);

// Change 3: Clarify the Exceptions based on law
content = content.replace(
  /<ul>\s*<li>Cuando se persigue a una persona sorprendida en in fraganti delito que huye y se refugia en una morada\.<\/li>\s*<li>Cuando se escuchen voces de auxilio desde el interior del domicilio que alerten sobre un peligro inminente para la vida o la integridad física de las personas\.<\/li>\s*<li>En casos de incendio, inundación u otros desastres similares\.<\/li>\s*<\/ul>/,
  `<ul>
<li><strong>Persecución in fraganti:</strong> Cuando se persigue a una persona sorprendida en in fraganti delito que huye y se refugia en una morada.</li>
<li><strong>Peligro inminente a la vida:</strong> Cuando se escuchen voces de auxilio desde el interior del domicilio que alerten sobre un peligro para la vida.</li>
<li><strong>Emergencia grave:</strong> En casos de incendio, inundación u otros desastres similares que requieran auxilio inmediato.</li>
<li><strong>Consentimiento expreso:</strong> Cuando el morador consiente voluntariamente el ingreso, lo cual debe quedar debidamente documentado.</li>
</ul>`
);

fs.writeFileSync(path.join(__dirname, 'allanamiento_modified.html'), content);
console.log('allanamiento_modified.html created');
