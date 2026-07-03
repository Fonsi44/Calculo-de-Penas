# Plan de Acción SEO — Basado en datos LIVE

**Generado:** 2026-07-03T14:27 UTC
**Fuentes:** GSC (28d), GA4 (28d), Bing WMT (23d), IndexNow, SEO Health, Sitemap
**Sistema:** `npm run seo:collect` — 6/6 fuentes operativas

---

## Estado base LIVE

| Fuente | Métrica clave | Valor |
|--------|--------------|-------|
| GSC | Clics / Impresiones | 134 / 6,613 |
| GSC | CTR / Posición media | 2.03% / 7.0 |
| GSC | Queries / Páginas / Países | 100 / 110 / 50 |
| GA4 | Usuarios / Sesiones | 670 / 843 |
| GA4 | Pageviews / Conversiones | 4,801 / 9 |
| GA4 | Fuentes orgánicas (Google+Bing) | 125 usuarios (19%) |
| Bing | Páginas rastreadas / 4xx / Errores | 2,387 / 161 / 206 |
| Bing | Queries / Backlinks | 44 / 0 |
| IndexNow | URLs prioritarias | 20 (dry-run OK) |
| SEO Health | Probes | 15/15 OK |
| Sitemap | URLs | 220 (sin rutas privadas) |

---

## 5 Mejoras inmediatas de CTR en GSC

| # | Acción | Query target | Imp. | Pos. | CTR actual | Meta CTR | Impacto est. |
|---|--------|-------------|------|------|-----------|----------|-------------|
| 1 | Mejorar meta description de página de prescripción de deudas | "cuando prescribe una deuda en honduras" | 12 | 6.3 | 0% | 8% | +1 clic/mes |
| 2 | Optimizar title tag para incluir "porcentaje 2026" | "cuanto es la pensión alimenticia por hijo en honduras" | 51 | 6.6 | 0% | 5% | +2-3 clics/mes |
| 3 | Revisar snippet de Home para "abogado" | "abogado" | 2 | 1.0 | 0% | 10% | Diagnóstico |
| 4 | Añadir datos estructurados FAQ a página de pensión alimenticia | "cuanto es la manutencion de un hijo en honduras" | 23 | 5.8 | 0% | 5% | +1 clic/mes |
| 5 | Crear meta description específica para página de despacho | "bufete de abogados" | 3 | 6.7 | 0% | 5% | Bajo volumen |

**Herramienta:** `npm run seo:gsc:live` → analizar queries con CTR=0% y posición <10.

---

## 5 Mejoras de conversión basadas en GA4

| # | Acción | Dato GA4 | Meta |
|---|--------|----------|------|
| 1 | Añadir CTA visible above-the-fold en `/servicios-juridicos` (296 pageviews, 28 usuarios) | Tasa conversión ~0% desde esa página | +2 conversiones/mes |
| 2 | Optimizar formulario de `/solicitar-consulta` (131 pageviews, 29 usuarios) | 9 conversiones totales | Reducir fricción → +3 conv/mes |
| 3 | Añadir pop-up de consulta con intención de salida en `/blog` (268 pageviews) | 26 usuarios únicos en blog | +1-2 conversiones/mes |
| 4 | Crear landing page para queries de alta intención de GSC | "en cuanto tiempo prescribe una deuda" (25% CTR) | +1 conversión/mes |
| 5 | Implementar eventos GA4 en botones de WhatsApp/Llamada | Sin datos de interacción con CTA | Medir para optimizar |

**Herramienta:** `npm run seo:ga4:live` → revisar `topPages` y cruzar con `sources`.

---

## 5 Mejoras Bing / Indexación

| # | Acción | Estado actual | Meta |
|---|--------|--------------|------|
| 1 | Reducir errores 4xx: verificar origen en dashboard Bing WMT | 161 errores 4xx en 23 días | <50 errores |
| 2 | Forzar re-rastreo post-IndexNow de 4 URLs estratégicas no indexadas | `/servicios-juridicos`, `/blog`, `/despacho`, `/hondurenos-en-espana` lastCrawled=null | 4/4 indexadas en 7 días |
| 3 | Enviar IndexNow real (no dry-run) tras cada deploy | 20 URLs dry-run | `npm run indexnow:core` |
| 4 | Construir backlinks: directorios legales HN, colegios de abogados | 0 backlinks | 5-10 en 30 días |
| 5 | Añadir Bing Webmaster Tools verification meta tag si no existe | Verificado vía DNS | Confirmar en dashboard |

**Herramienta:** `npm run seo:bing:live` → `npm run indexnow:core`.

---

## 5 Acciones de contenido/blog

| # | Acción | Impacto | Prioridad |
|---|--------|---------|-----------|
| 1 | Crear guía completa sobre "prescripción de deudas en Honduras" (query con 317 imp, 8 clics) | Alto — captura query de alta intención | P1 |
| 2 | Ampliar artículo de pensión alimenticia para cubrir variantes de query | Alto — 240+299+191 impresiones en 3 URLs | P1 |
| 3 | Crear artículo sobre "antejuicio en Honduras" | Medio — 2 imp, 0 clics, query nueva | P2 |
| 4 | Mejorar artículo de habeas corpus para subir posición de 9.6 a top 5 | Medio — 209 imp, 2 clics | P2 |
| 5 | Crear contenido sobre "custodia de hijos" (427 imp, 3 clics — bajo CTR) | Medio — alto volumen, bajo CTR | P2 |

**Herramienta:** cruzar `data/google/gsc-live.json` queries con alto volumen y bajo CTR.

---

## 5 Acciones humanas requeridas

| # | Acción | Responsable | Plazo |
|---|--------|-------------|-------|
| 1 | Iniciar sesión en Bing WMT Dashboard → exportar Site Explorer (69 warnings, 71 excluidas) | Carlos | 7 días |
| 2 | Revisar GA4: filtrar tráfico bot de Hong Kong (56), Países Bajos (28), China (21) para obtener métricas reales de Honduras | Carlos | 7 días |
| 3 | Decidir si crear contenido para queries GSC con alta impresión y 0 clics (ver tabla arriba) | Carlos + IA | 14 días |
| 4 | Revisar snippet de "abogado" (posición 1, CTR 0%) — posible problema de rich snippet o canibalización | Carlos | 7 días |
| 5 | Evaluar si el tráfico de España (42% en GA4) es orgánico real o bot/VPN | Carlos | 14 días |

---

## Métricas a revisar semanalmente

| Métrica | Fuente | Frecuencia | Comando |
|---------|--------|-----------|---------|
| Clics totales | GSC | Semanal | `npm run seo:gsc:live -- --days 7` |
| CTR medio | GSC | Semanal | ídem |
| Impresiones | GSC | Semanal | ídem |
| Posición media | GSC | Semanal | ídem |
| Usuarios orgánicos Google | GA4 | Semanal | `npm run seo:ga4:live -- --days 7` |
| Usuarios orgánicos Bing | GA4 | Semanal | ídem |
| Conversiones | GA4 | Semanal | ídem |
| Errores 4xx Bing | Bing WMT | Quincenal | `npm run seo:bing:live` |
| URLs indexadas Bing | Bing WMT | Quincenal | ídem |
| Sitemap URLs | Local | Mensual | `npm run audit:indexacion` |
| IndexNow estado | Local | Tras cada deploy | `npm run indexnow:dry` |

---

## Umbrales de alerta

| Alerta | Condición | Acción |
|--------|-----------|--------|
| Caída de clics GSC | -30% vs semana anterior | Revisar penalización, deindexación o caída de rankings |
| Caída de CTR | <1.5% sostenido 2 semanas | Revisar meta descriptions, títulos, rich snippets |
| Subida de errores Bing | +50 errores 4xx nuevos en un día | Verificar deploy reciente, URLs rotas |
| Caída de conversiones | 0 conversiones en 7 días | Revisar formularios, CTAs, tracking |
| Sitemap con URLs fantasma | URLs que devuelven 404/301 en sitemap | `npm run audit:indexacion` → corregir |
| IndexNow fallando | HTTP != 200 o error de API | Verificar INDEXNOW_KEY, endpoints |
| Tráfico bot excesivo | >50% de usuarios de países no-target (HK, CN, NL) | Configurar filtro GA4 |
| Páginas no indexadas nuevas | URLs prioritarias con lastCrawled=null por >7 días | `npm run indexnow:core` |

---

## Objetivos por plazo

### 7 días

- [ ] `seo:doctor` 0 errores (mantener)
- [ ] `seo:collect` 6/6 fuentes (mantener)
- [ ] CTR GSC > 2.5%
- [ ] Revisar dashboard Bing WMT (humano)
- [ ] IndexNow real enviado para URLs no indexadas
- [ ] CHANGELOG actualizado

### 30 días

- [ ] CTR GSC > 3.5%
- [ ] Errores 4xx Bing < 100
- [ ] 4 URLs estratégicas indexadas en Bing
- [ ] 5+ backlinks de calidad
- [ ] Conversiones GA4 > 15/mes
- [ ] Contenido creado para top 5 queries GSC con CTR 0%
- [ ] Tráfico bot filtrado en GA4 reporting

### 90 días

- [ ] CTR GSC > 5%
- [ ] Posición media < 5.0
- [ ] Errores 4xx Bing < 50
- [ ] 20+ backlinks
- [ ] Conversiones GA4 > 30/mes
- [ ] Tráfico orgánico Honduras > 50% del total
- [ ] Bing queries > 100
- [ ] Sistema SEO live operando sin intervención manual (solo monitoreo)

---

## Siguiente paso concreto

```bash
npm run seo:doctor     # Verificar 0 errores
npm run seo:collect    # Datos frescos
# Revisar docs/audits/seo-live-summary.md
# Comparar CTR, errores Bing y conversiones con este plan
```

---

*Plan generado con datos LIVE de GSC, GA4 y Bing WMT. Sin secretos expuestos. Actualizar semanalmente.*
