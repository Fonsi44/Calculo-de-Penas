export interface Delito {
  id: string;
  nombre: string;
  articulo: string;
  conducta: string;
  rama_id?: string | null;
  constitucion_articulo_id?: number | null;
  clasificacion?: string;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  pena_alternativa_min: number;
  pena_alternativa_max: number;
  tiene_pena_alternativa: boolean;
  penas_accesorias: string[];
  observaciones?: string | null;
  es_grave: boolean;
  tipo_pena_principal?: string | null;
  tiene_prision?: boolean;
  prision_min_valor?: number | null;
  prision_max_valor?: number | null;
  tiene_multa?: boolean;
  multa_min_valor?: number | null;
  multa_max_valor?: number | null;
  multa_unidad?: string | null;
  requiere_revision_humana?: boolean;
  confianza_extraccion?: number | null;
  pena_texto?: string;
  estado?: 'verificado' | 'pendiente_revision' | 'rechazado';
  estado_nota?: string | null;
  estado_articulo_sugerido?: string | null;
}

export interface Clasificacion {
  nombre: string;
  cantidad: number;
}

export interface DelitoConfig {
  delito: Delito;
  pena_seleccionada: 'prision' | 'multa';
  variables_activas: string[];
  grado_autoria: string;
  grado_ejecucion: string;
  reduccion_tentativa: number;
  agravantes: string[];
  atenuantes: string[];
  eximentes: string[];
  eximente_completa: string | null;
  /** Fase 5 — Supuesto penal (modalidad específica) seleccionado. */
  supuesto_penal_id?: string | null;
  /** Fase 3/5 — Agravantes específicas del tipo marcadas. */
  agravantes_especificas_ids?: string[];
}

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
