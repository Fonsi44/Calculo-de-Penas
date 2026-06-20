'use client';

/**
 * Helper de fetch centralizado para la intranet (H24).
 *
 * Problema resuelto: antes, cada página admin hacía `fetch(...)` suelto y, si
 * la sesión había expirado (token JWT caducado), los endpoints devolvían 401
 * que se ignoraban (catch vacío) o se mostraban como errores genéricos. El
 * dashboard quedaba en spinner o datos parciales sin explicación.
 *
 * `apiFetch` centraliza:
 *  - Redirección automática a /intranet/login?expired=1 cuando el backend
 *    responde 401 (sesión expirada). Evita estados rotos silenciosos.
 *  - Parseo consistente del JSON de error del backend ({ error: string }),
 *    lanzando `ApiError` con el mensaje legible.
 *  - Cabecera Content-Type por defecto para mutaciones JSON.
 *
 * Uso típico:
 *   try {
 *     const data = await apiFetch('/api/admin/blog', { method: 'POST', body: JSON.stringify(payload) });
 *   } catch (e) {
 *     if (e instanceof ApiError) toast.danger(e.message);
 *   }
 */

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let redirecting = false;

export interface ApiFetchOptions extends RequestInit {
  /**
   * Si true (default), una respuesta 401 redirige a /intranet/login?expired=1.
   * Ponlo a false solo para llamadas donde el 401 es esperado (p.ej. probe de
   * sesión en el propio login).
   */
  redirectOn401?: boolean;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { redirectOn401 = true, headers, ...rest } = options;

  // Content-Type por defecto para mutaciones con body (a menos que sea FormData).
  const finalHeaders = new Headers(headers);
  const hasBody = rest.body !== undefined && rest.body !== null;
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  if (hasBody && !isFormData && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: finalHeaders });
  } catch (e) {
    // Error de red (servidor caído, sin conexión).
    throw new ApiError(
      e instanceof Error ? `Error de red: ${e.message}` : 'Error de red',
      0,
    );
  }

  // Sesión expirada: redirigir una sola vez (evita bucles si hay varios
  // fetches en paralelo que devuelven 401 a la vez).
  if (res.status === 401 && redirectOn401) {
    if (!redirecting && typeof window !== 'undefined') {
      redirecting = true;
      // Conservar la URL actual para volver tras login.
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/intranet/login?expired=1&from=${from}`;
    }
    throw new ApiError('Sesión expirada. Redirigiendo al login…', 401);
  }

  // Parsear respuesta. Los endpoints devuelven { error: string } o
  // { error: string, details: ... } en caso de error de validación.
  let data: unknown = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const errObj = (data && typeof data === 'object' ? data : {}) as { error?: string; message?: string; details?: unknown };
    const message = errObj.error || errObj.message || `Error ${res.status}`;
    throw new ApiError(message, res.status, errObj.details);
  }

  return data as T;
}
