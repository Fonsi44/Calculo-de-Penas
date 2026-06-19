// Script para optimizar meta descriptions genéricas en posts existentes
// Ejecutar: npx tsx scripts/optimizar-metadescriptions.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada');
  process.exit(1);
}

const sql_conn = neon(process.env.DATABASE_URL);
const db = drizzle(sql_conn);

const optimizations: Record<string, { description: string; readingTime: string }> = {
  // === EXTRANJERIA Y MIGRACION ===
  'refugio-asilo-quien-puede-solicitarlo-honduras': {
    description: 'Quién califica para refugio o asilo en Honduras, diferencias entre ambos, proceso de solicitud ante la DGME y derechos durante el trámite. Guía actualizada con requisitos concretos.',
    readingTime: '6 min',
  },
  'visas-inversion-inversionista-rentista-pensionado-honduras': {
    description: 'Visas para inversionistas, rentistas y pensionados en Honduras: requisitos de inversión o ingresos demostrables, documentación necesaria y proceso de solicitud ante la DGME.',
    readingTime: '6 min',
  },
  'naturalizacion-obtener-nacionalidad-hondurena': {
    description: 'Cómo obtener la nacionalidad hondureña por naturalización: años de residencia requeridos, examen de conocimientos, documentación y plazos del proceso. Requisitos actualizados 2026.',
    readingTime: '7 min',
  },

  // === PROCESO PENAL ===
  'habeas-corpus-cuando-interponer-honduras': {
    description: 'Hábeas corpus en Honduras: qué es, cuándo procede, diferencias con el amparo y cómo interponerlo ante una detención ilegal. Requisitos, plazos y qué esperar del trámite.',
    readingTime: '6 min',
  },
  'etapa-investigacion-proceso-penal-honduras': {
    description: 'La etapa de investigación en el proceso penal hondureño: rol del Ministerio Público, plazos (6 meses prorrogables), diligencias que puede solicitar la defensa y control judicial.',
    readingTime: '7 min',
  },
  'recursos-sentencia-penal-apelacion-casacion-honduras': {
    description: 'Recursos contra sentencia penal en Honduras: apelación ante la Corte de Apelaciones y casación ante la Sala Penal. Plazos (10-20 días), requisitos y motivos para recurrir.',
    readingTime: '7 min',
  },
  'sobreseimiento-definitivo-provisional-diferencias-honduras': {
    description: 'Diferencia entre sobreseimiento definitivo y provisional en Honduras: efectos jurídicos, cuándo procede cada uno y cómo solicitarlos en la etapa intermedia del proceso penal.',
    readingTime: '6 min',
  },
  'juicio-oral-etapas-que-esperar-honduras': {
    description: 'El juicio oral en Honduras explicado paso a paso: alegatos de apertura, práctica de pruebas, testigos, peritos y sentencia. Qué esperar y cómo prepararse si enfrenta un juicio.',
    readingTime: '7 min',
  },

  // === DERECHOS CIUDADANOS ===
  'presentar-denuncia-conadeh-honduras': {
    description: 'Cómo presentar una denuncia ante el CONADEH en Honduras: qué casos atiende, requisitos de la queja, plazos de respuesta y limitaciones. Guía práctica para ciudadanos.',
    readingTime: '6 min',
  },
  'derecho-de-peticion-instituciones-honduras': {
    description: 'Derecho de petición en Honduras: fundamento constitucional, cómo redactar una solicitud efectiva ante instituciones públicas, plazos de respuesta y qué hacer si no contestan.',
    readingTime: '6 min',
  },
  'libertad-expresion-redes-sociales-honduras': {
    description: 'Libertad de expresión en redes sociales en Honduras: límites legales, cuándo puede haber consecuencias penales, difamación vs. opinión y cómo proteger sus derechos digitales.',
    readingTime: '6 min',
  },

  // === REGULACION SANITARIA ===
  'responsabilidad-medica-mala-praxis-honduras': {
    description: 'Responsabilidad médica y mala praxis en Honduras: cómo reclamar por negligencia médica, carga de la prueba, plazos de prescripción y vías de reclamación civil y penal.',
    readingTime: '7 min',
  },
  'habilitacion-clinicas-hospitales-privados-honduras': {
    description: 'Requisitos para habilitar una clínica u hospital privado en Honduras: licencia sanitaria, registro ante la Secretaría de Salud, inspección de planta y documentación necesaria.',
    readingTime: '6 min',
  },
  'registro-medicamentos-productos-farmaceuticos-honduras': {
    description: 'Registro de medicamentos y productos farmacéuticos ante la ARSA en Honduras: proceso de solicitud, requisitos técnicos, plazos estimados y renovación. Guía para laboratorios e importadores.',
    readingTime: '7 min',
  },

  // === PROPIEDAD INTELECTUAL (posts restantes) ===
  'contratos-confidencialidad-nda-secreto-comercial-honduras': {
    description: 'Contratos de confidencialidad (NDA) en Honduras: cuándo usarlos, cláusulas esenciales, definición de información confidencial, plazo de vigencia y consecuencias del incumplimiento.',
    readingTime: '6 min',
  },
  'proteccion-marcas-competencia-desleal-honduras': {
    description: 'Protección de marcas frente a competencia desleal en Honduras: qué conductas constituyen competencia desleal, cómo denunciarlas ante el Instituto de la Propiedad y vías de defensa.',
    readingTime: '6 min',
  },
  'derechos-de-autor-proteccion-registro-honduras': {
    description: 'Derechos de autor en Honduras: qué obras protege, cómo se adquiere el derecho, diferencia entre registro y protección automática, y cómo defender sus derechos frente a infracciones.',
    readingTime: '6 min',
  },

  // === DERECHO CIVIL (posts con meta genérica) ===
  'usucapion-prescripcion-adquisitiva-honduras': {
    description: 'Usucapión o prescripción adquisitiva en Honduras: cómo adquirir la propiedad de un inmueble por posesión continuada, requisitos de buena fe, plazos (10-20 años) y proceso judicial.',
    readingTime: '7 min',
  },
  'clausulas-abusivas-contratos-como-detectar-honduras': {
    description: 'Cláusulas abusivas en contratos en Honduras: cómo identificarlas, qué dice la ley de protección al consumidor, ejemplos frecuentes en contratos bancarios y de adhesión, y cómo impugnarlas.',
    readingTime: '7 min',
  },
  'danos-perjuicios-indemnizacion-honduras': {
    description: 'Cómo reclamar una indemnización por daños y perjuicios en Honduras: tipos de daño (material, moral, lucro cesante), carga de la prueba, plazos de prescripción y proceso judicial.',
    readingTime: '7 min',
  },
  'contratos-arrendamiento-derechos-obligaciones-honduras': {
    description: 'Derechos y obligaciones en contratos de arrendamiento en Honduras: depósito, plazo mínimo, desahucio, reparaciones y cómo proteger sus intereses como inquilino o arrendador.',
    readingTime: '7 min',
  },
  'prescripcion-deudas-plazos-honduras': {
    description: 'Prescripción de deudas en Honduras: plazos según tipo de deuda (civil 10 años, mercantil 3-5 años, laboral variable), cuándo empieza a contar el plazo y cómo se interrumpe la prescripción.',
    readingTime: '6 min',
  },
  'contratos-civiles-honduras-errores-comunes': {
    description: 'Errores comunes al redactar contratos civiles en Honduras: cláusulas ambiguas, falta de penalización por incumplimiento y omisión de domicilio procesal. Cómo evitarlos y redactar contratos sólidos.',
    readingTime: '6 min',
  },

  // === AMBIENTAL ===
  'licencia-ambiental-categorias-plazos-honduras': {
    description: 'Licencia ambiental en Honduras: categorías de impacto (bajo, medio, alto), plazos de tramitación según categoría, documentación requerida y consecuencias de operar sin licencia.',
    readingTime: '6 min',
  },
  'delitos-ambientales-como-denunciarlos-honduras': {
    description: 'Delitos ambientales en Honduras: tipos penales, cómo identificarlos, ante quién denunciar (Ministerio Público, SERNA) y qué pruebas necesita para que su denuncia prospere.',
    readingTime: '6 min',
  },
  'derechos-indigenas-consulta-previa-honduras': {
    description: 'Derechos de los pueblos indígenas en Honduras: consulta previa, libre e informada, fundamento legal (Convenio 169 OIT), cuándo es obligatoria y cómo se aplica en proyectos extractivos e infraestructura.',
    readingTime: '7 min',
  },

  // === CONCILIACION Y ARBITRAJE (restantes) ===
  'mediacion-familiar-cuando-funciona-honduras': {
    description: 'Mediación familiar en Honduras: cuándo es obligatoria, en qué casos funciona mejor (custodia, alimentos, visitas) y en cuáles no (violencia doméstica). Diferencias con el arbitraje y el juicio.',
    readingTime: '6 min',
  },
  'centro-conciliacion-arbitraje-ccic-guia-honduras': {
    description: 'Centro de Conciliación y Arbitraje de la CCIC en Honduras: servicios, costos, procedimiento para someter un caso y ventajas del arbitraje institucional frente al litigio judicial.',
    readingTime: '6 min',
  },
  'mediacion-vs-juicio-que-conviene-mas-honduras': {
    description: 'Mediación vs juicio en Honduras: comparativa de costos, plazos, confidencialidad y efectividad. Cuándo conviene mediar y cuándo es mejor litigar, con ejemplos de casos reales.',
    readingTime: '6 min',
  },

  // === DERECHO PENAL (posts con meta genérica) ===
  'diferencia-denuncia-querella-acusacion-honduras': {
    description: 'Denuncia, querella y acusación en Honduras: diferencias, quién presenta cada una, plazos, consecuencias procesales y cómo afectan su defensa. Guía para víctimas e imputados.',
    readingTime: '6 min',
  },
  'medidas-sustitutivas-prision-preventiva-honduras': {
    description: 'Medidas sustitutivas a la prisión preventiva en Honduras: arraigo, caución, vigilancia electrónica y otras alternativas. Requisitos, cómo solicitarlas en la audiencia inicial y criterios del juez.',
    readingTime: '6 min',
  },
  'antejuicio-en-honduras': {
    description: 'Antejuicio en Honduras: qué funcionarios gozan de este privilegio procesal, cómo funciona el procedimiento ante el Congreso Nacional y qué implicaciones tiene para la persecución penal.',
    readingTime: '6 min',
  },
  'allanamiento-ilegal-violacion-domicilio-honduras': {
    description: 'Allanamiento ilegal en Honduras: qué hacer si la policía ingresa a su domicilio sin orden judicial, cómo impugnar pruebas obtenidas ilegalmente y sus derechos constitucionales frente al registro domiciliario.',
    readingTime: '6 min',
  },
  'fianza-medidas-cautelares-proceso-penal-honduras': {
    description: 'Fianza y medidas cautelares en el proceso penal hondureño: tipos de caución, cómo se fija el monto, quién puede prestarla y qué sucede si se incumplen las condiciones impuestas por el juez.',
    readingTime: '6 min',
  },
  'estafas-fraudes-tipos-penales-honduras': {
    description: 'Estafas y fraudes en Honduras: tipos penales, cómo identificarlos, qué hacer si es víctima (denuncia, pruebas), y defensa si es acusado. Penas según el monto defraudado y agravantes.',
    readingTime: '7 min',
  },

  // === DERECHO LABORAL (posts restantes) ===
  'riesgos-profesionales-accidentes-laborales-honduras': {
    description: 'Riesgos profesionales y accidentes laborales en Honduras: obligaciones del empleador, cobertura del IHSS, cómo reportar un accidente y cómo reclamar indemnización por lesiones o enfermedad profesional.',
    readingTime: '7 min',
  },
  'jornada-laboral-horas-extra-descansos-honduras': {
    description: 'Jornada laboral, horas extra y descansos en Honduras: límites legales diurnos y nocturnos, recargo del 25% en horas extra, descanso semanal y qué hacer si su empleador no las paga.',
    readingTime: '6 min',
  },
  'acoso-laboral-mobbing-honduras': {
    description: 'Acoso laboral o mobbing en Honduras: qué conductas lo constituyen, cómo documentarlo, vías de denuncia (Secretaría de Trabajo, vía judicial) y derecho a indemnización por daño moral.',
    readingTime: '7 min',
  },
  'derechos-trabajadora-embarazada-honduras': {
    description: 'Derechos de la trabajadora embarazada en Honduras: fuero maternal, licencia de maternidad (6+6 semanas), prohibición de despido sin autorización judicial y reinstalación con salarios caídos.',
    readingTime: '6 min',
  },

  // === EXTRANJERIA (posts con meta genérica) === 
  'residencia-temporal-requisitos-plazos-honduras': {
    description: 'Residencia temporal en Honduras 2026: tipos (trabajo, inversión, estudios, reunificación familiar, rentista), requisitos de cada categoría, proceso ante la DGME y plazos de tramitación.',
    readingTime: '7 min',
  },
  'permiso-trabajo-extranjeros-honduras': {
    description: 'Permiso de trabajo para extranjeros en Honduras: quién lo necesita, requisitos, proceso ante la Secretaría de Trabajo, sanciones por trabajar sin permiso y excepciones por categoría migratoria.',
    readingTime: '7 min',
  },

  // === MERCANTIL ===
  'incumplimiento-contrato-comercial-honduras': {
    description: 'Incumplimiento de contrato comercial en Honduras: qué hacer si la otra parte no cumple, cómo reclamar daños y perjuicios, cláusula penal y ejecución forzosa del contrato. Guía práctica.',
    readingTime: '6 min',
  },
  'titulos-valores-cheques-sin-fondo-honduras': {
    description: 'Cheques sin fondo en Honduras: qué es el protesto, plazo de 8 días para protestar, acciones cambiarias contra el librador y cómo recuperar el dinero de un cheque impago.',
    readingTime: '6 min',
  },
  'competencia-desleal-como-denunciar-honduras': {
    description: 'Competencia desleal en Honduras: qué conductas la constituyen, cómo denunciar ante el Instituto de la Propiedad y qué sanciones enfrenta quien incurre en prácticas desleales.',
    readingTime: '6 min',
  },
  'contratos-franquicia-aspectos-legales-honduras': {
    description: 'Contratos de franquicia en Honduras: marco legal, cláusulas esenciales (canon, regalías, exclusividad territorial, no competencia) y cómo proteger sus intereses como franquiciante o franquiciado.',
    readingTime: '7 min',
  },
};

async function main() {
  console.log(`\nOptimizando ${Object.keys(optimizations).length} posts...\n`);
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [slug, opts] of Object.entries(optimizations)) {
    try {
      const [existing] = await db.select({ id: blogPosts.id, slug: blogPosts.slug, description: blogPosts.description })
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);

      if (!existing) {
        console.log(`  ⊘ NO ENCONTRADO: ${slug}`);
        skipped++;
        continue;
      }

      // Solo actualizar si la description actual es genérica o vacía
      const isGeneric = !existing.description || 
        existing.description.startsWith('Explica') || 
        existing.description.startsWith('Todo sobre') ||
        existing.description.includes('Guía completa') && existing.description.length < 100;

      if (!isGeneric) {
        console.log(`  ✓ YA OK: ${slug}`);
        skipped++;
        continue;
      }

      await db.update(blogPosts)
        .set({
          description: opts.description,
          readingTime: opts.readingTime,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, existing.id));

      console.log(`  ✓ OPTIMIZADO: ${slug}`);
      updated++;
    } catch (err: any) {
      console.error(`  ✗ ERROR en ${slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n---`);
  console.log(`RESULTADO: ${updated} optimizados, ${skipped} saltados, ${errors} errores`);
  console.log(`Total procesados: ${Object.keys(optimizations).length}\n`);
}

main().catch(console.error);
