import { describe, it, expect, beforeEach } from 'vitest';
import { calcularSchema, contactoSchema, validate, authRegisterSchema, authLoginSchema } from '../lib/validation';
import { isAllowedAuthEmail, ALLOWED_EMAIL_DOMAIN, TEST_EMAIL_DOMAINS } from '../lib/auth';

describe('validation.ts - calcularSchema', () => {
  const baseDelito = {
    delito_id: 'd1',
    pena_seleccionada: 'prision' as const,
    variables_activas: [],
    grado_autoria: 'autor_directo' as const,
    grado_ejecucion: 'consumado' as const,
    reduccion_tentativa: 1,
    agravantes: [],
    atenuantes: [],
    eximentes: [],
    eximente_completa: null,
  };

  const validRequest = {
    delitos: [baseDelito],
    tipo_concurso: 'ninguno' as const,
  };

  it('acepta un request válido mínimo', () => {
    const r = validate(calcularSchema, validRequest);
    expect(r.success).toBe(true);
  });

  it('rechaza grado_autoria inválido', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, grado_autoria: 'pirata' }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.toLowerCase()).toMatch(/grado_autoria|invalid|pirata/);
    }
  });

  it('rechaza agravante con id inexistente', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, agravantes: ['id_falso_inexistente'] }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza atenuante con id inexistente', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, atenuantes: ['no_existe'] }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza eximente_completa con id inexistente', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, eximente_completa: 'invalida' }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza tipo_concurso inválido', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      tipo_concurso: 'mixto',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza pena_seleccionada distinta del enum', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, pena_seleccionada: 'trabalenguas' }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza reduccion_tentativa fuera de rango', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, reduccion_tentativa: 5 }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza array de delitos vacío', () => {
    const r = validate(calcularSchema, { ...validRequest, delitos: [] });
    expect(r.success).toBe(false);
  });

  it('acepta todos los IDs válidos de los catálogos', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{
        ...baseDelito,
        grado_autoria: 'complice',
        grado_ejecucion: 'tentativa_inacabada',
        reduccion_tentativa: 2,
        agravantes: ['alevosia', 'reincidencia'],
        atenuantes: ['arrebato', 'reparacion'],
        eximentes: [],
        eximente_completa: 'legitima_defensa',
      }],
      tipo_concurso: 'real',
    });
    expect(r.success).toBe(true);
  });
});

describe('validation.ts - contactoSchema', () => {
  const baseValido = {
    nombre: 'Juan Pérez',
    telefono: '+504 9536-3724',
    email: 'juan@example.com',
    asunto: 'Cita para consulta' as const,
    mensaje: 'Necesito orientación sobre un caso penal.',
    acepta: true as const,
  };

  it('acepta un payload válido', () => {
    const r = validate(contactoSchema, baseValido);
    expect(r.success).toBe(true);
  });

  it('acepta email vacío (opcional)', () => {
    const r = validate(contactoSchema, { ...baseValido, email: '' });
    expect(r.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const r = validate(contactoSchema, { ...baseValido, nombre: '   ' });
    expect(r.success).toBe(false);
  });

  it('rechaza mensaje < 10 caracteres', () => {
    const r = validate(contactoSchema, { ...baseValido, mensaje: 'corto' });
    expect(r.success).toBe(false);
  });

  it('rechaza asunto fuera del enum', () => {
    const r = validate(contactoSchema, { ...baseValido, asunto: 'Otro tema' });
    expect(r.success).toBe(false);
  });

  it('rechaza acepta=false', () => {
    const r = validate(contactoSchema, { ...baseValido, acepta: false });
    expect(r.success).toBe(false);
  });

  it('rechaza email inválido', () => {
    const r = validate(contactoSchema, { ...baseValido, email: 'no-es-email' });
    expect(r.success).toBe(false);
  });

  it('hace trim de nombre y teléfono', () => {
    const r = validate(contactoSchema, { ...baseValido, nombre: '  Ana  ', telefono: '  +504 9999  ' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nombre).toBe('Ana');
      expect(r.data.telefono).toBe('+504 9999');
    }
  });
});

describe('validation.ts - authRegisterSchema con restricción de dominio', () => {
  const baseValido = {
    email: 'carlos@pinedayasociadoshn.com',
    password: 'password123',
    nombre: 'Carlos Pineda',
  };

  const env = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    env.ALLOW_TEST_EMAILS = undefined;
    env.NODE_ENV = undefined;
  });

  it('acepta email del dominio permitido', () => {
    const r = validate(authRegisterSchema, baseValido);
    expect(r.success).toBe(true);
  });

  it('rechaza email de dominio externo', () => {
    const r = validate(authRegisterSchema, { ...baseValido, email: 'carlos@gmail.com' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.toLowerCase()).toMatch(/pinedayasociadoshn\.com/);
    }
  });

  it('rechaza email con dominio similar malicioso (pinedayasociadoshn.com.evil.com)', () => {
    const r = validate(authRegisterSchema, {
      ...baseValido,
      email: 'carlos@pinedayasociadoshn.com.evil.com',
    });
    expect(r.success).toBe(false);
  });

  it('acepta mayúsculas y minúsculas en el dominio permitido', () => {
    const r = validate(authRegisterSchema, { ...baseValido, email: 'CARLOS@PinedayAsociadosHN.com' });
    expect(r.success).toBe(true);
  });

  it('rechaza dominio de test cuando ALLOW_TEST_EMAILS no está activo', () => {
    const r = validate(authRegisterSchema, { ...baseValido, email: 'e2e-1234@test.local' });
    expect(r.success).toBe(false);
  });

  it('acepta dominio de test cuando ALLOW_TEST_EMAILS=true', () => {
    env.ALLOW_TEST_EMAILS = 'true';
    const r = validate(authRegisterSchema, { ...baseValido, email: 'e2e-1234@test.local' });
    expect(r.success).toBe(true);
  });

  it('acepta dominio de test cuando NODE_ENV=test', () => {
    env.NODE_ENV = 'test';
    const r = validate(authRegisterSchema, { ...baseValido, email: 'user@example.com' });
    expect(r.success).toBe(true);
  });
});

describe('validation.ts - authLoginSchema con restricción de dominio', () => {
  const baseValido = {
    email: 'carlos@pinedayasociadoshn.com',
    password: 'password123',
  };

  const env = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    env.ALLOW_TEST_EMAILS = undefined;
    env.NODE_ENV = undefined;
  });

  it('acepta email del dominio permitido', () => {
    const r = validate(authLoginSchema, baseValido);
    expect(r.success).toBe(true);
  });

  it('rechaza email de dominio externo', () => {
    const r = validate(authLoginSchema, { ...baseValido, email: 'usuario@otro.com' });
    expect(r.success).toBe(false);
  });
});

describe('lib/auth - isAllowedAuthEmail', () => {
  const env = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    env.ALLOW_TEST_EMAILS = undefined;
    env.NODE_ENV = undefined;
  });

  it('exporta ALLOWED_EMAIL_DOMAIN correcto', () => {
    expect(ALLOWED_EMAIL_DOMAIN).toBe('@pinedayasociadoshn.com');
  });

  it('exporta TEST_EMAIL_DOMAINS con @test.local y @example.com', () => {
    expect(TEST_EMAIL_DOMAINS).toContain('@test.local');
    expect(TEST_EMAIL_DOMAINS).toContain('@example.com');
  });

  it('rechaza emails vacíos o solo espacios', () => {
    expect(isAllowedAuthEmail('')).toBe(false);
    expect(isAllowedAuthEmail('   ')).toBe(false);
  });

  it('bloquea gmail en modo producción (sin env vars de test)', () => {
    expect(isAllowedAuthEmail('usuario@gmail.com')).toBe(false);
  });

  it('bypass solo aplica a TEST_EMAIL_DOMAINS, no a cualquier dominio', () => {
    env.ALLOW_TEST_EMAILS = 'true';
    expect(isAllowedAuthEmail('usuario@gmail.com')).toBe(false);
    expect(isAllowedAuthEmail('user@test.local')).toBe(true);
    expect(isAllowedAuthEmail('user@example.com')).toBe(true);
  });
});
