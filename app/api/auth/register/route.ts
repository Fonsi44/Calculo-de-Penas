import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';

export async function POST(request: Request) {
  await audit({
    accion: 'unauthorized_access',
    ip: ipFromRequest(request),
    userAgent: uaFromRequest(request),
    exito: false,
    metadata: { kind: 'public_register_disabled' },
    mensaje: 'Intento de registro publico bloqueado',
  });

  return Response.json(
    {
      error: 'El alta de usuarios requiere invitacion o creacion por un administrador.',
    },
    { status: 403 },
  );
}
