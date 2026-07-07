# SEO / GEO ACTION PLAN — Pineda y Asociados HN

**Generado:** 2026-07-06
**Dominio:** `https://www.pinedayasociadoshn.com/`
**Documento complementario:** `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` (informe completo de hallazgos).

Este plan contiene **únicamente tareas accionables**, priorizadas por criticidad. Cada tarea incluye objetivo, archivo o URL afectada, acción exacta, impacto esperado y esfuerzo estimado.

---

## 🔴 CRÍTICA (0 tareas)

No se han detectado bloqueadores críticos de indexación ni riesgos legales graves que requieran acción inmediata. El sitio es plenamente rastreable, indexable y comprensible.

> **Estado Fase 1 post-deploy (2026-07-06):** A-01 pendiente Vercel · A-02 ✅ completada y validada en producción · A-03 ✅ completada y visible en producción · A-04 parcialmente completada (1 enlace roto corregido y vivo; 232 URLs 4xx requieren tool externo). Deploy confirmado: enlace al Poder Judicial visible en `/despacho` y footer; canonical coherente; sitemap 213 URLs; slug A-04 sirve 200. **Progreso: 92 %** (sin cambios; A-01 Vercel + A-04 detalle externo pendientes).

---

## 🟠 ALTA (4 tareas — ejecutar antes de esperar indexación)

> **Estado Fase 1 (2026-07-06):** A-01 pendiente externa · A-02 completada (decisión documentada) · A-03 completada · A-04 parcialmente completada. Ver detalle en cada tarea y en `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` § "Implementación Fase 1".

### TAREA A-01 — Consolidar redirección del dominio apex en un solo salto

**Estado: 🔶 PENDIENTE EXTERNA** — No ejecutable desde el repositorio. Requiere configuración manual en el panel de Vercel.

| Campo | Valor |
|---|---|
| **Objetivo** | Eliminar la cadena de 2 saltos (308→308) que diluye señales de enlace y retrasa la consolidación de autoridad en el host canónico `https://www.` |
| **URL afectada** | Todo el dominio `pinedayasociadoshn.com` (apex/non-www/HTTP) |
| **Estado actual** | `http://pinedayasociadoshn.com/` → 308 → `https://pinedayasociadoshn.com/` → 308 → `https://www.pinedayasociadoshn.com/` |
| **Acción exacta** | 1. En Vercel: Project Settings → Domains → configurar `pinedayasociadoshn.com` como **"Redirect to www"** con **301 Permanent** (no 308). 2. Verificar con `curl -sS -o /dev/null -w "%{http_code} %{redirect_url}" "http://pinedayasociadoshn.com/"` que el resultado es **301 directo a `https://www.pinedayasociadoshn.com/`** en un solo salto. 3. Confirmar en GSC (Configuración → Preferencia de dominio) que `https://www.pinedayasociadoshn.com/` es la propiedad canónica y que `sc-domain:pinedayasociadoshn.com` consolida ambas variantes. |
| **Impacto esperado** | Consolidación de ~211 impresiones / 15 clics que GSC atribuye a `http://pinedayasociadoshn.com/` en el host correcto. Mejora marginal de crawl efficiency. |
| **Esfuerzo** | Bajo (15 min de configuración + verificación) |
| **Validación** | `curl` directo + GSC Coverage 7 días después |

---

### TAREA A-02 — Verificar y consolidar canonical de la home

**Estado: ✅ COMPLETADA (decisión documentada)** — El canonical renderizado sin slash es coherente y seguro. No se fuerza `trailingSlash: true` (riesgo de regresión > beneficio). Comentarios actualizados en `page.tsx` y `layout.tsx`.

| Campo | Valor |
|---|---|
| **Objetivo** | Garantizar que el canonical de `/` y `og:url` son consistentes con el comentario explícito del código (slash final) y que Bing no reporta "this page is a redirect" |
| **Archivos afectados** | `app/(public)/page.tsx` (línea `alternates: { canonical: \`${site.url}/\` }`), `app/(public)/layout.tsx` (línea `url: \`${site.url}/\``), `next.config.ts` (añadir `trailingSlash` si aplica) |
| **Estado actual** | Código define `https://www.pinedayasociadoshn.com/` (con slash); HTML renderizado muestra `https://www.pinedayasociadoshn.com` (sin slash). Comentario advierte que el slash es crítico para Bing. |
| **Acción exacta** | 1. Verificar con **Bing Webmaster Tools → SEO Report** si la home marca "this page is a redirect" o canonical mismatch. 2. Verificar con **GSC URL Inspection** qué canonical declara Google para `/`. 3. Si hay mismatch: añadir `trailingSlash: true` en `next.config.ts` (Next.js forzará slash en todas las URLs) **o** configurar redirect 308 explícito `/` (sin slash) → `/` (con slash). 4. Si Next.js normaliza intencionalmente (comportamiento por defecto desde Next 13), documentarlo y aceptarlo si no hay error en Bing. 5. Regenerar sitemap y reenviar a GSC/Bing/IndexNow. |
| **Impacto esperado** | Evita consolidación incorrecta en Bing; clarifica la URL canónica para todos los motores. |
| **Esfuerzo** | Medio (2–4 h entre verificación, fix y revalidación) |
| **Validación** | Bing WMT SEO Report + GSC URL Inspection post-fix |

---

### TAREA A-03 — Añadir enlace saliente a autoridad jurídica (Colegio de Abogados / Poder Judicial)

**Estado: ✅ COMPLETADA** — Añadido enlace al Poder Judicial de Honduras (`https://www.poderjudicial.gob.hn/`) en `/despacho` (tarjeta "Credenciales y especialidad") y en el footer (columna identidad). `rel="noopener noreferrer"`, sin `nofollow`, tono prudente.

| Campo | Valor |
|---|---|
| **Objetivo** | Reforzar E-E-A-T (Trustworthiness) en un sitio YMYL jurídico mediante enlace saliente a fuente de autoridad oficial verificable |
| **Archivos afectados** | `app/(public)/despacho/page.tsx`, `components/marketing/public-footer.tsx` |
| **Estado actual** | La web declara "Abogado colegiado en Honduras" en schema (`hasCredential`) y texto visible, pero no enlaza al Colegio de Abogados ni al registro público verificable |
| **Acción exacta** | 1. Añadir en `/despacho` (sección "Equipo" o "Credenciales") un enlace `rel="noopener"` al sitio oficial del Colegio de Abogados de Honduras (verificar URL canónica: `http://www.cah.hn/` o equivalente vigente) y/o al Poder Judicial (`https://poderjudicial.gob.hn/`). 2. Opcional: repetir el enlace en el footer (sección "Recursos" o "Marco legal"). 3. Considerar también enlazar la versión oficial del Código Penal (Decreto 130-2017) en el sitio del Congreso o Diario Oficial La Gaceta. |
| **Impacto esperado** | Señal de confianza verificable para Google (YMYL) y para LLMs (GEO). Los enlaces salientes a fuentes .gob.hn / oficiales son señal positiva en nicho legal. |
| **Esfuerzo** | Bajo (30 min) |
| **Validación** | Inspección visual + verificación de que los enlaces no son nofollow accidentales |

---

### TAREA A-04 — Auditar y corregir enlaces internos rotos (4xx en Bing)

**Estado: 🟡 PARCIALMENTE COMPLETADA** — 1 enlace roto corregido (`landing-local.tsx`: slug `derecho-ambiental-regulatorio` → `ambiental-regulatorio`). Las 232 URLs 4xx restantes requieren tool externo (Bing WMT / Screaming Frog): `data/bing/bing-live.json` no contiene el detalle de URLs, solo agregados.

| Campo | Valor |
|---|---|
| **Objetivo** | Eliminar los 232 errores 4xx y los 320 crawl errors reportados por Bing Webmaster en los últimos 26 días |
| **URLs afectadas** | Lista en `data/bing/bing-live.json` (campo `crawlErrors`); revisar también Bing WMT → Crawl Information → Crawl Errors |
| **Estado actual** | Bing reporta: 2xx = 3.754, 4xx = 232, crawlErrors = 320 (sobre 2.930 páginas rastreadas en 26 días) |
| **Acción exacta** | 1. Descargar lista completa de URLs 4xx desde Bing WMT (Crawl Errors → URL con detalle). 2. Ejecutar crawl con Screaming Frog (o equivalente) sobre `https://www.pinedayasociadoshn.com/` configurado para seguir todos los enlaces internos. 3. Cruzar las URLs 4xx con el sitemap y los enlaces internos del sitio. 4. Para cada error: corregir el enlace origen (si apunta a URL inexistente) o añadir redirect 301 (si la URL destino cambió) o restaurar la página (si fue eliminada por error). 5. Para crawl errors repetitivos (URLs que Bing insiste en rastrear pero no existen): añadir `Disallow` específico en `robots.txt` o devolver 410 Gone. 6. Reindexar vía GSC + IndexNow (`npm run indexnow:core`). |
| **Impacto esperado** | Mejora del crawl budget, reducción de errores que Bing interpreta como mala calidad técnica, mejor experiencia de usuario. |
| **Esfuerzo** | Medio (4–8 h dependiendo del nº de enlaces únicos rotos) |
| **Validación** | Bing WMT Crawl Errors 7 días post-fix + nuevo crawl Screaming Frog |

---

## Cierre externo Fase 1 — 2026-07-06

Las tres tareas con pendientes externos (A-01, A-02, A-04) tienen su procedimiento operativo detallado en `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` § "Cierre técnico Fase 1". Resumen ejecutivo para el operador:

### A-01 (Vercel) — ~10 min
1. Vercel → Settings → Domains → `pinedayasociadoshn.com` → "Redirect to www" → Permanent (301 o 308).
2. Verificar: `curl -sSL -o /dev/null -w "Saltos: %{num_redirects}\n" http://pinedayasociadoshn.com/` → debe dar **1**.
3. Confirmar en GSC Preferred Domain 1–2 semanas después.

### A-02 (GSC + Bing) — validación pasiva
1. GSC URL Inspection de `https://www.pinedayasociadoshn.com/` → confirmar "User-declared canonical" = "Google-selected canonical".
2. Bing WMT SEO Report → confirmar que la home NO marca "this page is a redirect".
3. Si ambos confirman coherencia: A-02 queda **✅ validada externamente**.

### A-04 (Bing WMT + Screaming Frog) — 4–8 h
1. Exportar Crawl Errors 4xx desde Bing WMT → CSV.
2. Crawl Screaming Frog con sitemap como fuente (detectar orphan pages).
3. Clasificar cada URL: (a) corregible / (b) redirect 301 / (c) basura externa / (d) privada / (e) inexistente.
4. Corregir solo tipos (a) y (b) en commits atómicos. Prohibido redirigir 404 a la home o crear páginas vacías.
5. **Criterio de cierre:** 0 enlaces internos rotos corregibles (no 0 errores 4xx absolutos).

**Recomendación de indexación:** desplegar cambios actuales + cerrar A-01 en Vercel → ya se puede esperar indexación. A-04 ejecutable en paralelo (no bloquea).

---

## 🟡 MEDIA (5 tareas — ejecutar en paralelo con indexación)

### TAREA M-01 — Completar `sameAs` con perfiles sociales verificados

| Campo | Valor |
|---|---|
| **Objetivo** | Reforzar el Knowledge Graph y la verificación de identidad del bufete (E-E-A-T Authoritativeness) |
| **Archivos afectados** | `lib/site.ts` (campos `site.social.instagram`, `.linkedin`, `.youtube`, `.tiktok`) vía variables `NEXT_PUBLIC_SOCIAL_*` |
| **Estado actual** | `facebook`, `x`, `googleBusiness` poblados; `instagram`, `linkedin`, `youtube`, `tiktok` = `null` |
| **Acción exacta** | Cuando el bufete aporte URLs reales y verificadas (NO inventar, cumple R4): 1. Configurar las variables `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, `NEXT_PUBLIC_SOCIAL_LINKEDIN`, `NEXT_PUBLIC_SOCIAL_YOUTUBE`, `NEXT_PUBLIC_SOCIAL_TIKTOK` en `.env.local` y Vercel. 2. Verificar que aparecen automáticamente en `Organization.sameAs` y `LegalService.sameAs` (el código ya los incluye condicionalmente). 3. Añadir iconos en el footer cuando existan. |
| **Impacto esperado** | Mejor vinculación entidad→perfiles en Knowledge Graph de Google/Microsoft; refuerzo de autoridad. |
| **Esfuerzo** | Bajo (cuando se disponga de las URLs: 15 min) |
| **Validación** | [Rich Results Test](https://search.google.com/test/rich-results) en home → verificar `sameAs` |

---

### TAREA M-02 — Validar Core Web Vitals con datos de campo (CrUX)

| Campo | Valor |
|---|---|
| **Objetivo** | Confirmar que LCP, INP y CLS están en verde ("Good") en móvil con datos reales de usuario |
| **URLs afectadas** | Home, `/servicios-juridicos`, `/derecho-penal`, `/blog`, posts top por tráfico |
| **Estado actual** | NO VALIDADO (sin datos CrUX suficientes o no consultados) |
| **Acción exacta** | 1. Ejecutar `npm run audit:performance` (script `scripts/auditar-performance-publico.ts`) sobre las URLs principales. 2. Consultar [PageSpeed Insights](https://pagespeed.web.dev/) con la URL de la home y `/servicios-juridicos` (móvil). 3. Consultar GSC → Core Web Vitals para datos de campo agregados. 4. Si alguna métrica está en amarillo/rojo: priorizar LCP (imágenes hero, fonts), INP (JS de cliente en widgets) y CLS (reservas de imagen). 5. Revisar el script de `chat-widget.tsx`, `live-widgets.tsx` y `turnstile-widget.tsx` como posibles fuentes de INP. |
| **Impacto esperado** | Confirmación o mejora del ranking (Google usa CWV como señal de clasificación desde 2021, con INP desde marzo 2024). |
| **Esfuerzo** | Medio (1 día de análisis + optimización si hay issues) |
| **Validación** | PageSpeed Insights móvil score ≥ 90 en Performance + GSC CWV en verde |

---

### TAREA M-03 — Solicitar indexación de hubs no rastreados en GSC

| Campo | Valor |
|---|---|
| **Objetivo** | Activar el rastreo e indexación de 8 categorías de blog y 8 servicios marcados "NEUTRAL / nunca rastreado" en la línea base GSC |
| **URLs afectadas** | Ver lista priorizada en `docs/audits/indexacion-monitorizacion.md` (Niveles 1 y 2) |
| **Estado actual** | 16 URLs clave con estado NEUTRAL en GSC (nunca rastreadas) |
| **Acción exacta** | 1. En GSC → URL Inspection → pegar cada URL → "Solicitar indexación". 2. Respetar la cuota de Google (~10 solicitudes/día). 3. Priorizar primero las URLs comerciales (Nivel 1: `/servicios-juridicos`, `/servicios-juridicos/derecho-laboral`, etc.) y después los hubs de blog (Nivel 2). 4. Revisar a los 7 días el estado ("Cubierta" vs "Descubierta"). 5. Paralelamente, ejecutar `npm run indexnow:core` para notificar a Bing/IndexNow. |
| **Impacto esperado** | Indexación de 16 URLs que actualmente reciben 0 impresiones por no estar indexadas. |
| **Esfuerzo** | Bajo (2 min por URL, distribuido en ~2 días por cuota) |
| **Validación** | GSC Coverage 7–14 días post-solicitud |

---

### TAREA M-04 — Ampliar posts top con bloques citables (tablas/listas)

| Campo | Valor |
|---|---|
| **Objetivo** | Maximizar el potencial de featured snippet y citación por LLMs en los 5 posts con mayor volumen de impresiones en GSC |
| **URLs afectadas** | `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita`, `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`, `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras`, `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026`, `/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena` |
| **Estado actual** | Posts con buen contenido pero sin tabla/resumen estructurado que Google pueda extraer como snippet directo |
| **Acción exacta** | Para cada post, añadir tras el primer `<h2>` (o como bloque `<AnswerBlock>` al inicio): una **tabla HTML o lista ordenada** con los datos clave (plazos de prescripción por tipo de deuda, tipos de estafa con pena, porcentajes de pensión por nº de hijos, tipos de poder notarial, requisitos de naturalización). **No inventar datos legales (R4)**: todas las cifras deben verificarse contra `data/articulos_cp.json`, `data/codigo_civil.json`, etc. 2. Asegurar que la tabla está dentro del `articleBody` para que la incluya el `SpeakableSpecification`. |
| **Impacto esperado** | Ocupación de featured snippet (position 0) en queries informativas; mayor citabilidad por Gemini/ChatGPT/Perplexity. |
| **Esfuerzo** | Medio (2–3 h por post, 5 posts = ~15 h) |
| **Validación** | GSC Performance 30 días post-publicación (impresiones + posición) |

---

### TAREA M-05 — Evaluar e implementar banner de consentimiento RGPD

| Campo | Valor |
|---|---|
| **Objetivo** | Cumplir con RGPD / LOPDGDD (España) dado que España es el país #1 de usuarios (41,8 % del tráfico, 281 usuarios en 28 días) y la web usa GA4 + Clarity (cookies analíticas no esenciales) |
| **Archivos afectados** | Nuevo componente `components/ui/cookie-consent.tsx`, layout raíz, `app/(public)/politica-cookies/page.tsx` |
| **Estado actual** | Política de Cookies publicada pero sin banner de consentimiento explícito |
| **Acción exacta** | 1. **Evaluar obligación:** confirmar con asesoría legal si el tráfico desde España (RGPD) justifica el banner. Dado que supera el 40 % del tráfico, lo probable es que sí. 2. Implementar banner conforme estándar europeo: consentimiento previo (opt-in), granularidad (analítica / marketing), posibilidad de rechazar todo con un click, registro del consentimiento. 3. Bloquear GA4 y Clarity hasta consentimiento (enviar eventos solo tras aceptar). 4. Mantener la coherencia con `site.fbPixelId` (también requiere consentimiento si se activa). |
| **Impacto esperado** | Cumplimiento legal; evita sanciones de la AEPD (hasta 20M€ o 4 % facturación). |
| **Esfuerzo** | Medio (1–2 días de implementación + testeo) |
| **Validación** | Test funcional en navegador incógnito + revisión legal |

---

## 🟢 BAJA (3 tareas — refinamiento continuo)

### TAREA B-01 — Confirmar `foundingDate` verificable

| Campo | Valor |
|---|---|
| **Objetivo** | Asegurar que la fecha de fundación en schema es exacta o está marcada como aproximada |
| **Archivos afectados** | `lib/site.ts` (`organizationSchema()`, línea `foundingDate: '2010'`) |
| **Estado actual** | `foundingDate: '2010'` con comentario "refleja 'más de 15 años de ejercicio profesional'" |
| **Acción exacta** | Confirmar con el bufete el año exacto de fundación/inicio de ejercicio. Si no se puede verificar: cambiar a `foundingDate: '~2010'` (Schema.org acepta string aproximado) o eliminar la propiedad. |
| **Impacto esperado** | Precisión E-E-A-T (Google valora datos verificables; datos falsos en schema son riesgo). |
| **Esfuerzo** | Bajo (5 min) |
| **Validación** | Rich Results Test |

---

### TAREA B-02 — Ejecutar crawl técnico completo para detectar rutas huérfanas

| Campo | Valor |
|---|---|
| **Objetivo** | Confirmar que toda URL del sitemap recibe al menos 1 enlace interno entrante y detectar páginas huérfanas |
| **URLs afectadas** | Global |
| **Estado actual** | NO VALIDADO (no se ha ejecutado crawl completo) |
| **Acción exacta** | 1. Ejecutar Screaming Frog SEO Spider (o Sitebulb) sobre `https://www.pinedayasociadoshn.com/`. 2. Activar la opción "List of URLs" con el sitemap para detectar orphan pages. 3. Cruzar las URLs huérfanas con el sitemap y añadir enlaces internos desde hubs relevantes (home, blog, servicios) hacia las huérfanas que tengan valor. |
| **Impacto esperado** | Distribución uniforme de autoridad interna; indexación más rápida de URLs profundas. |
| **Esfuerzo** | Medio (crawl + análisis: 3–4 h) |
| **Validación** | Reporte Screaming Frog → 0 orphan pages en URLs comerciales |

---

### TAREA B-03 — Auditoría de accesibilidad WCAG AA

| Campo | Valor |
|---|---|
| **Objetivo** | Garantizar accesibilidad técnica para usuarios con discapacidad y cumplir buenas prácticas SEO semánticas |
| **URLs afectadas** | Global |
| **Estado actual** | Señales positivas (skip link, landmarks, `aria-label`) pero sin audit completo |
| **Acción exacta** | 1. Ejecutar Lighthouse Accessibility (móvil y desktop) en home, servicios, blog y un post. 2. Ejecutar axe DevTools en las mismas URLs. 3. Corregir: contraste de color WCAG AA, alt text en todas las imágenes (`alt=""` para decorativas), foco visible en navegación por teclado, roles ARIA en widgets interactivos (chat, menús). 4. Documentar resultados en `docs/audits/`. |
| **Impacto esperado** | Mejor experiencia para todos los usuarios; la accesibilidad es señal positiva de calidad para Google. |
| **Esfuerzo** | Medio (1 día de audit + fixes) |
| **Validación** | Lighthouse Accessibility ≥ 95 + axe 0 violaciones críticas |

---

## Resumen de priorización

| Fase | Tareas | Esfuerzo total | Plazo | Estado (2026-07-06) |
|---|---|---|---|---|
| **Fase 1 (crítica)** | A-01, A-02, A-03, A-04 | ~1–3 días | Inmediato | **A-01 pendiente externa · A-02 ✅ · A-03 ✅ · A-04 parcial** |
| **Fase 2 (alto impacto)** | M-01, M-02, M-03, M-04 | ~1–2 semanas | Paralelo a indexación | Pendiente |
| **Fase 3 (refinamiento)** | M-05, B-01 | ~2 semanas | Tras confirmar tráfico | Pendiente |
| **Fase 4 (continuo)** | B-02, B-03 | Mensual/trimestral | Mantenimiento | Pendiente |

**Regla de ejecución:** completar Fase 1 antes de esperar indexación. Las demás fases pueden correr en paralelo con el proceso natural de rastreo/indexación de Google y Bing.

**Notas Fase 1 (2026-07-06):**
- A-01 requiere acción manual en el panel de Vercel (configurar dominio apex como redirect 301 directo a www). No es ejecutable desde el repositorio.
- A-02 se resolvió con decisión documentada (no cambio de código funcional): la normalización de trailing slash de Next.js es coherente y Bing no reporta errores.
- A-03 completada: enlace al Poder Judicial de Honduras en `/despacho` y footer.
- A-04 parcial: 1 enlace roto corregido; el resto de las 232 URLs 4xx requiere descarga del detalle desde Bing Webmaster Tools o un crawl con Screaming Frog (la lista detallada no está en el repositorio).
