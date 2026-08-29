import { describe, it, expect } from 'vitest';
import { procesarMensajeLocal, type Intencion } from '../lib/chat/rules-engine';

describe('rules-engine — detección de intención', () => {
  const casos: Array<{ mensaje: string; intencion: Intencion }> = [
    { mensaje: 'Hola, buenas tardes', intencion: 'saludo' },
    { mensaje: 'Qué servicios tienen?', intencion: 'servicios' },
    { mensaje: 'Dónde están ubicados?', intencion: 'ubicacion' },
    { mensaje: 'Cuál es el horario de atención?', intencion: 'horario' },
    { mensaje: 'Cómo puedo contactarlos?', intencion: 'contacto' },
    { mensaje: 'Quiero preparar mi consulta', intencion: 'preparar_consulta' },
    { mensaje: 'Es un caso urgente, necesito ayuda ya', intencion: 'caso_urgente' },
    { mensaje: 'No sé qué área necesito', intencion: 'identificar_area' },
    { mensaje: 'Qué documentos necesito llevar?', intencion: 'checklist' },
    { mensaje: 'Quiero hablar por WhatsApp', intencion: 'whatsapp' },
    { mensaje: 'Dónde está el formulario de consulta?', intencion: 'formulario' },
    { mensaje: 'Qué hacen con mis datos personales?', intencion: 'privacidad' },
    { mensaje: 'Soy hondureño en España', intencion: 'migrantes' },
  ];

  for (const { mensaje, intencion } of casos) {
    it(`detecta intención "${intencion}" para: "${mensaje}"`, () => {
      const r = procesarMensajeLocal(mensaje);
      expect(r.intencion).toBe(intencion);
      expect(r.source).toBe('rules');
    });
  }
});

describe('rules-engine — urgencia', () => {
  it('marca urgent=true y prioriza contacto', () => {
    const r = procesarMensajeLocal('Mi familiar está detenido, es urgente');
    expect(r.urgent).toBe(true);
    expect(r.reply.toLowerCase()).toContain('whatsapp');
    expect(r.reply.toLowerCase()).toContain('teléfono');
  });

  it('no marca urgencia en consultas normales', () => {
    const r = procesarMensajeLocal('Hola, quiero información sobre divorcio');
    expect(r.urgent).toBe(false);
  });
});

describe('rules-engine — clasificación de área', () => {
  it('clasifica correctamente por keywords', () => {
    expect(procesarMensajeLocal('Me detuvieron ayer').area).toBe('penal');
    expect(procesarMensajeLocal('Quiero divorciarme').area).toBe('familia');
    expect(procesarMensajeLocal('Me despidieron sin motivo').area).toBe('laboral');
  });
});

describe('rules-engine — límites legales', () => {
  it('nunca promete resultados', () => {
    const respuestas = [
      'Hola',
      'Quiero demanda a mi jefe',
      '¿Ganaré mi caso?',
      'Necesito que me digan si voy a ganar',
      'Tengo un caso penal urgente',
    ].map((m) => procesarMensajeLocal(m).reply.toLowerCase());
    for (const r of respuestas) {
      expect(r).not.toContain('ganará');
      expect(r).not.toContain('usted ganará');
      expect(r).not.toContain('seguro que gan');
      expect(r).not.toContain('resultado asegurado');
    }
  });

  it('usa lenguaje provisional al clasificar área', () => {
    const r = procesarMensajeLocal('Me detuvieron y no sé qué área necesito');
    if (r.intencion === 'identificar_area' || r.area === 'penal') {
      // La respuesta debe contener lenguaje prudente o derivación
      const lower = r.reply.toLowerCase();
      const tieneLenguajePrudente =
        lower.includes('podría') ||
        lower.includes('parece') ||
        lower.includes('orientación') ||
        lower.includes('conviene') ||
        lower.includes('abogado');
      expect(tieneLenguajePrudente).toBe(true);
    }
  });

  it('la respuesta de no_entendido deriva a contacto humano', () => {
    const r = procesarMensajeLocal('xyz qwerty asdf');
    expect(r.intencion).toBe('no_entendido');
    expect(r.reply.toLowerCase()).toMatch(/whatsapp|despacho|preparar consulta/);
  });
});

describe('rules-engine — no transmisión a terceros', () => {
  it('el resultado siempre es source=rules (local)', () => {
    const mensajes = ['Hola', 'urgencia', 'divorcio', 'servicios', 'xyz'];
    for (const m of mensajes) {
      expect(procesarMensajeLocal(m).source).toBe('rules');
    }
  });

  it('las respuestas no contienen URLs (se filtran en sanitizeReply)', () => {
    const mensajes = ['Dónde están', 'Quiero WhatsApp', 'Servicios disponibles'];
    for (const m of mensajes) {
      const r = procesarMensajeLocal(m);
      // El reply crudo puede tener WhatsApp como texto, pero no URLs https://
      expect(r.reply).not.toMatch(/https?:\/\//);
    }
  });
});

describe('rules-engine — generador WhatsApp', () => {
  it('ofrece mensaje para WhatsApp cuando se pide', () => {
    const r = procesarMensajeLocal('Quiero hablar por WhatsApp');
    expect(r.intencion).toBe('whatsapp');
    expect(r.reply).toContain('WhatsApp');
    // Debe ofrecer un texto copiable (entre comillas)
    expect(r.reply).toContain('"');
  });

  it('el mensaje WhatsApp no contiene conclusiones legales', () => {
    const r = procesarMensajeLocal('Quiero hablar por WhatsApp sobre mi divorcio');
    expect(r.reply.toLowerCase()).not.toContain('ganar');
    expect(r.reply.toLowerCase()).not.toContain('demanda'); // no aconseja demandar
  });
});

describe('rules-engine — checklists', () => {
  it('ofrece checklist cuando se pide y hay área detectada', () => {
    const r = procesarMensajeLocal('Qué documentos necesito para un caso laboral?');
    expect(r.intencion).toBe('checklist');
    expect(r.area).toBe('laboral');
    expect(r.reply.toLowerCase()).toContain('contrato');
    expect(r.reply.toLowerCase()).toContain('orientativo');
  });

  it('pide aclarar área si no puede detectarla', () => {
    const r = procesarMensajeLocal('Qué documentos necesito llevar?');
    expect(r.intencion).toBe('checklist');
    expect(r.area).toBeNull();
    expect(r.reply.toLowerCase()).toContain('penal');
    expect(r.reply.toLowerCase()).toContain('familiar');
  });
});
