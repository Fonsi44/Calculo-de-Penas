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
  pena_texto?: string;
}

export interface Clasificacion {
  nombre: string;
  cantidad: number;
}

export interface CatalogoItem {
  id: string;
  nombre: string;
  articulo?: string;
  descripcion?: string;
  completa?: boolean;
  efecto?: string;
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
}

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
