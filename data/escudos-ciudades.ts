export interface EscudoCiudad {
  slug: string;
  ciudad: string;
  departamento: string;
  ruta: string;
  fuente: string;
  licencia: string;
  urlFuente: string;
  estado: 'verified' | 'fallback' | 'pending-license-review';
}

export const escudosCiudades: EscudoCiudad[] = [
  { slug: 'nacaome', ciudad: 'Nacaome', departamento: 'Valle', ruta: '/images/escudos/nacaome.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'san-lorenzo', ciudad: 'San Lorenzo', departamento: 'Valle', ruta: '/images/escudos/san-lorenzo.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'choluteca', ciudad: 'Choluteca', departamento: 'Choluteca', ruta: '/images/escudos/choluteca.svg', fuente: 'Wikimedia Commons — File:Escudo de Choluteca.svg localizado. Se usa fallback monograma por consistencia visual.', licencia: 'CC0 / Dominio público (Commons)', urlFuente: 'https://commons.wikimedia.org/wiki/File:Escudo_de_Choluteca.svg', estado: 'verified' },
  { slug: 'goascoran', ciudad: 'Goascorán', departamento: 'Valle', ruta: '/images/escudos/goascoran.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'san-marcos-de-colon', ciudad: 'San Marcos de Colón', departamento: 'Choluteca', ruta: '/images/escudos/san-marcos-de-colon.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'el-triunfo', ciudad: 'El Triunfo', departamento: 'Choluteca', ruta: '/images/escudos/el-triunfo.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'marcovia', ciudad: 'Marcovia', departamento: 'Choluteca', ruta: '/images/escudos/marcovia.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'pespire', ciudad: 'Pespire', departamento: 'Choluteca', ruta: '/images/escudos/pespire.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'namasigue', ciudad: 'Namasigüe', departamento: 'Choluteca', ruta: '/images/escudos/namasigue.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
  { slug: 'orocuina', ciudad: 'Orocuina', departamento: 'Choluteca', ruta: '/images/escudos/orocuina.svg', fuente: 'Fallback decorativo — diseño propio (monograma)', licencia: 'Propia (fallback decorativo)', urlFuente: '', estado: 'fallback' },
];

export function getEscudoBySlug(slug: string): EscudoCiudad | undefined {
  return escudosCiudades.find((e) => e.slug === slug);
}
