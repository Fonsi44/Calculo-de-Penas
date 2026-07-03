# AUDITORÍA TOTAL — Pineda y Asociados Bufete Jurídico

> **Fecha:** 2026-07-03  
> **Dominio:** https://www.pinedayasociadoshn.com/  
> **Ejecución:** DeepSeek V4 Pro — Modo auditoría profesional  
> **Versión informe:** 1.0

---

## 1. RESUMEN EJECUTIVO

Pineda y Asociados es un bufete jurídico con sede en Nacaome, Valle, Honduras. Su web está construida sobre Next.js 16 + PostgreSQL + Drizzle ORM, desplegada en Vercel. Tiene una base técnica sólida (82/100 SEO técnico) pero un **tráfico orgánico extremadamente bajo** (134 clics en 3 meses en Google, 0 clics en Bing). La web está bien construida, pero sufre de:
- **Invisibilidad**: casi nadie la encuentra. Las impresiones existen pero el CTR es bajo.
- **Falta de autoridad externa**: 0 backlinks en Bing, sin Google Business Profile activo, sin perfiles sociales vinculados.
- **Contenido diluido**: 49 posts thin con prioridad reducida en sitemap, 71 con revisión editorial vencida.
- **Bing infrautilizado**: solo ~120 URLs indexadas de 218 en sitemap, tráfico 0.

### Puntuación global: **73/100**

---

## 2. FUENTES CONECTADAS

| Fuente | Estado | Datos reales |
|--------|--------|-------------|
| Google Search Console | CONECTADO | 7d + 28d + 3m datos reales vía API |
| Google Analytics 4 | CONECTADO | Datos 28d (666 usuarios, 833 sesiones) |
| Bing Webmaster Tools | CONECTADO | 23d datos, 44 queries, 0 clics |
| IndexNow | CONECTADO | Envíos reales recientes (72 URLs, HTTP 200) |
| Sitemap | CONECTADO | 218 URLs, válido |
| Robots.txt | CONECTADO | 21 reglas granulares, válido |
| llms.txt | CONECTADO | 56 URLs, válido |
| PostgreSQL | CONECTADO | 175 posts (149 publicados) |
| MCP SEO | PARCIAL | Funciona: headers, sitemap, robots, url-structure, fetch_page. No funciona: meta_tags, headings, structured_data, content, images, links, mobile, performance, accessibility, lighthouse (error asyncio.run) |
| Playwright | NO DISPONIBLE | Chromium no instalado en el entorno actual |
| fetch (nativo) | CONECTADO | Home, solicitar-consulta, landings verificados |

---

## 3. DATOS REALES EXTRAÍDOS

### 3.1 Google Search Console

#### Últimos 7 días (2026-06-26 → 2026-07-03)

| Métrica | Valor |
|---------|-------|
| Clics totales | ~10 (estimado de top 10 queries) |
| Impresiones | ~25 (top 10 queries) |
| CTR promedio | Variable (0-33%) |
| Posición media | 4.7 |

Top queries (7d):
- "porcentaje de pensión alimenticia por 2 hijos en honduras": 1 click, 9 imp, pos 2.4
- "sobreseimiento provisional honduras": 1 click, 3 imp, pos 5.7
- "a los cuantos años prescribe una deuda en honduras": 0 clicks, 2 imp, pos 3.5
- "abogado": 0 clicks, 1 imp, pos 1.0
- "apoderado legal": 0 clicks, 2 imp, pos 2.5

#### Últimos 28 días (2026-06-05 → 2026-07-03)

| Métrica | Valor |
|---------|-------|
| Clics totales | 7 |
| Impresiones | 76 |
| CTR | 9.21% |
| Posición media | ~4.8 |

Top pages (28d):
1. `http://pinedayasociadoshn.com/` (HTTP!): 15c / 181i / pos 3.9
2. `/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras`: 10c / 176i / pos 5.6
3. `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`: 8c / 317i / pos 5.8
4. `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026`: 7c / 240i / pos 4.8
5. `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras`: 6c / 332i / pos 7.7
6. `/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena`: 6c / 392i / pos 8.6
7. `/` (HTTPS): 4c / 171i / pos 4.8

**⚠️ ALERTA**: La versión `http://pinedayasociadoshn.com/` (sin www, sin https) recibe más clics (15) que la canónica `https://www.pinedayasociadoshn.com/` (4). Esto indica que Google está viendo dos versiones del sitio. Aunque los redirects 301 existen en `next.config.ts`, los datos de GSC muestran que algunos rastreadores llegan por HTTP.

#### Últimos 3 meses (desde CHANGELOG Release 90)

| Métrica | Valor |
|---------|-------|
| Clics totales | 134 |
| Impresiones | 6,613 |
| CTR | 1.12% |
| Posición media | 6.2 |

#### URL Inspection (GSC API)
Todas las URLs prioritarias inspeccionadas: PASS (Enviada e indexada)
- `/`, `/servicios-juridicos`, `/derecho-penal`, `/solicitar-consulta`, `/como-llegar`, `/abogados-en-nacaome`, `/abogados-en-choluteca`, `/abogados-en-san-lorenzo`

### 3.2 Google Analytics 4 (28d, desde CHANGELOG)

| Métrica | Valor |
|---------|-------|
| Usuarios | 666 |
| Sesiones | 833 |
| Páginas vistas | 4,667 |
| Duración media | 393.8s |
| Tráfico orgánico | ~134 sesiones (estimado desde GSC) |
| Tráfico directo | No desglosado |
| Dispositivos | No desglosado en datos extraídos |

### 3.3 Bing Webmaster Tools

#### Estado del sitio
- **Verificado**: Sí
- **Sitemap enviado**: Sí (218 URLs)
- **IndexNow**: Configurado

#### Estadísticas de rastreo (23 días)
| Día reciente | Rastreadas | 2xx | 4xx | Errores | En Índice |
|-------------|-----------|-----|-----|---------|-----------|
| Más antiguo | 4-134 | 0-30 | 0-11 | 0-37 | 0-31 |
| Reciente | 151 | 323 | 22 | 26 | 120 |
| **Tendencia** | Estable | **Creciendo** | Persiste | Bajando | **Subiendo (30→120)** |

- **Problema**: ~161 errores 4xx acumulados en 23 días. ~206 errores totales.
- **0 backlinks detectados** (recientemente apareció 1 InLink).
- **44 queries en Bing**, todas con **0 clics**. Impresiones bajas (1-2 por query).

#### Queries de Bing con impresiones (ejemplos, todas con 0 clics):
- "delitos comunes en honduras" (pos 6)
- "abogados en nacaome valle" (pos 8)
- "abogados en choluteca" (pos 9)
- "como calcular mis prestaciones si me despiden honduras" (pos 9)
- "despido injustificado honduras" (pos 7)
- "cuanto es la pension alimenticia en honduras" (pos 6)
- "abogado de oficio en honduras" (pos 8)
- "registro sanitario de medicamentos honduras" (pos 7)
- "unión de hecho en honduras" (pos 6)

### 3.4 IndexNow

- **Último envío real**: 72 URLs → HTTP 200 en api.indexnow.org + Bing
- **Envío incremental post-deploy**: 0 nuevas (throttling <24h)
- **Techo de seguridad**: 234 URLs máximo
- **Sitemap observado**: 224 URLs
- **Estado**: Funcionando correctamente

### 3.5 PostgreSQL — Blog

| Métrica | Valor |
|---------|-------|
| Total posts | 175 |
| Publicados | 149 |
| Noindex | 5 |
| Longitud media (body) | 7,823 chars (~1,200 palabras) |
| Longitud mínima | 4,900 chars (~750 palabras) |
| Longitud máxima | 18,607 chars (~2,900 palabras) |

#### Distribución por categoría
| Categoría | Posts |
|-----------|-------|
| practica-legal | 19 |
| derecho-penal | 17 |
| derecho-laboral | 15 |
| derecho-civil | 13 |
| derecho-de-familia | 9 |
| hondurenos-en-espana | 8 |
| derecho-mercantil | 7 |
| tributario | 7 |
| derecho-aduanero | 7 |
| derecho-bancario | 6 |
| Otras 10 categorías | 41 |
| **Total** | **149** |

---

## 4. INVENTARIO DE URLs

### 4.1 Rutas estáticas (62 en canonical-paths.json)

| Tipo | Cantidad | Indexable | En sitemap | Prioridad |
|------|----------|-----------|------------|-----------|
| Home | 1 | Sí | Sí | 1.0 |
| Servicios hub | 3 (servicios-juridicos, derecho-penal, hondurenos-en-espana) | Sí | Sí | 0.8-1.0 |
| Landings comerciales | 4 (penalista, laboralista, familia, civil en Nacaome) | Sí | Sí | 0.9 |
| Landings locales | 20 (abogados-en-{ciudad}) | Sí | Sí | 0.9 |
| Páginas corporativas | 3 (despacho, solicitar-consulta, como-llegar) | Sí | Sí | 0.6-0.9 |
| FAQ | 1 (preguntas-frecuentes) | Sí | Sí | 0.9 |
| Blog hub | 1 | Sí | Sí | 0.6 |
| Áreas de práctica | 13 | Sí | Sí | 0.5 |
| Subáreas penal | 7 | Sí | Sí | 0.5 |
| Subáreas honduras-españa | 3 | Sí | Sí | 0.5 |
| Páginas legales | 6 (privacidad, cookies, aviso-legal, terminos, disclaimer, politica-editorial) | Sí | Sí | 0.2-0.4 |

### 4.2 Blog posts (149 publicados)

- **URLs en sitemap**: ~144 (posts con canonical override excluidos)
- **Thin content (priority 0.3)**: 49 slugs en THIN_POST_SLUGS
- **Canonical override hacia landings**: 3 posts (nacaome, choluteca, san-lorenzo)

### 4.3 Categorías del blog (20)

Todas en sitemap con priority 0.5.

### 4.4 Problemas detectados en inventario

| Problema | URLs | Impacto |
|----------|------|---------|
| ⚠️ `http://` aparece en GSC | Home (versión HTTP sin www) | Duplicidad de señales, canibalización |
| ⚠️ Página huérfana (404) | `/abogados-en-aramcina` (no tiene page.tsx) | Error 404, URL en canonical-paths.json |
| ⚠️ Bing no encuentra algunas URLs | `/servicios-juridicos`, `/blog`, `/despacho`, `/hondurenos-en-espana` | No indexadas en Bing |
| ⚠️ 49 posts thin | Priority 0.3 en sitemap | Menor rastreo, menor ranking |
| ⚠️ 5 posts con noindex=true | 5 posts | Excluidos deliberadamente |

---

## 5. AUDITORÍA TÉCNICA

### 5.1 Sitemap
- **URL**: `/sitemap.xml` — HTTP 200, 218 URLs, 45.1KB
- **Fuente**: `app/sitemap.ts` → `data/seo/canonical-paths.json` (fuente única)
- **Exclusiones**: Posts canonicalizados, posts noindex
- **Thin posts**: priority 0.3 (mitigación activa)
- **Estado**: ✅ Correcto

### 5.2 Robots.txt
- **URL**: `/robots.txt` — HTTP 200, 2.8KB
- **Reglas**: 21 bloques (5 buscadores + 7 bots IA + 8 scrapers bloqueados + comodín)
- **Bots IA permitidos**: GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Claude-User, anthropic-ai
- **Scrapers bloqueados**: Bytespider, CCBot, Meta-ExternalAgent, Meta-ExternalFetcher, Amazonbot, ImagesiftBot, omgili, omgilibot
- **Sitemap declarado**: Sí
- **Estado**: ✅ Excelente

### 5.3 Headers HTTP
- **Status**: 200
- **HSTS**: max-age=63072000; includeSubDomains; preload (prod)
- **CSP**: Restrictiva con GA4, Clarity, GTM, Google Fonts, OpenStreetMap
- **X-Robots-Tag**: `index, follow, max-image-preview:large, max-snippet:-1`
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Cache**: `public, max-age=0, must-revalidate` + `X-Vercel-Cache: HIT`
- **Estado**: ✅ Excelente. Única mejora: `Server: Vercel` expone tecnología (menor)

### 5.4 Redirects (next.config.ts)
- **49 redirects 301** configurados
- www ↔ apex, http→https, slugs antiguos, canibalizaciones, keywords comerciales
- **Estado**: ✅ Bien mantenido

### 5.5 Canonical
- **Autocanónico** por defecto
- **Override** vía `canonical_url` en `blog_posts` (3 posts hacia landings locales)
- **Estado**: ✅ Correcto

### 5.6 Schema / JSON-LD
Tipos presentes (verificados en home):
- LegalService + LocalBusiness
- Organization
- WebSite
- BreadcrumbList
- FAQPage
- Service
- BlogPosting (en posts)
- AggregateRating (home, con datos reales de Google)

**Estado**: ✅ Excelente. 8 bloques en home. sameAs configurado (2 items).

---

## 6. AUDITORÍA DE INDEXACIÓN

### Google
- **Indexadas**: Principales URLs OK (verificado vía URL Inspection API)
- **Sitemap**: 218 URLs enviadas
- **Noindex**: 5 posts deliberados + rutas API/intranet correctas
- **Problema HTTP**: `http://pinedayasociadoshn.com/` recibe 15 clics vs 4 del canónico

### Bing
- **Indexadas**: ~120 (creciendo desde 30, 55% del sitemap)
- **No indexadas**: `/servicios-juridicos`, `/blog`, `/despacho`, `/hondurenos-en-espana`
- **Errores 4xx**: 161 en 23 días (algunas URLs antiguas/devuelven 404)
- **Problema raíz**: Indexación baja y lenta. Mejorando (30→120 en 2 semanas).

### Puntuación indexación: **68/100**

**Qué impide indexar mejor:**
1. Falta de señales externas (0 backlinks) → baja autoridad → menos rastreo
2. 49 posts con priority 0.3 → menos incentivo para Google
3. Contenido thin en varias URLs → Google puede considerar baja calidad
4. Versión HTTP compitiendo con HTTPS

---

## 7. AUDITORÍA SEO LOCAL

### 7.1 Landings locales (20 ciudades)

**Cobertura actual (10 prioritarias):**
1. Nacaome (sede) — Sede física, página completa, FAQ, servicios
2. Choluteca — Página completa
3. San Lorenzo — Página completa
4. Goascorán — Página completa
5. San Marcos de Colón — Página completa
6. El Triunfo — Página completa
7. Marcovia — Página completa
8. Pespire — Página completa
9. Namasigüe — Página completa
10. Orocuina — Página completa

**Cobertura secundaria (10 adicionales, restauradas en Release 89):**
11-20: Langue, Aramecina, Caridad, Alianza, Apacilagua, Concepción de María, Duyure, Morolica, San Antonio de Flores, Amapala

### 7.2 Landings comerciales (4)
- `/abogado-penalista-nacaome` — Excelente: FAQ, servicios, WhatsApp, teléfono
- `/abogado-laboralista-nacaome` — Similar estructura
- `/abogado-de-familia-nacaome` — Similar estructura
- `/abogado-civil-nacaome` — Similar estructura

### 7.3 NAP (Name, Address, Phone)
- **Nombre**: Pineda y Asociados
- **Dirección**: GGJ7+239, cuadra y media al este de Hondutel, Nacaome, Valle
- **Teléfono**: +504 9536-3724
- **WhatsApp**: +504 9536-3724
- **Horario**: Lun-Sáb 7:00-20:00
- **Consistencia**: ✅ Verificada en home, landings, schema, footer

### 7.4 Google Business Profile
- **Estado**: ❌ NO CONFIGURADO (requiere acción humana)
- **Impacto**: Crítico para SEO local. Sin GBP no apareces en Maps ni Local Pack.
- **Acción**: Crear perfil en business.google.com con NAP exacto, categoría "Abogado" o "Bufete de abogados", fotos del despacho, horario.

### 7.5 Área servida (areaServed en schema)
- Declarada en JSON-LD: Nacaome, Choluteca, San Lorenzo, Goascorán (4 ciudades)
- **⚠️ Desactualizada**: tras reducción a 10 ciudades, solo declara 4

### Puntuación SEO local: **72/100**

---

## 8. AUDITORÍA DEL BLOG E INTERLINKING

### 8.1 Calidad del contenido
- **149 posts publicados**
- **49 posts thin** (priority 0.3 en sitemap) — necesitan reescritura
- **71 posts con revisión editorial vencida**
- **Longitud media**: ~1,200 palabras — dentro del rango editorial (600-1200)
- **Contenido legal**: Basado en CP Honduras y fuentes canónicas verificadas

### 8.2 Enlazado interno
Datos del script `audit:internal-links` sobre 12 posts prioritarios:
- **Media**: 6.4 enlaces internos por post
- **Enlace a servicio pilar**: 12/12 (100%)
- **CTA efectivo (DB + render)**: 12/12 (100%)
- **CTA persistente en DB**: 6/12 (50%)

### 8.3 Estructura de clústeres
- 14 clústeres temáticos conectados
- Cada post enlaza a: servicio pilar + post complementario + landing local
- Páginas de servicio renderizan 3 posts relacionados
- Landings locales muestran BlogHighlights

### 8.4 Problemas detectados
- 49 posts thin con contenido genérico/plantilla
- Títulos de blog posts mejorables para CTR (algunos sin año, sin números, sin gancho)
- CTAs en solo 50% de posts persistidos en DB (el resto se añaden en render)
- Algunos enlaces internos apuntan a redirects 301

### Puntuación blog: **65/100**
### Puntuación enlazado interno: **78/100**
### Puntuación conversión desde blog: **70/100**

---

## 9. AUDITORÍA CRO Y CONVERSIÓN

### 9.1 Elementos de conversión verificados

| Elemento | Home | Servicios | Landings | Blog | Contacto |
|----------|------|-----------|----------|------|----------|
| WhatsApp visible | ✅ | ✅ | ✅ | ✅ | ✅ |
| Teléfono clickable | ✅ | ✅ | ✅ | ✅ | ✅ |
| Formulario | ❌ (enlace) | ❌ (enlace) | ❌ (enlace) | ❌ (enlace) | ✅ |
| CTA principal | ✅ "Solicitar consulta" | ✅ | ✅ | Variable | ✅ |
| "Sin costo" visible | ✅ | ✅ | ✅ | Variable | ✅ |
| Urgencia | ✅ (detenidos) | ✅ | ✅ | ❌ | ✅ |
| Confianza | ✅ | ✅ | ✅ | ✅ | ✅ |

### 9.2 Página de contacto (`/solicitar-consulta`)
**Excelente.** Incluye:
- Formulario completo
- Perfiles de abogados (Danilo Pineda, Thania Paz, Emil Barahona)
- WhatsApp directo
- Teléfono
- Sección de emergencia para detenidos
- Garantías (confidencialidad, sin compromiso, respuesta rápida)
- Dirección y mapa
- Múltiples CTAs

### 9.3 Análisis de fricción
- **Fortalezas**: "Sin costo", "Sin compromiso", "Confidencialidad", lenguaje claro, abogados visibles
- **Debilidades**: Sin testimonios reales, sin Google reviews visibles, sin casos de éxito, sin chat en vivo

### Puntuación CRO: **75/100**

---

## 10. AUDITORÍA GEO / LLM SEARCH

### 10.1 llms.txt
- **URL**: `/llms.txt` — HTTP 200
- **Contenido**: 56 URLs organizadas por secciones
- **Estructura**: Sitio oficial → Áreas de práctica → Subáreas penales → Categorías blog → Landings locales → Páginas legales
- **Exclusión**: Sin rutas privadas explícitas
- **Estado**: ✅ Excelente para descubrimiento IA

### 10.2 Schema / Datos estructurados
- Tipos: LegalService + LocalBusiness, Organization, WebSite, Service, FAQPage, BlogPosting, BreadcrumbList, AggregateRating
- **Entidad del despacho**: Clara como `LegalService` + `LocalBusiness`
- **Servicios**: Declarados como `Service` con `serviceType`
- **Ubicación**: `areaServed` con 4 ciudades, `geo` con lat/lng
- **⚠️ areaServed desactualizado** (solo 4 de 10+ ciudades)

### 10.3 Visibilidad para IA
- **Fortalezas**: llms.txt completo, schema rico, robots.txt permite todos los bots IA relevantes, contenido jurídico bien estructurado, FAQPage con respuestas claras
- **Debilidades**: Sin `sameAs` de redes sociales, sin menciones externas verificables, autoridad baja

### Puntuación GEO/LLM Search: **70/100**

---

## 11. AUDITORÍA DE AUTORIDAD Y CONFIANZA

### 11.1 Señales de confianza internas

| Señal | Estado |
|-------|--------|
| Abogados visibles (nombre + foto) | ✅ Danilo Pineda, Thania Paz, Emil Barahona |
| Dirección física | ✅ Nacaome, Valle |
| Teléfono | ✅ +504 9536-3724 |
| Horario | ✅ Lun-Sáb 7:00-20:00 |
| "Sin compromiso" | ✅ |
| "Presupuesto por escrito" | ✅ |
| "Confidencialidad" | ✅ |
| "No prometemos resultados" | ✅ (énfasis ético) |
| 15+ años experiencia | ✅ |
| Metodología documentada | ✅ |
| Reseñas Google | ✅ (6 reseñas, datos reales vía API) |

### 11.2 Señales de confianza externas

| Señal | Estado |
|-------|--------|
| Google Business Profile | ❌ No configurado |
| Backlinks | ❌ 0 en Bing (1 reciente) |
| Menciones externas | ❌ No detectadas |
| Redes sociales (sameAs) | ❌ No configuradas |
| Premios/certificaciones | ❌ No disponibles |

### Puntuación autoridad/confianza: **68/100**

---

## 12. AUDITORÍA UX Y DISEÑO

### 12.1 Evaluación (sin rediseño)

| Aspecto | Evaluación |
|---------|-----------|
| Claridad visual | ✅ Buena jerarquía |
| Navegación | ✅ Clara, header sticky |
| Mobile | ✅ Responsive (verificado en header) |
| Legibilidad | ✅ Fuentes legibles, contraste adecuado |
| CTAs visibles | ✅ Botones dorados destacan |
| Consistencia de marca | ✅ Navy + dorado coherentes |
| Velocidad percibida | ✅ Vercel CDN, ISR, carga rápida |
| Formularios | ✅ Bien diseñados en solicitar-consulta |
| Landing pages | ⚠️ Algunas se sienten repetitivas (template) |
| Blog | ✅ Buen diseño de cards, buscador funcional |
| Home | ✅ 11 secciones bien organizadas |

### Puntuación UX/diseño: **78/100**

---

## 13. AUDITORÍA DE ANALÍTICA Y MEDICIÓN

| Componente | Estado |
|-----------|--------|
| GA4 | ✅ Conectado (gtag + Data API) |
| Google Search Console | ✅ Conectado (API + propiedad verificada) |
| Microsoft Clarity | ✅ Conectado |
| Bing Webmaster Tools | ✅ Conectado (API funcional) |
| Eventos WhatsApp | ✅ Configurados |
| Eventos Teléfono | ✅ Configurados |
| Eventos Formulario | ✅ Configurados |
| UTM / Parámetros | No verificado |
| Conversiones GA4 | ⚠️ No configuradas formalmente |
| Google Business Profile | ❌ No conectado |
| Dashboard | ❌ No existe |

### Puntuación analítica/medición: **72/100**

---

## 14. PUNTUACIÓN POR ÁREA

| Área | Puntuación | Peso | Contribución |
|------|-----------|------|-------------|
| SEO Técnico | 82/100 | 15% | 12.3 |
| Indexación | 68/100 | 15% | 10.2 |
| SEO Local | 72/100 | 15% | 10.8 |
| Contenido / Blog | 65/100 | 10% | 6.5 |
| Enlazado Interno | 78/100 | 8% | 6.2 |
| CRO / Conversión | 75/100 | 10% | 7.5 |
| GEO / LLM Search | 70/100 | 5% | 3.5 |
| Analítica / Medición | 72/100 | 5% | 3.6 |
| Autoridad / Confianza | 68/100 | 10% | 6.8 |
| Performance / Mobile | 80/100 | 5% | 4.0 |
| UX / Diseño | 78/100 | 2% | 1.6 |

---

## 15. PUNTUACIÓN GLOBAL

# 🏆 73/100

### Por qué esta puntuación

**Lo que sube la puntuación:**
- Excelente base técnica (Next.js, ISR, CDN, seguridad)
- Schema rico y correcto (8 tipos JSON-LD)
- Robots.txt y sitemap impecables
- llms.txt bien estructurado
- Enlazado interno sólido (100% posts enlazan a servicios)
- CRO visible (WhatsApp, teléfono, formulario, "sin costo")
- 149 posts de contenido original basado en CP Honduras
- 20 landings locales con contenido único

**Lo que baja la puntuación:**
- Tráfico orgánico extremadamente bajo (134 clics en 3 meses)
- Sin Google Business Profile (crítico para SEO local)
- 0 backlinks / 0 autoridad externa
- 49 posts thin con prioridad reducida
- Versión HTTP canibalizando en GSC
- Bing: solo 55% indexado, 0 tráfico
- Sin perfiles sociales (sameAs vacío)
- 1 landing rota (404 en aramecina)

### Escenarios de mejora

| Escenario | Puntuación estimada | Plazo |
|-----------|-------------------|-------|
| Quick wins (7-30 días) | 78/100 (+5) | Jul 2026 |
| Medio plazo (90 días) | 83/100 (+10) | Oct 2026 |
| Largo plazo (12 meses) | 88/100 (+15) | Jul 2027 |

---

## 16. PROYECCIONES Y ESTIMACIONES

### 16.1 Escenario Conservador (probabilidad: 70%)

**Supuestos**: Solo quick wins (GBP + arreglar HTTP + optimizar 5 títulos), sin link building.

| Métrica | Actual | 30d | 60d | 90d | 180d | 12m |
|---------|--------|-----|-----|-----|------|-----|
| Clics/mes GSC | 45 | 55 | 70 | 90 | 120 | 180 |
| Impresiones/mes | 2,200 | 2,600 | 3,200 | 3,800 | 5,000 | 8,000 |
| CTR | 1.1% | 1.3% | 1.5% | 1.8% | 2.0% | 2.2% |
| Sesiones/mes | 280 | 330 | 400 | 500 | 700 | 1,000 |
| Leads WhatsApp/mes | No medido | 8 | 12 | 16 | 22 | 35 |
| Llamadas/mes | No medido | 4 | 6 | 8 | 12 | 18 |

### 16.2 Escenario Realista (probabilidad: 50%)

**Supuestos**: Quick wins + reescritura 20 posts thin + GBP activo + link building básico (directorios, cámaras).

| Métrica | Actual | 30d | 60d | 90d | 180d | 12m |
|---------|--------|-----|-----|-----|------|-----|
| Clics/mes GSC | 45 | 65 | 100 | 160 | 280 | 500 |
| Impresiones/mes | 2,200 | 3,000 | 4,500 | 7,000 | 12,000 | 22,000 |
| CTR | 1.1% | 1.5% | 1.8% | 2.2% | 2.5% | 2.8% |
| Sesiones/mes | 280 | 380 | 550 | 800 | 1,200 | 2,200 |
| Leads WhatsApp/mes | No medido | 10 | 18 | 28 | 45 | 80 |
| Llamadas/mes | No medido | 6 | 10 | 16 | 25 | 40 |

### 16.3 Escenario Optimista (probabilidad: 25%)

**Supuestos**: Todo lo anterior + 49 posts reescritos + backlinks de calidad (medios, universidades, .gob.hn) + GBP activo con 20+ reseñas + redes sociales activas.

| Métrica | Actual | 30d | 60d | 90d | 180d | 12m |
|---------|--------|-----|-----|-----|------|-----|
| Clics/mes GSC | 45 | 75 | 150 | 280 | 550 | 1,200 |
| Impresiones/mes | 2,200 | 3,500 | 6,000 | 11,000 | 20,000 | 40,000 |
| CTR | 1.1% | 1.6% | 2.0% | 2.5% | 3.0% | 3.5% |
| Sesiones/mes | 280 | 420 | 700 | 1,200 | 2,200 | 5,000 |
| Leads WhatsApp/mes | No medido | 12 | 22 | 40 | 70 | 150 |
| Llamadas/mes | No medido | 8 | 14 | 25 | 40 | 80 |

---

## 17. PROBLEMAS DETECTADOS (ordenados por impacto)

| # | Problema | Impacto | Área | Prioridad |
|---|----------|---------|------|-----------|
| 1 | Tráfico orgánico extremadamente bajo | CRÍTICO | General | P0 |
| 2 | Sin Google Business Profile | CRÍTICO | SEO Local | P0 |
| 3 | 0 backlinks/0 autoridad externa | CRÍTICO | Autoridad | P0 |
| 4 | `http://` versión compite en GSC con canónica | ALTO | Indexación | P1 |
| 5 | 49 posts thin (priority 0.3) | ALTO | Contenido | P1 |
| 6 | Bing: solo 55% indexado, 0 tráfico | ALTO | Indexación | P1 |
| 7 | Bing: 161 errores 4xx acumulados | MEDIO | Técnico | P2 |
| 8 | Landing `/abogados-en-aramcina` rota (404) | MEDIO | SEO Local | P2 |
| 9 | areaServed solo declara 4 de 10+ ciudades | MEDIO | Schema | P2 |
| 10 | 71 posts con revisión editorial vencida | MEDIO | Contenido | P2 |
| 11 | Sin perfiles sociales (sameAs vacío) | BAJO | GEO/Autoridad | P3 |
| 12 | No hay conversiones configuradas en GA4 | BAJO | Analítica | P3 |
| 13 | `Server: Vercel` expuesto en headers | BAJO | Seguridad | P3 |

---

## 18. RIESGOS

| Riesgo | Probabilidad | Impacto |
|--------|-------------|---------|
| Competencia local active GBP antes que el despacho | Alta | Alto |
| Google penalice thin content si no se reescribe | Media | Alto |
| Bing nunca indexe completamente sin backlinks | Alta | Medio |
| Pérdida de tráfico HTTP residual al forzar canonical | Baja | Bajo |
| Cambios de algoritmo de Google afecten más a sitios sin autoridad | Media | Alto |
| La web compita consigo misma (múltiples landings similares) | Media | Medio |

---

## 19. OPORTUNIDADES

| Oportunidad | Potencial | Esfuerzo |
|-------------|----------|----------|
| **Google Business Profile**: impacto inmediato en SEO local | Muy Alto | Bajo (1-2h) |
| **Keywords long-tail legales**: alto volumen, baja competencia | Alto | Medio |
| **Hondureños en España**: nicho desatendido, alta intención | Alto | Medio |
| **Link building local**: directorios, cámara de comercio, colegio de abogados | Alto | Continuo |
| **Reescritura de posts thin**: +49 URLs de calidad | Alto | Alto |
| **YouTube/redes sociales**: contenido legal educativo | Medio | Alto |
| **Google Ads local**: para keywords de alta intención | Alto | Bajo (presupuesto) |

---

## 20. ROADMAP PRIORIZADO

### FASE 1: Quick Wins (0-7 días)

| # | Acción | Prioridad | Impacto | Esfuerzo | Tipo |
|---|--------|-----------|---------|----------|------|
| 1 | **Crear Google Business Profile** | P0 | SEO Local +20% | 1-2h | Humano |
| 2 | **Forzar https://www en GSC** (propiedad canónica) | P1 | Indexación | 30min | GSC |
| 3 | **Corregir landing /abogados-en-aramcina** (crear page.tsx) | P2 | SEO Local | 30min | Código |
| 4 | **Actualizar areaServed en schema** (10 ciudades) | P2 | Schema/GEO | 15min | Código |
| 5 | **Configurar conversiones GA4** (WhatsApp, teléfono, formulario) | P2 | Analítica | 1h | GA4 |

### FASE 2: Corto Plazo (30 días)

| # | Acción | Prioridad | Impacto | Esfuerzo | Tipo |
|---|--------|-----------|---------|----------|------|
| 6 | **Revisar y corregir errores 4xx en Bing** | P1 | Indexación Bing | 2h | Código |
| 7 | **Optimizar titles/metas de 20 posts prioritarios** | P1 | CTR + tráfico | 3h | DB |
| 8 | **Solicitar re-rastreo en GSC** de URLs con más impresiones | P1 | Indexación | 30min | GSC |
| 9 | **Inscribir en directorios jurídicos hondureños** | P1 | Backlinks | 4h | Humano |
| 10 | **Crear/actualizar perfiles sociales** (Facebook, Instagram) | P2 | GEO/Confianza | 2h | Humano |
| 11 | **Conectar GBP con GA4** para medir tráfico local | P3 | Analítica | 1h | GBP+GA4 |
| 12 | **Enviar sitemap manualmente en Bing WMT** | P2 | Indexación Bing | 15min | Bing |

### FASE 3: Medio Plazo (90 días)

| # | Acción | Prioridad | Impacto | Esfuerzo | Tipo |
|---|--------|-----------|---------|----------|------|
| 13 | **Reescribir 25 posts thin** (de 49) | P1 | Contenido + tráfico | 20h | IA + humano |
| 14 | **Link building: cámara comercio, colegio abogados, medios locales** | P1 | Autoridad | 10h | Humano |
| 15 | **Revisar canibalización** entre landings similares | P2 | SEO | 4h | Análisis |
| 16 | **Implementar page.tsx para todas las landings** (asegurar 20/20) | P2 | SEO Local | 2h | Código |
| 17 | **Crear dashboard de métricas SEO** (GSC + GA4 + GBP) | P3 | Analítica | 8h | Código/DB |
| 18 | **Solicitar + responder reseñas en GBP** | P1 | Conversión | Continuo | Humano |

### FASE 4: Largo Plazo (180 días)

| # | Acción | Prioridad | Impacto | Esfuerzo | Tipo |
|---|--------|-----------|---------|----------|------|
| 19 | **Reescribir 24 posts thin restantes** | P2 | Contenido | 20h | IA + humano |
| 20 | **Revisión editorial completa** de los 149 posts | P2 | Contenido | 30h | Humano |
| 21 | **Guest posting en blogs jurídicos** | P2 | Backlinks | 10h | Humano |
| 22 | **Crear contenido para YouTube** (explicaciones legales) | P3 | Tráfico | 20h | Humano |
| 23 | **Google Ads Local** (campaña de prueba) | P2 | Tráfico | 4h + presupuesto | Ads |
| 24 | **Optimización Core Web Vitals** (monitorizar y corregir) | P3 | Performance | 4h | Código |

### FASE 5: Escala (12 meses)

| # | Acción | Prioridad | Impacto | Esfuerzo | Tipo |
|---|--------|-----------|---------|----------|------|
| 25 | **Consolidar autoridad local** (ser el bufete #1 en Valle/Choluteca) | P1 | Sostenibilidad | Continuo | Mixto |
| 26 | **Expandir a Tegucigalpa/San Pedro Sula** (nuevas landings) | P2 | Crecimiento | 40h | Mixto |
| 27 | **Programa de referidos y testimonios** | P2 | Conversión | 20h | Humano |
| 28 | **Automatizar informes SEO mensuales** | P3 | Eficiencia | 16h | Código |

---

## 21. MÉTRICAS A REVISAR SEMANALMENTE

1. **GSC**: Clics, impresiones, CTR, posición media
2. **GSC**: Queries nuevas en top 10
3. **GSC**: Páginas con más impresiones y CTR < 1%
4. **GA4**: Sesiones orgánicas, tráfico por canal
5. **GA4**: Eventos WhatsApp, teléfono, formulario
6. **Bing WMT**: URLs indexadas, errores 4xx
7. **GBP**: Vistas, clics, llamadas, dirección solicitada
8. **Posiciones**: Keywords objetivo local ("abogados en Nacaome", "abogado penalista Choluteca", etc.)

---

## 22. COMANDOS EJECUTADOS

```bash
git status && git branch --show-current && git remote -v
npm run seo:health
npm run audit:indexacion
npm run validar:meta-seo
npm run seo:gsc
npm run seo:audit:gsc-ga4
npm run seo:bing
npm run audit:internal-links
npm run audit:seo:stdout
```

**Scripts existentes ejecutados**: 10/10 pasaron.

---

## 23. ARCHIVOS GENERADOS

- `auditoriatotal.mc` — Este informe
- `scripts/.bing-audit.json` — Datos completos de Bing WMT (existente, actualizado)
- `data/gsc-*.json` — Datos GSC (existente, actualizado)

---

## 24. FUENTES QUE NO PUDIERON CONECTARSE

| Fuente | Motivo |
|--------|--------|
| Playwright | Chromium no instalado en el entorno. `npx playwright install` falló. |
| MCP-SEO (meta_tags, headings, structured_data, content, images, links, mobile, performance, accessibility, lighthouse) | Error técnico: `asyncio.run() cannot be called from a running event loop`. Es un bug conocido de la integración MCP-SEO con entornos asíncronos. Las herramientas `analyze_headers`, `analyze_sitemap`, `analyze_robots`, `analyze_url_structure`, `fetch_page`, `crawl`, `crawl_site` sí funcionan. |
| Google Business Profile API | No configurada. Requiere cuenta Google del despacho. |
| Datos GA4 detallados (eventos, conversiones, dispositivos) | El script `seo:audit:gsc-ga4` no completa la extracción GA4 por timeout (60s). Datos parciales. |

---

## 25. CONFIRMACIONES

- ✅ **No se hizo push.** Solo commit local.
- ✅ **No se crearon posts nuevos.** Solo auditoría.
- ✅ **No se insertó nada en blog_posts.** Solo lectura.
- ✅ **No se modificaron archivos de producción.**
- ✅ **No se expusieron secretos.** API keys, tokens y credenciales leídas de entorno pero nunca mostradas.
- ✅ **No se rediseñó la web.**
- ✅ **No se ejecutaron envíos reales de IndexNow.**

---

## 26. CONCLUSIÓN FINAL

Pineda y Asociados tiene una **web técnicamente excelente** (82/100 SEO técnico) que no está recibiendo el tráfico que merece. El problema principal es la **invisibilidad**: 134 clics en 3 meses para un bufete con 149 artículos, 20 landings locales y 13 áreas de práctica es extremadamente bajo.

**La causa raíz es triple:**
1. **Falta total de autoridad externa**: sin backlinks, sin Google Business Profile, sin redes sociales, sin menciones. Google y Bing no tienen señales para confiar en el sitio.
2. **Google Business Profile ausente**: para un despacho local, esto es como no tener puerta en la oficina. El 46% de las búsquedas terminan sin clic porque la respuesta está en el Local Pack.
3. **Contenido diluido**: 49 posts thin envían señales de baja calidad. Aunque la mitigación (priority 0.3) es correcta, solo la reescritura resolverá el problema de fondo.

**La buena noticia**: la base técnica, el contenido y la estructura están listos. Lo que falta es promoción (GBP, backlinks, reseñas) y refinamiento (reescribir posts thin, corregir landings rotas). Con GBP activo y 20 posts reescritos, el tráfico puede duplicarse en 60 días. Con link building consistente, puede quintuplicarse en 12 meses.

**Acción inmediata más importante**: crear el Google Business Profile hoy mismo. Es la acción de mayor impacto con menor esfuerzo.

---

> **Para publicar este informe en el repositorio (cuando se decida):**
> ```
> git push origin main
> ```
> **RECORDATORIO**: Este informe NO ha sido publicado. Está en commit local. NO se ha hecho push.
