/** Helpers de request para formularios públicos (sin auditoría de intranet). */

export function ipFromRequest(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? undefined;
}

export function uaFromRequest(request: Request): string | undefined {
  return request.headers.get('user-agent') ?? undefined;
}
