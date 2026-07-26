/**
 * Fase 3C — Aplicar correcciones a los 4 artículos bloqueados.
 *
 * Los 4 slugs bloqueados de Fase 3B:
 *   - abogado-penalista-choluteca                  (claim comercial "6-12 meses")
 *   - abogado-penalista-sur-honduras               (claim comercial "facilita defensa")
 *   - cuando-necesito-abogado-penalista-honduras   (claim comercial "es crucial")
 *   - diferencia-denuncia-querella-acusacion-honduras (claims CPP verificables)
 *
 * Criterios (enunciado Fase 3C §4):
 *   - diferencia-denuncia-querella: verificar claims contra CPP Arts. 96, 99,
 *     267-269, 301, 407-408. Desbloquear.
 *   - Los 3 comerciales: reformular afirmaciones promocionales no demostrables
 *     a derecho de defensa técnica (Art. 289 CPP / Art. 88 Constitución),
 *     eliminando "mejor abogado", "resultados garantizados", "6-12 meses",
 *     "facilita la defensa", "es crucial".
 *
 * Seguridad (igual que fase3b-aplicar-correcciones.ts):
 *   - Reemplazos idempotentes.
 *   - Dry-run por defecto; --aplicar para escribir.
 *   - NO toca ai_review_status (lo hace fase3c-reclasificar.ts).
 *
 * Uso:
 *   npx tsx scripts/fase3c-desbloquear.ts --dry-run
 *   npx tsx scripts/fase3c-desbloquear.ts --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

interface Reemplazo {
  slug: string;
  buscar: string;
  reemplazar: string;
  claimId: string;
  norma: string;
  fuenteUrl: string;
  motivo: string;
}

const CPP_URL =
  'https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf';
const CONSTIT_URL = 'data/articulos_constitucion.json';

const REEMPLAZOS: Reemplazo[] = [
  // ===== diferencia-denuncia-querella-acusacion-honduras =====
  // Verificación CPP directa. Los claims citan Arts. 96, 99, 267-269, 301.
  // Las afirmaciones son sustancialmente correctas; se precisan citas.
  {
    slug: 'diferencia-denuncia-querella-acusacion-honduras',
    buscar:
      'Sin embargo, para ciertos profesionales o funcionarios, la denuncia puede ser obligatoria según el Artículo 269 del Código Procesal Penal de Honduras.',
    reemplazar:
      'Sin embargo, para ciertos profesionales o funcionarios, la denuncia es <strong>obligatoria</strong> conforme al <strong>Artículo 269 del Código Procesal Penal</strong> (Decreto 9-99-E), que impone este deber a funcionarios públicos, profesionales de la salud y quienes tengan bajo su cuidado bienes ajenos, cuando tengan conocimiento de delitos de acción pública.',
    claimId: 'ddq-1',
    norma: 'CPP Decreto 9-99-E, Art. 269',
    fuenteUrl: CPP_URL,
    motivo:
      'Confirmación del Art. 269 con texto literal del CPP: la denuncia es obligatoria para funcionarios, profesionales de salud y custodios de bienes ajenos.',
  },
  {
    slug: 'diferencia-denuncia-querella-acusacion-honduras',
    buscar:
      'Los Artículos 96 y 99 del Código Procesal Penal de Honduras regulan la intervención y los requisitos de la acusación privada, permitiendo al querellante ofrecer pruebas y participar en las audiencias.',
    reemplazar:
      'Los <strong>Artículos 96 y 99 del Código Procesal Penal</strong> (Decreto 9-99-E) regulan la figura del acusador privado y los requisitos de la acusación privada: el Artículo 96 permite a la víctima o su representante provocar la persecución penal asistida por un profesional del derecho, y el Artículo 99 enumera los requisitos formales de la acusación privada (designación del tribunal, identificación del acusador y del imputado, relación sucinta de los hechos, indicación de pruebas y petición de ser tenido como parte).',
    claimId: 'ddq-2',
    norma: 'CPP Decreto 9-99-E, Arts. 96 y 99',
    fuenteUrl: CPP_URL,
    motivo:
      'Confirmación con texto literal: Art. 96 (acusador privado) y Art. 99 (7 requisitos de la acusación privada). El claim original era correcto pero impreciso; se precisa el contenido de cada artículo.',
  },
  {
    slug: 'diferencia-denuncia-querella-acusacion-honduras',
    buscar:
      'Según el Artículo 301 del Código Procesal Penal de Honduras, esta debe contener la identificación del imputado, una descripción clara de los hechos, la calificación jurídica del delito, el ofrecimiento de pruebas y la solicitud de enjuiciamiento.',
    reemplazar:
      'Conforme al <strong>Artículo 301 del Código Procesal Penal</strong> (Decreto 9-99-E), en la audiencia preliminar el fiscal y el acusador privado formalizan la acusación, que debe contener: una relación breve y precisa de las acciones u omisiones, los aspectos relevantes de la investigación, la calificación jurídica de los hechos según el Código Penal, la participación del imputado y el mínimo y máximo de las penas solicitadas.',
    claimId: 'ddq-3',
    norma: 'CPP Decreto 9-99-E, Art. 301',
    fuenteUrl: CPP_URL,
    motivo:
      'Corrección: el Art. 301 real enumera 5 requisitos textuales (relación, aspectos relevantes, calificación, participación, penas). El claim original mencionaba "identificación del imputado, ofrecimiento de pruebas y solicitud de enjuiciamiento" que no coincide exactamente con el texto legal.',
  },

  // ===== abogado-penalista-choluteca =====
  // Reformular claim comercial "proceso simplificado 6-12 meses / 2-3 años".
  // No existe tabla oficial de duración. Se sustituye por mención prudente
  // de plazos procesales puntuales del CPP sin inventar duraciones de proceso.
  {
    slug: 'abogado-penalista-choluteca',
    buscar:
      'Un proceso penal simplificado puede resolverse entre 6 y 12 meses. Casos de mayor complejidad, con múltiples recursos, pueden extenderse a 2 o 3 años o más.',
    reemplazar:
      'La duración real de un proceso penal depende de múltiples variables (complejidad del caso, recursos interpuestos, carga del sistema judicial) y no existe una tabla oficial de duración promedio. El Código Procesal Penal fija plazos procesales puntuales, como la celebración de la audiencia inicial dentro de los seis (6) días siguientes a la declaración del imputado detenido (Art. 292), pero el tiempo total hasta sentencia firme es variable.',
    claimId: 'apc-1',
    norma: 'CPP Decreto 9-99-E, Art. 292',
    fuenteUrl: CPP_URL,
    motivo:
      "Eliminación de afirmación comercial '6-12 meses / 2-3 años' sin respaldo normativo. Se sustituye por mención prudente del plazo procesal puntual del Art. 292 (audiencia inicial en 6 días) y se reconoce explícitamente que la duración total es variable.",
  },

  // ===== abogado-penalista-sur-honduras =====
  // Reformular claim comercial "facilita la defensa" / "ventaja local".
  // Sustituir por derecho de defensa técnica (Art. 289 CPP / Art. 88 Constitución).
  {
    slug: 'abogado-penalista-sur-honduras',
    buscar:
      'Un abogado penalista con presencia real en el sur de Honduras —Nacaome, Choluteca, San Lorenzo, Valle— no solo ofrece cercanía a los tribunales de la zona, sino una ventaja procesal concreta que puede influir en decisiones cruciales como medidas cautelares o la preparación de audiencias.',
    reemplazar:
      'El derecho a la defensa técnica está garantizado por la Constitución de la República (Art. 88) y el Código Procesal Penal (Art. 289), que exige la presencia del defensor bajo pena de nulidad. La elección de un abogado penalista es una decisión personal del imputado; la cercanía geográfica a los tribunales puede facilitar la logística de las audiencias, pero no constituye por sí misma una ventaja procesal normativa.',
    claimId: 'aps-1',
    norma: 'Constitución Art. 88; CPP Art. 289',
    fuenteUrl: `${CPP_URL}; ${CONSTIT_URL}`,
    motivo:
      "Eliminación de afirmación comercial 'ventaja procesal concreta' no demostrable. Se sustituye por el derecho de defensa técnica (Art. 88 Constitución + Art. 289 CPP), reformulando la cercanía geográfica como ventaja logística, no procesal.",
  },

  // ===== cuando-necesito-abogado-penalista-honduras =====
  // Reformular claim comercial "es crucial desde las primeras etapas".
  // Sustituir por derecho de defensa y asistencia letrada sin convertir
  // recomendación general en obligación legal inexistente.
  {
    slug: 'cuando-necesito-abogado-penalista-honduras',
    buscar:
      'La intervención de un abogado penalista en Honduras es crucial desde las primeras etapas de un proceso, ya sea que usted sea investigado, detenido o víctima de un delito. Su conocimiento especializado en el <strong>Código Penal</strong> y el <strong>Código Procesal Penal</strong> de Honduras garantiza la protección de sus derechos fundamentales.',
    reemplazar:
      'El derecho a la defensa técnica es una garantía constitucional en Honduras. La <strong>Constitución de la República</strong> (Art. 88) reconoce el derecho de defensa, y el <strong>Código Procesal Penal</strong> (Art. 289) dispone que la declaración del imputado es un acto personalísimo que se presta siempre en presencia del defensor, bajo pena de nulidad. Esto significa que la asistencia letrada es un derecho efectivo desde la primera actuación del proceso, tanto para quien es investigado o detenido como para la víctima que desea constituirse en acusador privado (Arts. 96 y 99 del CPP).',
    claimId: 'cna-1',
    norma: 'Constitución Art. 88; CPP Arts. 96, 99, 289',
    fuenteUrl: `${CPP_URL}; ${CONSTIT_URL}`,
    motivo:
      "Eliminación de afirmación comercial 'es crucial' (valorativa). Se sustituye por el derecho de defensa técnica y asistencia letrada con base normativa concreta (Arts. 88, 96, 99, 289), sin convertir la recomendación general en obligación legal inexistente.",
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const aplicar = process.argv.includes('--aplicar');

  if (!dryRun && !aplicar) {
    console.error('Especifica --dry-run o --aplicar');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log(`Fase 3C — Desbloqueo de 4 artículos del Lote 1 Penal`);
  console.log(`Reemplazos a aplicar: ${REEMPLAZOS.length}`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}\n`);

  // Agrupar reemplazos por slug
  const porSlug = new Map<string, Reemplazo[]>();
  for (const r of REEMPLAZOS) {
    if (!porSlug.has(r.slug)) porSlug.set(r.slug, []);
    porSlug.get(r.slug)!.push(r);
  }

  let totalAplicados = 0;
  let totalYaAplicados = 0;
  let totalNoEncontrados = 0;

  for (const [slug, reemplazos] of porSlug) {
    const [post] = (await sql`
      SELECT body FROM blog_posts WHERE slug = ${slug}
    `) as Array<{ body: string }>;

    if (!post) {
      console.log(`❌ ${slug}: no encontrado en DB.`);
      continue;
    }

    let body = post.body;
    const shaAntes = crypto
      .createHash('sha256')
      .update(body, 'utf8')
      .digest('hex')
      .substring(0, 16);
    const cambios: string[] = [];

    for (const r of reemplazos) {
      if (body.includes(r.buscar)) {
        if (body.includes(r.reemplazar)) {
          console.log(`  [YA] ${slug}: ${r.claimId} ya corregido.`);
          totalYaAplicados++;
        } else {
          if (aplicar) {
            body = body.replace(r.buscar, r.reemplazar);
          }
          cambios.push(r.claimId);
          console.log(`  [OK] ${slug} ${dryRun ? '(dry)' : ''}: ${r.claimId} — ${r.norma}`);
          totalAplicados++;
        }
      } else if (body.includes(r.reemplazar)) {
        console.log(`  [YA] ${slug}: ${r.claimId} ya corregido.`);
        totalYaAplicados++;
      } else {
        console.log(`  [NO] ${slug}: ${r.claimId} no encontrado.`);
        totalNoEncontrados++;
      }
    }

    if (aplicar && cambios.length > 0) {
      const shaDespues = crypto
        .createHash('sha256')
        .update(body, 'utf8')
        .digest('hex')
        .substring(0, 16);
      await sql`
        UPDATE blog_posts
        SET body = ${body}, updated_at = NOW()
        WHERE slug = ${slug}
      `;
      console.log(`  ✅ ${slug}: ${cambios.length} cambios (sha ${shaAntes} → ${shaDespues}).`);
    }
    console.log('');
  }

  console.log('=== RESUMEN ===');
  console.log(`Aplicados: ${totalAplicados}`);
  console.log(`Ya aplicados (idempotencia): ${totalYaAplicados}`);
  console.log(`No encontrados: ${totalNoEncontrados}`);
  if (aplicar) {
    console.log('\nDB actualizada. NO se modificó ai_review_status.');
    console.log('Ejecuta scripts/fase3c-reclasificar.ts --aplicar para recalcular estados.');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
