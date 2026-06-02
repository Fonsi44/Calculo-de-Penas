export interface CatalogoItem {
  id: string;
  nombre: string;
  articulo?: string;
  descripcion?: string;
  completa?: boolean;
  efecto?: string;
}

export const AGRAVANTES: CatalogoItem[] = [
  { id: 'alevosia', articulo: 'Art. 32.1 CP', nombre: 'Alevosía', descripcion: 'Emplear medios que aseguren la ejecución sin riesgo para el autor' },
  { id: 'abuso_superioridad', articulo: 'Art. 32.2 CP', nombre: 'Abuso de superioridad o confianza', descripcion: 'Ejecutar el hecho mediante abuso de superioridad o de confianza' },
  { id: 'ensanamiento', articulo: 'Art. 32.3 CP', nombre: 'Ensañamiento', descripcion: 'Aumentar deliberada e inhumanamente el sufrimiento de la víctima' },
  { id: 'disfraz', articulo: 'Art. 32.4 CP', nombre: 'Disfraz', descripcion: 'Ejecutar el hecho mediante disfraz o aprovechando circunstancias de tiempo y lugar' },
  { id: 'precio', articulo: 'Art. 32.5 CP', nombre: 'Precio, recompensa o promesa', descripcion: 'Cometer el hecho por precio, recompensa o promesa remuneratoria' },
  { id: 'prevalimiento', articulo: 'Art. 32.6 CP', nombre: 'Prevalimiento del carácter público', descripcion: 'Prevalerse del carácter público que tenga el culpable' },
  { id: 'victima_menor', articulo: 'Art. 32.7 CP', nombre: 'Valerse de menor o discapacitado', descripcion: 'Ejecutar el hecho valiéndose de persona menor de 18 años o con discapacidad' },
  { id: 'discriminacion', articulo: 'Art. 32.8 CP', nombre: 'Motivos discriminatorios', descripcion: 'Por motivos de raza, género, religión, orientación sexual, identidad de género, etc.' },
  { id: 'reincidencia', articulo: 'Art. 32.9 CP', nombre: 'Reincidencia', descripcion: 'Haber sido condenado previamente por delito de igual naturaleza' },
  { id: 'multiples_victimas', articulo: 'Art. 32.10 CP', nombre: 'Pluralidad de víctimas', descripcion: 'Cometer el delito contra múltiples víctimas' },
];

export const ATENUANTES: CatalogoItem[] = [
  { id: 'eximente_incompleta', articulo: 'Art. 31.1 CP', nombre: 'Eximente incompleta', descripcion: 'Causa de exención incompleta (atenuante cualificada)' },
  { id: 'arrebato', articulo: 'Art. 31.2 CP', nombre: 'Arrebato u obcecación', descripcion: 'Actuar por estímulos tan poderosos que produzcan arrebato u obcecación' },
  { id: 'reparacion', articulo: 'Art. 31.3 CP', nombre: 'Reparación del daño', descripcion: 'Haber reparado el daño causado o disminuido sus efectos' },
  { id: 'menor_edad', articulo: 'Art. 31.4 CP', nombre: 'Menor de 21 años', descripcion: 'Ser mayor de 18 años y menor de 21 años' },
  { id: 'confesion', articulo: 'Art. 31.5 CP', nombre: 'Confesión del delito', descripcion: 'Haber confesado la infracción antes de conocer el inicio del procedimiento' },
  { id: 'analoga', articulo: 'Art. 31.6 CP', nombre: 'Circunstancia análoga', descripcion: 'Cualquier otra circunstancia análoga a las anteriores' },
];

export const EXIMENTES: CatalogoItem[] = [
  { id: 'inimputabilidad', articulo: 'Art. 30.1 CP', nombre: 'Inimputabilidad', descripcion: 'Anomalía o alteración psíquica, intoxicación plena, alteración de la percepción', completa: true },
  { id: 'legitima_defensa', articulo: 'Art. 30.4 CP', nombre: 'Legítima defensa', completa: true, descripcion: 'Defensa necesaria de bienes jurídicos propios o ajenos' },
  { id: 'estado_necesidad', articulo: 'Art. 30.5 CP', nombre: 'Estado de necesidad', completa: true, descripcion: 'Para evitar un mal propio o ajeno lesionando un bien jurídico' },
  { id: 'miedo_insuperable', articulo: 'Art. 30.6 CP', nombre: 'Miedo insuperable', completa: true, descripcion: 'Actuar por miedo insuperable a un mal igual o mayor' },
  { id: 'cumplimiento_deber', articulo: 'Art. 30.2 CP', nombre: 'Cumplimiento de deber', completa: true, descripcion: 'Actuar en cumplimiento de un específico deber jurídico' },
];

export const GRADOS_AUTORIA: CatalogoItem[] = [
  { id: 'autor_directo', nombre: 'Autor Directo', articulo: 'Art. 25 CP', descripcion: 'Realiza la conducta punible por sí mismo', efecto: 'pena_integra' },
  { id: 'coautor', nombre: 'Coautor', articulo: 'Art. 25 CP', descripcion: 'Realizan la conducta punible conjuntamente', efecto: 'pena_integra' },
  { id: 'inductor', nombre: 'Inductor', articulo: 'Art. 26 párr. 2° CP', descripcion: 'Determina dolosamente a otro a realizar un hecho delictivo', efecto: 'pena_integra' },
  { id: 'complice', nombre: 'Cómplice', articulo: 'Art. 26 párr. 3° CP', descripcion: 'Coopera con actos anteriores o simultáneos no necesarios', efecto: 'pena_inferior_1_3' },
];

export const GRADOS_EJECUCION: CatalogoItem[] = [
  { id: 'consumado', nombre: 'Consumado', articulo: 'Art. 19 CP', descripcion: 'Se han realizado todos los actos y producido el resultado', efecto: 'pena_integra' },
  { id: 'tentativa_acabada', nombre: 'Tentativa Acabada', articulo: 'Art. 21 y 62 CP', descripcion: 'Se realizan todos los actos pero no se produce el resultado', efecto: 'pena_inferior_1_4' },
  { id: 'tentativa_inacabada', nombre: 'Tentativa Inacabada', articulo: 'Art. 21 y 62 CP', descripcion: 'Se ejecuta solo parte de los actos de ejecución', efecto: 'pena_inferior_1_3' },
];

export const TIPOS_CONCURSO: CatalogoItem[] = [
  { id: 'real', nombre: 'Concurso Real', articulo: 'Art. 66 CP', descripcion: 'Pluralidad de hechos delictivos independientes. Se acumulan las penas respetando los límites legales (triple de la más grave, máx. 30 años, o 40 si algún delito excede 20 años).' },
  { id: 'ideal', nombre: 'Concurso Ideal', articulo: 'Art. 67 CP', descripcion: 'Una sola acción u omisión infringe varias disposiciones legales. Pena de la infracción más grave aumentada en 1/3.' },
  { id: 'continuado', nombre: 'Delito Continuado', articulo: 'Art. 68 CP', descripcion: 'Pluralidad de acciones con misma finalidad delictiva. Pena en mitad superior de la más grave, pudiendo llegar hasta +1/3.' },
];
