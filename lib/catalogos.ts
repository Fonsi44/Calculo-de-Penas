export interface CatalogoItem {
  id: string;
  nombre: string;
  articulo?: string;
  descripcion?: string;
  completa?: boolean;
  efecto?: string;
}

export const AGRAVANTES: CatalogoItem[] = [
  { id: 'alevosia', articulo: 'Art. 27.1 CP', nombre: 'Alevosía', descripcion: 'Emplear medios que aseguren la ejecución sin riesgo para el autor' },
  { id: 'disfraz', articulo: 'Art. 27.2 CP', nombre: 'Disfraz o abuso de superioridad', descripcion: 'Usar disfraz o abusar de superioridad de fuerzas' },
  { id: 'precio', articulo: 'Art. 27.3 CP', nombre: 'Precio, recompensa o promesa', descripcion: 'Cometer el delito mediante precio, recompensa o promesa' },
  { id: 'discriminacion', articulo: 'Art. 27.4 CP', nombre: 'Motivos discriminatorios', descripcion: 'Por motivos de raza, género, religión, orientación sexual, etc.' },
  { id: 'ensanamiento', articulo: 'Art. 27.5 CP', nombre: 'Ensañamiento', descripcion: 'Aumentar deliberada e inhumanamente el sufrimiento de la víctima' },
  { id: 'abuso_confianza', articulo: 'Art. 27.6 CP', nombre: 'Abuso de confianza', descripcion: 'Quebrantar relación de confianza con la víctima' },
  { id: 'prevalimiento', articulo: 'Art. 27.7 CP', nombre: 'Prevalimiento del carácter público', descripcion: 'Aprovecharse de la condición de funcionario público' },
  { id: 'reincidencia', articulo: 'Art. 27.8 CP', nombre: 'Reincidencia', descripcion: 'Haber sido condenado previamente por delito de igual naturaleza' },
  { id: 'multiples_victimas', articulo: 'Art. 27.9 CP', nombre: 'Pluralidad de víctimas', descripcion: 'Cometer el delito contra múltiples víctimas' },
  { id: 'victima_vulnerable', articulo: 'Art. 27.10 CP', nombre: 'Víctima especialmente vulnerable', descripcion: 'Menor de edad, persona con discapacidad, anciano, etc.' },
];

export const ATENUANTES: CatalogoItem[] = [
  { id: 'eximente_incompleta', articulo: 'Art. 26.1 CP', nombre: 'Eximente incompleta', descripcion: 'Cuando no concurran todos los requisitos de una eximente' },
  { id: 'grave_adiccion', articulo: 'Art. 26.2 CP', nombre: 'Grave adicción', descripcion: 'Actuar bajo influencia de grave adicción a sustancias' },
  { id: 'arrebato', articulo: 'Art. 26.3 CP', nombre: 'Arrebato u obcecación', descripcion: 'Actuar por estímulos tan poderosos que produzcan arrebato' },
  { id: 'confesion', articulo: 'Art. 26.4 CP', nombre: 'Confesión del delito', descripcion: 'Haber confesado el delito antes de conocer el procedimiento' },
  { id: 'reparacion', articulo: 'Art. 26.5 CP', nombre: 'Reparación del daño', descripcion: 'Haber reparado el daño o disminuido sus efectos' },
  { id: 'dilaciones', articulo: 'Art. 26.6 CP', nombre: 'Dilaciones indebidas', descripcion: 'Dilaciones extraordinarias e indebidas en el procedimiento' },
  { id: 'menor_edad', articulo: 'Art. 26.7 CP', nombre: 'Menor de 21 años', descripcion: 'Ser menor de veintiún años' },
];

export const EXIMENTES: CatalogoItem[] = [
  { id: 'anomalia', articulo: 'Art. 25.1 CP', nombre: 'Anomalía o alteración psíquica', completa: true },
  { id: 'intoxicacion', articulo: 'Art. 25.2 CP', nombre: 'Intoxicación plena', completa: true },
  { id: 'alteracion_percepcion', articulo: 'Art. 25.3 CP', nombre: 'Alteración de la percepción', completa: true },
  { id: 'legitima_defensa', articulo: 'Art. 25.4 CP', nombre: 'Legítima defensa', completa: true },
  { id: 'estado_necesidad', articulo: 'Art. 25.5 CP', nombre: 'Estado de necesidad', completa: true },
  { id: 'miedo_insuperable', articulo: 'Art. 25.6 CP', nombre: 'Miedo insuperable', completa: true },
  { id: 'cumplimiento_deber', articulo: 'Art. 25.7 CP', nombre: 'Cumplimiento de un deber', completa: true },
  { id: 'eximente_incompleta', articulo: 'Art. 26.1 CP', nombre: 'Eximente incompleta', completa: false },
];

export const GRADOS_AUTORIA: CatalogoItem[] = [
  { id: 'autor_directo', nombre: 'Autor Directo', articulo: 'Art. 28 p. 1° CP', descripcion: 'Realiza el hecho por sí solo', efecto: 'pena_integra' },
  { id: 'coautor', nombre: 'Coautor', articulo: 'Art. 28 p. 1° CP', descripcion: 'Realizan el hecho conjuntamente', efecto: 'pena_integra' },
  { id: 'inductor', nombre: 'Inductor', articulo: 'Art. 28 p. 2° a) CP', descripcion: 'Induce directamente a otro a ejecutarlo', efecto: 'pena_integra' },
  { id: 'cooperador_necesario', nombre: 'Cooperador Necesario', articulo: 'Art. 28 p. 2° b) CP', descripcion: 'Coopera con acto sin el cual no se habría efectuado', efecto: 'pena_integra' },
  { id: 'complice', nombre: 'Cómplice', articulo: 'Art. 29 CP', descripcion: 'Coopera con actos anteriores o simultáneos (no necesarios)', efecto: 'pena_inferior_1_grado' },
];

export const GRADOS_EJECUCION: CatalogoItem[] = [
  { id: 'consumado', nombre: 'Consumado', articulo: 'Art. 15 CP', descripcion: 'Se han realizado todos los actos y producido el resultado', efecto: 'pena_integra' },
  { id: 'tentativa_acabada', nombre: 'Tentativa Acabada', articulo: 'Art. 16 y 62 CP', descripcion: 'Se practican todos los actos pero no se produce el resultado', efecto: 'pena_inferior_1_2_grados' },
  { id: 'tentativa_inacabada', nombre: 'Tentativa Inacabada', articulo: 'Art. 16 y 62 CP', descripcion: 'Se practica solo parte de los actos de ejecución', efecto: 'pena_inferior_1_2_grados' },
];

export const TIPOS_CONCURSO: CatalogoItem[] = [
  { id: 'real', nombre: 'Concurso Real', articulo: 'Art. 37 CP', descripcion: 'Pluralidad de hechos delictivos independientes. Se acumulan las penas respetando los límites legales máximos.' },
  { id: 'ideal', nombre: 'Concurso Ideal', articulo: 'Art. 36 CP', descripcion: 'Un solo hecho constituye dos o más delitos. Se aplica la pena del delito más grave en su mitad superior.' },
  { id: 'medial', nombre: 'Concurso Medial', articulo: 'Art. 36.2 CP', descripcion: 'Un delito es medio necesario para cometer otro. Se aplica la pena superior en grado a la del delito más grave.' },
  { id: 'continuado', nombre: 'Delito Continuado', articulo: 'Art. 35 CP', descripcion: 'Pluralidad de acciones con misma finalidad delictiva. Pena en mitad superior del delito más grave.' },
];
