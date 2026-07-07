export type BlogCategory = {
  slug: string;
  nombre: string;
  descripcion: string;
  color: string;
};

export const blogCategories: BlogCategory[] = [
  {
    slug: 'derecho-penal',
    nombre: 'Derecho Penal',
    descripcion: 'Análisis y comentarios sobre defensa penal, jurisprudencia y reformas al Código Penal hondureño (Decreto 130-2017) para abogados y ciudadanos.',
    color: 'danger',
  },
  {
    slug: 'proceso-penal',
    nombre: 'Proceso Penal',
    descripcion: 'Guías y explicaciones sobre cada etapa del proceso penal hondureño: investigación, audiencia inicial, juicio oral, sentencia y recursos de casación.',
    color: 'warning',
  },
  {
    slug: 'derecho-de-familia',
    nombre: 'Derecho de Familia',
    descripcion: 'Divorcio, custodia, pensión de alimentos, sucesiones, violencia intrafamiliar y protección de menores ante los juzgados de familia de Honduras.',
    color: 'primary',
  },
  {
    slug: 'derecho-laboral',
    nombre: 'Derecho Laboral',
    descripcion: 'Despidos, prestaciones, riesgos profesionales, acoso laboral y derechos de los trabajadores hondureños según el Código de Trabajo.',
    color: 'accent',
  },
  {
    slug: 'derecho-civil',
    nombre: 'Derecho Civil y Notarial',
    descripcion: 'Contratos, compraventa de inmuebles, sucesiones, deudas, poderes notariales y trámites registrales en el ordenamiento civil hondureño.',
    color: 'muted',
  },
  {
    slug: 'derecho-mercantil',
    nombre: 'Derecho Mercantil y Empresarial',
    descripcion: 'Constitución de sociedades, contratos comerciales, gobierno corporativo, marcas y propiedad intelectual para empresas en Honduras.',
    color: 'accent',
  },
  {
    slug: 'extranjeria-migracion',
    nombre: 'Extranjería y Migración',
    descripcion: 'Visas, residencia temporal y permanente, naturalización y trámites migratorios para extranjeros ante el Instituto Nacional de Migración.',
    color: 'primary',
  },
  {
    slug: 'hondurenos-en-espana',
    nombre: 'Hondureños en España',
    descripcion: 'Asistencia legal, gestión documental, apostillas, actos notariales y trámites para hondureños residentes en España y españoles en Honduras.',
    color: 'primary',
  },
  {
    slug: 'derecho-notarial',
    nombre: 'Derecho Notarial',
    descripcion: 'Poderes notariales, actos jurídicos, protocolización de documentos, testamentos y trámites notariales regulados por el Código del Notariado.',
    color: 'muted',
  },
  {
    slug: 'tributario',
    nombre: 'Derecho Tributario',
    descripcion: 'Impuestos ISR e ISV, fiscalización del SAR, planificación fiscal, precios de transferencia y defensa del contribuyente en Honduras.',
    color: 'warning',
  },
  {
    slug: 'noticias-legales',
    nombre: 'Noticias Legales',
    descripcion: 'Novedades legislativas, reformas legales y cambios normativos en Honduras: Código Penal, Familia, Trabajo y leyes tributarias y administrativas.',
    color: 'info',
  },
  {
    slug: 'practica-legal',
    nombre: 'Práctica Legal',
    descripcion: 'Consejos prácticos para abogados, estudiantes de derecho y profesionales del sistema judicial hondureño: gestión del despacho y litigio.',
    color: 'success',
  },
  {
    slug: 'derechos-ciudadanos',
    nombre: 'Derechos Ciudadanos',
    descripcion: 'Información sobre derechos fundamentales, garantías constitucionales, amparo, hábeas corpus y mecanismos de protección ciudadana en Honduras.',
    color: 'primary',
  },
  {
    slug: 'derecho-bancario',
    nombre: 'Derecho Bancario',
    descripcion: 'Demandas bancarias, deudas, ejecución hipotecaria, tarjetas de crédito, central de riesgos y derechos del consumidor financiero en Honduras.',
    color: 'warning',
  },
  {
    slug: 'derecho-administrativo',
    nombre: 'Derecho Administrativo',
    descripcion: 'Amparo, contratación pública, sanciones administrativas, expropiación, servicio civil y defensa de particulares frente al Estado hondureño.',
    color: 'muted',
  },
  {
    slug: 'derecho-aduanero',
    nombre: 'Derecho Aduanero',
    descripcion: 'Importación y exportación, Código Aduanero Centroamericano, zonas libres (ZOLI), aranceles y trámites aduaneros para comerciantes en Honduras.',
    color: 'muted',
  },
  {
    slug: 'regulacion-sanitaria',
    nombre: 'Regulación Sanitaria',
    descripcion: 'Registros sanitarios ARSA, habilitación de clínicas y hospitales, responsabilidad médica, buena práctica de fabricación y regulación farmacéutica.',
    color: 'success',
  },
  {
    slug: 'propiedad-intelectual',
    nombre: 'Propiedad Intelectual',
    descripcion: 'Registro de marcas, patentes, derechos de autor, secreto comercial, NDA y protección de activos intangibles ante la Dirección de Propiedad Intelectual.',
    color: 'accent',
  },
  {
    slug: 'derecho-ambiental',
    nombre: 'Derecho Ambiental',
    descripcion: 'Licencias ambientales, delitos ecológicos, evaluación de impacto ambiental, permisos MiAmbiente y derechos de los pueblos indígenas en Honduras.',
    color: 'success',
  },
  {
    slug: 'conciliacion-arbitraje',
    nombre: 'Conciliación y Arbitraje',
    descripcion: 'Mediación, conciliación, arbitraje comercial, Centro de Conciliación y Arbitraje (CCIC) y métodos alternos de resolución de conflictos en Honduras.',
    color: 'info',
  },
];
