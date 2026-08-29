/**
 * Landings de cargo (query exacta: "abogado penalista Nacaome", etc.).
 *
 * Fuente única para las 5 URLs existentes. No crea rutas nuevas.
 * Cada cargo es una página corta que empuja al hub de área; no es un
 * segundo hub. FAQ: máximo 3, logística local, sin listados de servicios.
 */

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import {
  EMIL_PROFILE,
  FOUNDER_PROFILE,
  THANIA_PROFILE,
} from '@/lib/site';

export type CargoArea = 'penal' | 'familia' | 'laboral' | 'civil';
export type CargoLawyerKey = 'danilo' | 'thania' | 'emil';

export type CargoLanding = {
  /** Path canónico sin host, con slash inicial. */
  path: string;
  area: CargoArea;
  city: string;
  citySlug: string;
  lawyer: CargoLawyerKey;
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  ogImageAlt: string;
  heroEyebrow: string;
  h1: string;
  heroSubtitle: string;
  introTitle: string;
  intro: string;
  localProofTitle: string;
  localProof: string;
  faqs: { pregunta: string; respuesta: string }[];
  whatsappMsg: string;
  ctaTitle: string;
  ctaSubtitle: string;
  /** Guías del blog enlazadas desde la landing (SEO contextual, no hub duplicado). */
  relatedBlogLinks?: { href: string; label: string }[];
};

export const CARGO_HUB: Record<
  CargoArea,
  { href: string; label: string; crumb: string; title: string; body: (city: string) => string }
> = {
  penal: {
    href: '/derecho-penal',
    label: 'Ver la defensa penal completa',
    crumb: 'Derecho Penal',
    title: 'La explicación completa de la defensa está en Derecho Penal',
    body: (city) =>
      `Esta página orienta la búsqueda local en ${city}. Etapas, documentos y estrategia de defensa están en el hub. Danilo Pineda Maradiaga atiende el área; el presupuesto va por escrito.`,
  },
  familia: {
    href: '/servicios-juridicos/derecho-de-familia',
    label: 'Ver el servicio de familia completo',
    crumb: 'Derecho de Familia',
    title: 'La explicación completa del servicio está en Derecho de Familia',
    body: (city) =>
      `Esta página orienta la búsqueda local en ${city}. Divorcio, custodia, pensión y el recorrido del trámite están en el hub. Thania Marlene Paz atiende el área; el presupuesto va por escrito.`,
  },
  laboral: {
    href: '/servicios-juridicos/derecho-laboral',
    label: 'Ver el servicio laboral completo',
    crumb: 'Derecho Laboral',
    title: 'La explicación completa del servicio está en Derecho Laboral',
    body: (city) =>
      `Esta página orienta la búsqueda local en ${city}. Despido, prestaciones y el recorrido del reclamo están en el hub. Emil Barahona atiende el área; el presupuesto va por escrito.`,
  },
  civil: {
    href: '/servicios-juridicos/derecho-civil-y-notarial',
    label: 'Ver el servicio civil y notarial completo',
    crumb: 'Derecho Civil',
    title: 'La explicación completa del servicio está en Derecho Civil',
    body: (city) =>
      `Esta página orienta la búsqueda local en ${city}. Contratos, herencias y trámites notariales están en el hub. Thania Marlene Paz atiende el área; el presupuesto va por escrito.`,
  },
};

export const CARGO_LAWYER = {
  danilo: FOUNDER_PROFILE,
  thania: THANIA_PROFILE,
  emil: EMIL_PROFILE,
} as const;

export const landingsCargo: CargoLanding[] = [
  {
    path: '/abogado-penalista-nacaome',
    area: 'penal',
    city: 'Nacaome',
    citySlug: 'nacaome',
    lawyer: 'danilo',
    title: 'Abogado Penalista Nacaome | Pineda y Asociados',
    description:
      'Abogado penalista en Nacaome, Valle. Defensa en audiencias, medidas cautelares, juicio oral y recursos. Atención urgente para detenidos.',
    keywords: [
      'abogado penalista Nacaome',
      'defensa penal Nacaome',
      'abogado penal Valle Honduras',
      'asistencia a detenidos Nacaome',
      'audiencia inicial Nacaome',
    ],
    ogImage: '/og/nacaome.webp',
    ogImageAlt: 'Abogado Penalista en Nacaome',
    heroEyebrow: 'Defensa penal · Nacaome, Valle',
    h1: 'Abogado Penalista en Nacaome',
    heroSubtitle:
      'Defensa técnica conforme al Código Penal hondureño. Asistencia desde la detención, audiencia inicial y hasta el juicio oral. El despacho declara más de 15 años de experiencia profesional en el sur de Honduras.',
    introTitle: 'Defensa penal en Nacaome, Valle',
    intro:
      'La Constitución garantiza el derecho a un abogado desde el primer momento de la detención y a ser presentado ante un juez en un plazo máximo de 24 horas. Esta página orienta la búsqueda local; el detalle de etapas y estrategia está en el hub de Derecho Penal.',
    localProofTitle: 'Sede y juzgados en Nacaome',
    localProof:
      'La oficina está en Nacaome, Valle: cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Coordinamos audiencias ante los Juzgados de Letras de Valle. Horario: lunes a sábado, de 7:00 a 20:00.',
    faqs: [
      {
        pregunta: '¿Qué hacer si me detienen en Nacaome?',
        respuesta:
          'Tiene derecho a un abogado desde el primer momento. No declare sin representación. Escríbanos por WhatsApp indicando que es una detención: le decimos cómo proceder. El plazo constitucional para ser presentado ante un juez es de 24 horas.',
      },
      {
        pregunta: '¿Atienden emergencias penales fuera de horario?',
        respuesta:
          'El horario de oficina es de lunes a sábado, de 7:00 a 20:00. Si hay una detención, escriba por WhatsApp indicando que es urgente. No prometemos presencia inmediata las 24 horas.',
      },
      {
        pregunta: '¿Dónde consultan un asunto penal en Nacaome?',
        respuesta:
          'En la sede de Nacaome. Danilo Pineda Maradiaga atiende el área. La evaluación inicial es confidencial y, si hay representación, el presupuesto va por escrito.',
      },
    ],
    whatsappMsg: 'Necesito un abogado penalista urgente en Nacaome. Vi su sitio web.',
    ctaTitle: '¿Necesita defensa penal en Nacaome?',
    ctaSubtitle:
      'Si hay detención o citación, hable con Danilo. Presupuesto por escrito, sin promesas de resultado.',
    relatedBlogLinks: [
      {
        href: '/blog/proceso-penal/audiencia-inicial-juzgados-valle',
        label: 'Audiencia inicial en Juzgados de Valle',
      },
      {
        href: '/blog/derecho-penal/detencion-familiar-nacaome-primeras-horas',
        label: 'Primeras horas si detienen a un familiar',
      },
      {
        href: '/blog/derecho-penal/defensa-penal-choluteca-desde-nacaome',
        label: 'Defensa penal en Choluteca desde Nacaome',
      },
    ],
  },
  {
    path: '/abogado-penalista-choluteca',
    area: 'penal',
    city: 'Choluteca',
    citySlug: 'choluteca',
    lawyer: 'danilo',
    title: 'Abogado Penalista Choluteca | Pineda y Asociados',
    description:
      'Abogado penalista en Choluteca. Defensa penal urgente en detenciones, audiencias, medidas cautelares y juicio oral en el sur de Honduras.',
    keywords: [
      'abogado penalista Choluteca',
      'defensa penal Choluteca',
      'abogado penalista sur Honduras',
      'asistencia a detenidos Choluteca',
      'audiencia inicial Choluteca',
    ],
    ogImage: '/og/penal.webp',
    ogImageAlt: 'Abogado Penalista en Choluteca - Pineda y Asociados',
    heroEyebrow: 'Defensa penal · Choluteca, Honduras',
    h1: 'Abogado Penalista en Choluteca',
    heroSubtitle:
      'Defensa técnica conforme al Código Penal hondureño (Decreto 130-2017 y reformas). Coordinamos presencia en los juzgados de Choluteca desde la sede en Nacaome.',
    introTitle: 'Defensa penal en Choluteca desde Nacaome',
    intro:
      'No hay sucursal en Choluteca. Se atiende desde Nacaome, a unos 55 km por la CA-1. Coordinamos audiencias y diligencias ante los juzgados del departamento. El detalle de la defensa está en el hub de Derecho Penal.',
    localProofTitle: 'Juzgados de Choluteca y corredor de Guasaule',
    localProof:
      'Coordinamos presencia en los Juzgados de Letras de Choluteca y trámites ligados a la zona de Guasaule cuando el caso lo pide. Distancia aproximada desde Nacaome: 55 km por la Panamericana CA-1.',
    faqs: [
      {
        pregunta: '¿Tienen oficina en Choluteca?',
        respuesta:
          'No. La sede física está en Nacaome, Valle, a unos 55 km por la CA-1. Atendemos a clientes de Choluteca desde esa oficina y coordinamos audiencias en los juzgados del departamento.',
      },
      {
        pregunta: '¿Qué hacer si me detienen en Choluteca?',
        respuesta:
          'Tiene derecho a un abogado desde el primer momento. No declare sin representación. Escríbanos por WhatsApp indicando que es una detención en Choluteca: le decimos cómo proceder.',
      },
      {
        pregunta: '¿Coordinan audiencias en los juzgados de Choluteca?',
        respuesta:
          'Sí. Danilo Pineda Maradiaga atiende el área penal. Coordinamos diligencias en Choluteca ciudad y el corredor de la Panamericana. El presupuesto va por escrito.',
      },
    ],
    whatsappMsg: 'Necesito un abogado penalista en Choluteca. Vi su sitio web.',
    ctaTitle: '¿Necesita defensa penal en Choluteca?',
    ctaSubtitle:
      'Detención, audiencia o medida cautelar en Choluteca: hable con Danilo. Se atiende desde Nacaome, con presupuesto por escrito.',
  },
  {
    path: '/abogado-de-familia-nacaome',
    area: 'familia',
    city: 'Nacaome',
    citySlug: 'nacaome',
    lawyer: 'thania',
    title: 'Abogado de Familia Nacaome | Pineda y Asociados',
    description:
      'Abogado de familia en Nacaome, Valle. Divorcios, custodia, pensión alimenticia, sucesiones y violencia intrafamiliar en el sur de Honduras.',
    keywords: [
      'abogado de familia Nacaome',
      'divorcio Nacaome',
      'custodia hijos Nacaome',
      'pensión alimenticia Nacaome',
      'abogado familia Valle Honduras',
    ],
    ogImage: '/og/nacaome.webp',
    ogImageAlt: 'Abogado de Familia en Nacaome',
    heroEyebrow: 'Derecho de familia · Nacaome, Valle',
    h1: 'Abogado de Familia en Nacaome',
    heroSubtitle:
      'Divorcios, custodia, pensión alimenticia y régimen de visitas. Asesoría con discreción ante los juzgados de familia de Nacaome y la zona sur.',
    introTitle: 'Asuntos de familia en Nacaome',
    intro:
      'Los trámites de familia se atienden en la sede de Nacaome, con confidencialidad. Esta página orienta la búsqueda local; el recorrido de divorcio, custodia y pensión está en el hub de Derecho de Familia.',
    localProofTitle: 'Juzgados de familia en Valle',
    localProof:
      'Coordinamos procesos ante los juzgados de familia con competencia en Valle, desde la oficina de Nacaome. Thania Marlene Paz atiende el área. Horario: lunes a sábado, de 7:00 a 20:00.',
    faqs: [
      {
        pregunta: '¿Dónde atienden un asunto de familia en Nacaome?',
        respuesta:
          'En la sede de Nacaome, Valle. Puede escribir por WhatsApp o pedir evaluación inicial confidencial. Si hay representación, el presupuesto va por escrito.',
      },
      {
        pregunta: '¿Quién atiende divorcio, custodia o pensión?',
        respuesta:
          'Thania Marlene Paz atiende el área de familia. El detalle de cada trámite está en el hub de Derecho de Familia; aquí coordinamos la atención local.',
      },
      {
        pregunta: '¿La consulta de familia es discreta?',
        respuesta:
          'Sí. La evaluación inicial es confidencial. No publicamos testimonios ni detalles de expedientes. Se habla con la abogada y el costo se confirma por escrito.',
      },
    ],
    whatsappMsg: 'Necesito un abogado de familia en Nacaome. Vi su sitio web.',
    ctaTitle: '¿Necesita orientación en un asunto de familia?',
    ctaSubtitle:
      'Divorcio, custodia o pensión: hable con Thania. Evaluación inicial confidencial y presupuesto por escrito.',
    relatedBlogLinks: [
      {
        href: '/blog/derecho-de-familia/pension-alimenticia-nacaome-documentos',
        label: 'Pensión alimenticia en Nacaome: documentos',
      },
      {
        href: '/blog/derecho-de-familia/abogado-familia-choluteca',
        label: 'Abogado de familia en Choluteca',
      },
      {
        href: '/blog/derecho-de-familia/pension-alimenticia-choluteca',
        label: 'Pensión alimenticia en Choluteca',
      },
    ],
  },
  {
    path: '/abogado-laboralista-nacaome',
    area: 'laboral',
    city: 'Nacaome',
    citySlug: 'nacaome',
    lawyer: 'emil',
    title: 'Abogado Laboralista Nacaome | Pineda y Asociados',
    description:
      'Abogado laboral en Nacaome, Valle. Despidos, prestaciones, liquidaciones, accidentes de trabajo y juicios orales laborales en el sur.',
    keywords: [
      'abogado laboralista Nacaome',
      'abogado laboral Nacaome',
      'despido injustificado Nacaome',
      'prestaciones laborales Nacaome',
      'reclamo laboral Valle Honduras',
    ],
    ogImage: '/og/nacaome.webp',
    ogImageAlt: 'Abogado Laboralista en Nacaome',
    heroEyebrow: 'Derecho laboral · Nacaome, Valle',
    h1: 'Abogado Laboralista en Nacaome',
    heroSubtitle:
      'Si lo despidieron, no le pagaron prestaciones o hay un conflicto en el trabajo, podemos revisar documentos y decirle qué se puede reclamar conforme al Código de Trabajo de Honduras.',
    introTitle: 'Reclamos laborales desde Nacaome',
    intro:
      'La atención laboral se presta en la sede de Nacaome. Esta página orienta la búsqueda local; el recorrido del despido, las prestaciones y la conciliación está en el hub de Derecho Laboral.',
    localProofTitle: 'Trabajo y sede en el sur de Valle',
    localProof:
      'Revisamos planilla, contrato y carta de despido en Nacaome. Emil Barahona atiende el área. Coordinamos también casos de trabajadores de San Lorenzo y la zona costera cuando el expediente lo requiere.',
    faqs: [
      {
        pregunta: '¿Atienden despidos en Nacaome?',
        respuesta:
          'Sí. Se atiende en la sede de Nacaome. Traiga planilla, contrato y carta de despido, si los tiene. Emil Barahona le dice qué se puede revisar y el costo, por escrito.',
      },
      {
        pregunta: '¿Qué documentos llevar a la evaluación laboral?',
        respuesta:
          'Contrato, planillas, carta de despido, finiquito y cualquier comunicación con el empleador. Si no tiene todos, igual puede escribir: le decimos qué falta.',
      },
      {
        pregunta: '¿Quién atiende el área laboral?',
        respuesta:
          'Emil Barahona. El detalle de prestaciones y etapas está en el hub de Derecho Laboral; aquí coordinamos la atención local en Nacaome.',
      },
    ],
    whatsappMsg: 'Me despidieron y necesito un abogado laboralista en Nacaome. Vi su sitio web.',
    ctaTitle: '¿Tuvo un problema laboral en Nacaome?',
    ctaSubtitle:
      'Despido o prestaciones: hable con Emil. Evaluación inicial confidencial y presupuesto por escrito.',
    relatedBlogLinks: [
      {
        href: '/blog/derecho-laboral/prestaciones-puerto-san-lorenzo',
        label: 'Prestaciones en el puerto de San Lorenzo',
      },
      {
        href: '/blog/derecho-laboral/abogado-laboral-choluteca',
        label: 'Abogado laboral en Choluteca',
      },
      {
        href: '/blog/derecho-laboral/demanda-laboral-choluteca',
        label: 'Demanda laboral en Choluteca',
      },
    ],
  },
  {
    path: '/abogado-civil-nacaome',
    area: 'civil',
    city: 'Nacaome',
    citySlug: 'nacaome',
    lawyer: 'thania',
    title: 'Abogado Civil en Nacaome | Pineda y Asociados',
    description:
      'Abogado civil en Nacaome, Valle. Contratos, herencias, testamentos, poderes notariales y trámites registrales en el sur de Honduras.',
    keywords: [
      'abogado civil Nacaome',
      'contratos Nacaome',
      'herencias Nacaome',
      'poder notarial Nacaome',
      'compraventa inmuebles Nacaome',
    ],
    ogImage: '/og/nacaome.webp',
    ogImageAlt: 'Abogado Civil en Nacaome',
    heroEyebrow: 'Derecho civil y notarial · Nacaome, Valle',
    h1: 'Abogado Civil en Nacaome',
    heroSubtitle:
      'Contratos, compraventas, herencias, testamentos y poderes notariales. Trámites civiles y notariales desde la sede en Nacaome.',
    introTitle: 'Trámites civiles y notariales en Nacaome',
    intro:
      'La atención civil y notarial se presta en la sede de Nacaome. Esta página orienta la búsqueda local; el recorrido de contratos, herencias y escrituras está en el hub de Derecho Civil.',
    localProofTitle: 'Sede en Nacaome para trámites con validez nacional',
    localProof:
      'Redacción y firma se coordinan en Nacaome, Valle. Thania Marlene Paz atiende el área. Los actos notariales que procedan tienen el alcance que les da la ley hondureña, no una sucursal en otra ciudad.',
    faqs: [
      {
        pregunta: '¿Hacen trámites civiles y notariales en Nacaome?',
        respuesta:
          'Sí. La sede está en Nacaome. Contratos, herencias y poderes se coordinan ahí. El detalle de cada trámite está en el hub de Derecho Civil.',
      },
      {
        pregunta: '¿Cómo se pide un presupuesto para un contrato o herencia?',
        respuesta:
          'Escriba por WhatsApp o use el formulario. La evaluación inicial es confidencial. Si hay que formalizar el trámite, el costo va por escrito.',
      },
      {
        pregunta: '¿Quién atiende el área civil?',
        respuesta:
          'Thania Marlene Paz. Puede ver su perfil en el equipo. No prometemos plazos fijos: dependen del registro, las partes y el tipo de acto.',
      },
    ],
    whatsappMsg: 'Necesito un abogado civil en Nacaome para contratos o herencias. Vi su sitio web.',
    ctaTitle: '¿Necesita un trámite civil o notarial en Nacaome?',
    ctaSubtitle:
      'Contrato, herencia o poder: hable con Thania. Evaluación inicial confidencial y presupuesto por escrito.',
    relatedBlogLinks: [
      {
        href: '/blog/derecho-civil/contrato-compraventa-nacaome-revision',
        label: 'Contrato o compraventa en Nacaome',
      },
      {
        href: '/blog/derecho-civil/abogado-civil-choluteca',
        label: 'Abogado civil en Choluteca',
      },
      {
        href: '/blog/derecho-civil/cobro-deudas-choluteca',
        label: 'Cobro de deudas en Choluteca',
      },
    ],
  },
];

const cargoByPath = new Map(landingsCargo.map((c) => [c.path, c]));

export function getCargoByPath(path: string): CargoLanding {
  const cargo = cargoByPath.get(path);
  if (!cargo) {
    throw new Error(`Landing de cargo no registrada: ${path}`);
  }
  return cargo;
}

export function cargoMetadata(cargo: CargoLanding): Metadata {
  return buildMetadata({
    title: cargo.title,
    description: cargo.description,
    canonicalPath: cargo.path,
    keywords: cargo.keywords,
    ogImage: cargo.ogImage,
    ogImageAlt: cargo.ogImageAlt,
  });
}
