# Rate Limiting — Limitaciones Conocidas

## Implementación actual

`lib/rate-limit.ts` implementa rate limiting **in-memory** usando un `Map<string, RateLimitEntry>`.

**NO usa Redis/Upstash** porque el plan es **$0 presupuesto**.

## Limitaciones técnicas

### 1. No funciona con múltiples instancias

**Problema**: En Vercel, una sola región puede tener múltiples instancias serverless
ejecutándose en paralelo (cold start, auto-scaling). El estado in-memory es **local
a cada instancia**.

**Impacto**: Un atacante con suerte puede evadir el rate limit golpeando instancias
diferentes. En la práctica, Vercel intenta mantener sticky sessions, así que el
impacto real es bajo.

**Mitigación futura** (Fase E):
- Upstash Redis (free tier: 10k comandos/día) — ~$0/mes
- Vercel KV (free tier: 256MB) — incluido en plan Pro
- Cloudflare Workers KV (free tier: 100k reads/día)

### 2. Se pierde en cold starts

**Problema**: Las funciones serverless de Vercel se "duermen" tras 5-15 minutos
de inactividad. El siguiente request las "despierta" con estado vacío.

**Impacto**: Un atacante puede esperar 15 min y volver a intentar, reseteando el
rate limit.

**Mitigación futura**: Persistencia externa (Upstash/Redis).

### 3. No detecta IPs detrás de proxies

**Problema**: En Vercel, `request.headers.get('x-forwarded-for')` puede contener
la IP del cliente O la IP del proxy de Vercel.

**Implementación actual** (`lib/rate-limit.ts` → `getClientIp`):
```ts
function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
```

**Válido** porque Vercel siempre rellena `x-forwarded-for` con la IP real del cliente.
La IP del proxy aparece después de la coma.

### 4. Sin curva de aprendizaje

**Problema**: El rate limit usa un modelo simple "X requests por Y segundos". No
detecta patrones de ataque sostenido (DDoS).

**Mitigación futura**: Cloudflare (free tier) o Vercel WAF (Pro).

## Rate limits actuales

| Endpoint | Límite | Ventana | Config |
|----------|--------|---------|--------|
| `POST /api/auth/login` | 5 | 60s | `RATE_LIMIT_LOGIN` |
| `POST /api/auth/register` | 3 | 60s | `RATE_LIMIT_REGISTER` |
| `POST /api/calcular` | 30 | 60s | `RATE_LIMIT_CALCULAR` |
| `GET /api/auth/me` | 60 | 60s | `RATE_LIMIT_ME` |
| (general API) | 100 | 60s | `RATE_LIMIT_DEFAULT` |

Config en `lib/rate-limit.ts` constantes. Ajustables en commit.

## Tests

`tests/rate-limit.test.ts` (16 tests) cubre:
- Permite N requests, rechaza N+1
- Resetea tras la ventana
- Diferentes keys son independientes
- Headers correctos (`X-RateLimit-*`, `Retry-After`)

## Decisión de diseño

**Por qué in-memory**:
- $0/mes (Upstash cuesta $0.20/100k comandos, free tier limitado)
- Implementación simple, sin infraestructura extra
- Suficiente para amenaza casual (bots, scrapers)

**Cuándo migrar a Redis**:
- Si vemos > 10k requests/mes desde misma IP
- Si vemos patrones de DDoS
- Si tenemos tráfico legítimo > 1k DAU

## Roadmap

- [ ] **Fase E**: Evaluar migración a Vercel KV (incluido en Pro)
- [ ] **Fase E**: Evaluar Cloudflare WAF free tier
- [ ] **Fase E**: Añadir métricas Prometheus de rate limit hits
