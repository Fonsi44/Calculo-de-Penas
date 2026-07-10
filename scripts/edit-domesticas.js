import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let content = fs.readFileSync(path.join(__dirname, 'domesticas_original.html'), 'utf8');

// Change 1: Remove alarmist tone in intro
content = content.replace(
  /<p>La relación laboral de las empleadas domésticas en Honduras se rige por los <strong>Artículos 114 al 120 del Código de Trabajo<\/strong>\. Contratar personal doméstico sin cumplir la normativa vigente puede acarrear sanciones económicas significativas, incluyendo multas y el pago de indemnizaciones por despido injustificado\.<\/p>/,
  `<p>La relación laboral de las empleadas domésticas en Honduras se rige por los <strong>Artículos 114 al 120 del Código de Trabajo</strong>. Formalizar esta relación laboral mediante un contrato claro beneficia a ambas partes: garantiza los derechos ineludibles de la trabajadora y brinda seguridad jurídica al empleador (jefe de hogar) frente a eventuales reclamos por liquidaciones o finiquitos.</p>`
);

// Change 2: Update IHSS section to be accurate "cuando corresponda"
content = content.replace(
  /<p>Los empleadores de personal doméstico deben afiliar a sus empleadas al <strong>Instituto Hondureño de Seguridad Social \(IHSS\)<\/strong> y al <strong>Régimen de Aportaciones Privadas \(RAP\)<\/strong>, cubriendo las cuotas patronales correspondientes\. /,
  `<p>Los empleadores deben afiliar a las empleadas domésticas al <strong>Instituto Hondureño de Seguridad Social (IHSS)</strong>, cubriendo las cuotas patronales correspondientes, en aquellas ciudades donde exista cobertura obligatoria aplicable a este sector. `
);

// Change 3: Remove alarmist tone in example
content = content.replace(
  /El empleador también enfrentará multas por el incumplimiento de la afiliación al IHSS, demostrando los altos costos de no adherirse a la ley\./,
  `Contar con la documentación en regla (contrato, recibos de pago y afiliaciones) es la mejor prevención contra reclamos desproporcionados.`
);

// Change 4: Add proper CTA at the end replacing the last paragraph
content = content.replace(
  /<p>Un litigio laboral mal gestionado puede resultar costoso\. La inversión en el cumplimiento legal es mínima comparada con el riesgo de una demanda\.<\/p>/,
  `<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">Asesoría Laboral para Hogares y Empleadores</h3>
  <p class="mb-4 text-text-muted">Redactamos contratos domésticos legales, calculamos liquidaciones exactas y elaboramos finiquitos seguros para prevenir conflictos futuros.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="derecho-laboral" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Asesoría Laboral Patronal</a>
</div>`
);

fs.writeFileSync(path.join(__dirname, 'domesticas_modified.html'), content);
console.log('domesticas_modified.html created');
