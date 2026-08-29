import { z } from 'zod';

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
  // Honeypot antispam: campo oculto visible solo para bots. Debe ir vacío.
  website: z
    .string()
    .max(0, 'Spam detectado')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const CONSULTA_MOTIVOS = [
  'Familiar detenido',
  'Citaciones o audiencias',
  'Investigación en curso',
  'Querella o denuncia',
  'Recurso o apelación',
  'Asesoría preventiva',
  'Atención a víctima',
  'Despido o prestaciones laborales',
  'Divorcio, custodia o pensión de alimentos',
  'Contrato, propiedad, sucesión o trámite notarial',
  'Asunto desde España',
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
  medioPreferido: z
    .enum(['whatsapp', 'telefono', 'email', 'llamada'], { message: 'Medio inválido' })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  localidad: z
    .string()
    .trim()
    .max(120, 'Localidad demasiado larga')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  urgencia: z
    .enum(['normal', 'alta', 'penal'], { message: 'Nivel de urgencia inválido' })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  fechaAudiencia: z
    .string()
    .trim()
    .max(60, 'Fecha demasiado larga')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  hayDetencion: z
    .enum(['si', 'no'], { message: 'Valor inválido' })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  fechaDespido: z
    .string()
    .trim()
    .max(60, 'Fecha demasiado larga')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  residenciaEspana: z
    .enum(['si', 'no'], { message: 'Valor inválido' })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  disponibleLlamada: z
    .enum(['si', 'no'], { message: 'Valor inválido' })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  website: z
    .string()
    .max(0, 'Spam detectado')
    .optional()
    .or(z.literal('').transform(() => undefined)),
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
