export type HttpErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: HttpErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Acceso denegado') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso no encontrado') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export function correlationIdFrom(request?: Request): string {
  return request?.headers.get('x-correlation-id') || crypto.randomUUID();
}

export function httpErrorResponse(error: unknown, request?: Request): Response {
  const correlationId = correlationIdFrom(request);
  const headers = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
  };
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({
      error: error.message,
      code: error.code,
      ...(error.details === undefined ? {} : { details: error.details }),
      correlationId,
    }), { status: error.status, headers });
  }
  console.error(`[${correlationId}] Error inesperado`, error);
  return new Response(JSON.stringify({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    correlationId,
  }), { status: 500, headers });
}
