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
    descripcion: 'Análisis y comentarios sobre defensa penal, jurisprudencia y reformas al Código Penal hondureño.',
    color: 'danger',
  },
  {
    slug: 'proceso-penal',
    nombre: 'Proceso Penal',
    descripcion: 'Guías y explicaciones sobre cada etapa del proceso penal hondureño, desde la investigación hasta los recursos.',
    color: 'warning',
  },
  {
    slug: 'derecho-de-familia',
    nombre: 'Derecho de Familia',
    descripcion: 'Divorcio, custodia, alimentos, sucesiones y protección de menores en Honduras.',
    color: 'primary',
  },
  {
    slug: 'derecho-laboral',
    nombre: 'Derecho Laboral',
    descripcion: 'Despidos, prestaciones, riesgos profesionales y derechos de los trabajadores en Honduras.',
    color: 'accent',
  },
  {
    slug: 'derecho-civil',
    nombre: 'Derecho Civil y Notarial',
    descripcion: 'Contratos, inmuebles, deudas y actos notariales en el ordenamiento hondureño.',
    color: 'muted',
  },
  {
    slug: 'derecho-mercantil',
    nombre: 'Derecho Mercantil y Empresarial',
    descripcion: 'Constitución de empresas, contratos comerciales, marcas y propiedad intelectual.',
    color: 'accent',
  },
  {
    slug: 'extranjeria-migracion',
    nombre: 'Extranjería y Migración',
    descripcion: 'Visas, residencia, naturalización y trámites migratorios para extranjeros en Honduras.',
    color: 'primary',
  },
  {
    slug: 'hondurenos-en-espana',
    nombre: 'Hondureños en España',
    descripcion: 'Asistencia legal, gestión documental y trámites para hondureños residentes en España.',
    color: 'primary',
  },
  {
    slug: 'derecho-notarial',
    nombre: 'Derecho Notarial',
    descripcion: 'Poderes, actos notariales, protocolización de documentos y trámites notariales en Honduras.',
    color: 'muted',
  },
  {
    slug: 'tributario',
    nombre: 'Derecho Tributario',
    descripcion: 'Impuestos, fiscalización del SAR, planificación fiscal y defensa del contribuyente.',
    color: 'warning',
  },
  {
    slug: 'noticias-legales',
    nombre: 'Noticias Legales',
    descripcion: 'Novedades legislativas, reformas legales y cambios normativos en Honduras.',
    color: 'info',
  },
  {
    slug: 'practica-legal',
    nombre: 'Práctica Legal',
    descripcion: 'Consejos prácticos para abogados, estudiantes de derecho y profesionales del sistema judicial.',
    color: 'success',
  },
  {
    slug: 'derechos-ciudadanos',
    nombre: 'Derechos Ciudadanos',
    descripcion: 'Información sobre derechos fundamentales, garantías constitucionales y mecanismos de protección.',
    color: 'primary',
  },
  {
    slug: 'derecho-bancario',
    nombre: 'Derecho Bancario',
    descripcion: 'Demandas bancarias, deudas, ejecución hipotecaria, tarjetas de crédito y derechos del consumidor financiero.',
    color: 'warning',
  },
  {
    slug: 'derecho-administrativo',
    nombre: 'Derecho Administrativo',
    descripcion: 'Amparo, contratación pública, sanciones administrativas, expropiación y defensa frente al Estado.',
    color: 'muted',
  },
  {
    slug: 'derecho-aduanero',
    nombre: 'Derecho Aduanero',
    descripcion: 'Importación y exportación, Código Aduanero Centroamericano, zonas libres y trámites aduaneros.',
    color: 'muted',
  },
  {
    slug: 'regulacion-sanitaria',
    nombre: 'Regulación Sanitaria',
    descripcion: 'Registros sanitarios ARSA, habilitación de clínicas, responsabilidad médica y regulación farmacéutica.',
    color: 'success',
  },
  {
    slug: 'propiedad-intelectual',
    nombre: 'Propiedad Intelectual',
    descripcion: 'Marcas, patentes, derechos de autor, secreto comercial y protección de activos intangibles.',
    color: 'accent',
  },
  {
    slug: 'derecho-ambiental',
    nombre: 'Derecho Ambiental',
    descripcion: 'Licencias ambientales, delitos ecológicos, evaluación de impacto ambiental y derechos indígenas.',
    color: 'success',
  },
  {
    slug: 'conciliacion-arbitraje',
    nombre: 'Conciliación y Arbitraje',
    descripcion: 'Mediación, arbitraje comercial, CCIC, métodos alternos de resolución de conflictos.',
    color: 'info',
  },
];
