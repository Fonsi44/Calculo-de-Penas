export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
