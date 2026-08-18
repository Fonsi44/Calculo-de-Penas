# PAQUETE DE EJECUCIÓN TÉCNICA - 2026-08-16

Fuente: `docs/audits/plan-remediacion-2026-08-16.md`. No aplicar IndexNow real ni deploy sin autorización. No mezclar con el PR `fix/allow-production-editorial-upsert`.

Tras aplicar diffs: actualizar `tests/fase2-arquitectura-publica.test.ts` (`heroTitle` Nacaome) — ese test no está en la lista de parches y fallará si no se toca.

Los enlaces internos pensión (HTML en DB) no tienen archivo en este paquete; van en el checklist editorial.

---

## 1. PARCHES DE CÓDIGO (APLICAR CON `git apply` o manualmente)

### 1.1. Archivo: `data/blog/blog-metadata-overrides.ts`

```diff
   'pension-alimenticia-honduras-guia-completa': {
-    title: 'Pensión Alimenticia en Honduras: Requisitos y Pasos',
-    description: 'Requisitos y procedimiento para solicitar pensión alimenticia en Honduras. Montos, plazos, documentos y ejecución ante incumplimiento.',
+    title: 'Pensión alimenticia Honduras: requisitos y pasos',
+    description: 'Cómo solicitar pensión alimenticia en Honduras: documentos, demanda, plazos y cobro ante incumplimiento. Guía de procedimiento. Nacaome.',
   },
   'poder-legal-honduras-cuando-se-necesita': {
```

Insertar **antes** de `'poder-legal-honduras-cuando-se-necesita'` (si no existe la clave porcentaje):

```diff
+  'pension-alimenticia-porcentaje-honduras-2026': {
+    title: 'Pensión alimenticia Honduras 2026: porcentaje',
+    description: 'Cómo estima el juez el porcentaje de pensión alimenticia en Honduras en 2026: ingresos, necesidades del menor y tope de embargo. Nacaome.',
+  },
+  'divorcio-honduras-guia-completa': {
+    title: 'Divorcio en Honduras: mutuo acuerdo, causal y plazos',
+    description: 'Tres vías de divorcio en Honduras: mutuo consentimiento, causal y separación. Documentos, hijos y pensión. Bufete en Nacaome.',
+  },
+  'nacionalidad-espanola-para-hondurenos-residencia-plazos': {
+    title: 'Nacionalidad española para hondureños: plazos',
+    description: 'Requisitos generales de nacionalidad española por residencia. El bufete en Nacaome orienta trámites hondureños; no ejerce derecho español.',
+  },
```

```diff
   'que-hacer-si-me-detienen-en-honduras': {
-    title: '¿Qué hacer si me detienen en Honduras? Guía práctica',
-    description: 'Recomendaciones generales para actuar con prudencia ante una detención y solicitar asistencia jurídica sin interferir con la actuación de la autoridad.',
+    title: 'Detención en Honduras: derechos, 24 h y qué no firmar',
+    description: 'Si lo detienen en Honduras: pida el motivo, no declare sin defensor y no firme lo que no entienda. Plazo de 24 horas ante el juez.',
   },
```

### 1.2. Archivo: `app/(public)/despacho/page.tsx`

```diff
 export const metadata: Metadata = buildMetadata({
-  // 50 chars. Plan maestro §6.1: "Bufete de Abogados en Nacaome | Nuestro Equipo"
-  title: `Bufete de Abogados en ${site.address.city} | Nuestro Equipo`,
-  // 155 chars. Plan §6.1
-  description: `Conozca a los abogados colegiados de ${site.name}, sus áreas de práctica y la metodología de atención del bufete en ${site.address.city} y la zona sur de Honduras.`,
+  // CHANGED A.1 — 46 chars. Desambiguación Nacaome vs Tegucigalpa.
+  title: 'Abogados colegiados en Nacaome, Valle | Equipo',
+  description: 'Equipo del bufete en Nacaome, Valle, no Tegucigalpa: áreas de práctica, método de atención y evaluación inicial confidencial.',
   canonicalPath: '/despacho',
```

### 1.3. Archivo: `app/(public)/preguntas-frecuentes/page.tsx`

```diff
   return {
-    title: 'Preguntas frecuentes sobre consultas y honorarios',
-    description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención de ${site.name}.`,
+    title: { absolute: 'Honorarios y primera consulta | FAQ' },
+    description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención de ${site.name} en Nacaome.`,
     alternates: { canonical: '/preguntas-frecuentes' },
     keywords: ['evaluación inicial confidencial', 'honorarios abogados Honduras', 'presupuesto legal', 'confidencialidad abogado', 'documentos primera consulta'],
     twitter: {
       card: 'summary_large_image',
-      title: 'Preguntas frecuentes sobre consultas y honorarios',
+      title: 'Honorarios y primera consulta | FAQ',
       description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención.`,
       images: [`${site.url}/og/faq.webp`],
     },
     openGraph: {
-      title: 'Preguntas frecuentes sobre consultas y honorarios',
+      title: 'Honorarios y primera consulta | FAQ',
       description: `${total} respuestas sobre evaluación inicial confidencial, documentación, honorarios, presupuesto y atención de ${site.name}.`,
```

### 1.4. Archivo: `components/blog/blog-toc.tsx`

```diff
  *   - Este componente recibe `headings` como prop y se renderiza en SSR.
- *   - El smooth-scroll al hacer clic se mantiene como enhancement progresivo.
- *
- * El componente sigue siendo `'use client'` porque necesita `onClick` para el
- * scroll suave y el pushState, pero el HTML inicial (el que ven crawlers y
- * LLMs) ya contiene el TOC completo con los anchors correctos.
+ *   - El smooth-scroll al hacer clic no escribe `#` en el historial (A.2).
+ *
+ * El componente sigue siendo `'use client'` porque necesita `onClick` para el
+ * scroll suave. Los `id` de los H2 siguen en el HTML servidor (lib/blog-toc.ts).
  *
  * Solo se muestra si hay ≥2 H2.
  */
@@
           {h2s.map((h) => (
             <li key={h.id}>
-              <a
-                href={`#${h.id}`}
-                className="text-sm text-text-secondary hover:text-primary transition-colors no-underline border-b border-dotted border-border/30 hover:border-accent/50"
-                onClick={(e) => {
-                  e.preventDefault();
-                  const el = document.getElementById(h.id);
-                  if (el) {
-                    const top = el.getBoundingClientRect().top + window.scrollY - 100;
-                    window.scrollTo({ top, behavior: 'smooth' });
-                    history.pushState(null, '', `#${h.id}`);
-                  }
-                }}
-              >
-                {h.text}
-              </a>
+              <button
+                type="button"
+                className="text-sm text-text-secondary hover:text-primary transition-colors text-left w-full border-b border-dotted border-border/30 hover:border-accent/50"
+                onClick={() => {
+                  const el = document.getElementById(h.id);
+                  if (el) {
+                    const top = el.getBoundingClientRect().top + window.scrollY - 100;
+                    window.scrollTo({ top, behavior: 'smooth' });
+                  }
+                }}
+              >
+                {h.text}
+              </button>
             </li>
           ))}
```

### 1.5. Archivo: `app/robots.ts`

```diff
   return {
     rules: [
-      ...ALLOWED_CRAWLER_USER_AGENTS.map((userAgent) => ({
+      ...ALLOWED_CRAWLER_USER_AGENTS.filter((userAgent) => userAgent !== 'Bingbot').map((userAgent) => ({
         userAgent,
         allow: '/',
         disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
       })),
+      {
+        userAgent: 'Bingbot',
+        allow: '/',
+        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
+        crawlDelay: 2,
+      },
       ...FULLY_BLOCKED_USER_AGENTS.map((userAgent) => ({
```

### 1.6. Archivo: `components/marketing/public-footer.tsx`

```diff
             <p className="text-sm text-text-inverse/80 leading-relaxed text-pretty">
               <strong className="font-semibold text-text-inverse">Bufete jurídico</strong> en {site.address.city}, {site.address.department},
               con más de 15 años de ejercicio profesional y <strong className="font-semibold text-accent">defensa penal</strong> como
               pilar fundacional. Atención directa con presencia activa en juzgados del sur de Honduras.
             </p>
+            <p className="text-xs text-text-inverse/70 leading-relaxed mt-2 text-pretty">
+              Sede en {site.address.city}, {site.address.department}. No tenemos oficina en
+              Tegucigalpa ni relación con despachos homónimos.
+            </p>
             <p className="text-xs text-text-inverse/80 leading-relaxed mt-2 text-pretty">
               Aplicación rigurosa del {LEGAL_FRAME_BADGE}.
             </p>
```

### 1.7. Archivo: `lib/legal-content.ts`

```diff
   'politica-privacidad': {
     title: 'Política de Privacidad',
-    subtitle: 'Compromiso con la protección de sus datos personales conforme a la Ley de Protección de Datos de Honduras.',
-    version: '0.5',
-    lastUpdated: 'Julio 2026',
+    subtitle: 'Protección de datos personales conforme a la Constitución de Honduras (Arts. 76 a 80).',
+    version: '0.6',
+    lastUpdated: 'Agosto 2026',
   },
```

### 1.8. Archivo: `app/(public)/politica-privacidad/page.tsx`

```diff
         <p>
-          A la fecha de publicación de esta política, la República de
-          Honduras no cuenta con una autoridad regulatoria independiente
-          de protección de datos personales. El bufete aplica de forma
-          voluntaria los principios generales del derecho a la intimidad
-          reconocidos en los <strong className="font-semibold text-primary">Arts. 76 a 80 de la Constitución de la República</strong>{' '}
-          y en los tratados internacionales en materia de derechos humanos
-          ratificados por Honduras.
+          A la fecha de esta política, la República de Honduras no cuenta con
+          una autoridad administrativa independiente de protección de datos
+          personales equivalente a las agencias de otros países. El bufete
+          aplica de forma voluntaria los principios del derecho a la intimidad,
+          al honor y a la propia imagen reconocidos en los{' '}
+          <strong className="font-semibold text-primary">Arts. 76 a 80 de la Constitución de la República</strong>,
+          el deber de secreto profesional del abogado conforme a la Ley Orgánica
+          del Colegio de Abogados de Honduras, y las reglas generales del Código
+          Civil sobre responsabilidad por el uso ilícito de datos e imagen. Esta
+          política no afirma la vigencia de una ley general de protección de
+          datos personales que no esté identificada por decreto en el cuerpo
+          del documento.
         </p>
```

Si `page_content.hero.subtitle` en DB sigue citando «Ley de Protección de Datos», hay que actualizarlo en admin (el default de `lib/legal-content.ts` no gana si hay valor en DB).

### 1.9. Archivos collector / dotenv

`scripts/seo-live-collect.mjs`:

```diff
 config({ path: resolve(ROOT, '.env') });
-config({ path: resolve(ROOT, '.env.local'), override: true });
+config({ path: resolve(ROOT, '.env.local'), override: false });
```

```diff
     const out = execSync(cmd, {
       encoding: 'utf-8',
       stdio: 'pipe',
       cwd: ROOT,
-      timeout: 120_000,
+      timeout: 180_000,
       windowsHide: true,
     }).trim();
```

`scripts/google-search-console-live.mjs`:

```diff
 config({ path: resolve(ROOT, ".env") });
-config({ path: resolve(ROOT, ".env.local"), override: true });
+config({ path: resolve(ROOT, ".env.local"), override: false });
```

`scripts/google-analytics-live.mjs`:

```diff
 config({ path: resolve(ROOT, ".env") });
-config({ path: resolve(ROOT, ".env.local"), override: true });
+config({ path: resolve(ROOT, ".env.local"), override: false });
```

`scripts/bing-webmaster-live.mjs`:

```diff
 config({ path: resolve(ROOT, ".env") });
-config({ path: resolve(ROOT, ".env.local"), override: true });
+config({ path: resolve(ROOT, ".env.local"), override: false });
```

### 1.10. Archivo: `data/landings-locales.ts`

`intro` se renderiza como texto plano en `landing-local.tsx` (fuera de este paquete). Las rutas van en prosa, no JSX.

```diff
     heroEyebrow: 'Ubicación de la oficina · Valle, Honduras',
-    heroTitle: 'Cómo visitar nuestra oficina en Nacaome',
+    // KEEP_SECONDARY_OPERATIONAL — no canibalizar H1 «Abogados en Nacaome» (home).
+    heroTitle: 'Sede en Nacaome: dirección, horario y visita',
     heroSubtitle:
       'Consulte la ubicación, el horario y cómo preparar una atención presencial o remota con el despacho.',
     intro:
-      'Nacaome, cabecera del departamento de Valle, concentra gran parte de la actividad judicial y comercial del sur de Honduras. Nuestra sede está ubicada en el centro de la ciudad, cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Atendemos particulares, familias y empresas de Nacaome, San Lorenzo, Amapala y toda la zona sur.',
+      'Nacaome, cabecera del departamento de Valle, concentra gran parte de la actividad judicial y comercial del sur de Honduras. Nuestra sede está ubicada en el centro de la ciudad, cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Atendemos particulares, familias y empresas de Nacaome, San Lorenzo, Amapala y toda la zona sur. Indicaciones de ruta, mapa y accesos desde Tegucigalpa, Choluteca y San Lorenzo están en /como-llegar. Para contratar defensa o asesoría, use la página principal / o solicite una evaluación inicial confidencial.',
```

Tras este diff, ajustar el expect en `tests/fase2-arquitectura-publica.test.ts`:

```
expect(landing?.heroTitle).toBe('Sede en Nacaome: dirección, horario y visita');
```

---

## 2. COMANDOS DE TERMINAL (COPIA Y PEGA)

```bash
# 0) Lint / types (antes y después de aplicar diffs)
npm run lint
npx tsc --noEmit

# 1) Lighthouse móvil (B.4) — app en http://localhost:3100
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

# LCP ms (debe ser < 2500 para pasar)
node -e "const j=require('./docs/audits/lighthouse-home-mobile-2026-08-16.report.json'); console.log('LCP', j.audits['largest-contentful-paint'].numericValue)"

# 2) Verificar 308 (A.4)
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  https://www.pinedayasociadoshn.com/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras

curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" -L --max-redirs 3 \
  https://www.pinedayasociadoshn.com/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras

curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  https://www.pinedayasociadoshn.com/blog/derecho-laboral/empleador-no-paga-salario-honduras

curl -sI -o /dev/null -w "%{http_code} %{url_effective}\n" -L --max-redirs 3 \
  https://www.pinedayasociadoshn.com/blog/derecho-laboral/empleador-no-paga-salario-honduras

# 3) IndexNow dry-run (A.4) — NO envía. Envío real: solo con autorización + ENABLE_INDEXNOW_SUBMIT=true
npm run indexnow:dry

# 4) Collector reparado (C.2)
npm run seo:doctor
npm run seo:collect

# 5) Tests tocados por B.1 / robots
npx vitest run tests/fase2-arquitectura-publica.test.ts tests/crawl-contract.test.ts tests/blog-metadata-only.test.ts
```

Esperado curls 308: `308` + Location al destino corto. Con `-L`: `200` en:

- `https://www.pinedayasociadoshn.com/blog/proceso-penal/sobreseimiento-definitivo-provisional`
- `https://www.pinedayasociadoshn.com/blog/derecho-laboral/despido-laboral-honduras-guia-completa`

---

## 3. INSTRUCCIONES PARA CONSOLAS WEB

### 3.1. GA4 — comparación «Público canónico» (A.3)

Property: `541022095`. Sitio: `www.pinedayasociadoshn.com`.

1. Abre [https://analytics.google.com/](https://analytics.google.com/) e inicia sesión.
2. Arriba a la izquierda, elige la propiedad del sitio Pineda y Asociados (`541022095`).
3. En el menú izquierdo entra en **Informes** (cualquier informe de Adquisición o Enganche).
4. Arriba del informe, pulsa **Comparar** (icono de dos columnas / «Comparar datos»).
5. Pulsa **Crear nueva**.
6. Nombre: `Público canónico`.
7. Añade condición **Incluir**: dimensión `Nombre de host` → coincide exactamente con `www.pinedayasociadoshn.com`.
8. Añade condición **Excluir**: dimensión `Ruta de página` → contiene `/intranet`.
9. Añade condición **Excluir**: dimensión `Ruta de página` → contiene `/preview`.
10. Guarda. Activa esta comparación en los informes; no uses el 365d sin filtro.

Exploración `(not set)`:

1. Menú **Explorar** → **Técnica libre**.
2. Dimensiones: `Página de destino`, `Fuente de la sesión`, `Dispositivo`.
3. Filtro: `Nombre de host` = `www.pinedayasociadoshn.com`.
4. Filtro: `Página de destino` no coincide con `(not set)` ni con `/intranet`.

Hostname como dimensión secundaria: en el informe, **Personalizar informe** → añadir `Nombre de host`. Ignorar `localhost` y `*.vercel.app`.

### 3.2. GA4 — marcar `email_click` como evento clave (C.1)

Hace falta usuario **Editor** o **Administrador** (la service account de lectura no sirve).

1. En GA4, icono **Administrar** (engranaje, abajo a la izquierda).
2. Columna de la propiedad → **Mostrar datos** / **Visualización de datos** → **Eventos**.
3. Busca `email_click` en la lista.
4. Si aparece: menú de tres puntos → **Marcar como evento clave** (o el interruptor «Evento clave»).
5. Si **no** aparece: en el sitio público, con cookies de analítica aceptadas, pulsa un `mailto:` → espera 24–48 h → vuelve a Eventos → márcalo.
6. Entra en **Eventos clave** y confirma que están `contact_form_submit` y `email_click`.
7. No marques `page_view` ni `scroll_depth`.

### 3.3. Bing Webmaster — 4xx y recrawl 308 (A.4)

1. Abre [https://www.bing.com/webmasters](https://www.bing.com/webmasters) e inicia sesión.
2. Selecciona `https://www.pinedayasociadoshn.com/`.
3. Menú **Informes y datos** (o **Site Explorer** / **Rastreo**, según el idioma del panel).
4. Abre **Páginas de error** / crawl errors. Exporta el CSV de 4xx.
5. Clasifica cada URL: 404 real → candidata a «Quitar URL»; 308 ya en `next.config.ts` → no borrar, dejar que siga Location.
6. **Quitar 4xx reales:** Herramientas → **Bloquear URL** / **Quitar URLs** → pega solo 404 confirmados → Enviar.
7. **Recrawl destinos 308:** **Inspección de URL** (URL Inspection). Pega, una a una, y pulsa **Recrawl** / **Enviar a Bing**:
   - `https://www.pinedayasociadoshn.com/blog/proceso-penal/sobreseimiento-definitivo-provisional`
   - `https://www.pinedayasociadoshn.com/blog/derecho-laboral/despido-laboral-honduras-guia-completa`
8. IndexNow **real** (no dry-run): solo si el titular autoriza y `ENABLE_INDEXNOW_SUBMIT=true`. No pegues la key. Usa `npm run indexnow:dry` hasta esa autorización.

---

## 4. CHECKLIST DE VERIFICACIÓN POST-DEPLOY

- [ ] `npm run lint` y `npx tsc --noEmit` en verde
- [ ] `npx vitest run tests/fase2-arquitectura-publica.test.ts tests/crawl-contract.test.ts tests/blog-metadata-only.test.ts` en verde
- [ ] Producción FAQ: `view-source:https://www.pinedayasociadoshn.com/preguntas-frecuentes` → `<title>Honorarios y primera consulta | FAQ</title>` (35 caracteres, sin segundo `| Pineda y Asociados`)
- [ ] Producción despacho: title `Abogados colegiados en Nacaome, Valle | Equipo`
- [ ] Producción divorcio: title `Divorcio en Honduras: mutuo acuerdo, causal y plazos` (o esa cadena + marca solo si cabe en 60 vía `buildBlogMetaTitle`)
- [ ] Producción detención: title `Detención en Honduras: derechos, 24 h y qué no firmar`
- [ ] Footer en `/` y `/despacho`: frase «No tenemos oficina en Tegucigalpa ni relación con despachos homónimos»
- [ ] Un solo `<h1>` por página; el H1 de `/abogados-en-nacaome` es `Sede en Nacaome: dirección, horario y visita`
- [ ] TOC de un artículo: clic en índice **no** cambia `location.hash`; la URL no gana `#...`
- [ ] `/politica-privacidad`: no aparece «Ley de Protección de Datos de Honduras»; sí Arts. 76–80, CAH y Código Civil; `noindex, follow`
- [ ] `https://www.pinedayasociadoshn.com/robots.txt`: bloque `User-agent: Bingbot` con `Crawl-delay: 2` y mismos Disallow que Googlebot; `Sitemap:` presente
- [ ] Curls 308 del §2: 308 → 200 en destinos cortos
- [ ] `npm run seo:doctor` → 0 ERROR; `npm run seo:collect` → 6/6 (o error real, no timeout 120s)
- [ ] Lighthouse móvil: anotar LCP ms; no afirmar CWV de campo
- [ ] GA4: comparación «Público canónico» activa; `email_click` marcado si el evento existe
- [ ] Bing: recrawl de 2 destinos 308 enviado; CSV 4xx clasificado
- [ ] Editorial DB (fuera de git): enlaces pensión porcentaje ↔ guía completa (plan B.3)
- [ ] GSC 14–28 días: CTR divorcio y detención > 1,5 % o posición anotada; filas `prescripcion-deudas-plazos-honduras#` en descenso
- [ ] GBP Nacaome: `NO VALIDADO` hasta entrar al panel (fuera de código)
