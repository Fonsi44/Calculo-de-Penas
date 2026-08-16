---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-08-30
supersedes: null
---

# VERIFICACIÓN POST-DEPLOY - 2026-08-16

**Modo:** `VERIFICACIÓN`. Producción: `https://www.pinedayasociadoshn.com/`.  
**Rama local:** `fix/allow-production-editorial-upsert` @ `767b4d2` — los 10 archivos del paquete **no** están modificados en el árbol.  
**Paquete:** `docs/audits/paquete-ejecucion-tecnica-2026-08-16.md`.  
**GSC/GA4 7d:** `2026-08-09` → `2026-08-16` (`dataState: final`). JSON gitignored: `data/google/verify-post-deploy-7d.json`.

## Resumen ejecutivo

- Estado general: **RECHAZADO**
- Número de parches verificados correctamente en producción: **0/10**
- Riesgos identificados:
  - El paquete de ejecución **no está en producción** ni en esta rama; el ciclo Auditoría → Plan → Paquete **no** se ha implementado.
  - Titles/metas, TOC `<a href="#">`, footer, H1 Nacaome, `Crawl-delay`, subtítulo de privacidad y dotenv `override: true` siguen en el estado pre-parche.
  - LCP móvil de laboratorio en las 3 URLs de producción **> 2500 ms** (home 3391, pensión 3158, consulta 5078). No es CWV de campo.
  - `npm run seo:gsc:live -- --days 7` **falla** con JWT de service account (`ERR_OSSL_UNSUPPORTED`) porque C.2 no se aplicó; la extracción 7d se hizo por ADC en un script temporal, no por el collector del repo.

---

## A. Verificación de parches de código

| Ítem | Archivo / Cambio | Estado | Evidencia |
|------|------------------|--------|-----------|
| A.1 | `blog-metadata-overrides.ts` — title Divorcio | ❌ | Producción: `<title>Divorcio en Honduras: vías, requisitos y plazos</title>`. Esperado: `Divorcio en Honduras: mutuo acuerdo, causal y plazos`. URL: `/blog/derecho-de-familia/divorcio-honduras-guia-completa` |
| A.1 | mismo — Detención | ❌ | `<title>¿Qué hacer si me detienen en Honduras? Guía práctica</title>`. Esperado: `Detención en Honduras: derechos, 24 h y qué no firmar` |
| A.1 | mismo — Nacionalidad ES | ❌ | `<title>Nacionalidad española para hondureños: requisitos y plazos</title>`. Esperado: `…hondureños: plazos` |
| A.1 | mismo — Pensión % / guía | ❌ | `%`: `Pensión Alimenticia en Honduras 2026: Porcentajes y Cálculo`. Guía: `Pensión Alimenticia en Honduras: Requisitos y Pasos` (textos pre-B.3) |
| A.1 | `despacho/page.tsx` — title y meta | ❌ | `<title>Bufete de Abogados en Nacaome \| Nuestro Equipo</title>`. Meta: `Conozca a los abogados colegiados de Pineda y Asociados…`. Esperado: `Abogados colegiados en Nacaome, Valle \| Equipo` |
| A.1 | `preguntas-frecuentes/page.tsx` — title absoluto | ❌ | `<title>Preguntas frecuentes sobre consultas y honorarios \| Pineda y Asociados</title>` (70 caracteres, template del layout). Esperado: `Honorarios y primera consulta \| FAQ` |
| A.2 | `blog-toc.tsx` — `<button>` sin `pushState` | ❌ | `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`: TOC SSR sigue `<a href="#cuando-prescribe-una-deuda-en-honduras-plazos-lega" …>`. No hay `<button type="button">` en el TOC |
| A.4 | `robots.ts` — `Crawl-delay: 2` Bingbot | ❌ | `GET /robots.txt`: bloque `User-Agent: Bingbot` con Allow/Disallow, **sin** `Crawl-delay`. `Sitemap: https://www.pinedayasociadoshn.com/sitemap.xml` presente |
| A.5 | `public-footer.tsx` — desambiguación | ❌ | HTML de `/`, `/despacho` y landings: cadena `No tenemos oficina en Tegucigalpa` **ausente** |
| B.1 | `landings-locales.ts` — H1 Nacaome | ❌ | `/abogados-en-nacaome`: `<h1>Cómo visitar nuestra oficina en Nacaome</h1>`. Esperado: `Sede en Nacaome: dirección, horario y visita`. `/como-llegar` aparece en nav/footer (preexistente), no prueba el intro parcheado |
| B.5 | `legal-content.ts` + privacidad | ❌ | Hero: `…conforme a la Ley de Protección de Datos de Honduras.` §1 sigue el párrafo de tratados, no CAH + Código Civil del paquete. `robots`: `noindex, follow`. Arts. 76–80 **sí** están (texto viejo) |
| C.2 | `scripts/*.mjs` — `override: false` + timeout 180s | ❌ | En esta rama: `override: true` y `timeout: 120_000` en `scripts/seo-live-collect.mjs`. `npm run seo:gsc:live -- --days 7` → `Error: error:1E08010C:DECODER routines::unsupported` (SA JWT). ADC 7d sí funcionó fuera del collector |

Local `git diff` de los 10 archivos: vacío.

---

## B. Rendimiento Lighthouse (móvil)

Lab contra **producción**, 2026-08-16, Chrome headless. No es CrUX. PSI API no se reintentó (429 histórico). Artefactos en `/tmp/jv-lh-*-2026-08-16` (no versionados).

| URL | LCP (ms) | TBT (ms) | CLS | Estado (LCP &lt; 2500) |
|-----|----------|----------|-----|------------------------|
| `/` | 3391 | 29 | 0.002 | ❌ (perf 0.91, a11y 1.00) |
| `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` | 3158 | 54 | 0 | ❌ (perf 0.93) |
| `/solicitar-consulta` | 5078 | 70 | 0.002 | ❌ (perf 0.76) |

Interpretación: **falla** el umbral de 2,5 s en las tres. Consulta es la peor. TBT y CLS de lab están dentro de verde. No afirmar CWV de campo.

---

## C. Redirecciones 308

Preexistentes en `next.config.ts`. No forman parte de un deploy de este paquete; **sí** responden en vivo.

| Origen | Destino esperado | Código real | ¿Coincide? |
|--------|------------------|-------------|------------|
| `/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras` | `/blog/proceso-penal/sobreseimiento-definitivo-provisional` | `308` `location: /blog/proceso-penal/sobreseimiento-definitivo-provisional`; `-L` → `200` URL efectiva canónica | ✅ |
| `/blog/derecho-laboral/empleador-no-paga-salario-honduras` | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` | `308` `location: /blog/derecho-laboral/despido-laboral-honduras-guia-completa`; `-L` → `200` | ✅ |

---

## D. Métricas tempranas (GSC y GA4 — 7 días)

**No** hay impacto de snippets nuevos: los titles en vivo son los anteriores. 7 días **no** son tendencia; etiqueta: **estable / monitorear en 14 días**.

GSC property `https://www.pinedayasociadoshn.com/`. Auth: gcloud ADC (el script npm oficial falló por SA).

### Sitio

| Ventana | Clics | Impresiones | CTR | Posición |
|---------|------:|------------:|----:|---------:|
| 7d (2026-08-09→2026-08-16) | 206 | 9715 | 2.12% | 6.1 |
| 28d (2026-07-19→2026-08-16) | 741 | 31933 | 2.32% | 6.0 |

### URLs del paquete A.1

| URL | 7d clics | 7d imp | 7d CTR | 7d pos | 28d clics | 28d imp | 28d CTR | 28d pos | Lectura |
|-----|---------:|-------:|-------:|-------:|----------:|--------:|--------:|--------:|---------|
| Divorcio | 0 | 367 | 0.00% | 7.6 | 14 | 1845 | 0.76% | 7.7 | Estable en posición; CTR 7d 0 — **monitorear en 14 días** |
| Detención | 0 | 178 | 0.00% | 5.8 | 3 | 772 | 0.39% | 6.4 | Posición 7d no peor; 0 clics — **monitorear** |
| Despacho | 0 | 27 | 0.00% | 6.5 | 1 | 121 | 0.83% | 5.9 | Posición 7d un poco peor (muestra chica) — **monitorear** |
| Nacionalidad ES | 0 | 37 | 0.00% | 8.3 | 0 | 137 | 0.00% | 8.2 | Estable |
| FAQ `/preguntas-frecuentes` | 0 | 15 | 0.00% | 6.9 | 0 | 35 | 0.00% | 7.1 | Estable; title de 70 caracteres sigue en vivo |

Filas GSC con `#` en prescripción (28d, sin cambio de TOC): siguen cientos de impresiones en hashes. **FAIL** de A.2 en código; el efecto GSC no puede haber empezado.

### GA4 property `541022095` (7d)

La comparación UI «Público canónico» **no es consultable por API** → `NOT_VERIFIED`.

Sustituto: filtro Data API `hostName = www.pinedayasociadoshn.com` AND `pagePath` no contiene `/intranet`:

| Métrica 7d | Valor |
|------------|------:|
| Usuarios (overview) | 140 |
| Sesiones overview | 169 |
| Sesiones filtro público manual | 169 |
| Pageviews | 226 |
| Eventos | 893 |
| Key events | 8 |
| `landingPage = (not set)` | 9 sesiones (28d: 30) |
| `email_click` | **0** (ausente en el informe de eventos) |
| `contact_form_submit` | **0** en 7d (28d: 2) |
| `whatsapp_click` | 7 |

Intranet no aparece en top landings 7d. `(not set)` sigue presente (9/169 ≈ 5 %). No interpretar bajada 30→9 como éxito del filtro UI.

`email_click` como evento clave: **FAIL / NOT_VERIFIED** en UI (sin evento en 7d ni en el dump 28d).

---

## E. Checklist completo

Fuente: sección 4 de `paquete-ejecucion-tecnica-2026-08-16.md`.

- [ ] `npm run lint` y `npx tsc --noEmit` en verde → **N/A** — no hay código del paquete en esta rama; no se lintó un release inexistente
- [ ] Vitest fase2 / crawl / blog-metadata → **N/A** — mismos archivos que antes del paquete
- [ ] FAQ title `Honorarios y primera consulta \| FAQ` → **FAIL** — title de 70 caracteres con marca
- [ ] Despacho title `Abogados colegiados en Nacaome, Valle \| Equipo` → **FAIL**
- [ ] Divorcio title mutuo acuerdo / causal → **FAIL**
- [ ] Detención title 24 h → **FAIL**
- [ ] Footer Tegucigalpa → **FAIL**
- [ ] Un H1; Nacaome `Sede en Nacaome: dirección, horario y visita` → **FAIL** — H1 `Cómo visitar nuestra oficina en Nacaome`
- [ ] TOC no escribe `#` en historial → **FAIL** — SSR emite `<a href="#…">` (historial no medido en headless; el href crawlable sigue)
- [ ] Privacidad sin «Ley de Protección de Datos de Honduras»; sí Arts. 76–80, CAH y Código Civil; `noindex, follow` → **FAIL** (ley en hero; `noindex, follow` **PASS**; Arts. 76 **PASS** en §1 viejo)
- [ ] `robots.txt` Bingbot `Crawl-delay: 2` → **FAIL**
- [ ] Curls 308 → **PASS** (ya estaban)
- [ ] `seo:doctor` 0 ERROR → **PASS** (21 OK / 0 ERROR / 2 PENDIENTE Bing OAuth)
- [ ] `seo:collect` 6/6 → **FAIL / NO EJECUTADO** — C.2 no aplicado; `seo:gsc:live` 7d oficial falló; no se reejecutó `seo:collect` para no pisar `docs/audits/seo-live-summary.md`
- [ ] Lighthouse LCP &lt; 2500 → **FAIL** (3/3)
- [ ] GA4 comparación «Público canónico» → **NOT_VERIFIED** (solo UI)
- [ ] `email_click` evento clave → **FAIL / NOT_VERIFIED** (0 eventos)
- [ ] Bing recrawl 308 + CSV 4xx → **NOT_VERIFIED** (panel humano)
- [ ] Enlaces pensión en DB → **NOT_VERIFIED**
- [ ] GSC 14–28 d CTR divorcio/detención &gt; 1,5 % → **NO APLICABLE** (parche no live; 7d CTR 0 %)
- [ ] GBP Nacaome → **NO VALIDADO**

---

## Conclusión y próximos pasos

**No hay release que verificar.** Producción y esta rama muestran el estado **pre-paquete**. Los 308 y `seo:doctor` 0 ERROR no cuentan como implementación del plan.

1. Autorizar implementación en una **rama nueva** (no mezclar con `fix/allow-production-editorial-upsert`).
2. Aplicar `docs/audits/paquete-ejecucion-tecnica-2026-08-16.md` (incluir expect de `tests/fase2-arquitectura-publica.test.ts`).
3. `npm run lint`, `npx tsc --noEmit`, vitest citados, Preview, luego deploy con orden expresa.
4. Repetir este informe contra producción. Hasta entonces el ciclo de remediación está **abierto**.

Hotfix en producción: **ninguno** — no se desplegó código defectuoso del paquete; el defecto es **ausencia de deploy**.
