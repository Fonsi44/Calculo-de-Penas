import { describe, expect, it } from 'vitest';
import { isPenalUrgencyPath, whatsappMessageForPath } from '@/lib/whatsapp-messages';

describe('mensajes de WhatsApp por ruta', () => {
  it('devuelve un mensaje específico para defensa penal', () => {
    expect(whatsappMessageForPath('/derecho-penal')).toMatch(/defensa penal urgente/i);
    expect(isPenalUrgencyPath('/derecho-penal')).toBe(true);
    expect(isPenalUrgencyPath('/derecho-penal/audiencia-inicial')).toBe(true);
  });

  it('usa un mensaje local para landings de ciudad', () => {
    expect(whatsappMessageForPath('/abogados-en-nacaome')).toMatch(/página local/i);
    expect(whatsappMessageForPath('/abogado-penalista-choluteca')).toMatch(/penalista/i);
    expect(isPenalUrgencyPath('/abogado-penalista-nacaome')).toBe(true);
  });

  it('no inventa PII ni claims comerciales prohibidos', () => {
    const message = whatsappMessageForPath('/solicitar-consulta');
    expect(message).toMatch(/evaluación inicial confidencial/i);
    expect(message).not.toMatch(/gratuit|sin costo|sin compromiso/i);
  });

  it('tiene un fallback seguro', () => {
    expect(whatsappMessageForPath(null)).toMatch(/orientación jurídica/i);
    expect(whatsappMessageForPath('/aviso-legal')).toMatch(/orientación jurídica/i);
    expect(isPenalUrgencyPath('/')).toBe(false);
  });
});
