'use client';

import Link from 'next/link';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE, directTelHref, directWhatsappHref } from '@/lib/site';
import { trackWhatsAppClick, trackPhoneClick, trackFormClick } from '@/lib/analytics';

const CATEGORY_COPY: Record<string, { h2: string; body: string; whatsappMsg: string }> = {
  'derecho-penal': {
    h2: '¿Enfrenta un proceso penal en la zona sur?',
    body: 'Las decisiones tempranas definen el resultado. Hable con un abogado penalista en Nacaome, Valle. Defensa desde la detención hasta la audiencia.',
    whatsappMsg: 'Necesito defensa penal urgente. Vi su artículo en el blog.',
  },
  'derecho-de-familia': {
    h2: '¿Necesita resolver un asunto de familia?',
    body: 'Divorcio, custodia, pensión alimenticia. Un abogado de familia en Nacaome puede orientarle con discreción y eficacia.',
    whatsappMsg: 'Necesito orientación en un asunto de familia. Vi su artículo en el blog.',
  },
  'derecho-laboral': {
    h2: '¿Tuvo un problema laboral?',
    body: 'Despido injustificado, prestaciones impagas, acoso laboral. Un abogado laboralista en Nacaome puede ayudarle a reclamar lo que le corresponde.',
    whatsappMsg: 'Necesito un abogado laboralista. Vi su artículo en el blog.',
  },
  'derecho-civil': {
    h2: '¿Necesita seguridad jurídica en sus trámites?',
    body: 'Contratos, compraventas, herencias o poderes notariales. Un abogado civil en Nacaome le garantiza documentos seguros y válidos.',
    whatsappMsg: 'Necesito un abogado civil para contratos o herencias. Vi su artículo en el blog.',
  },
  'proceso-penal': {
    h2: '¿Enfrenta un proceso penal en la zona sur?',
    body: 'Cada etapa del proceso penal requiere defensa técnica. Hable hoy con un abogado penalista en Nacaome.',
    whatsappMsg: 'Necesito defensa penal urgente. Vi su artículo en el blog.',
  },
  'derecho-mercantil': {
    h2: '¿Necesita asesoría para su empresa?',
    body: 'Constitución de sociedades, contratos mercantiles, cobro de cartera. Un abogado mercantil en Nacaome puede asistirle.',
    whatsappMsg: 'Necesito asesoría mercantil para mi empresa. Vi su artículo en el blog.',
  },
  'derecho-notarial': {
    h2: '¿Necesita un trámite notarial?',
    body: 'Poderes, escrituras, actas notariales. Un abogado notarial en Nacaome le da fe pública a sus documentos.',
    whatsappMsg: 'Necesito un poder notarial o escritura. Vi su artículo en el blog.',
  },
  'tributario': {
    h2: '¿Tiene un problema con el SAR?',
    body: 'Fiscalizaciones, multas, devoluciones de impuestos. Un abogado tributario en la zona sur puede defenderle.',
    whatsappMsg: 'Necesito defensa tributaria. Vi su artículo en el blog.',
  },
  'hondurenos-en-espana': {
    h2: '¿Está en España y necesita trámites en Honduras?',
    body: 'Poderes, documentos, trámites notariales y familiares desde el extranjero. Le asistimos sin que tenga que viajar.',
    whatsappMsg: 'Estoy en España y necesito hacer trámites en Honduras. Vi su artículo.',
  },
  'extranjeria-migracion': {
    h2: '¿Necesita trámites migratorios en Honduras?',
    body: 'Visas, residencia, naturalización y permisos migratorios. Un abogado en Nacaome puede gestionar su trámite ante las autoridades hondureñas.',
    whatsappMsg: 'Necesito asesoría migratoria en Honduras. Vi su artículo en el blog.',
  },
  'noticias-legales': {
    h2: '¿Le afecta un cambio legal reciente?',
    body: 'Las reformas legislativas pueden impactar sus derechos. Consulte con un abogado en Nacaome cómo le afecta la nueva normativa.',
    whatsappMsg: 'Quiero consultar sobre un cambio legal reciente. Vi su artículo en el blog.',
  },
  'practica-legal': {
    h2: '¿Necesita aplicar esta información a su caso?',
    body: 'Cada situación legal es distinta. Un abogado en Nacaome, Valle puede analizar su caso concreto y recomendarle el mejor camino.',
    whatsappMsg: 'Necesito orientación legal sobre mi caso. Vi su artículo en el blog.',
  },
  'derechos-ciudadanos': {
    h2: '¿Cree que se han vulnerado sus derechos?',
    body: 'Garantías constitucionales, amparo, habeas corpus. Un abogado en Nacaome puede defender sus derechos fundamentales ante las autoridades.',
    whatsappMsg: 'Necesito defender mis derechos. Vi su artículo en el blog.',
  },
  'derecho-bancario': {
    h2: '¿Tiene un problema con el banco o una deuda?',
    body: 'Ejecuciones hipotecarias, demandas bancarias, tarjetas de crédito. Un abogado bancario en Nacaome puede defender sus intereses frente a la entidad financiera.',
    whatsappMsg: 'Necesito un abogado para un problema bancario. Vi su artículo en el blog.',
  },
  'derecho-administrativo': {
    h2: '¿Enfrenta un procedimiento administrativo?',
    body: 'Sanciones, contratación pública, amparo administrativo. Un abogado en Nacaome puede representarle ante la administración del Estado.',
    whatsappMsg: 'Necesito defensa en un procedimiento administrativo. Vi su artículo en el blog.',
  },
  'derecho-aduanero': {
    h2: '¿Tiene un problema aduanero o de importación?',
    body: 'Clasificación arancelaria, sanciones aduaneras, zonas libres. Un abogado aduanero en la zona sur puede asistirle con las autoridades aduaneras.',
    whatsappMsg: 'Necesito asesoría aduanera. Vi su artículo en el blog.',
  },
  'regulacion-sanitaria': {
    h2: '¿Necesita registros o permisos sanitarios?',
    body: 'Registro sanitario ARSA, habilitación de clínicas, responsabilidad médica. Un abogado en Nacaome le guía en el marco regulatorio hondureño.',
    whatsappMsg: 'Necesito asesoría en regulación sanitaria. Vi su artículo en el blog.',
  },
  'propiedad-intelectual': {
    h2: '¿Necesita proteger su marca, patente o creación?',
    body: 'Registro de marcas, derechos de autor, patentes y secreto comercial. Un abogado en Nacaome puede proteger sus activos intangibles en Honduras.',
    whatsappMsg: 'Necesito proteger mi propiedad intelectual. Vi su artículo en el blog.',
  },
  'derecho-ambiental': {
    h2: '¿Necesita una licencia ambiental o enfrenta una sanción?',
    body: 'Evaluación de impacto ambiental, delitos ecológicos, derechos indígenas. Un abogado en Nacaome le asesora en derecho ambiental hondureño.',
    whatsappMsg: 'Necesito asesoría en derecho ambiental. Vi su artículo en el blog.',
  },
  'conciliacion-arbitraje': {
    h2: '¿Busca resolver un conflicto sin ir a juicio?',
    body: 'Mediación, conciliación y arbitraje comercial. Un abogado en Nacaome puede representarle en métodos alternos de resolución de conflictos.',
    whatsappMsg: 'Necesito mediación o arbitraje. Vi su artículo en el blog.',
  },
};

interface BlogCtaBarProps {
  category?: string;
}

export function BlogCtaBar({ category }: BlogCtaBarProps) {
  const copy = category ? CATEGORY_COPY[category] : null;
  const contacts = category === 'derecho-laboral'
    ? [EMIL_PROFILE]
    : category === 'derecho-de-familia' || category === 'derecho-mercantil' || category === 'derecho-administrativo'
      ? [THANIA_PROFILE]
      : category === 'derecho-civil' || category === 'derecho-notarial'
        ? [THANIA_PROFILE, EMIL_PROFILE]
        : category === 'derecho-penal' || category === 'proceso-penal'
          ? [FOUNDER_PROFILE, EMIL_PROFILE]
          : category === 'hondurenos-en-espana'
            ? [THANIA_PROFILE]
            : [FOUNDER_PROFILE];

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-accent-dark mb-2">
        Consulta confidencial en Nacaome
      </p>
      <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-text mb-4">
        {copy?.h2 ?? '¿Necesita asesoría legal en la zona sur?'}
      </h2>
      <p className="text-text-secondary mb-6 max-w-lg mx-auto leading-relaxed">
        {copy?.body ?? 'Hable directamente con un abogado en Nacaome, Valle, Choluteca o San Lorenzo. Podemos revisar su situación y orientarle sobre los siguientes pasos.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        {contacts.map((contact) => (
          <div key={contact.slug} className="flex flex-col sm:flex-row gap-2">
            <a href={directTelHref(contact.phone)} onClick={() => trackPhoneClick('blog_cta')} className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-primary text-white text-sm font-bold"><Phone size={18} /> Llamar a {contact.name.split(' ')[0]}</a>
            <a href={directWhatsappHref(contact.phone, `${copy?.whatsappMsg ?? 'Necesito orientación legal.'} Hola ${contact.name.split(' ')[0]}.`)} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick('blog_cta')} className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-success text-white text-sm font-bold"><MessageCircle size={18} /> WhatsApp con {contact.name.split(' ')[0]}</a>
          </div>
        ))}
      </div>
      <Link
        href="/solicitar-consulta#formulario"
        onClick={() => trackFormClick('blog_cta')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
      >
        O complete el formulario de consulta <ArrowRight size={14} />
      </Link>
    </div>
  );
}
