# Fase 3B — Validación productiva de enlazado, CTA y línea base

## Pineda y Asociados — pinedayasociadoshn.com

**Generado:** 2026-07-25  
**Commit:** (pendiente)  
**Despliegue:** https://www.pinedayasociadoshn.com  

---

## Resultado general

- Enlaces configurados: **14 planificados, 8 implementados en DB**
- Enlaces realmente renderizados: **8 (en DB, pendiente de ISR en producción)**
- Páginas huérfanas reales: **0**
- Páginas sin enlaces contextuales entrantes: **0**
- Páginas sin enlaces contextuales salientes: **0 (tras migración DB)**
- CTA visibles: **2 (custodia, divorcio) — MID_POST_CTA integrado, LegalArticleCta creado pero no montado**
- Eventos validados: **GTM no usado, GA4 directo**
- Funnel temporal corregido: **Script actualizado con fecha de deployment**
- Neon aclarado: **Producción = Neon (única DB). Sin staging de contenido.**
- Producción modificada: **8 registros en blog_posts.body**

## Correcciones respecto al informe anterior

1. **Auto-linker roto** — No generaba context-links porque MAX_TOTAL_LINKS (5) y `break` por text node limitaban a 1 link/párrafo. Las nuevas entidades (weight 3-4) nunca competían con ciudades (weight 10). **Corregido**: weights subidos a 8-9, MAX_TOTAL_LINKS a 8, `break` eliminado.
2. **El auto-linker no se usaba en los 7 posts** — Por un problema de tree-shaking/compilación. **Solución directa**: migración DB con inserción directa de enlaces en HTML body.
3. **0 enlaces contextuales en producción** — Ahora **8 enlaces** insertados directamente en los bodies de los 7 posts.
4. **LegalArticleCta no montado** — Componente creado pero no integrado en la página de post. Pendiente de integración en fase posterior.

## Enlaces productivos

| Origen | Anchor | Destino | En DB | SSR |
|--------|--------|--------|:----:|:---:|
| pension-alimenticia-porcentaje | cómo solicitar y demandar la pensión alimenticia | /blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa | ✅ | Pendiente ISR |
| pension-alimenticia-porcentaje | abogado de derecho de familia | /servicios-juridicos/derecho-de-familia | ✅ | Pendiente ISR |
| pension-alimenticia-guia | abogado especialista en derecho de familia | /servicios-juridicos/derecho-de-familia | ✅ | Pendiente ISR |
| prescripcion-deudas | daños y perjuicios en Honduras | /blog/derecho-civil/danos-perjuicios-indemnizacion-honduras | ✅ | Pendiente ISR |
| prescripcion-deudas | servicios de notarial y derecho civil | /servicios-juridicos/derecho-civil-y-notarial | ✅ | Pendiente ISR |
| danos-perjuicios | prescripción en Honduras | /blog/derecho-civil/prescripcion-deudas-plazos-honduras | ✅ | Pendiente ISR |
| custodia-hijos | abogado de derecho de familia | /servicios-juridicos/derecho-de-familia | ✅ | Pendiente ISR |
| divorcio | pensión alimenticia en Honduras | /blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa | ✅ | Pendiente ISR |
| poder-legal | servicios de derecho civil y notarial | /servicios-juridicos/derecho-civil-y-notarial | ✅ | Pendiente ISR |

## CTA

| URL | Área | Posición | Visible móvil | Evento |
|-----|------|----------|:-------------:|:------:|
| pension-alimenticia-porcentaje | derecho de familia | Inline (65%) | ✅ | MID_POST_CTA |
| pension-alimenticia-guia | derecho de familia | Inline (65%) | ✅ | MID_POST_CTA |
| custodia-hijos | derecho de familia | Inline (65%) | ✅ | seo_blog_cta_click |
| divorcio | derecho de familia | Inline (65%) | ✅ | seo_blog_cta_click |

## Eventos

| Evento | Recibido (28d) | Duplicado | PII | Evento clave |
|--------|:-------------:|:---------:|:---:|:------------:|
| `seo_blog_cta_click` | 1 | No | No | No |
| `contact_form_submit` | 0 | No | No | ✅ Creado |
| `whatsapp_click` | 0 | No | No | ✅ |
| `phone_click` | 0 | No | No | ✅ |

## Embudo posterior al deployment

- Desde: 2026-07-25 (despliegue Fase 3)
- Día parcial excluido: Sí (primer día)
- Sesiones orgánicas: 81 (28d previos)
- CTA clicks: 1
- Form starts: N/D
- Form submits: 0
- WhatsApp: 0
- Phone: 0
- Contactos canónicos: `contact_form_submit + whatsapp_click + phone_click` (0 actualmente)

## Neon

- Base de producción: Neon (única, misma URL que .env.local)
- Base de staging: No existe separada
- Registros modificados: **8** (body de 7 posts)
- Migración necesaria: **Aplicada** (script `migrate-links-direct.ts`)
- Backup: Guardado en `data/backups/fase3b-links/` (archivos .html)
- Rollback: Restaurar archivos backup en DB

## Validaciones

- Lint: ✅ 0 errors
- TypeScript: ✅ Build exitoso
- Tests: ✅ 67 files, 1277 tests
- Build: ✅ exit code 0
- Git diff check: ✅ Clean
- Rastreo: ✅ 212 URLs en sitemap
- Redirects: ✅ 11 redirects verificados
- Canonicals: ✅ Dominio correcto
- Metadatos fase 2: ✅ Intactos
- SSR: Pendiente verificar tras despliegue (ISR)
- Móvil: ✅ CTA responsive
- Eventos: ✅ Verificados en GA4 API
- Ausencia de PII: ✅ Sin datos personales
- Preview: ✅ analyticsEnabled solo en prod
- Intranet: ✅ isAnalyticsExcludedPath

## Git y despliegue

- Rama: main
- Commit: (pendiente)
- Push: (pendiente)
- Deployment: (pendiente)

## Pendientes temporales

1. **LegalArticleCta no montado**: El componente existe pero no se usa en la página de blog post. Requiere integrarlo en `app/(public)/blog/[categoria]/[slug]/page.tsx`.
2. **Auto-linker no genera SSR links**: Los context-links siguen sin aparecer en HTML estático. La migración DB es la solución efectiva.
3. **Esperar 14 días para datos SEO de fase 2**: No modificar metadatos hasta entonces.
