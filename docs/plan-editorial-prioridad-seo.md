# Plan editorial priorizado por impacto SEO (2026-06-20)

> **Complementa a:** [`plan-reescritura-blog.md`](./plan-reescritura-blog.md)
> (que detalla los 49 posts thin y los criterios de calidad).
>
> **Este documento añade:** el **orden de ejecución** basado en potencial SEO
> real, conectando el plan de reescritura con el problema de negocio
> (0 clics orgánicos en 90 días, dominio nuevo sin autoridad).

---

## 1. Contexto SEO real (2026-06-20)

| Métrica | Valor | Fuente |
|---------|-------|--------|
| Impresiones GSC (90d) | 94 | Search Console API |
| Clics GSC (90d) | **0** | Search Console API |
| Tráfico orgánico Google | **0%** | GA4 (0 sesiones de google) |
| URLs indexadas | 8/9 prioridad | GSC URL Inspection |
| Backlinks | 0 | Bing WMT |
| Posts thin (ALTO riesgo) | 49 | `THIN_POST_SLUGS` |
| Posts vencidos editoriales | 71 | `npm run content:audit` |
| Edad del dominio verificado | ~11 días | GSC |

**Diagnóstico:** el sitio está bien indexado pero Google casi no lo muestra
(94 impresiones/90d) y cuando lo hace, recibe 0 clics. Las prioridades son:

1. **Maximizar visibilidad** → contenido que responda a búsquedas reales con
   volumen (no temas exóticos).
2. **Subir CTR** → titles/descriptions orientados a intención (en marcha,
   commit `99fec2c`).
3. **Autoridad** → requiere link building externo (fuera del repo).

---

## 2. Criterio de priorización: potencial de búsqueda

El plan de reescritura agrupa los 49 thin por **tipo** (landings locales,
guías temáticas, canibalizaciones). Pero no todas las guías tienen el mismo
potencial SEO. Se prioriza por:

| Factor | Peso | Justificación |
|--------|------|---------------|
| **Volumen de búsqueda estimado** | Alto | Temas que la gente busca mucho > temas de nicho |
| **Intención comercial** | Alto | "abogado X en Y" (transaccional) > "qué es X" (informativo) |
| **Cobertura geográfica** | Medio | Sur de Honduras (Nacaome, Choluteca, San Lorenzo) |
| **Competencia** | Medio | Long-tail local tiene menos competencia que genéricos |
| **Valor legal verificable** | Bajo | Posts con datos CP concretos aportan más E-E-A-T |

---

## 3. Orden de ejecución recomendado (por lotes)

### Lote 1 — Money pages locales (prioridad MÁXIMA)
Son las que generan ingresos. Reescribir/completar primero.

**7 landings/perfiles locales** (compiten con `/abogados-en-*`):
- `abogado-civil-choluteca`, `abogado-familia-choluteca`,
  `abogado-empresas-san-lorenzo`
- `abogados-en-choluteca`, `abogados-en-san-lorenzo`,
  `abogados-en-nacaome`, `abogados-en-amapala-valle`
- `pineda-asociados-bufete-multidisciplinario-honduras`

**Acción:** para los que canibalizan con landings existentes, **canonicalizar**
(redirigir authority). Para los únicos, **reescribir como guía local profunda**
con NAP, casos típicos, cómo llegar, FAQ local.

### Lote 2 — Guías de alta demanda (penal, familia, laboral)
Temas que la gente busca cuando tiene un problema urgente. Mayor intención
comercial.

- `defensa-penal-menores-edad-honduras` (penal + menores = urgente)
- `etapa-investigacion-proceso-penal-honduras` (proceso penal = alta demanda)
- `sobreseimiento-definitivo-provisional-diferencias-honduras`
- `presentar-denuncia-conadeh-honduras` (denuncia = acción concreta)
- `fianza-medidas-cautelares-proceso-penal-honduras`
- `allanamiento-ilegal-violacion-domicilio-honduras`
- `delitos-ambientales-como-denunciarlos-honduras`
- `union-de-hecho-requisitos-derechos-honduras` (familia, alta búsqueda)
- `adopcion-requisitos-proceso-honduras` (familia, procedimiento)
- `prescripcion-deudas-plazos-honduras` (civil, alta demanda)

### Lote 3 — Guías de demanda media (mercantil, tributario, administrativo)
- `costos-honorarios-abogados-como-funcionan-honduras` (¡búsqueda transaccional directa!)
- `facturacion-electronica-obligaciones-requisitos-sar-honduras`
- `sar-notifica-fiscalizacion-que-hacer-honduras`
- `impuestos-pequenas-empresas-guia-basica-honduras`
- `como-obtener-rtn-personas-empresas-honduras`
- `constituir-empresa-guia-paso-a-paso-honduras`
- `centro-conciliacion-arbitraje-ccic-guia-honduras`
- `contratacion-publica-licitaciones-empresas-honduras`

### Lote 4 — Nichos (banca, ambiental, internacional, notarial)
Demanda baja pero cero competencia. Buen para autoridad temática a largo plazo.

- Resto de guías thin (visas, usucapión, refugio, tarjetas crédito, NDA,
  lavado activos, títulos valores, competencia desleal, etc.)

### Lote 5 — Posts vencidos (71, revisión trimestral)
No son thin, pero necesitan actualización de fechas/referencias legales.
Priorizar los del Lote 1-2 que estén vencidos (doble beneficio).

---

## 4. Métricas de seguimiento

Tras cada lote reescrito, medir (período de 30-60 días por la latencia SEO):

| Métrica | Herramienta | Frecuencia |
|---------|-------------|------------|
| Impresiones GSC | `scripts/seo-audit-gsc-ga4.mjs` | Semanal |
| Clics GSC | `scripts/seo-audit-gsc-ga4.mjs` | Semanal |
| URLs indexadas | GSC URL Inspection | Tras cada reescritura |
| Tráfico orgánico GA4 | GA4 (fuente: google) | Mensual |
| Posts thin restantes | `THIN_POST_SLUGS` count | Tras cada lote |

**Objetivo a 90 días:** subir de 94 → 500+ impresiones/mes y de 0 → 10+ clics/mes.

---

## 5. NOTA IMPORTANTE sobre el CTR

Los titles/metadescriptions se optimizaron en commit `99fec2c` para las
páginas principales. El **siguiente paso de CTR** sería aplicar el mismo
criterio (keyword + beneficio + CTA) a los titles de los **posts del blog**
cuando se reescriban. No tiene sentido optimizar titles de posts thin que
van a ser reescritos — el title debe salir del contenido reescrito.

---

## 6. Trabajo que NO se puede automatizar (requiere humano)

- **Redacción de contenido legal** con datos verificados (artículos CP,
  plazos, costes). La IA puede estructurar pero el bufete debe validar.
- **Link building** off-page (directorios legales, prensa, asociaciones).
- **Google Business Profile** (reseñas, fotos, posts).
- **Redes sociales** (`NEXT_PUBLIC_SOCIAL_*` sin configurar).
