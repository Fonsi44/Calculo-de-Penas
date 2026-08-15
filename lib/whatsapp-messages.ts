/**
 * Mensajes predefinidos de WhatsApp según la ruta pública.
 * No incluye PII ni claims comerciales no autorizados.
 */

const DEFAULT_MESSAGE =
  'Hola, necesito orientación jurídica. Los contacto desde la web de Pineda y Asociados.';

const EXACT_MESSAGES: Record<string, string> = {
  '/': 'Hola, necesito orientación jurídica. Escribo desde la página de inicio de Pineda y Asociados.',
  '/derecho-penal':
    'Hola, necesito defensa penal urgente. Escribo desde la página de Derecho Penal.',
  '/solicitar-consulta':
    'Hola, quiero una evaluación inicial confidencial. Escribo desde el formulario de consulta.',
  '/como-llegar':
    'Hola, necesito indicaciones para llegar al bufete en Nacaome.',
  '/despacho':
    'Hola, quiero conocer al despacho y solicitar orientación jurídica.',
  '/servicios-juridicos':
    'Hola, necesito orientación sobre un servicio jurídico. Escribo desde Servicios Jurídicos.',
  '/hondurenos-en-espana':
    'Hola, estoy en España y necesito trámites o asesoría en Honduras.',
  '/preguntas-frecuentes':
    'Hola, tengo una consulta jurídica. Escribo desde Preguntas frecuentes.',
  '/blog':
    'Hola, necesito orientación jurídica. Vi una guía en el blog de Pineda y Asociados.',
};

const PREFIX_MESSAGES: Array<{ prefix: string; message: string }> = [
  {
    prefix: '/derecho-penal/',
    message: 'Hola, necesito defensa penal. Escribo desde una página de Derecho Penal.',
  },
  {
    prefix: '/servicios-juridicos/',
    message: 'Hola, necesito orientación jurídica. Escribo desde una página de servicios.',
  },
  {
    prefix: '/hondurenos-en-espana/',
    message: 'Hola, estoy en España y necesito asesoría en Honduras.',
  },
  {
    prefix: '/abogado-penalista-',
    message: 'Hola, necesito un abogado penalista. Escribo desde una página local.',
  },
  {
    prefix: '/abogados-en-',
    message: 'Hola, necesito un abogado en mi ciudad. Escribo desde una página local.',
  },
  {
    prefix: '/blog/',
    message: 'Hola, necesito orientación jurídica. Vi una guía en el blog de Pineda y Asociados.',
  },
  {
    prefix: '/equipo/',
    message: 'Hola, quiero contactar con un profesional del despacho. Escribo desde su perfil.',
  },
];

export function whatsappMessageForPath(pathname: string | null | undefined): string {
  if (!pathname) return DEFAULT_MESSAGE;
  const path = pathname.split('?')[0]?.split('#')[0] || '/';
  if (EXACT_MESSAGES[path]) return EXACT_MESSAGES[path];
  const match = PREFIX_MESSAGES.find((entry) => path.startsWith(entry.prefix));
  return match?.message ?? DEFAULT_MESSAGE;
}

export function isPenalUrgencyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split('?')[0] || '/';
  return path === '/derecho-penal' || path.startsWith('/derecho-penal/') || path.startsWith('/abogado-penalista-');
}
