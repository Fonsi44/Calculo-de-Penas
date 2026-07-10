# Pendientes y próximos pasos — Auditoría Ahrefs 2026-07-10

**Fecha:** 10-jul-2026

---

## Pendientes que requieren nuevo crawl o acción externa

### 1. CSV `all_issues` (export general de problemas)
No se aportó en este lote (solo 5 CSV únicos de 6 esperados). Cuando se exporte, re-analizar para:
- Recuento real de errores de Schema.org (Article/BlogPosting/FAQPage/BreadcrumbList).
- Errores de imágenes (rotas, sobredimensionadas, sin alt).
- Errores de rendimiento (LCP, páginas lentas).
- Duplicados de title/meta/H1 (más allá de los ya revisados).

### 2. Landings locales: reemplazar slugs viejos en `BlogHighlights`
Al despublicar los 8 posts, las landings que los listaban (`abogados-en-{ciudad}`, `abogado-laboralista-nacaome`) muestran una tarjeta menos. No es un error (las tarjetas se omiten con elegancia), pero para mantener densidad de enlaces internos, conviene **reemplazar los slugs viejos por slugs actuales** en los arrays `slugs=[...]`:

| Landing | Slug viejo a reemplazar | Slug actual sugerido |
|---|---|---|
| `abogados-en-el-triunfo`, `-goascoran`, `-langue`, `-namasigue`, `-orocuina`, `-pespire` | `abogado-penalista-choluteca` | `cuando-necesito-abogado-penalista-honduras` o `que-hacer-si-me-detienen-en-honduras` |
| `abogado-laboralista-nacaome` | `despido-injustificado-...`, `calcular-prestaciones-...`, `empleador-no-paga-...` | `despido-laboral-honduras-guia-completa`, `calcular-liquidacion-laboral-honduras` |
| `abogados-en-choluteca` | `calcular-prestaciones-laborales-honduras` | `calcular-liquidacion-laboral-honduras` |

> **Prioridad baja.** No afecta a la corrección de los 3xx (ya resueltos). Es mejora de densidad de enlazado interno.

### 3. `data/landings-locales.ts` — entradas con slug viejo
Líneas 420 y 454 contienen `{ slug: 'despido-laboral-honduras-derechos', ... }` (slug despublicado). Revisar si esas entradas alimentan enlaces visibles y actualizar al slug consolidado `despido-laboral-honduras-guia-completa`.

### 4. `MID_POST_CTA_COPY` (`page.tsx:117-197`)
Mapea slugs viejos (`calcular-prestaciones-laborales-honduras`, `despido-injustificado-...`, `abogado-penalista-choluteca`, `empleador-no-paga-salario-honduras`) a copy de CTA. Al estar los posts despublicados, ese copy ya no se inyecta en esos slugs (no se renderizan). Pero si se reutilizan las claves para otros fines, conviene limpiar el mapa. **Revisar en próxima fase.**

---

## Qué revisar en Ahrefs tras nuevo crawl

1. **"Broken links" (4xx):** deberían bajar de 8 a 6 (los 2 reales corregidos; los 6 artefactos pueden seguir apareciendo si Ahrefs sigue resolviendo rutas relativas incorrectamente — son tolerables).
2. **"Internal links to 3xx":** debería bajar drásticamente de 114 (idealmente a 0 internos; pueden quedar backlinks externos que no controlamos).
3. **"Pages with no H1":** los 3 posts corregidos deberían salir del reporte.
4. **Sitemap issues:** 0 URLs 3xx en sitemap.
5. **"Non-self-referencing canonicals":** mantenerse en 19 (todos correctos: paginación).

---

## Qué revisar en Bing Webmaster Tools

1. **Crawl Information → Crawl errors:** confirmar descenso de 3xx/4xx internos.
2. **Sitemaps:** re-enviar `/sitemap.xml` para que Bing recrawlee la estructura sin los 8 slugs viejos.
3. **URL Inspection** sobre `/blog/derecho-penal/abogado-penalista-choluteca`: debe mostrar redirección 301 a `/abogado-penalista-choluteca`.
4. **IndexNow:** las URLs candidatas (ver `urls-candidatas-indexnow.csv`) pueden enviarse **solo con aprobación explícita** para acelerar la re-indexación de las URLs consolidadas.

---

## Qué revisar en Google Search Console

1. **Cobertura → Excluidas → "Redirección":** los 8 slugs viejos deberían migrar de "Indexada" a "Redirigida" y eventualmente a fuera del índice (las URLs finales los reemplazan).
2. **Rendimiento:** vigilar durante 2-4 semanas que las URLs finales (`despido-laboral-honduras-guia-completa`, `calcular-liquidacion-laboral-honduras`, `poder-legal-honduras-cuando-se-necesita`, `como-elegir-abogado-honduras`, `/abogado-penalista-choluteca`) absorban las impresiones de los slugs viejos (~196 imp/mes).
3. **Inspección de URLs** sobre las URLs finales: confirmar "URL canónica" correcta y "Indexable".
4. **Sitemaps:** GSC detecta automáticamente cambios; confirmar "Descubierta" vs "Indexada".
5. **Rich Results / Cobertura:** si aparecen errores nuevos de schema, diagnosticar con el CSV `all_issues` (pendiente).

---

## IndexNow — URLs candidatas (NO enviar sin aprobación)

Ver `urls-candidatas-indexnow.csv`. Incluye las **URLs finales consolidadas** que conviene notificar a Bing/IndexNow para acelerar re-indexación tras la despublicación de los slugs viejos:

- `/abogado-penalista-choluteca`
- `/blog/derecho-laboral/despido-laboral-honduras-guia-completa`
- `/blog/derecho-laboral/calcular-liquidacion-laboral-honduras`
- `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita`
- `/blog/practica-legal/como-elegir-abogado-honduras`
- `/hondurenos-en-espana` (página con los 2 enlaces corregidos)
- 3 posts con h1 corregido: `/blog/derecho-bancario/banco-demanda-deuda-defensa-opciones-honduras`, `/blog/practica-legal/como-preparar-demanda-guia-no-abogados-honduras`, `/blog/regulacion-sanitaria/habilitacion-clinicas-hospitales`

**Comando (solo cuando se apruebe):**
```bash
ENABLE_INDEXNOW_SUBMIT=true npx tsx scripts/submit-indexnow.mjs
```
El script `postbuild` ya lo ejecuta en dry-run por defecto (no envía sin `ENABLE_INDEXNOW_SUBMIT=true`).

---

## Riesgos pendientes

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Pérdida temporal de ~196 impresiones/mes durante la consolidación | Media | Bajo (0 clics) | Los redirects 301 transfieren señal; vigilar GSC 2-4 sem. |
| Landings con una tarjeta menos | Alta | Muy bajo | Reemplazar slugs viejos (pendiente §2) |
| Artefactos de crawl sigan apareciendo en Ahrefs | Alta | Nulo | Ya documentados; tolerables |
| Schema errors no detectados (sin CSV all_issues) | Media | Medio | Rich Results Test tras deploy |
