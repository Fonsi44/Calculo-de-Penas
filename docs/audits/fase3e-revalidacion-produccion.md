# Fase 3E — Revalidación on-demand en producción

**Fecha:** 2026-07-26
**Endpoint:** `POST /api/revalidate`
**Veredicto:** CERRADO. La revalidación on-demand funciona en producción con autorización robusta.

---

## Hallazgos de la auditoría (§3 del enunciado)

### Estado inicial (Fase 3D)

El endpoint `POST /api/revalidate` existía desde Fase 3D (commit `412fc430`) con:

- Autenticación `Authorization: Bearer <CRON_SECRET>`.
- Comparación timing-safe (`crypto.timingSafeEqual`).
- Schema Zod para `type` y `value`.
- Resolución `slug → path` vía DB.

### Bloqueo 1: `CRON_SECRET` no existía en producción

**Hallazgo:** `vercel env pull --environment=production` reveló que `CRON_SECRET` **no
estaba definida** en Vercel. El endpoint devolvía 401 siempre (el `autorizado()` falla
si `process.env.CRON_SECRET` está vacío).

**Solución:** Se creó `CRON_SECRET` en Vercel production (tipo Sensitive, 64 chars
hex criptográficamente seguros) vía API REST con el valor exacto en JSON. El valor
**nunca** se escribió en Git ni en logs; se cargó en memoria del proceso de validación
desde un archivo temporal restringido (`/tmp/.fase3e_cron_secret`, permisos 600) que se
eliminó tras su uso.

### Bloqueo 2: el proxy bloqueaba el endpoint

**Hallazgo:** Tras crear `CRON_SECRET`, el endpoint seguía devolviendo 401. La causa raíz
resultó ser el **proxy (middleware)** en `proxy.ts:143`: la regla genérica de `/api/*`
interceptaba `/api/revalidate` antes de que el handler pudiera verificar `CRON_SECRET`.
Como el endpoint no estaba en `PUBLIC_API_EXACT` y no hay token JWT en la llamada del
cron, el proxy devolvía 401. El mensaje `{"error":"No autorizado"}` es idéntico al del
handler, lo que ocultó el diagnóstico inicial.

**Solución:** Se añadió `/api/revalidate` a `PUBLIC_API_EXACT` en `proxy.ts`. El handler
tiene su propia autorización robusta (`CRON_SECRET` + `timingSafeEqual` + rate-limit +
allowlist), coherente con el patrón de `/api/chat` y `/api/contacto` que ya están en la
lista.

## Refuerzos aplicados (commit f327ac60)

### Allowlist de paths

`type: 'path'` ahora restringe a prefijos públicos explícitos
(`ALLOWED_PATH_PREFIXES`):

```
/blog, /preguntas-frecuentes, /abogados-en-, /abogado-penalista-,
/servicios-juridicos, /derecho-, /solicitar-consulta, /como-llegar,
/despacho, /hondurenos-en-espana, /
```

Impide revalidar rutas arbitrarias o privadas (`/intranet`, `/api`, `/admin`,
`/calculadora`, `/casos`, `/cp`, `/delitos`, `/preview`) aunque el caller conozca
`CRON_SECRET`. Las rutas no permitidas se devuelven en `rechazados`.

`type: 'slug'` es intrínsecamente seguro: resuelve el path vía DB, no desde entrada del
usuario.

### Rate limiting por IP

Defensivo (30/min) vía `lib/rate-limit.ts`. El `CRON_SECRET` es la barrera principal;
esto mitiga bucles accidentales o abuso si el secret se compromete. Mismo patrón que
`app/api/admin/*`.

### Logging sin secretos

Registro estructurado con `type`, `count`, `errores`, `rechazados` y un path de muestra.
**Nunca** se loguea el valor de `CRON_SECRET` ni el header `Authorization` completo.

## Método seguro usado para revalidar

1. `vercel env pull --environment=production` a archivo temporal gitignored.
2. Carga del valor en variable de proceso (memoria), sin imprimirlo.
3. `curl POST /api/revalidate` con `Authorization: Bearer $CRON_SECRET` (leído de la
   variable, sin pasar por disco de logs).
4. Eliminación del archivo temporal tras la operación.

**Resultado de la revalidación de los 15 slugs:**

```
HTTP 200
ok: true
count: 42 paths revalidados (14 slugs × 3 paths + 1 landing)
rechazados: []
errores: 1 → abogado-penalista-choluteca (es landing, revalidada vía type:path)
```

La landing `/abogado-penalista-choluteca` se revalidó por separado con `type: 'path'`
(HTTP 200, sin rechazos).

## Respuesta del endpoint

```json
{
  "ok": true,
  "revalidated": ["/blog/derecho-penal/<slug>", "/blog/derecho-penal", "/blog"],
  "errores": [],
  "rechazados": [],
  "count": 3
}
```

GET devuelve 405 (requiere POST con body JSON).

## Commits relacionados

- `412fc430` (Fase 3D): endpoint inicial.
- `f327ac60` (Fase 3E): allowlist + rate-limit + logging.
- `96d362f4` (Fase 3E): excepción en proxy.
- `7cf18f08` (Fase 3E): allowlist `/abogado-penalista-`.

## Rotación de `CRON_SECRET`

Si en el futuro se necesita rotar `CRON_SECRET`:

```bash
# 1. Generar nuevo secret
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"

# 2. Eliminar el anterior en Vercel
echo "y" | vercel env rm CRON_SECRET production

# 3. Añadir el nuevo (vía API REST para valor exacto)
TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"CRON_SECRET","value":"<NUEVO_VALOR>","type":"encrypted","target":["production"]}' \
  https://api.vercel.com/v9/projects/justicia-verdadera/env

# 4. Redeploy production
vercel redeploy <deployment-url>
```

Nunca commitear el valor. Si se sospecha compromiso, rotar inmediatamente.
