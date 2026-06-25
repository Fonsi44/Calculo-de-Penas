import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

const FIXES: Record<string, string> = {
  'errores-contratos-civiles-honduras': '8 Errores en Contratos Civiles en Honduras',
  'reformas-legales-recientes-honduras': 'Reformas Legales Recientes en Honduras',
  'proceso-consulta-legal-pineda-asociados-honduras': 'Proceso de Consulta Legal en Honduras | Pineda',
  'etapa-investigacion-proceso-penal-honduras': 'Etapa de Investigación del Proceso Penal Hondureño',
  'facturacion-electronica-obligaciones-requisitos-sar-honduras': 'Facturación Electrónica SAR Honduras: Guía 2026',
  'sobreseimiento-definitivo-provisional-diferencias-honduras': 'Sobreseimiento Definitivo y Provisional en Honduras',
  'servicios-legales-empresas-sur-honduras': 'Servicios Legales para Empresas en Sur de Honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras': 'Fianza y Medidas Cautelares en el Proceso Penal',
  'lavado-activos-obligaciones-cumplimiento-empresas-honduras': 'Lavado de Activos en Honduras: Obligaciones Legales',
  'contratos-franquicia-aspectos-legales-honduras': 'Contratos de Franquicia: Aspectos Legales Honduras',
  'importar-mercancias-guia-legal-aduanera-honduras': 'Importar Mercancías a Honduras: Guía Aduanera',
  'impuestos-pequenas-empresas-guia-basica-honduras': 'Impuestos para Pequeñas Empresas: Guía SAR',
  'incumplimiento-contrato-comercial-honduras': 'Incumplimiento de Contrato Comercial: Qué Hacer',
  'usucapion-prescripcion-adquisitiva-honduras': 'Usucapión en Honduras: Cómo Adquirir una Propiedad',
  'prescripcion-deudas-plazos-honduras': 'Prescripción de Deudas en Honduras: Plazos Legales',
  'defensa-penal-honduras': 'Defensa Penal en Honduras: Proteja sus Derechos',
  'presentar-denuncia-conadeh-honduras': 'Cómo Denunciar ante el CONADEH en Honduras',
  'libertad-expresion-redes-sociales-honduras': 'Libertad de Expresión en Redes Sociales Honduras',
  'contratacion-publica-licitaciones-empresas-honduras': 'Contratación Pública y Licitaciones: Guía Empresas',
  'arraigo-social-laboral-hondurenos-espana': 'Arraigo Social y Laboral Hondureños en España',
  'mediacion-vs-juicio-que-conviene-mas-honduras': 'Mediación vs Juicio: Diferencias y Cuándo Elegir',
  'derechos-trabajadora-embarazada-honduras': 'Derechos de la Trabajadora Embarazada en Honduras',
  'naturalizacion-obtener-nacionalidad-hondurena': 'Naturalización: Cómo Obtener Nacionalidad Hondureña',
  'banco-demanda-deuda-defensa-opciones-honduras': '¿Banco le Demanda? Defensa y Opciones Legales',
  'visas-inversion-inversionista-rentista-pensionado-honduras': 'Visas de Inversión, Rentista y Pensionado Honduras',
  'poder-desde-espana-para-tramites-honduras': 'Poder desde España para Trámites en Honduras',
  'titulos-valores-cheques-sin-fondo-honduras': 'Cheques sin Fondo en Honduras: Qué Hacer',
  'diferencia-denuncia-querella-acusacion-honduras': 'Denuncia, Querella o Acusación: Diferencias',
  'hondurenos-espana-documentos-legales-extranjero': 'Hondureños en España: Documentos Legales',
  'proceso-penal-completo': 'Proceso Penal Completo en Honduras',
  'divorcio-choluteca': 'Divorcio en Choluteca: Tipos, Costos y Trámite',
  'arbitraje-honduras-guia-completa': 'Arbitraje en Honduras: Guía Completa',
  'reagrupacion-familiar-hondurenos-espana': 'Reagrupación Familiar Hondureños en España',
  'asuntos-civiles-y-familiares-desde-el-extranjero': 'Asuntos Civiles y Familiares desde Extranjero',
  'danos-perjuicios-indemnizacion-honduras': 'Daños y Perjuicios en Honduras: Qué Reclamar',
  'derechos-detenido-honduras-guia-constitucional': 'Derechos del Detenido en Honduras: Guía Completa',
  'despido-empleados-publicos-honduras': 'Despido de Empleados Públicos en Honduras',
  'abogados-en-marcovia-choluteca': 'Abogados en Marcovia, Choluteca | Pineda',
  'testamentos-sucesiones-herencia-honduras': 'Testamentos y Sucesiones: Guía Legal Honduras',
  'demanda-laboral-choluteca': 'Demanda Laboral en Choluteca: Pasos y Plazos',
  'abogados-en-amapala-valle': 'Abogados en Amapala, Valle | Pineda',
  'asuntos-familiares-honduras-viviendo-espana': 'Asuntos Familiares Honduras-España: Guía',
  'centro-conciliacion-arbitraje-ccic-guia-honduras': 'Centro de Conciliación CCIC: Guía Honduras',
  'importar-desde-china-guia-legal-aduanera-honduras': 'Importar desde China a Honduras: Guía Aduanera',
  'riesgos-profesionales-accidentes-laborales-honduras': 'Accidentes Laborales: Derechos del Trabajador',
  'tributar-espana-bienes-honduras-guia-fiscal': 'Tributar en España con Bienes en Honduras',
  'codigo-aduanero-centroamericano-basico-honduras': 'Código Aduanero Centroamericano: Guía Honduras',
  'habilitacion-clinicas-hospitales-privados-honduras': 'Habilitación de Clínicas y Hospitales en Honduras',
  'abogados-en-pespire-choluteca': 'Abogados en Pespire, Choluteca | Pineda',
  'cobro-deudas-choluteca': 'Cobro Judicial de Deudas en Choluteca',
  'pension-alimenticia-choluteca': 'Pensión Alimenticia en Choluteca: Guía Completa',
  'evaluacion-impacto-ambiental-honduras': 'Evaluación de Impacto Ambiental en Honduras',
  'proteccion-marcas-competencia-desleal-honduras': 'Protección de Marcas y Competencia Desleal',
  'abogados-en-choluteca': 'Abogados en Choluteca: Asesoría Legal | Pineda',
  'abogados-en-san-lorenzo': 'Abogados en San Lorenzo, Valle | Pineda',
  'creditos-reestructuracion-deudas-bancarias-honduras': 'Reestructuración de Deudas Bancarias Honduras',
  'medidas-sustitutivas-prision-preventiva-honduras': 'Medidas Sustitutivas a Prisión Preventiva',
  'refugio-asilo-quien-puede-solicitarlo-honduras': 'Refugio y Asilo en Honduras: Guía Completa',
  'herencias-transfronterizas-bienes-honduras-espana': 'Herencias Transfronterizas Honduras-España',
  'impuesto-renta-personas-fisicas-honduras': 'Impuesto Sobre la Renta para Personas Físicas',
  'cuando-necesito-abogado-penalista-honduras': '¿Cuándo Necesito un Abogado Penalista en Honduras?',
  'audiencia-inicial-proceso-penal-honduras': 'Audiencia Inicial en el Proceso Penal Hondureño',
  'delitos-mas-comunes-honduras': 'Delitos Más Comunes en Honduras: Guía Legal',
  'que-hacer-si-me-detienen-en-honduras': '¿Qué Hacer si me Detienen en Honduras? Guía',
  'jornada-laboral-horas-extra-descansos-honduras': 'Jornada Laboral, Horas Extra y Descansos',
  'herencias-honduras-fallece-familiar': 'Herencias en Honduras: ¿Falleció un Familiar?',
  'registrar-marca-paso-a-paso-honduras': 'Registrar una Marca en Honduras: Proceso DIGEPI',
};

async function main() {
  const slugs = Object.keys(FIXES);
  console.log(`Corrigiendo ${slugs.length} meta_titles...`);

  let ok = 0;
  let err = 0;
  for (const [slug, metaTitle] of Object.entries(FIXES)) {
    try {
      const [post] = await db.update(blogPosts)
        .set({ metaTitle })
        .where(eq(blogPosts.slug, slug))
        .returning({ slug: blogPosts.slug, metaTitle: blogPosts.metaTitle });
      if (post) {
        console.log(`  ✅ ${slug} → "${post.metaTitle}"`);
        ok++;
      } else {
        console.log(`  ❌ ${slug} → no encontrado`);
        err++;
      }
    } catch (e) {
      console.error(`  ❌ ${slug} → error: ${e}`);
      err++;
    }
  }

  console.log(`\nResultado: ${ok} ok, ${err} errores`);
}

main().catch(console.error);
