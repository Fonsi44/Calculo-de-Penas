---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-09-13
supersedes: null
---

# PLAN DE REMEDIACIÓN - 2026-08-16

**Fuentes de verdad:** [auditoria-sitio-completa-2026-08-15.md](./auditoria-sitio-completa-2026-08-15.md), [bing-live-report.md](./bing-live-report.md).  
**Modo:** documento ejecutable. **No aplica** los parches hasta autorización expresa (R5, R23, R24).  
**Política comercial:** solo «Evaluación inicial confidencial» (`lib/marketing-policy.ts`).  
**Límites del repo:** titles finales ≤ 60 (`META_TITLE_MAX`); meta descriptions 120–155 (`META_DESC_MIN` / `META_DESC_MAX` en `lib/seo.ts`). Los posts del blog usan `title: { absolute }` vía `buildBlogMetaTitle`.

Este archivo **no** debe mezclarse en el PR `fix/allow-production-editorial-upsert` salvo orden expresa.

---

> 🔥 ALTA

## A.1. Snippets con CTR &lt; 1 %

**Problema:** «CTR estructuralmente bajo (2,25–2,32 %) con muchas queries en posiciones 4–10 a CTR 0 %»; divorcio 15 clics / 2.248 imp.; detención 5 / 957; despacho 1 / 218; nacionalidad española 1 / 461; FAQ 0 clics y title de 70 caracteres.

**Causa raíz:** titles genéricos o largos; el template de `app/(public)/layout.tsx` (`%s | ${site.name}`) **sí se aplica** en FAQ (por eso 70 caracteres). Los posts del blog ya usan `absolute`. Snippets no responden la query en las primeras palabras (móvil = 69 % de clics GSC).

**Solución ejecutable**

Archivo de overrides del blog (fuente única, no editar el body en DB): [`data/blog/blog-metadata-overrides.ts`](../../data/blog/blog-metadata-overrides.ts).  
Páginas pilar: [`app/(public)/despacho/page.tsx`](../../app/%28public%29/despacho/page.tsx) (`buildMetadata` ya emite `title.absolute`) y [`app/(public)/preguntas-frecuentes/page.tsx`](../../app/%28public%29/preguntas-frecuentes/page.tsx).

Ruta real de nacionalidad española (no `extranjeria-migracion`):  
`/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos`.

| URL | Actual (producción 2026-08-16) | Propuesta | Chars | Por qué |
| --- | --- | --- | ---: | --- |
| `/blog/derecho-de-familia/divorcio-honduras-guia-completa` | Title: `Divorcio en Honduras: vías, requisitos y plazos` | **Title:** `Divorcio en Honduras: mutuo acuerdo, causal y plazos` | 52 | Nombra las vías que busca la query `tipos de divorcio en honduras` (67 imp., CTR 0 %) |
| misma | Meta: compare vías, genérica | **Meta:** `Tres vías de divorcio en Honduras: mutuo consentimiento, causal y separación. Documentos, hijos y pensión. Bufete en Nacaome.` | 125 | Respuesta directa + NAP; sin «consulta gratuita» |
| `/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras` | Title: `¿Qué hacer si me detienen en Honduras? Guía práctica` | **Title:** `Detención en Honduras: derechos, 24 h y qué no firmar` | 53 | Cubre `que es detencion judicial en honduras` (91 imp., CTR 0) y el plazo constitucional/procesal |
| misma | Meta: «recomendaciones generales…» | **Meta:** `Si lo detienen en Honduras: pida el motivo, no declare sin defensor y no firme lo que no entienda. Plazo de 24 horas ante el juez.` | 130 | Primeros 40 caracteres = instrucción; CTA WhatsApp queda en el body (ya hay CTA) |
| `/despacho` | Title: `Bufete de Abogados en Nacaome \| Nuestro Equipo` | **Title:** `Abogados colegiados en Nacaome, Valle \| Equipo` | 46 | Query «bufete» + desambiguación geográfica vs Tegucigalpa |
| misma | Meta: equipo y metodología | **Meta:** `Equipo del bufete en Nacaome, Valle, no Tegucigalpa: áreas de práctica, método de atención y evaluación inicial confidencial.` | 125 | Homónimo + R24 |
| `/blog/hondurenos-en-espana/nacionalidad-espanola-para-hondurenos-residencia-plazos` | Title: `Nacionalidad española para hondureños: requisitos y plazos` | **Title:** `Nacionalidad española para hondureños: plazos` | 45 | Acorta; no promete trámite español |
| misma | Meta: requisitos y proceso | **Meta:** `Requisitos generales de nacionalidad española por residencia. El bufete en Nacaome orienta trámites hondureños; no ejerce derecho español.` | 138 | YMYL / límite de jurisdicción (fase 1) |
| `/preguntas-frecuentes` | Title tag: `Preguntas frecuentes sobre consultas y honorarios \| Pineda y Asociados` (70) | **Title absolute:** `Honorarios y primera consulta \| FAQ` | 35 | Evita el template del layout; query honorarios/presupuesto |

Parche FAQ (`generateMetadata`): el title **debe** ser absoluto. Conservar `total` dinámico en la description:

```tsx
return {
  title: { absolute: 'Honorarios y primera consulta | FAQ' },
  description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención de ${site.name} en Nacaome.`,
  alternates: { canonical: '/preguntas-frecuentes' },
  // twitter/openGraph: mismo title absoluto
};
```

Parche blog (añadir/reemplazar claves en `BLOG_METADATA_OVERRIDES`):

```ts
'divorcio-honduras-guia-completa': {
  title: 'Divorcio en Honduras: mutuo acuerdo, causal y plazos',
  description:
    'Tres vías de divorcio en Honduras: mutuo consentimiento, causal y separación. Documentos, hijos y pensión. Bufete en Nacaome.',
},
'que-hacer-si-me-detienen-en-honduras': {
  title: 'Detención en Honduras: derechos, 24 h y qué no firmar',
  description:
    'Si lo detienen en Honduras: pida el motivo, no declare sin defensor y no firme lo que no entienda. Plazo de 24 horas ante el juez.',
},
'nacionalidad-espanola-para-hondurenos-residencia-plazos': {
  title: 'Nacionalidad española para hondureños: plazos',
  description:
    'Requisitos generales de nacionalidad española por residencia. El bufete en Nacaome orienta trámites hondureños; no ejerce derecho español.',
},
```

Parche despacho: cambiar el `title` y `description` del `buildMetadata({...})` en `app/(public)/despacho/page.tsx` por los textos de la tabla. No tocar el H1 visible sin revisión del despacho (puede vivir en `page_content`).

Tras publicar: el CTA de WhatsApp del artículo (ya instrumentado con `trackWhatsAppClick`) es el KPI de conversión, no el formulario.

**Verificación:** GSC 28 días después del deploy: CTR divorcio y detención > 1,5 %, o anotar si la posición empeoró. FAQ title tag en producción ≤ 60. `npm run lint` + tests `tests/blog-metadata-only.test.ts`.

---

## A.2. Fragmentos indexados (`#`) en prescripción

**Problema:** GSC lista URLs con `#plazos-de-prescripcion-segun-el-tipo-de-obligacion`, `#como-se-interrumpe-la-prescripcion-de-una-deuda-en`, `#caso-practico-prescripcion-de-una-deuda-bancaria-e` con 583–646 impresiones y 0 clics.

**Causa raíz:** no es el `@id` de FAQPage (`#faqpage`). Es [`lib/blog-toc.ts`](../../lib/blog-toc.ts) `injectHeadingIds`, que slugifica cada H2/H3 y lo inyecta en el HTML **a propósito** para TOC/GEO. [`components/blog/blog-toc.tsx`](../../components/blog/blog-toc.tsx) expone `<a href="#${h.id}">` en SSR y hace `history.pushState(..., #id)`. Google trata esos anchors como filas distintas en Search Analytics. **No se puede `noindex` un fragmento.** El canonical de la página ya apunta a la URL sin hash (`app/(public)/blog/[categoria]/[slug]/page.tsx`).

**Solución ejecutable**

1. **Conservar** los `id` en H2/H3 (accesibilidad, TOC, `speakable` en [`lib/schemas/blog.ts`](../../lib/schemas/blog.ts)). Quitarlos rompería el TOC y el contrato GEO documentado en el propio `blog-toc.ts`.
2. Dejar de **empujar** el hash al historial y de emitir href crawlables que Google cuenta como URL. En `BlogTOC`, sustituir el `<a href="#...">` por un botón que solo hace scroll (el `id` sigue en el heading para lectores de pantalla):

```tsx
<button
  type="button"
  className="text-sm text-text-secondary hover:text-primary transition-colors text-left w-full"
  onClick={() => {
    const el = document.getElementById(h.id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }}
>
  {h.text}
</button>
```

Quitar `history.pushState(null, '', `#${h.id}`)`.

3. JSON-LD: **no** poner `@id` de `Question` igual a `url + '#' + slug`. [`lib/faq-common.ts`](../../lib/faq-common.ts) ya no lo hace. FAQPage puede seguir con `@id: ${url}#faqpage` (no aparece en las filas GSC). BlogPosting ya usa `#blogposting` y `mainEntityOfPage.@id` **sin** hash — no cambiar.

4. Canonical: no tocar. Ya es la URL limpia.

5. GSC: Inspección de URL de la guía canónica  
   `https://www.pinedayasociadoshn.com/blog/derecho-civil/prescripcion-deudas-plazos-honduras`  
   → Solicitar indexación. Las filas `#` suelen diluirse en 14–28 días; no usar Removals sobre el artículo padre.

**Verificación:** en GSC, impresiones de URLs que contienen `prescripcion-deudas-plazos-honduras#` < 50 en 28 días, o consolidadas en la URL padre. TOC del artículo sigue navegable en móvil. Tests de `tests/blog-html-sanitizer.test.ts` (IDs de headings) siguen en verde.

---

## A.3. GA4: filtrar intranet y `(not set)`

**Problema:** «Medición contaminada a 365 días por rutas `/intranet/*`»; `landingPage = (not set)` 30 sesiones / 28d y 132 / 365d.

**Causa raíz:** el layout público **ya excluye** `/intranet` (`ANALYTICS_EXCLUDED_PREFIXES` en [`lib/analytics.ts`](../../lib/analytics.ts); `AnalyticsScripts` solo en [`app/(public)/layout.tsx`](../../app/%28public%29/layout.tsx)). Los hits de intranet en 365d son históricos o de otro stream. `(not set)` encaja con el retraso de consentimiento (`CONSENT_REVEAL_DELAY_MS = 2500` en [`components/cookie-consent.tsx`](../../components/cookie-consent.tsx)): `session_start` puede registrarse sin `page_location`.

GA4 no tiene vistas con filtro como Universal Analytics. No hay que «filtrar en el tag» lo que ya no se envía. Hay que **filtrar informes** y, si se usa BigQuery, las consultas.

**Solución ejecutable (consola GA4, property `541022095`)**

1. **Comparación permanente «Tráfico público»**  
   Informes → Comparar → Crear nueva comparación  
   - Incluir: `Nombre de host` coincide exactamente con `www.pinedayasociadoshn.com`  
   - Excluir: `Ruta de página` contiene `/intranet`  
   - Excluir: `Ruta de página` contiene `/preview`  
   Guardar como «Público canónico». Usar esta comparación (no el 365d crudo) para decidir.

2. **Exploración**  
   Explorar → Técnica libre  
   Dimensiones: Página de destino, Fuente de la sesión, Dispositivo  
   Filtros:  
   - `Nombre de host` = `www.pinedayasociadoshn.com`  
   - `Página de destino` no coincide con regex `^(\(not set\)|/intranet)`  

3. **Tráfico interno (opcional, IPs de oficina)**  
   Administrar → Flujos de datos → el flujo web → Configurar ajustes de etiquetas → Mostrar más → Definir tráfico interno → `traffic_type = internal` → crear filtro de datos «Tráfico interno» en Administrar → Recogida y modificación de datos → Filtros de datos.  
   No filtrar por path aquí: GA4 no ofrece filtro de path a nivel de recogida.

4. **Hostname en informes**  
   Informes → Personalizar informe (p. ej. Adquisición) → Añadir dimensión secundaria `Nombre de host`. Ignorar filas `localhost`, `*.vercel.app`, previews.

5. **BigQuery** (solo si el export está activo; si no, `NO VALIDADO`):

```sql
-- Sustituir `project.dataset` ; no imprimir secretos.
SELECT
  event_date,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer') AS page_referrer,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') AS page_title
FROM `project.dataset.events_*`
WHERE _TABLE_SUFFIX BETWEEN '20260719' AND '20260816'
  AND event_name = 'page_view'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')
      NOT LIKE '%/intranet%'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')
      LIKE 'https://www.pinedayasociadoshn.com%'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') IS NOT NULL;
```

No bajar `CONSENT_REVEAL_DELAY_MS` para «arreglar» `(not set)`: el delay existe para no tapar LCP.

**Verificación:** informe 28d «Público canónico» sin `/intranet/login` en top pages; `(not set)` documentado como residual de consentimiento. Decidir con GSC + esa comparación, no con GA4 365d.

---

## A.4. Sobre-rastreo Bing (9.477 vs 203) y 4xx

**Problema:** Bing 67d: 9.477 rastreadas, 1.183 4xx, 1.351 errores de rastreo, 0 5xx, 0 backlinks ([bing-live-report.md](./bing-live-report.md)). Sitemap producción: 203 `<loc>`.

**Causa raíz:** Bingbot sigue historial, 308 y URLs fuera de manifiesto. `robots.txt` ya lista `Sitemap:` y Disallow de intranet (`app/robots.ts` + [`lib/crawl-policy.ts`](../../lib/crawl-policy.ts)). **No existe** una directiva robots que diga «rastrea solo el sitemap». `Crawl-delay` es informal; Bing puede ignorarlo.

Los 308 ya están en [`next.config.ts`](../../next.config.ts):

- `/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras` → `/blog/proceso-penal/sobreseimiento-definitivo-provisional`
- `/blog/derecho-laboral/empleador-no-paga-salario-honduras` → `/blog/derecho-laboral/despido-laboral-honduras-guia-completa`

**Solución ejecutable**

1. **No reescribir un robots.txt a mano.** Parche en `buildRobots()` para Bingbot: mismo Allow/Disallow + `crawlDelay` (si el tipo de Next lo admite en esta versión):

```ts
{
  userAgent: 'Bingbot',
  allow: '/',
  disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
  crawlDelay: 2,
},
```

Hoy Bingbot se genera en el `map` de `ALLOWED_CRAWLER_USER_AGENTS`. Hay que **sacarlo del map** y declararlo aparte para no aplicar `crawlDelay` a Googlebot. El `sitemap` del return ya es `${site.url}/sitemap.xml`.

2. **Clasificar 4xx en el panel** (la API Key no entrega el desglose URL a URL):  
   Bing Webmaster Tools → el sitio `https://www.pinedayasociadoshn.com/` → Informes y datos → Rastreo / Páginas de error → exportar. Marcar: muerto / ya 308 / noindex. No inventar la lista aquí.

3. **Recrawl de destinos 308** (IndexNow real; **requiere autorización** y `ENABLE_INDEXNOW_SUBMIT=true`, AGENTS.md §5):

```bash
# Dry-run primero (ya validado en la auditoría)
npm run indexnow:dry

# Tras autorización expresa, enviar SOLO las URLs canónicas de destino:
# usar el script del repo, no un curl con la key en claro.
npx --yes node scripts/submit-indexnow.mjs --dry-run
```

No pegar `INDEXNOW_KEY` en la terminal ni en este documento. El procedimiento de Bing UI: URL Inspection → introducir cada destino 200 → Recrawl / Enviar.

4. **Eliminar 4xx del índice Bing:** Herramientas → Bloquear URL / Quitar URLs → pegar orígenes 4xx **tras** confirmar en el export que son 404 reales (no 308). Un 308 no se «borra»: se deja que Bing siga el Location.

5. **curl de comprobación** (sin auth; no borra nada):

```bash
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  https://www.pinedayasociadoshn.com/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras
# Esperado: 308 y Location al destino corto

curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" -L --max-redirs 3 \
  https://www.pinedayasociadoshn.com/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras
# Esperado: 200 en .../sobreseimiento-definitivo-provisional
```

**Verificación:** próximo `npm run seo:bing:live`: 4xx en descenso; URLs prioritarias siguen 10/10 rastreadas. GSC deja de atribuir impresiones al origen largo de sobreseimiento.

---

## A.5. Desambiguación de marca (homónimo Tegucigalpa)

**Problema:** colisión con `bufetepinedayasociados.com` (José Juan Pineda, Tegucigalpa).

**Causa raíz:** mismo nombre comercial, otra ciudad. El NAP del sitio ya dice Nacaome, Valle; no está en el footer como contraste explícito.

**Solución ejecutable — no poner la frase en todos los H1.** Eso canibalizaría cada título de artículo (R5, R9) y violaría un H1 = intención de la página (R15). La auditoría pedía «una línea aprobada por el titular», no reescribir 155 H1.

**Frase canónica (aprobar con el despacho antes de publicar):**

> Pineda y Asociados es un bufete con sede en Nacaome, Valle. No tenemos oficina en Tegucigalpa ni relación con otros despachos homónimos.

**Dónde sí va**

| Superficie | Texto | Archivo |
| --- | --- | --- |
| Footer (todas las páginas públicas) | Frase canónica, 1 párrafo | [`components/marketing/public-footer.tsx`](../../components/marketing/public-footer.tsx) |
| Title de `/despacho` | ya cubierto en A.1 | `app/(public)/despacho/page.tsx` |
| H1 de `/despacho` | opcional, si el titular lo aprueba: mantener el H1 actual de equipo y **no** clavar Tegucigalpa en el H1 | `page_content` / hero |
| Organization JSON-LD | `areaServed` ya es Valle; no inventar `sameAs` del homónimo | [`lib/site.ts`](../../lib/site.ts) |

JSX a insertar en el bloque de identidad del footer (después del párrafo de «Bufete jurídico en {city}»):

```tsx
<p className="text-xs text-text-inverse/70 leading-relaxed mt-2 text-pretty">
  Sede en {site.address.city}, {site.address.department}. No tenemos oficina en
  Tegucigalpa ni relación con despachos homónimos.
</p>
```

No añadir la frase al `layout.tsx` como H1. El layout no debe ganar un segundo H1.

GBP (panel, no código): nombre `Pineda y Asociados - Nacaome` + ciudad Valle. `NO VALIDADO` hasta entrar al panel.

**Verificación:** la frase visible en el footer de `/` y `/despacho`; un solo H1 por página; ningún title de blog menciona Tegucigalpa.

---

> 🧩 MEDIA

## B.1. H1 de `/abogados-en-nacaome`

**Problema:** H1 «Cómo visitar nuestra oficina en Nacaome»; el informe pide «Abogados en Nacaome, Valle».

**Causa raíz:** es **arquitectura deliberada**, no un despiste. [`data/landings-locales.ts`](../../data/landings-locales.ts) líneas 112–118: la home es la URL comercial de «abogados en Nacaome»; la landing es operativa. El test [`tests/fase2-arquitectura-publica.test.ts`](../../tests/fase2-arquitectura-publica.test.ts) **exige** exactamente ese `heroTitle`. El title SEO de producción (`Abogados en Nacaome · Bufete con Sede en Valle`) lo genera `landingMetadata` por `sedeFisica`. Poner H1 = «Abogados en Nacaome» **canibaliza la home**.

**Solución ejecutable (recomendada, no la del prompt crudo)**

1. **No** usar H1 `Abogados en Nacaome, Valle`.
2. Aclarar la intención operativa y mover la logística fina a `/como-llegar`:

```ts
heroTitle: 'Sede en Nacaome: dirección, horario y visita',
```

3. En `intro` o al final del hero, enlace contextual (copy R24):

```tsx
<p>
  Indicaciones de ruta, mapa y accesos desde Tegucigalpa, Choluteca y San Lorenzo
  están en <Link href="/como-llegar">cómo llegar a la oficina</Link>.
  Para contratar defensa o asesoría, use la{' '}
  <Link href="/">página principal de abogados en Nacaome</Link>
  o solicite una evaluación inicial confidencial.
</p>
```

4. Actualizar el expect del test fase 2 al nuevo `heroTitle`.  
   Si el titular **insiste** en el H1 comercial, hay que cambiar también el test y aceptar canibalización con `/` — no es la recomendación.

**Verificación:** un H1; home sigue rankeando `abogados nacaome`; GSC 28d de `/abogados-en-nacaome` no come clics a `/`. Test fase 2 verde.

---

## B.2. Alt de imagen del home

**Problema:** «home 1/11» imágenes sin alt.

**Causa raíz:** el parser de la auditoría contó `alt=""` como missing. En [`app/(public)/page.tsx`](../../app/%28public%29/page.tsx) líneas 156–165 la foto `/images/penal/litigio-complejo.webp` es **fondo decorativo** dentro de `aria-hidden="true"`. WCAG 1.1.1 exige `alt=""` en imágenes decorativas. Un alt descriptivo haría que algunos AT anunciaran una imagen marcada como hidden.

**Solución ejecutable:** **no cambiar el alt.** Dejar:

```tsx
<Image
  src="/images/penal/litigio-complejo.webp"
  alt=""
  fill
  priority
  fetchPriority="high"
  sizes="100vw"
  className="object-cover object-center opacity-[0.22]"
/>
```

Opcional, redundante: `role="presentation"` en el `Image`. Las fotos de equipo ya usan `alt={profile.imageAlt}`.

**Verificación:** Lighthouse a11y lab sigue 100; el árbol a11y no anuncia el hero como imagen informativa. Cerrar el ítem del informe como falso positivo del parser.

---

## B.3. Canibalización pensión alimenticia

**Problema:** porcentaje-2026 (180 clics / 4.352 imp.) vs guía completa (42 / 3.522).

**Causa raíz:** dos URLs indexables para el mismo cluster; titles no separan «cuánto» vs «cómo tramitar».

**Solución ejecutable** — overrides + un enlace en cada body (el body vive en DB; el enlace se añade con el flujo editorial, no inventando derecho).

| Pieza | Rol | Title (45–48) | Meta (136–137) |
| --- | --- | --- | --- |
| `pension-alimenticia-porcentaje-honduras-2026` | PRIMARY «cuánto» | `Pensión alimenticia Honduras 2026: porcentaje` | `Cómo estima el juez el porcentaje de pensión alimenticia en Honduras en 2026: ingresos, necesidades del menor y tope de embargo. Nacaome.` |
| `pension-alimenticia-honduras-guia-completa` | PRIMARY «requisitos» | `Pensión alimenticia Honduras: requisitos y pasos` | `Cómo solicitar pensión alimenticia en Honduras: documentos, demanda, plazos y cobro ante incumplimiento. Guía de procedimiento. Nacaome.` |

En `BLOG_METADATA_OVERRIDES` (la guía completa **ya** tiene un override; actualizarlo; añadir el de porcentaje si no está).

Enlaces internos (anchor text, no genérico «clic aquí»):

En **porcentaje-2026**, bloque al final del intro:

```html
<p>Esta página explica cómo se estima el monto. El procedimiento (demanda, documentos y cobro) está en la <a href="/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa">guía de requisitos y pasos para pensión alimenticia</a>.</p>
```

En **guia-completa**:

```html
<p>Si busca cómo se calcula el monto o el porcentaje, consulte <a href="/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026">pensión alimenticia 2026: porcentaje y cálculo</a>.</p>
```

CTA WhatsApp existente; no añadir «consulta gratuita».

**Verificación:** GSC query «cuanto es la pensión…» atribuye clics sobre todo a porcentaje-2026; «requisitos / demanda» a la guía. Sin MERGE hasta 28 días post-parche.

---

## B.4. Medir LCP móvil real

**Problema:** PSI producción 429; CrUX sin datos; Lighthouse lab desktop LCP 3,67–4,43 s.

**Causa raíz:** API pública de PSI rate-limit; origen sin volumen CrUX. El script npm `lighthouse` actual es desktop a `localhost:3100`.

**Solución ejecutable** (app local o Preview, **no** perfil de Chrome personal; skill preview-smoke-test: no producción con sesión):

```bash
# App en :3100 (o sustituir la URL de Preview)
npx lighthouse "http://localhost:3100/" \
  --preset=perf \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --screenEmulation.width=390 \
  --screenEmulation.height=844 \
  --screenEmulation.deviceScaleFactor=2 \
  --throttling-method=simulate \
  --only-categories=performance,accessibility \
  --output=json \
  --output=html \
  --output-path="docs/audits/lighthouse-home-mobile-2026-08-16" \
  --chrome-flags="--headless --no-sandbox"

npx lighthouse "http://localhost:3100/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026" \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --only-categories=performance \
  --output=json \
  --output-path="docs/audits/lighthouse-pension-mobile-2026-08-16" \
  --chrome-flags="--headless --no-sandbox"

npx lighthouse "http://localhost:3100/solicitar-consulta" \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --only-categories=performance \
  --output=json \
  --output-path="docs/audits/lighthouse-consulta-mobile-2026-08-16" \
  --chrome-flags="--headless --no-sandbox"
```

Interpretar JSON: `audits["largest-contentful-paint"].numericValue` en ms. **Pasa** si &lt; 2500; **falla** si ≥ 4000 (rojo). TBT/INP lab no sustituyen CrUX. No afirmar CWV de campo.

Los JSON/HTML de Lighthouse en `docs/audits/` son artefactos regenerables; no commitear dumps pesados salvo que el titular lo pida (AGENTS.md §10).

**Verificación:** tres JSON con LCP numérico; si LCP ≥ 2,5 s, abrir treemap (`--view` o informe HTML) antes de tocar el hero. No bajar el delay del banner de cookies para «ganar» LCP.

---

## B.5. Política de privacidad (tensión legal)

**Problema:** el cuerpo dice que Honduras no tiene autoridad independiente (Arts. 76–80 Constitución); el default del hero cita «Ley de Protección de Datos de Honduras».

**Causa raíz:** [`lib/legal-content.ts`](../../lib/legal-content.ts) `DEFAULTS['politica-privacidad'].subtitle`. El HTML de [`app/(public)/politica-privacidad/page.tsx`](../../app/%28public%29/politica-privacidad/page.tsx) §1 ya es preciso. Si `page_content` tiene `hero.subtitle`, gana sobre el default.

**Solución ejecutable**

1. Default:

```ts
'politica-privacidad': {
  title: 'Política de Privacidad',
  subtitle:
    'Protección de datos personales conforme a la Constitución de Honduras (Arts. 76 a 80).',
  version: '0.6',
  lastUpdated: 'Agosto 2026',
},
```

2. Sustituir / no usar la fórmula «Ley de Protección de Datos de Honduras» en hero ni metadata (`description` de la page hoy dice «conforme al ordenamiento hondureño» — eso sí es aceptable).

3. Párrafo para §1 (el segundo `<p>` actual se mantiene en sustancia; redacción propuesta, sin inventar agencia ni ley innominada):

```tsx
<p>
  A la fecha de esta política, la República de Honduras no cuenta con una
  autoridad administrativa independiente de protección de datos personales
  equivalente a las agencias de otros países. El bufete aplica de forma
  voluntaria los principios del derecho a la intimidad, al honor y a la
  propia imagen reconocidos en los Arts. 76 a 80 de la Constitución de la
  República, el deber de secreto profesional del abogado conforme a la Ley
  Orgánica del Colegio de Abogados de Honduras, y las reglas generales del
  Código Civil sobre responsabilidad por el uso ilícito de datos e imagen.
  Esta política no afirma la vigencia de una ley general de protección de
  datos personales que no esté identificada por decreto en el cuerpo del
  documento.
</p>
```

Si más adelante el Congreso aprueba una ley con número de decreto, se cita el decreto — no antes (R4).

**Verificación:** GET `/politica-privacidad` sin la cadena «Ley de Protección de Datos de Honduras»; sí Arts. 76–80, CAH y Código Civil. Robots sigue `noindex, follow`.

---

> 🧹 BAJA

## C.1. Marcar `email_click` como evento clave

**Problema:** plan de medición: key event pendiente; la service account no tiene escritura.

**Causa raíz:** hay que hacerlo en la UI con un usuario editor/admin, no por API con la SA de solo lectura.

**Solución ejecutable (GA4, property `541022095`)**

1. analytics.google.com → seleccionar la propiedad del sitio.  
2. Icono **Administrar** (engranaje, abajo a la izquierda).  
3. **Mostrar datos** → **Eventos** (en versiones nuevas: Administrar → Visualización de datos → Eventos).  
4. En la lista, buscar `email_click`.  
   - Si existe: menú ⋮ → **Marcar como evento clave** (o el interruptor «Evento clave»).  
   - Si no existe: **Crear evento** no sustituye al helper. Primero generar un clic real en un `mailto:` público (`trackEmailClick` en [`lib/analytics.ts`](../../lib/analytics.ts)) con consentimiento analytics aceptado; esperar 24–48 h; luego marcarlo.  
5. **Eventos clave** → confirmar que `email_click` aparece junto a `contact_form_submit`.  
6. No marcar `page_view` ni `scroll_depth` como eventos clave.

**Verificación:** Administrar → Eventos clave lista `email_click`; en 28d el recuento puede seguir en 0 si nadie pulsa mailto (el informe tenía 0). Eso no es un fallo del marcado.

---

## C.2. Reparar `seo:collect` (timeout + dotenvx)

**Problema:** collector 4/6; `seoHealth` y sitemap local fallaron; `override: true` pisa el env inyectado por dotenvx (service account / GSC site URL de 11 caracteres basura).

**Causa raíz:** [`scripts/seo-live-collect.mjs`](../../scripts/seo-live-collect.mjs) `timeout: 120_000` por comando; `dotenv` con `override: true` en collect, GSC, GA4 y Bing. `package.json` no necesita un script nuevo.

**Solución ejecutable**

En `scripts/seo-live-collect.mjs`, `scripts/google-search-console-live.mjs`, `scripts/google-analytics-live.mjs`, `scripts/bing-webmaster-live.mjs`:

```js
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: false });
```

Subir timeout del collect:

```js
timeout: 180_000,
```

No commitear `.env.local`. Tras el parche: `npm run seo:doctor` (0 ERROR) y `npm run seo:collect`. Health y sitemap locales deben pasar o reportar error real, no timeout.

Los fallbacks ADC de la corrida del 16 ago **no** se dejan en los extractores salvo un PR aparte de robustez.

**Verificación:** `seo:collect` 6/6; GSC site URL resuelto `https://www.pinedayasociadoshn.com/`; GA4 property numérica `541022095`.

---

## C.3. Landings indexables sin clics (Goascorán, Amapala)

**Problema:** indexables con 0 clics GSC 365d; el informe dice no noindexear aún.

**Causa raíz:** están en `indexable` de [`data/seo/local-landing-indexability.json`](../../data/seo/local-landing-indexability.json) (KEEP). Las 9 `noindex_until_unique` son otro conjunto.

**Solución ejecutable** — regla de negocio, no noindex hoy:

```json
{
  "_comment": "Fuente de verdad versionada de la clasificación de indexabilidad de las landings locales (16 municipios). NO modificar salvo nueva decisión editorial documentada en Search Console. Revisión 90 días: goascoran y amapala siguen INDEXABLES (KEEP_SECONDARY_OPERATIONAL) hasta 2026-11-14. Si GSC 90d muestra 0 clics y <30 impresiones, elevar a decisión humana NOINDEX_UNTIL_UNIQUE; no automatizar el noindex.",
  "schema_version": 1,
  "updated_at": "2026-08-16",
  "review_due": "2026-11-14",
  "watch_indexable_zero_clicks": ["goascoran", "amapala"]
}
```

No mover esas dos claves a `noindex_until_unique` en este bloque. No añadir `// NOINDEX_UNTIL_UNIQUE` sobre landings que **sí** se indexan: el comentario mentiría. El comentario correcto en `data/landings-locales.ts` junto a esas entradas:

```ts
// KEEP_SECONDARY_OPERATIONAL — indexable. Revisión GSC 2026-11-14.
// Si no hay demanda (0 clics y <30 imp. en 90d), proponer NOINDEX_UNTIL_UNIQUE
// en data/seo/local-landing-indexability.json. No noindexear antes.
```

**Verificación:** sitemap-local.xml sigue incluyendo `/abogados-en-goascoran` y `/abogados-en-amapala`; robots `index,follow`; recordatorio en `review_due`.

---

## Orden de implementación sugerido (cuando se autorice código)

1. A.1 + B.3 (solo `blog-metadata-overrides.ts` + FAQ/despacho metadata) — un commit «seo: snippets CTR».  
2. A.2 (BlogTOC) — commit «fix: no empujar fragments al historial».  
3. A.5 footer — commit «fix: desambiguación Nacaome en footer».  
4. B.1 + test fase 2 — commit aparte; no mezclar con H1 comercial.  
5. B.5 `legal-content.ts` + párrafo privacidad.  
6. C.2 dotenv `override: false`.  
7. A.4 `crawlDelay` Bingbot + IndexNow **solo con autorización**.  
8. A.3 y C.1 son consola GA4, no PR.  
9. B.2 no hay diff. B.4 es comando local.

**No implementar en este documento:** rediseño de `app/(public)/**` más allá de metadata/H1/footer/TOC/privacidad citados; push; deploy; migraciones.
