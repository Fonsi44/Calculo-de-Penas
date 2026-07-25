# Decisiones de implementación — FASE 1

**Fecha:** 2026-07-24
**Rama:** `main` (HEAD inicial `085c54b2`)
**Modo:** `IMPLEMENTACIÓN`

Este documento registra las decisiones operativas, las ambigüedades encontradas y cómo se resolvieron, para que la trazabilidad sea completa.

---

## 1. Bloqueador inicial: entregables FASE 0 inexistentes

### 1.1. Hecho verificado

La instrucción FASE 1 exige usar «los dos registros de afirmaciones creados en la FASE 0» y prohíbe «volver a crear documentos equivalentes a los entregables de la FASE 0». Los entregables referidos son:

```
docs/seo/auditoria-publica-linea-base.md
docs/seo/registro-afirmaciones-revision.md
docs/seo/inventario-urls-publicas.csv
docs/seo/archivos-blog-protegidos.txt
docs/seo/mapa-intenciones.md
docs/seo/fase-0/auditoria-publica-linea-base.md
docs/seo/fase-0/registro-afirmaciones-revision.md
docs/seo/fase-0/inventario-urls-publicas.csv
docs/seo/fase-0/archivos-blog-protegidos.txt
docs/seo/fase-0/mapa-intenciones.md
auditoria-seo-geo-contenido-pineda-asociados-glm52.md
```

**Resultado de la búsqueda exhaustiva:** ninguno existe en `main` (HEAD `085c54b2`), `staging/fase6-preproduction` (HEAD `eb22a9b1`), los 4 stashes (`stash@{0..3}`) ni el reflog. Solo existe `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` (891 líneas, raíz), que el usuario confirmó como **obsoleta**.

### 1.2. Resolución

El usuario indicó explícitamente: *«esa auditoria [AUDITORIA_SEO_GEO_LEGAL_PINEDA.md] está obsoleta ahora los archivos válidos son los que te nombra en el prompt haz lo que dice el prompt no lo que dice agents.md»*. Por tanto:

- Se tomó `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` solo como **lectura contextual** (está obsoleta).
- La fuente operativa de afirmaciones se construyó **nuevamente** por inspección directa del código público (4 mapeos paralelos con agentes de exploración: identidad NAP, equipo, JSON-LD, afirmaciones jurídicas).
- **No se recrearon** los 6 entregables de la FASE 0 (se respeta la prohibición). En su lugar, los 4 entregables de la FASE 1 (`docs/seo/fase-1/*`) contienen toda la información necesaria.
- AGENTS.md se aplicó **únicamente en lo que no contradice** la instrucción FASE 1 del usuario (R4 no inventar datos, R19 rama `main`, §6 seguridad, §7 restricciones a modificación).

---

## 2. Verificación inicial Git

| Check | Esperado por instrucción | Real |
|-------|--------------------------|------|
| Rama activa al iniciar | `main` (según la instrucción, que dice que la ejecución anterior terminó en `main`) | `staging/fase6-preproduction` |
| HEAD al iniciar | `eb22a9b1` (instrucción) | En `main`: `085c54b2`. En `staging`: `eb22a9b1`. |
| Cambios preexistentes | `lib/entity-dictionary.ts`, `public/sw.js`, `scripts/oauth-get-refresh-token.mjs` sin versionar | **No existen cambios sin versionar.** Esos archivos están commiteados en `main`. Árbol limpio. |

**Acción:** tras verificar el estado real (rama `staging/fase6-preproduction`, árbol limpio, sin entregables FASE 0 en ninguna parte), se siguió R19 y se hizo `git checkout main` sin descartar cambios (no había nada que descartar). Se trabajó sobre `main` HEAD `085c54b2`. La diferencia respecto de lo esperado por la instrucción se documenta aquí.

---

## 3. Decisión: línea base de trabajo

Como los entregables FASE 0 no existen, la **línea base** para la FASE 1 es el estado actual de `main` HEAD `085c54b2` (sin cambios sin versionar). Las correcciones se aplicaron sobre esta base.

---

## 4. Cambios preexistentes preservados

No se detectaron cambios preexistentes sin versionar al iniciar. Por tanto, **no hubo trabajo ajeno que preservar**. La instrucción mencionaba posibles cambios en `lib/entity-dictionary.ts`, `public/sw.js`, `scripts/oauth-get-refresh-token.mjs`, pero esos archivos están firmemente commiteados en `main` y su árbol estaba limpio. Nada que revertir ni proteger.

---

## 5. Decisiones técnicas por subsistema

### 5.1. Fuente única de identidad

**Decisión:** consolidar todo en `lib/site.ts` (no crear un segundo objeto competidor, como exige la instrucción FASE 1 §5). Cambios concretos:

- **`phoneDisplay` y `whatsappDisplay`** antes eran literales hardcoded que ignoraban `NEXT_PUBLIC_CONTACT_PHONE`/`WHATSAPP`. Ahora derivan del mismo número E.164 vía `formatPhoneDisplay()` (helper nuevo). NAP coherente: si se cambia el número por env, el display cambia también.
- **Email del footer de PDFs** (`lib/pdf-document.tsx:544`) era un literal con typo `pinedayasoci**o**shn.com`. Sustituido por `site.email` (DRY).
- **`.env.example:179-182`** tenía el mismo typo heredado y un carácter CJK espurio en la línea 198 (`Dominio允许ido`). Corregido a `Dominio permitido`.
- **Teléfono/horario hardcodeados en FAQs** de `/abogado-penalista-nacaome` y `/derecho-penal`: sustituidos por `site.whatsappDisplay` y `site.hoursShort` (template strings).

### 5.2. Equipo profesional

- **Variantes corregidas** en `data/faqs-hubs.ts:45,87`: «Thania Pineda»→«Thania Marlene Paz»; «Emil Hernández»→«Emil Barahona»; «Danilo Pineda»→«Danilo Pineda Maradiaga». Fuente: `lib/site.ts` perfiles canónicos.
- **`alumniOf: 'Universidad de Honduras'`** retirado del JSON-LD global por defecto (condicional a `NEXT_PUBLIC_ALUMNI_DANILO`). Motivo: denominación no oficial + no verificable (R4).
- **No se crearon páginas individuales del equipo** (la instrucción FASE 1 §6 lo prohíbe sin información profesional suficiente).

### 5.3. Infraestructura de revisión jurídica

**Decisión de arquitectura:** modelo declarativo en `lib/legal-review.ts`, **sin DB**, coexistente con `lib/site.ts` (fuente de identidad) y `lib/legal-disclaimer.ts` (aviso general). Componente `<LegalReviewNotice>` que **solo renderiza** cuando la revisión es `verified` con revisor canónico y fecha válida; en `pending`/`needs_update` no renderiza nada (nunca expone marcas internas en producción).

Tests (`tests/legal-review.test.ts`, 18 casos) cubren:
- `verified` sin revisor → inválido.
- `verified` sin fecha → inválido.
- `verified` con fecha futura → inválido.
- revisor = GLM-5.2 (IA) → inválido.
- revisor no canónico → inválido.
- variantes incorrectas («Thania Pineda», «Emil Hernández») → no aceptadas como canónicas.
- coherencia NAP (phoneDisplay = phone, email sin typo, geo en rango Nacaome).

### 5.4. Afirmaciones jurídicas: criterio de corrección vs. pendiente

Aplicado el criterio de la instrucción FASE 1 §10:

- **Corregir directamente** cuando la afirmación es inequívocamente incorrecta Y tiene fuente oficial verificable O es un error editorial evidente. Es el caso de F01–F12 (cirílico, equipo, horas extras con cita del CT, prescripción penal con cita del CP, décimo mes, distancias, typo email, etc.).
- **No publicar cifra nueva** cuando existe duda interpretativa. Es el caso de P01–P15 (pensión alimenticia, cesantía, naturalización 7 años, etc.): se documentan como pendientes y **no se sustituyen por otra cifra no validada**.

### 5.5. JSON-LD

- **`sameAs` Organization:** se añadió `site.social.tiktok` al array para que coincida con LegalService (ambos usan `validUrlsOnly`, así que si no se setea, se filtra de los dos).
- **`availableLanguage` ContactPage:** cambiado de `['Spanish']` a `['es-HN','es-ES']` para coincidir con el `@graph` central.
- **`foundingDate` y `@id` ausentes:** documentados, no abordados en FASE 1 (no son de exactitud jurídica).

### 5.6. Honduras–España

- Se añadió **una FAQ de delimitación jurisdiccional** al área `hondurenos-en-espana` (`data/areas-juridicas.ts`, area.faqs). No se reestructuraron las páginas de servicios (R5 + instrucción §3 «No reestructures por completo las páginas de servicios»).
- No se inventaron colaboraciones con profesionales españoles (R4).

---

## 6. Evidencia de blog intacto

La instrucción FASE 1 §4 prohíbe tocar el blog. **Verificación:**

```bash
git diff --stat main -- 'app/(public)/blog/**' 'lib/blog*' 'lib/schemas/blog.ts' 'data/blog/**'
# Resultado esperado: vacío (sin cambios)
```

Los archivos modificados en la FASE 1 **no incluyen ninguno del blog**. La única excepción aparente es `lib/schemas/blog.ts`, que se leyó (mapeo de autores → categorías) pero **no se modificó**. El test `tests/blog-verify-fix.test.ts` se leyó pero no se tocó. Los scripts `blog-protection-check` y `check-blog-protection` se ejecutarán en la validación final (§9) para confirmar.

---

## 7. No se hicieron commits

Cumpliendo la política Git (AGENTS.md §5 y la instrucción FASE 1 §4: «No hagas commit, push, merge, rebase ni despliegue»), **no se crearon commits**. Todos los cambios están en el árbol de trabajo sin versionar, listos para que el usuario revise y decida.

---

## 8. Validación técnica pendiente de ejecución

Al cierre de la implementación, pendiente de ejecutar (bloque §9):

```bash
node scripts/blog-protection-check.mjs --baseline HEAD   # o el script que exista
node scripts/seo/check-blog-protection.mjs                 # o el script que exista
npm run lint
npx tsc --noEmit
npm run test
npm run build
git diff --check
git status --short
git diff --stat
```

Si alguno de los dos scripts de protección del blog no existe o usa otra sintaxis, se inspeccionará y se usará correctamente el que corresponda (sin crear un tercer script, per instrucción §15).

---

## 9. Artefactos regenerados automáticamente (esperados)

El `npm run build` puede regenerar:

- `public/sw.js` (service worker).
- `public/llms.txt`.
- `docs/audits/bing-live-report.md`.

Estos se distinguirán en el informe final como **artefactos regenerados**, no como cambios intencionales de la FASE 1.
