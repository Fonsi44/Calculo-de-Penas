# Pineda y Asociados — Protocolo canónico para agentes IA

Precisión, trazabilidad, verificación real. Ningún agente afirma que algo está
implementado si no lo ha comprobado con lectura de archivos, cambios reales y
comandos de validación. Este protocolo es permanente.

---

## 1. Flujo de trabajo obligatorio

1. Leer `AGENTS.md` (este archivo).
2. Ejecutar `git status` — entender estado del working tree.
3. Ejecutar `npm run seo:doctor` — verificar credenciales y accesos.
4. Ejecutar `npm run seo:collect` — recolectar datos live.
5. Revisar `docs/audits/seo-live-summary.md` para contexto actual.
6. Leer los archivos que se van a modificar (no asumir contenido).
7. Aplicar cambios pequeños y justificados.
8. Validar siempre: `npm run lint && npm run build && npm test`.
9. Documentar la acción en `auditoria-acciones.md`.
10. No hacer push.

---

## 2. Reglas absolutas

| # | Regla |
|---|-------|
| R1 | Leer el archivo antes de editarlo. No asumir. |
| R2 | Una fuente de verdad por subsistema (ver tabla abajo). |
| R3 | No usar datos mock como solución final. Persistencia = DB. |
| R4 | No inventar datos legales. Citas verificables contra CP de Honduras. |
| R5 | No rediseñar la web pública (`app/(public)/**`). SEO sí; visual no. |
| R6 | No exponer la intranet. `/intranet/*`, `/admin/*` son PRIVADAS. |
| R7 | Un cambio lógico por commit. Commits atómicos en español con prefijo. |
| R8 | Validar siempre: `lint && build && test` (mínimo). |
| R9 | No cambiar arquitectura sin justificación técnica. |
| R10 | No modificar configuración de modelos, proveedores o APIs externas. |
| R11 | Clasificar con honestidad: `IMPLEMENTADO`, `VALIDADO`, `NO VALIDADO`, `PENDIENTE`, `RIESGO`. |
| R12 | No usar verbos complacientes. "hecho/listo/completado" solo si es exacto. |
| R13 | Posts 600–1200 palabras guía. Ampliación IA → 800–1000 sin inventar datos legales. |
| R14 | Disclaimer legal en componente `<LegalDisclaimer>`, nunca en body del post. |
| R15 | Un solo `<h1>` por página de post (el título). Body usa `<h2>`/`<h3>`. |
| R16 | Design tokens canónicos: radius `rounded-lg`, sombras vía `.btn-shadow-*`, icono `w-11 h-11`. Dorado solo acento. |
| R17 | IA en blog: verificar contra fuentes canónicas. Dry-run por defecto. Sin relleno genérico. |
| R18 | Footer/Home: solo 10 ciudades prioritarias (Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire, Namasigüe, Orocuina). |

### Fuentes de verdad

| Subsistema | Fuente |
|------------|--------|
| Blog | DB `blog_posts` vía `lib/blog-db.ts` |
| Categorías blog | `data/blog/categories.ts` (20) |
| FAQ | DB `faq_entries` vía `lib/faq-db.ts` |
| Categorías FAQ | `data/faq-categories.ts` (11) |
| Delitos CP | `data/delitos.json` (483, 100% verificados) |
| Páginas editables | DB `page_content` vía `lib/page-content-db.ts` |
| Schema DB | `lib/schema.ts` (35 tablas) |
| Config sitio | `lib/site.ts` |
| Artículos CP | `data/articulos_cp.json` (635+) |
| Constitución | `data/articulos_constitucion.json` (378) |
| Códigos legales | `data/codigo_trabajo.json`, `codigo_civil.json`, `codigo_comercio.json`, `codigo_tributario.json` |
| Áreas jurídicas | `data/areas-juridicas.ts` (13) |
| Landings locales | `data/landings-locales.ts` |
| SEO Live | `data/google/`, `data/bing/`, `data/seo/` (regenerable) |

---

## 3. Seguridad

- **Auth:** JWT + bcrypt. Cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax).
- **Proxy:** `proxy.ts` protege `/intranet/*` y `/api/*`. Rol admin para `/api/admin/*`.
- **Rate limiting:** login (5/60s), contacto (10/15min), calcular (30/min).
- **Sanitización:** `sanitize-html` en todo HTML de entrada.
- **Validación:** Zod en todas las rutas POST/PATCH/PUT.
- **NUNCA hardcodear:** `OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `JWT_SECRET`, `INDEXNOW_KEY`.
- **NUNCA commitear:** `.env.local`, `.env`, `.secrets/`, `data/google/`, `data/bing/`, `data/seo/`.
- Si un secreto está en git history, requiere rotación (el código no lo resuelve).

---

## 4. Validación por área

| Área | Comandos |
|------|----------|
| Cualquier cambio | `npm run lint && npm run build && npm test` |
| Schema DB | `npx drizzle-kit generate` |
| SEO / sitemap / robots | `build` + verificar `sitemap.xml` |
| Blog | `npm run validate:dates && npm run content:audit` |
| Contenido editorial | `npm run blog:normalizar` (dry-run) → `:aplicar` |
| IndexNow | `npm run indexnow:dry` |
| SEO Live | `npm run seo:doctor && npm run seo:collect` |
| SEO off-page | `npm run seo:health` |

---

## 5. Sistema SEO Live

```bash
npm run seo:doctor       # diagnóstico de auths y datos (debe dar 0 ERROR)
npm run seo:collect       # recolecta GSC + GA4 + Bing + IndexNow + Health + Sitemap
npm run seo:gsc:live      # GSC: queries, páginas, CTR, posición (28d default)
npm run seo:ga4:live      # GA4: usuarios, sesiones, eventos, conversiones (28d default)
npm run seo:bing:live     # Bing: crawl stats, queries, backlinks
npm run indexnow:dry      # IndexNow dry-run (20 URLs prioritarias)
```

Datos generados: `data/google/gsc-live.json`, `data/google/ga4-live.json`,
`data/bing/bing-live.json`, `data/seo/live-summary.json`.
Reportes: `docs/audits/seo-live-summary.md`, `docs/audits/seo-live-action-plan.md`.

---

## 6. Archivos que NO debe tocar la IA

- Web pública visual (`app/(public)/**/*.tsx`) — salvo SEO.
- Motor de cálculo (`lib/rules/v1/`).
- Schema DB (`lib/schema.ts`).
- Auth (`lib/auth.ts`), Proxy (`proxy.ts`).
- Datos de delitos (`data/delitos.json`, `data/delitos-estados.json`).
- Redirects 301 de `next.config.ts`.
- `auditoriatotal.mc` y `auditoriatotal.md` — solo lectura.

---

## 7. Formato de entrega

```
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```
