export interface DelitoBase {
  id: string;
  nombre: string;
  articulo: string;
  clasificacion?: string | null;
  penas_accesorias: string[];
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tiene_pena_alternativa: boolean;
  pena_alternativa_min: number;
  pena_alternativa_max: number;
}

export interface DelitoConfig {
  delito_id: string;
  pena_seleccionada: 'prision' | 'multa';
  variables_activas: string[];
  grado_autoria: string;
  grado_ejecucion: string;
  reduccion_tentativa: number;
  agravantes: string[];
  atenuantes: string[];
  eximentes: string[];
  eximente_completa: string | null;
}

export interface CalculoRequest {
  delitos: DelitoConfig[];
  tipo_concurso: string;
}

export interface ResultadoIndividual {
  delito: { id: string; nombre: string; articulo: string; clasificacion?: string | null; penas_accesorias: string[] };
  pena_min: number;
  pena_max: number;
  pena_recomendada: number;
  gravedad: string;
  tipo_pena: string;
  exento: boolean;
  pena_base_min: number;
  pena_base_max: number;
  modificaciones: string[];
}

export interface ResultadoConcurso {
  pena_min: number;
  pena_max: number;
  descripcion: string;
  articulo: string;
}

export interface DelitoAnalizado {
  delito_id: string;
  nombre: string;
  articulo: string;
  clasificacion: string;
  pena_base_min: number;
  pena_base_max: number;
  pena_base_texto: string;
  pena_individual_min: number;
  pena_individual_max: number;
  pena_individual_texto: string;
  pena_recomendada_meses: number;
  pena_recomendada_texto: string;
  gravedad: string;
  grado_autoria: string;
  grado_ejecucion: string;
  agravantes_aplicadas: string[];
  atenuantes_aplicadas: string[];
  penas_accesorias: string[];
  modificaciones: string[];
  exento: boolean;
}

export interface ResultadoCalculo {
  delitos_analizados: DelitoAnalizado[];
  tipo_concurso: string;
  concurso_descripcion: string;
  concurso_articulo: string;
  pena_principal: string;
  pena_principal_minimo_meses: number;
  pena_principal_maximo_meses: number;
  penas_accesorias: string[];
  analisis_juridico: string;
  fecha: string;
  disclaimer: string;
}
