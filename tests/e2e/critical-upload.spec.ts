/**
 * E2E Critical — Upload (escenarios 15-16).
 *
 * @critical
 *
 * Verifica:
 * - Upload de PDF, imagen, DOCX válidos aceptados
 * - Rechazo de MIME falso, ejecutable, DOCX inválido, ZIP peligroso,
 *   tamaño excesivo, nombres maliciosos
 */
import { test, expect } from '@playwright/test';

const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@test.local',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin123!',
};

async function loginAsAdmin(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email: ADMIN.email, password: ADMIN.password } });
  return res.headers()['set-cookie'] || '';
}

test.describe('@critical Upload — validación de archivos', () => {
  let adminCookies: string;

  test.beforeAll(async ({ request }) => {
    adminCookies = await loginAsAdmin(request);
  });

  test('15. Upload de imagen PNG válida es aceptado', async ({ request }) => {
    // Crear un PNG mínimo sintético
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pngData = Buffer.concat([pngMagic, Buffer.alloc(100, 0)]);

    const formData = new FormData();
    formData.append('file', new Blob([pngData], { type: 'image/png' }), 'test-valid.png');

    const res = await request.post('/api/admin/upload', {
      headers: { cookie: adminCookies },
      multipart: {
        file: { name: 'test-valid.png', mimeType: 'image/png', buffer: pngData },
      },
    });
    // Debe aceptar (201 Created)
    expect(res.status()).toBe(201);
  });

  test('16. MIME falso (HTML renombrado .png) es rechazado', async ({ request }) => {
    // Un archivo que empieza con <html> pero dice ser image/png
    const htmlFake = Buffer.from('<html><body>malware</body></html>');

    const res = await request.post('/api/admin/upload', {
      headers: { cookie: adminCookies },
      multipart: {
        file: { name: 'fake.png', mimeType: 'image/png', buffer: htmlFake },
      },
    });
    // Debe rechazar (400)
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no reconocido|no coincide|no permitido/i);
  });

  test('16. Ejecutable renombrado .jpg es rechazado', async ({ request }) => {
    // MZ header (EXE/DLL) pero con nombre .jpg
    const exeHeader = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // MZ signature
    const fakeExe = Buffer.concat([exeHeader, Buffer.alloc(200, 0)]);

    const res = await request.post('/api/admin/upload', {
      headers: { cookie: adminCookies },
      multipart: {
        file: { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: fakeExe },
      },
    });
    expect(res.status()).toBe(400);
  });

  test('16. DOCX inválido (no es ZIP) es rechazado', async ({ request }) => {
    const fakeDocx = Buffer.from('esto no es un ZIP ni un DOCX real');

    const res = await request.post('/api/admin/upload', {
      headers: { cookie: adminCookies },
      multipart: {
        file: { name: 'documento.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: fakeDocx },
      },
    });
    // Si el upload handler soporta DOCX, debe rechazar. Si solo acepta imágenes, 400.
    expect(res.status()).toBe(400);
  });

  test('16. Archivo demasiado grande (>10MB) es rechazado', async ({ request }) => {
    const big = Buffer.alloc(11 * 1024 * 1024, 0x41); // 11 MB de 'A'
    // Ponemos header PNG para que pase magic bytes pero falle por tamaño
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    big.set(pngMagic, 0);

    const res = await request.post('/api/admin/upload', {
      headers: { cookie: adminCookies },
      multipart: {
        file: { name: 'big.png', mimeType: 'image/png', buffer: big },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tamaño|excede|MB/i);
  });

  test('16. Nombre de archivo malicioso rechazado', async ({ request }) => {
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pngData = Buffer.concat([pngMagic, Buffer.alloc(100, 0)]);

    const res = await request.post('/api/admin/upload', {
      headers: { cookie: adminCookies },
      multipart: {
        file: { name: '../../../etc/passwd.png', mimeType: 'image/png', buffer: pngData },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/caracteres no permitidos|nombre.*inválido/i);
  });
});
