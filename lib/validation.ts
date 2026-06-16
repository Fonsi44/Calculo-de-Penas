import { z } from 'zod';
import {
  AGRAVANTES,
  ATENUANTES,
  EXIMENTES,
  GRADOS_AUTORIA,
  GRADOS_EJECUCION,
  TIPOS_CONCURSO,
} from './catalogos';
import { isAllowedAuthEmail } from './auth';

const ids = <T extends { id: string }>(items: T[]): [string, ...string[]] =>
  items.map((i) => i.id) as [string, ...string[]];

const ID_AGRAVANTES = ids(AGRAVANTES);
const ID_ATENUANTES = ids(ATENUANTES);
const ID_EXIMENTES = ids(EXIMENTES);
const ID_GRADO_AUTORIA = ids(GRADOS_AUTORIA);
const ID_GRADO_EJECUCION = ids(GRADOS_EJECUCION);
const ID_TIPOS_CONCURSO = ids(TIPOS_CONCURSO);

export const calcularSchema = z.object({
  delitos: z.array(z.object({
    delito_id: z.string().min(1),
    pena_seleccionada: z.enum(['prision', 'multa']),
    variables_activas: z.array(z.string()),
    grado_autoria: z.enum(ID_GRADO_AUTORIA),
    grado_ejecucion: z.enum(ID_GRADO_EJECUCION),
    reduccion_tentativa: z.number().int().min(1).max(2),
    agravantes: z.array(z.enum(ID_AGRAVANTES)),
    atenuantes: z.array(z.enum(ID_ATENUANTES)),
    eximentes: z.array(z.enum(ID_EXIMENTES)),
    eximente_completa: z.enum(ID_EXIMENTES).nullable(),
    // Fase 2/3/5 — campos opcionales para enriquecer el cálculo.
    // Si no se envían, el motor usa la pena base genérica del delito.
    supuesto_penal_id: z.string().uuid().nullable().optional(),
    agravantes_especificas_ids: z.array(z.string().uuid()).optional(),
  })).min(1),
  tipo_concurso: z.enum(ID_TIPOS_CONCURSO),
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
  email: z
    .string()
    .email('Email inválido')
    .refine(isAllowedAuthEmail, {
      message: 'Solo se permiten correos del dominio @pinedayasociadoshn.com',
    }),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().min(1, 'Nombre requerido'),
});

export const authLoginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .refine(isAllowedAuthEmail, {
      message: 'Solo se permiten correos del dominio @pinedayasociadoshn.com',
    }),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const CONTACTO_ASUNTOS = [
  'Cita para consulta',
  'Derecho penal',
  'Derecho de familia',
  'Derecho laboral',
  'Derecho civil y notarial',
  'Derecho mercantil y empresarial',
  'Derecho bancario y financiero',
  'Derecho administrativo',
  'Derecho aduanero y comercio exterior',
  'Regulación sanitaria',
  'Extranjería en Honduras',
  'Propiedad intelectual',
  'Derecho tributario y fiscal',
  'Derecho ambiental',
  'Conciliación y arbitraje',
  'Otro asunto',
] as const;

export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(200),
  telefono: z.string().trim().min(1, 'Teléfono requerido').max(50),
  email: z
    .string()
    .trim()
    .max(255)
    .email('Email inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  asunto: z.enum(CONTACTO_ASUNTOS, { message: 'Asunto inválido' }),
  mensaje: z.string().trim().min(10, 'Mínimo 10 caracteres').max(5000),
  acepta: z.literal(true, { message: 'Debe aceptar la política de privacidad' }),
});

export const CONSULTA_MOTIVOS = [
  'Familiar detenido',
  'Citaciones o audiencias',
  'Investigación en curso',
  'Querella o denuncia',
  'Recurso o apelación',
  'Asesoría preventiva',
  'Atención a víctima',
  'Otro asunto',
] as const;

export const consultaSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(200),
  telefono: z.string().trim().min(1, 'Teléfono requerido').max(50),
  email: z
    .string()
    .trim()
    .max(255)
    .email('Email inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  motivo: z.enum(CONSULTA_MOTIVOS, { message: 'Motivo inválido' }),
  resumen: z.string().trim().min(15, 'Mínimo 15 caracteres').max(5000),
  acepta: z.literal(true, { message: 'Debe aceptar la política de privacidad' }),
});

export type ContactoInput = z.infer<typeof contactoSchema>;
export type ConsultaInput = z.infer<typeof consultaSchema>;

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
