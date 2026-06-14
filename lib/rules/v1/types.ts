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
  tipo_pena_principal?: string | null;
  tiene_prision?: boolean;
  prision_min_valor?: number | null;
  prision_max_valor?: number | null;
  tiene_multa?: boolean;
  multa_min_valor?: number | null;
  multa_max_valor?: number | null;
  multa_unidad?: string | null;
  multa_descripcion_legal?: string | null;
  inhabilitacion_min_valor?: number | null;
  inhabilitacion_max_valor?: number | null;
  inhabilitacion_unidad?: string | null;
  reglas_especiales_pena?: string | null;
  observaciones_pena?: string | null;
  requiere_revision_humana?: boolean;
  confianza_extraccion?: number | null;
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
  unidad: 'meses' | 'dias';
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

export type ConfianzaDelito = 'verificado' | 'pendiente_revision' | 'rechazado';

export interface DelitoAnalizado {
  delito_id: string;
  nombre: string;
  articulo: string;
  clasificacion: string;
  confianza: ConfianzaDelito;
  tipo_pena_principal: string | null;
  pena_base_min: number;
  pena_base_max: number;
  pena_base_texto: string;
  pena_individual_min: number;
  pena_individual_max: number;
  pena_individual_texto: string;
  pena_recomendada_meses: number;
  pena_recomendada_texto: string;
  tiene_multa: boolean;
  multa_min_valor: number | null;
  multa_max_valor: number | null;
  multa_unidad: string | null;
  multa_descripcion_legal: string | null;
  gravedad: string;
  grado_autoria: string;
  grado_ejecucion: string;
  agravantes_aplicadas: string[];
  atenuantes_aplicadas: string[];
  penas_accesorias: string[];
  inhabilitacion_min_valor: number | null;
  inhabilitacion_max_valor: number | null;
  inhabilitacion_unidad: string | null;
  reglas_especiales_pena: string | null;
  modificaciones: string[];
  exento: boolean;
  requiere_revision_humana: boolean;
  confianza_extraccion: number | null;
}

export interface ResultadoCalculo {
  version_motor: string;
  delitos_analizados: DelitoAnalizado[];
  tipo_concurso: string;
  concurso_descripcion: string;
  concurso_articulo: string;
  pena_principal: string;
  pena_principal_tipo: string | null;
  pena_principal_minimo_meses: number;
  pena_principal_maximo_meses: number;
  penas_accesorias: string[];
  analisis_juridico: string;
  fecha: string;
  disclaimer: string;
  requiere_revision: boolean;
  advertencias: string[];
}
