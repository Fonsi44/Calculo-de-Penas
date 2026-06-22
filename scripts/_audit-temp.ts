import { extraerClaims, verificarClaims, detectarAlucinacionesNuevas, cargarDatosCanonicos } from './blog-verify-fix';
import fs from 'fs';
import path from 'path';

cargarDatosCanonicos();

// Simular el caso real de la 1ª ejecución: la IA amplió el post y fabricó
// una cita sobre el Art. 183. Tomamos el body original e inyectamos la cita
// fabricada para confirmar que la guardia AHORA la detecta.
const dir = 'auditoria-blog';
const backupFile = fs.readdirSync(dir).filter(f => f.startsWith('backup-verify-fix-') && f.endsWith('.json')).sort().reverse()[0];
const backup = JSON.parse(fs.readFileSync(path.join(dir, backupFile), 'utf8'));
const post = backup.find((p: any) => p.slug === 'proceso-consulta-legal-pineda');

// Body original (sin cita fabricada)
const bodyOriginal = post.body;
const discOriginales = verificarClaims(extraerClaims(bodyOriginal));
console.log('=== ORIGINAL (sin cita fabricada) ===');
console.log('Claims:', extraerClaims(bodyOriginal).length);
console.log('Discrepancias originales:', discOriginales.length);

// Body corregido CON la cita fabricada del Art. 183 (caso real 1ª ejecución)
const bodyConAlucinacion = bodyOriginal.replace(
  /<\/p>\s*<h2>/,
  '</p><p>El derecho a la defensa y a la asistencia letrada está reconocido en el Artículo 183 de la Constitución de la República de Honduras, que establece: "Toda persona tiene derecho a la defensa y a ser asistida por un abogado de su confianza."</p><h2>'
);

console.log('');
console.log('=== CORREGIDO CON CITA FABRICADA (simulación 1ª ejecución) ===');
const claimsCorregidos = extraerClaims(bodyConAlucinacion);
console.log('Claims extraídos:', claimsCorregidos.length);
const claimsConst = claimsCorregidos.filter(c => c.tipo === 'articulo_const');
console.log('Claims constitucionales:', claimsConst.length);
for (const c of claimsConst) {
  console.log('  textoOriginal:', c.textoOriginal);
}

const discCorregidas = verificarClaims(claimsCorregidos);
console.log('Discrepancias tras verificarClaims:', discCorregidas.length);
for (const d of discCorregidas) {
  console.log('  [' + d.severidad + ']', d.mensaje.slice(0, 150));
}

const aluc = detectarAlucinacionesNuevas(discOriginales, bodyConAlucinacion);
console.log('');
console.log('=== ALUCINACIONES NUEVAS DETECTADAS ===');
console.log('Total:', aluc.length);
for (const a of aluc) {
  console.log('  [' + a.severidad + ']', a.mensaje.slice(0, 150));
  console.log('    encontrado:', a.valorEncontrado.slice(0, 100));
  console.log('    correcto:', a.valorCorrecto.slice(0, 100));
}

const citaAluc = aluc.find(d => /no coincide con el texto real/i.test(d.mensaje));
console.log('');
console.log('✅ GUARDIA ANTI-ALUCINACIÓN FUNCIONA:', citaAluc ? 'SÍ' : 'NO');
if (citaAluc) {
  console.log('   La cita fabricada sobre el Art. 183 (amparo≠defensa) se detecta como crítica.');
}
