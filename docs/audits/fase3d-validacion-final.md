# Fase 3D — Validación final

> Fecha: 2026-07-26 · Modo: `IMPLEMENTACIÓN`

## 1. Matriz de validación (§4 AGENTS.md)

Cambio transversal (nuevo endpoint API + bodies + DB) → suite completa.

| Comando | Estado | Detalle |
|---|---|---|
| `npm run lint` | ✓ | 0 errores, 1 warning preexistente (`public/sw.js` CACHE, vanilla JS) |
| `npx tsc --noEmit` | ✓ | 0 errores |
| `npm run test` | ✓ | 208/208 pasan (13 archivos Fase 3B/3C/3D) |
| `npm run build` | ✓ | (se ejecuta ×2 abajo para determinismo) |

## 2. Tests Fase 3D añadidos

| Archivo | Tests | Cubre |
|---|---|---|
| `tests/fase3d-sw-cache-determinism.test.ts` | 5 | placeholder en HEAD, idempotencia de bump, restauración, fallo sin BUILD_ID, --check no escribe |
| `tests/fase3d-claims-reconstruidos.test.ts` | 10 | estructura 16 claims, IDs únicos, valores canónicos, reconciliación Arts.218-226/253-254, no confirmed sin trazabilidad, idempotencia script |
| `tests/api/revalidate.test.ts` | 12 | 401 sin secret, 400 Zod, 200 path/slug, error post no publicado, GET 405 |
| `tests/fase3d-integridad.test.ts` | 12 | 10 supuestos §11 + resumen (15 artículos / 69 claims / distribución) |
| **Total Fase 3D** | **39** | |

## 3. Dos builds consecutivos (determinismo sw.js)

Tras el Commit 1 (placeholder restaurado), dos builds consecutivos no dejan
diferencias inesperadas en `public/sw.js`:

```
Build 1 → postbuild inyecta BUILD_ID real en sw.js (esperado, artefacto efímero)
git checkout public/sw.js → restaura placeholder (estado base commiteado)
Build 2 → mismo comportamiento, mismo patrón
git checkout public/sw.js → árbol limpio
```

El árbol base queda determinista: el placeholder es lo que se commitea; el
BUILD_ID real solo vive en el artefacto de build desplegado.

## 4. Validación DB Neon (estados reales)

Los 15 slugs del Lote 1 están en `ai_review_version = 'fase3d'` en DB Neon:

```
6 completed: abogado-penalista-sur, audiencia-inicial, cuando-necesito,
             defensa-penal-honduras, diferencia-denuncia-querella, fianza-medidas
9 needs_human_review: abogado-penalista-choluteca, allanamiento, antejuicio,
                      cuando-prescribe, defensa-penal-menores, delitos-mas-comunes,
                      derechos-detenido, estafas-fraudes, violencia-domestica
```

## 5. Validación de bodies (correcciones aplicadas)

9/9 correcciones verificadas como presentes en body DB (verificación directa
post-aplicación, no basada en texto plano del JSON). Bodies actualizados con
`updated_at = NOW()`.

## 6. Validación visual real (PENDIENTE post-push)

La §10 exige validación con navegador real. Como requiere despliegue Vercel,
se ejecuta tras `git push origin main`:

- [ ] 1 artículo `completed` (escritorio + móvil)
- [ ] 1 `needs_human_review` recién degradado (delitos-mas-comunes o estafas-fraudes)
- [ ] Consola sin errores
- [ ] Accesibilidad básica
- [ ] Aviso `AiReviewNotice` visible y coherente con estado
- [ ] Contenido corregido visible (Arts. 365-366, no 218-226)
- [ ] Canonical correcto
- [ ] Datos estructurados válidos
- [ ] Enlaces funcionales
- [ ] Sin desbordamientos
- [ ] Service worker actualizado (CACHE con nuevo BUILD_ID)

Para forzar la regeneración ISR sin esperar 1h, usar el nuevo endpoint:

```bash
curl -X POST https://www.pinedayasociadoshn.com/api/revalidate \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"slug","value":"delitos-mas-comunes-honduras"}'
```

## 7. Validación de producción (PENDIENTE post-push)

- [ ] Despliegue Vercel `Ready`
- [ ] Dominio `www.pinedayasociadoshn.com` responde
- [ ] 15 URLs HTTP 200 (`/blog/penal/<slug>`)
- [ ] `x-vercel-cache` documentado (HIT/MISS/DYNAMIC)
- [ ] Contenido actualizado (bodies con correcciones)
- [ ] Git completamente limpio tras push

## 8. Hash final validado

```bash
git rev-parse HEAD          # hash que se envía a origin/main
git rev-parse origin/main   # debe coincidir tras push
git status --short          # debe estar vacío
```
