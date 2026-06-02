import { z } from 'zod';

export const calcularSchema = z.object({
  delitos: z.array(z.object({
    delito_id: z.string().min(1),
    pena_seleccionada: z.enum(['prision', 'multa']),
    variables_activas: z.array(z.string()),
    grado_autoria: z.string(),
    grado_ejecucion: z.string(),
    reduccion_tentativa: z.number().min(1).max(2),
    agravantes: z.array(z.string()),
    atenuantes: z.array(z.string()),
    eximentes: z.array(z.string()),
    eximente_completa: z.string().nullable(),
  })).min(1),
  tipo_concurso: z.string(),
});

export const delitoCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  articulo: z.string().min(1, 'Artículo requerido'),
  conducta: z.string().optional().default(''),
  clasificacion: z.string().optional().default(''),
  rama_id: z.string().nullable().optional(),
  constitucion_articulo_id: z.number().nullable().optional(),
  pena_minima_meses: z.number().int().min(0, 'Pena mínima inválida'),
  pena_maxima_meses: z.number().int().min(0, 'Pena máxima inválida'),
  tiene_pena_alternativa: z.boolean().optional().default(false),
  pena_alternativa_min: z.number().int().optional().default(0),
  pena_alternativa_max: z.number().int().optional().default(0),
  penas_accesorias: z.array(z.string()).optional().default([]),
  observaciones: z.string().nullable().optional(),
});

export const authRegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().min(1, 'Nombre requerido'),
});

export const authLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

function extractZodError(error: z.ZodError): string {
  try {
    const parsed = JSON.parse(error.message);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    return first?.message || 'Error de validación';
  } catch {
    return error.message || 'Error de validación';
  }
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: extractZodError(result.error) };
}
