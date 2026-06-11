# 08 — Rate limiting

## Implementación

El rate limit está implementado en `lib/rate-limit.ts` usando la tabla `rate_limits` en Neon PostgreSQL (no in-memory). Esto garantiza persistencia entre instancias de Vercel.

**Ventajas sobre la implementación in-memory anterior:**
- Persiste entre fríos y múltiples instancias
- No se pierde al reiniciar el servidor
- Consistente en despliegues con varias réplicas

## Límites actuales

| Ruta | Método | Límite | Ventana |
|------|--------|--------|---------|
| `/api/auth/login` | POST | 5 | 1 minuto |
| `/api/auth/register` | POST | 5 | 1 minuto |
| `/api/consulta` | POST | 10 | 15 minutos |
| `/api/contacto` | POST | 10 | 15 minutos |
| `/api/seed` | POST | 3 | 1 hora |
| `/api/calcular` | POST | 30 | 1 minuto |

## Tests

- 16 tests específicos de rate limiting (`tests/rate-limit.test.ts`)
- Se ejecutan con base de datos de pruebas real (Neon branch)

## Limitaciones conocidas

- La identificación por IP funciona correctamente en Vercel (cabecera `x-forwarded-for`)
- Tras proxies o CDN, la IP puede no ser la real del cliente
- No hay límite global por usuario (solo por IP y ruta)
- La tabla `rate_limits` crece con cada intento; se limpia con TTL en la consulta
