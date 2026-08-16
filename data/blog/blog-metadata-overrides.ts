export type BlogMetadataOverride = {
  title?: string;
  metaTitle?: string;
  description?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
};

/**
 * Única fuente de overrides públicos del blog. Este contrato excluye
 * deliberadamente body, firmas, fechas, categorías, slugs y estados.
 */
export const BLOG_METADATA_OVERRIDES: Readonly<
  Record<string, Readonly<BlogMetadataOverride>>
> = {
  'allanamiento-ilegal-violacion-domicilio-honduras': {
    title: 'Allanamiento en Honduras: Derechos y Qué Hacer',
    description: 'Cuándo puede realizarse un allanamiento en Honduras, qué debe contener la orden judicial y cómo actuar sin obstaculizar a la autoridad.',
  },
  'contratos-franquicia-aspectos': {
    title: 'Contrato de franquicia en Honduras: cláusulas y riesgos',
    description: 'Cláusulas que conviene revisar en un contrato de franquicia en Honduras: territorio, regalías, uso de marca, terminación y solución de conflictos.',
  },
  'guia-aduanera-importaciones-honduras': {
    title: 'Cómo Importar a Honduras: Requisitos y Documentos',
    description: 'Documentos, clasificación arancelaria, tributos y etapas generales del despacho para importar mercancías legalmente en Honduras.',
  },
  'usucapion-prescripcion-adquisitiva-honduras': {
    title: 'Usucapión en Honduras: requisitos y proceso judicial',
    description: 'Qué es la prescripción adquisitiva, qué elementos deben acreditarse y cómo se tramita judicialmente una pretensión de usucapión en Honduras.',
  },
  'abogados-en-nacaome': {
    title: 'Cómo Elegir Abogado en Nacaome: 10 Criterios antes de Contratar',
    description: 'Criterios prácticos para elegir abogado en Nacaome: especialidad, honorarios, comunicación y experiencia antes de contratar servicios jurídicos en Valle.',
  },
  'audiencia-inicial-proceso-penal-honduras': {
    title: 'Audiencia inicial en Honduras: proceso y preparación',
    description: 'Explicación general de la audiencia inicial, la importancia de la defensa técnica y la documentación que conviene organizar con antelación.',
  },
  'cuando-necesito-abogado-penalista-honduras': {
    title: '¿Cuándo necesita un abogado penalista en Honduras?',
    description: 'Situaciones en las que conviene buscar defensa penal temprana, qué información preparar y cómo se desarrolla una primera consulta.',
  },
  'cuando-prescribe-delito-en-honduras': {
    title: 'Prescripción Penal en Honduras: Plazos y Cálculo',
    description: 'Cómo se determina la prescripción penal en Honduras según la pena, el delito y los actos que pueden interrumpir o suspender el cómputo.',
  },
  'custodia-hijos-honduras-juez': {
    title: 'Custodia de Hijos en Honduras: Criterios del Juez',
    description: 'Criterios que el juez evalúa en procesos de custodia en Honduras: interés superior del menor, capacidad parental y régimen de visitas.',
  },
  'danos-perjuicios-indemnizacion-honduras': {
    title: 'Daños y Perjuicios en Honduras: Cómo Reclamar',
    description: 'Requisitos y pasos para reclamar daños y perjuicios en Honduras: tipos de indemnización, plazos, documentos y procedimiento judicial.',
  },
  'defensa-penal-honduras': {
    title: 'Defensa penal en Honduras: guía de las primeras actuaciones',
    description: 'Orientación general ante una detención, citación o investigación penal y sobre la importancia de recibir asesoría jurídica desde el inicio.',
  },
  'despido-laboral-honduras-guia-completa': {
    title: 'Despido Injustificado en Honduras: Prestaciones y Plazos',
    description: 'Prestaciones y plazos ante un despido injustificado en Honduras. Revisión de documentos, cálculo de liquidación y opciones de reclamación laboral.',
  },
  'estafas-fraudes-tipos-penales-honduras': {
    title: 'Estafa en Honduras: Tipos, Denuncia y Defensa',
    description: 'Tipos de estafa según el Código Penal de Honduras, cómo denunciar y cuándo buscar defensa legal ante acusaciones por fraude.',
  },
  'testamentos-sucesiones-herencia-honduras': {
    title: 'Testamentos y sucesiones en Honduras: trámites hereditarios',
    metaTitle: 'Testamentos y sucesiones en Honduras',
    description: 'Cómo se tramita una sucesión en Honduras, qué cambia si existe testamento y qué documentos conviene reunir para el trámite hereditario.',
    metaDescription: 'Conozca cómo se tramita una sucesión en Honduras, qué cambia si existe testamento y qué documentos reunir para el trámite hereditario.',
  },
  'jornada-laboral-horas-extra-descansos-honduras': {
    title: 'Jornada Laboral en Honduras: Horas Extra y Recargos',
    description: 'Límites de la jornada laboral en Honduras, horas extra, recargos, descansos obligatorios y derechos del trabajador según el Código de Trabajo.',
  },
  'pension-alimenticia-honduras-guia-completa': {
    title: 'Pensión alimenticia Honduras: requisitos y pasos',
    description: 'Cómo solicitar pensión alimenticia en Honduras: documentos, demanda, plazos y cobro ante incumplimiento. Guía de procedimiento. Nacaome.',
  },
  'pension-alimenticia-porcentaje-honduras-2026': {
    title: 'Pensión alimenticia Honduras 2026: porcentaje',
    description: 'Cómo estima el juez el porcentaje de pensión alimenticia en Honduras en 2026: ingresos, necesidades del menor y tope de embargo. Nacaome.',
  },
  'divorcio-honduras-guia-completa': {
    title: 'Divorcio en Honduras: mutuo acuerdo, causal y plazos',
    description: 'Tres vías de divorcio en Honduras: mutuo consentimiento, causal y separación. Documentos, hijos y pensión. Bufete en Nacaome.',
  },
  'nacionalidad-espanola-para-hondurenos-residencia-plazos': {
    title: 'Nacionalidad española para hondureños: plazos',
    description: 'Requisitos generales de nacionalidad española por residencia. El bufete en Nacaome orienta trámites hondureños; no ejerce derecho español.',
  },
  'poder-legal-honduras-cuando-se-necesita': {
    title: 'Poder notarial en Honduras: tipos, alcance y requisitos',
    description: 'Qué es un poder notarial, para qué trámites puede utilizarse y qué conviene revisar antes de otorgarlo dentro o fuera de Honduras.',
  },
  'proteccion-datos-personales-derechos-arco-honduras': {
    title: 'Derechos ARCO en Honduras: Cómo Ejercerlos',
    description: 'Derechos de acceso, rectificación, cancelación y oposición (ARCO) en Honduras. Cómo solicitar información y proteger sus datos personales.',
  },
  'que-hacer-si-me-detienen-en-honduras': {
    title: 'Detención en Honduras: derechos, 24 h y qué no firmar',
    description: 'Si lo detienen en Honduras: pida el motivo, no declare sin defensor y no firme lo que no entienda. Plazo de 24 horas ante el juez.',
  },
  'union-de-hecho-requisitos-derechos-honduras': {
    title: 'Unión de Hecho en Honduras: Requisitos y Derechos',
    description: 'Requisitos para el reconocimiento de la unión de hecho en Honduras, derechos patrimoniales y sucesorios, y diferencias con el matrimonio.',
  },
};
