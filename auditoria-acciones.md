# Auditoría — Acciones Ejecutadas

> **Fecha:** 2026-07-03  
> **Fase 2 completada:** Calidad superior  
> **Puntuación partida:** 73/100  
> **Puntuación estimada actual:** ~76-77/100 (+3-4 puntos)  
> **Objetivo 30 días:** 78/100  
> **Fuente canónica:** `auditoriatotal.mc` (no modificado)

---

## Fase 3 — Auditoría de redirects 301, URLs secundarias y cobertura visible

**Fecha:** 2026-07-03  
**Objetivo:** Verificar que footer/Home muestran exactamente las 10 ciudades
prioritarias, auditar los 8 redirects 301 de ciudades secundarias, y confirmar
coherencia del ecosistema indexable (sitemap, llms.txt, canonical-paths).

### Confirmación de cobertura visible

Footer (`components/marketing/public-footer.tsx` COBERTURA) y Home
(`app/(public)/page.tsx` → `getFeaturedLandings()` → `TOP_COBERTURA_SLUGS`)
muestran **exactamente las 10 ciudades prioritarias**: Nacaome, Choluteca,
San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire,
Namasigüe, Orocuina. Langue y Amapala NO aparecen en footer ni Home.

### Matriz de URLs revisadas

| URL | page.tsx | sitemap | canonical-paths | llms.txt | redirects 301 | enlaces internos | Decisión |
|-----|----------|---------|-----------------|----------|---------------|------------------|----------|
| `/abogados-en-nacaome` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-choluteca` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-san-lorenzo` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-goascoran` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-san-marcos-de-colon` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-el-triunfo` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-marcovia` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-pespire` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-namasigue` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-orocuina` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo A: mantener |
| `/abogados-en-langue` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo B: indexable, no visible |
| `/abogados-en-amapala` | ✅ | ✅ | ✅ | ✅ | — | ✅ | Grupo B: indexable, no visible |
| `/abogados-en-aramcina` | ❌ | ❌ | ❌ | ❌ | → nacaome | 0 | Grupo C: 301 por typo |
| `/abogados-en-caridad` | ❌ | ❌ | ❌ | ❌ | → san-lorenzo | 0 | Grupo C: 301 por histórico |
| `/abogados-en-alianza` | ❌ | ❌ | ❌ | ❌ | → goascoran | 0 | Grupo C: 301 por histórico |
| `/abogados-en-apacilagua` | ❌ | ❌ | ❌ | ❌ | → choluteca | 0 | Grupo C: 301 por histórico |
| `/abogados-en-concepcion-de-maria` | ❌ | ❌ | ❌ | ❌ | → choluteca | 0 | Grupo C: 301 por histórico |
| `/abogados-en-duyure` | ❌ | ❌ | ❌ | ❌ | → san-marcos-de-colon | 0 | Grupo C: 301 por histórico |
| `/abogados-en-morolica` | ❌ | ❌ | ❌ | ❌ | → san-marcos-de-colon | 0 | Grupo C: 301 por histórico |
| `/abogados-en-san-antonio-de-flores` | ❌ | ❌ | ❌ | ❌ | → choluteca | 0 | Grupo C: 301 por histórico |

### Decisión SEO sobre redirects 301

**Las 8 redirects 301 se mantienen** (Grupo C). Evidencia:
- 7 de 8 URLs tuvieron `page.tsx` real en git history (3–4 commits cada una),
  confirmando publicación histórica previa que justifica el redirect.
- 1 de 8 (`/abogados-en-aramcina`) es un typo de la ciudad real "Aramecina";
  nunca tuvo página pero es una variante histórica plausible.

Ninguna de las 8 URLs aparece en sitemap, `canonical-paths.json` ni `llms.txt`
(Grupo D en el ecosistema indexable). Solo existen como redirects 301. Cero
enlaces internos hacia ellas. La arquitectura local está limpia.

### Archivos modificados (Fase 3)

| Archivo | Cambio |
|---------|--------|
| `AGENTS.md` | R18 reforzada: distinción Grupo B (secundarias con página) vs Grupo D (sin página real) |

### Scripts ejecutados

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors, 1 pre-existing warning |
| `npm run build` | Success, TypeScript OK, sitemap 218 URLs |
| `npm test` | 730/730 tests, 33 suites, 0 fallos |
| `npm run audit:indexacion` | Todos los probes pasan (sitemap sin rutas privadas) |
| `npm run indexnow:dry` | 20 URLs válidas, 0 fantasma, techo 224 |

### Riesgos

- `generate-llms-txt.mjs` tiene rutas hardcodeadas (no lee de
  `canonical-paths.json`). Cambio amplio: dejado como pendiente técnico.
- Divergencia con `origin/main` (3 local / 5 remoto). No se hizo pull/merge.

### Pendientes técnicos

1. DRY: `generate-llms-txt.mjs` debería leer de `canonical-paths.json` (P2).
2. Crear `page.tsx` + datos para 8 landings secundarias si se decide
   publicarlas (Grupo E/backlog).

### Pendientes humanos

Sin cambios respecto a Fase 2 (ver §6).

### Confirmaciones finales

- ✅ Footer y Home muestran solo las 10 ciudades prioritarias.
- ✅ Langue, Amapala y demás secundarias NO aparecen en footer/Home.
- ✅ Sitemap/llms/canonical-paths quedan coherentes (sin rutas fantasma).
- ✅ No se modificó `auditoriatotal.mc`.
- ✅ No se modificó `auditoriatotal.md` (untracked).
- ✅ No se hizo push.
- ✅ No se crearon posts nuevos.
- ✅ No se expusieron secretos.

---

## Resumen Fase 2

La Fase 2 se enfocó en auditoría de calidad, corrección de landings huérfanas, coherencia de cobertura en footer/home, documentación de reglas vinculantes y validación completa. No se crearon posts ni se modificó contenido legal.

---

## 1. Diagnóstico de Calidad (scripts ejecutados)

| Script | Resultado |
|--------|-----------|
| `npm run seo:health` | 15 OK, 0 warn, 0 fail |
| `npm run audit:indexacion` | 30/30 probes pasan |
| `npm run blog:normalizar` | Dry-run: 0 problemas detectados, blog limpio |
| `npm run content:audit` | 74 posts vencidos, 22 próximos, 53 al día |
| `npm run seo:gsc` | 10 queries, ~10 clicks, CTR variable |

---

## 2. Acciones Ejecutadas en Fase 2

### 2.1 Redirects para landings huérfanas (P2) — CORREGIDO

**Diagnóstico:** El sitemap de producción mostraba `/abogados-en-caridad` sin page.tsx. De las 10 ciudades secundarias, solo Langue y Amapala tenían página. Las 8 restantes devolvían 404.

**Solución:** Añadidos 8 redirects 301 en `next.config.ts`:
- `/abogados-en-caridad` → `/abogados-en-san-lorenzo`
- `/abogados-en-alianza` → `/abogados-en-goascoran`
- `/abogados-en-apacilagua` → `/abogados-en-choluteca`
- `/abogados-en-concepcion-de-maria` → `/abogados-en-choluteca`
- `/abogados-en-duyure` → `/abogados-en-san-marcos-de-colon`
- `/abogados-en-morolica` → `/abogados-en-san-marcos-de-colon`
- `/abogados-en-san-antonio-de-flores` → `/abogados-en-choluteca`

El redirect de `/abogados-en-aramcina` (Fase 1) se mantiene.

**Archivo:** `next.config.ts` — +7 líneas.

### 2.2 Footer y Home: solo 10 ciudades prioritarias (P1) — CORREGIDO

**Diagnóstico:** El commit `ee59224` había reemplazado Namasigüe y Orocuina por Amapala y Langue en el footer y en la Home. Esto violaba la política de mostrar solo las 10 ciudades prioritarias.

**Soluciones:**
1. `components/marketing/public-footer.tsx`: Restaurado orden canónico de 10 ciudades (Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire, Namasigüe, Orocuina)
2. `data/landings-locales.ts`: Restaurado `TOP_COBERTURA_SLUGS` con las 10 prioritarias (quitadas amapala/langue, restauradas namasigue/orocuina)

**Archivos:** `public-footer.tsx`, `landings-locales.ts`.

### 2.3 Regla R18 registrada en AGENTS.md — DOCUMENTADO

**Regla vinculante añadida:** La sección «Cobertura» del footer y el grid de cobertura de la Home deben mostrar exclusivamente las 10 ciudades prioritarias. Las secundarias se mantienen en sitemap, llms.txt y canonical-paths.json (cuando tengan página), pero nunca en footer ni Home. Las que no tienen página deben tener redirect 301.

**Archivo:** `AGENTS.md` — +24 líneas (§10, tras R17).

### 2.4 Auditoría de calidad — VERIFICADO

**Blog:**
- 149 posts publicados, blog normalizado (0 problemas mecánicos)
- Títulos y meta descriptions bien optimizados (todos con año, Honduras, gancho)
- 74 posts con revisión editorial vencida (requiere revisión humana, no bug)
- 49 posts thin con priority 0.3 en sitemap (mitigación activa)

**Schema:**
- areaServed: 10 ciudades en LegalService, founderSchema, thaniaSchema, emilSchema (lib/site.ts)
- sameAs: 3 URLs reales (Facebook, X/Twitter, Google Maps)
- JSON-LD home: 8 bloques, tipos correctos

**Landings locales (12 con página):**
- Todas con H1 único, title único, meta description única
- NAP consistente, CTA visible, enlaces a servicios, schema local
- Langue y Amapala funcionales pero excluidas de footer/Home (R18)

**CRO/Confianza:**
- CTAs con WhatsApp, teléfono y formulario en todas las páginas clave
- "Sin costo", "Sin compromiso", "Presupuesto por escrito", "Confidencialidad" presentes
- Página `/solicitar-consulta` con perfiles de abogados, garantías, emergencia para detenidos

**Analítica:**
- Eventos: whatsapp_click, phone_click, lead_generated, form_click, email_click, directions_click
- 5 clics WhatsApp, 2 teléfono, 2 leads en 28 días
- form_click sin registrar (formulario en página dedicada)

---

## 3. Validación Final

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errors, 1 pre-existing warning |
| `npm run build` | Success, TypeScript OK, 355 páginas |
| `npm test` | 33 archivos, 730 tests, todos pasan |
| `npm run audit:indexacion` | 30/30 probes pasan |
| `npm run indexnow:dry` | 20 URLs válidas |

---

## 4. Archivos Modificados (Fase 1 + Fase 2)

| Archivo | Cambio | Fase |
|---------|--------|------|
| `AGENTS.md` | +R18: Cobertura footer solo 10 ciudades | F2 |
| `next.config.ts` | +1 redirect aramcina (F1) +7 redirects landings huérfanas (F2) | F1+F2 |
| `data/seo/canonical-paths.json` | +Langue +Amapala al sitemap | F1 |
| `lib/schemas/legal-page.ts` | Default areaServed 5→10 ciudades | F1 |
| `components/marketing/landing-local.tsx` | Comentario "5→10 ciudades" | F1 |
| `components/marketing/public-footer.tsx` | COBERTURA: 10 prioritarias (ordenado) | F2 |
| `data/landings-locales.ts` | TOP_COBERTURA_SLUGS: 10 prioritarias | F2 |
| `public/llms.txt` | Regenerado (115 líneas, auto postbuild) | F1 |
| `scripts/generate-llms-txt.mjs` | +Langue +Amapala en STATIC_ROUTES | F1 |

---

## 5. Mejoras Logradas

| Mejora | Área | Impacto |
|--------|------|---------|
| 8 redirects 301 para landings huérfanas | SEO Técnico | -8 errores 404 en Bing/Google |
| Footer y Home con solo 10 prioritarias | SEO Local | Consistencia NAP, sin canibalización |
| R18 documentado en AGENTS.md | Gobernanza | Regla vinculante para todos los agentes |
| Langue + Amapala en sitemap/llms/IndexNow | Indexación | +2 URLs indexables |
| areaServed actualizado en schema | Schema/GEO | 10 ciudades declaradas |
| Blog normalizado y títulos verificados | Contenido | Sin problemas mecánicos, títulos optimizados |

---

## 6. Pendientes Humanos

| # | Acción | Prioridad | Dónde |
|---|--------|-----------|-------|
| 1 | **Crear Google Business Profile** | P0 | business.google.com |
| 2 | **Forzar dominio canónico en GSC** | P1 | GSC → Settings → www |
| 3 | **Marcar conversiones en GA4** | P2 | GA4 Admin → Events → Conversions |
| 4 | **Solicitar reseñas Google** | P2 | Compartir enlace GBP |
| 5 | **Inscribir en directorios jurídicos** | P2 | Cámara de Comercio, Colegio Abogados |
| 6 | **Revisar 74 posts con revisión editorial vencida** | P2 | `npm run content:audit` |
| 7 | **Ejecutar `blog:verify-fix:aplicar`** para lote piloto de 10 posts thin | P1 | Requiere DEEPSEEK_API_KEY |

---

## 7. Pendientes Técnicos (próxima fase)

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | DRY: `generate-llms-txt.mjs` debería leer de `canonical-paths.json` | P2 |
| 2 | Crear datos en `landings-locales.ts` para las 8 ciudades secundarias restantes | P3 |
| 3 | Crear page.tsx para las 8 landings secundarias cuando existan datos | P3 |
| 4 | Verificar `form_click` tracking en componentes de formulario | P3 |
| 5 | Optimizar enlaces internos que apunten a redirects 301 | P3 |

---

## 8. Confirmaciones Finales

- ✅ **No se modificó `auditoriatotal.md`.**
- ✅ **No se hizo push.** Solo cambios locales.
- ✅ **No se crearon posts nuevos.** No se escribió en `blog_posts`.
- ✅ **No se expusieron secretos.**
- ✅ **No se rediseñó la web.**
- ✅ **No se modificó contenido legal sensible.**
- ✅ **Lint: 0 errores. Build: OK. Tests: 730/730 pasan.**
- ✅ **Auditoría indexación: 30/30 pasan.**
- ✅ **R18 grabada en AGENTS.md.**

---

> **Protocolo:** AGENTS.md  
> **Sin push.** Solo cambios locales en `main`.
