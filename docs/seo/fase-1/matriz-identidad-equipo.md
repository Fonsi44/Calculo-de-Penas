# Matriz de identidad y equipo — FASE 1

**Fecha:** 2026-07-24
**Fuente única de identidad:** `lib/site.ts` (objeto `site` + perfiles `FOUNDER_PROFILE`, `THANIA_PROFILE`, `EMIL_PROFILE`).
**Fuente base:** `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md`.

---

## 1. Matriz de variantes por persona

| Persona o variante | Archivos | Cargo actual | Credencial declarada | Evidencia | Decisión |
| ------------------ | -------- | ------------ | -------------------- | --------- | -------- |
| **Danilo Pineda Maradiaga** (canónico) | `lib/site.ts:435` (`FOUNDER_PROFILE.name`), `app/(public)/despacho/page.tsx:308`, `app/(public)/derecho-penal/page.tsx:220`, `app/(public)/guia-legal-abogados-honduras/page.tsx:99`, `data/images.ts:62`, `lib/schemas/blog.ts:11`, `lib/legal-review.ts` (CANONICAL_REVIEWERS) | Abogado penalista · Socio director | `Abogado colegiado en Honduras (CAH: …)` condicional a `NEXT_PUBLIC_CAH_DANILO` | Handle X `@Danilo_Pineda_M` (verificable); rol de socio director consistente en 15+ archivos | **Canónico.** Usar siempre «Danilo Pineda Maradiaga». |
| «Danilo Pineda» (sin segundo apellido) | `data/faqs-hubs.ts:45` (FAQ `/servicios-juridicos`) — **FASE 1: corregido** | — | — | Forma acortada, solo en esa FAQ | **Corregido** a «Danilo Pineda Maradiaga». |
| **Thania Marlene Paz** (canónico) | `lib/site.ts:540` (`THANIA_PROFILE.name`), `app/(public)/despacho/page.tsx:358`, `app/(public)/guia-legal-abogados-honduras/page.tsx:99`, `data/images.ts:94`, `lib/schemas/blog.ts:16`, `lib/legal-review.ts` | Abogada · Socia fundadora | `Abogada colegiada en Honduras (CAH: …)` condicional a `NEXT_PUBLIC_CAH_THANIA` | Fuente única del repo; especialidades verificables (administrativo, familia, civil/notarial, mercantil) | **Canónico.** Usar siempre «Thania Marlene Paz». |
| «Thania **Pineda**» ⚠️ | `data/faqs-hubs.ts:45,87` — **FASE 1: corregido** | — | — | **Variante incorrecta** que asumía el apellido del fundador sin base en ningún otro archivo | **Corregido** a «Thania Marlene Paz». Riesgo legal/identidad eliminado. |
| **Emil Barahona** (canónico) | `lib/site.ts:627` (`EMIL_PROFILE.name`), `app/(public)/despacho/page.tsx:407`, `app/(public)/guia-legal-abogados-honduras/page.tsx:99`, `data/images.ts:96`, `lib/schemas/blog.ts:21`, `lib/legal-review.ts` | Abogado · Socio del bufete (no fundador) | `Abogado colegiado en Honduras (CAH: …)` condicional a `NEXT_PUBLIC_CAH_EMIL` | Fuente única del repo; especialidades: laboral, penal, civil/notarial | **Canónico.** Usar siempre «Emil Barahona». |
| «Emil **Hernández**» ⚠️ | `data/faqs-hubs.ts:45,87` — **FASE 1: corregido** | — | — | **Variante incorrecta**, solo en ese archivo | **Corregido** a «Emil Barahona». Riesgo legal/identidad eliminado. |

---

## 2. Cargos declarados (verificación de coherencia)

| Persona | Cargo canónico (`lib/site.ts`) | Variantes detectadas en el repo | Coherente tras FASE 1 |
|---------|--------------------------------|---------------------------------|------------------------|
| Danilo Pineda Maradiaga | `Abogado penalista · Socio director` | «socio director», «socio fundador» (`Organization.founder`), «fundador» (`/guia-legal`), «Abogado responsable del bufete» (`/despacho`) | ✓ Los términos no son contradictorios (fundador implica socio director). Se mantienen. |
| Thania Marlene Paz | `Abogada · Socia fundadora` | «socia fundadora (administrativo, familia, civil y notarial, mercantil y empresarial)» | ✓ Consistente. |
| Emil Barahona | `Abogado · Socio del bufete` | «socio del bufete (laboral, penal, civil y notarial)»; bio visible en `/despacho:443` dice solo «laboral, civil y notarial» (**omite penal**) | ⚠ **Inconsistencia menor de especialidades**: el schema `EMIL_PROFILE.specialties` y los metadatos incluyen Penal, pero la bio visible lo omite. Documentado; no crítico. Queda pendiente unificar la redacción de la bio visible con las especialidades del schema. |

---

## 3. Credenciales declaradas (colegiación CAH)

| Persona | Declaración | Estado | Validación pendiente |
|---------|-------------|--------|---------------------|
| Danilo | Badge «CAH: {NEXT_PUBLIC_CAH_DANILO}» si se setea env var; claim textual «Colegiado en Honduras» en `/derecho-penal` | Condicional a env var. **No se publica nº sin valor real.** | Despacho debe aportar el nº de colegiación real ante el CAH para setear la variable. |
| Thania | Badge CAH condicional | Ídem | Ídem |
| Emil | Badge CAH condicional | Ídem | Ídem |
| Los tres | `data/faqs-hubs.ts:87` afirma categóricamente «Los tres son abogados y notarios públicos colegiados en Honduras» | Afirmación categórica **sin nº mostrado**. | Verificar colegiación efectiva de los tres y la condición notarial (en Honduras el notariado es una función ejercida por abogados autorizados por la Corte Suprema). |

**Política aplicada (R4):** no se publica número de colegiación sin confirmación y autorización del despacho. La afirmación textual «colegiados en Honduras» se mantiene porque es la afirmación pública existente del bufete; el nº solo se renderiza si se aporta vía env var.

---

## 4. Formación académica

| Persona | Declaración | Estado FASE 1 |
|---------|-------------|---------------|
| Danilo | `alumniOf: 'Universidad de Honduras'` en JSON-LD global (`lib/site.ts:485-488`) | **Retirada por defecto (F11)**. «Universidad de Honduras» NO es denominación oficial de ninguna universidad hondureña (la pública es UNAH; hay varias privadas con nombres propios). Convertido a condicional `NEXT_PUBLIC_ALUMNI_DANILO`. No se publica hasta que el despacho aporte el nombre oficial verificable. |
| Thania | Sin declaración académica | Sin cambios (no se inventa). |
| Emil | Sin declaración académica | Sin cambios. |

---

## 5. Antigüedad / año de fundación

| Afirmación | Ubicaciones | Estado |
|------------|-------------|--------|
| `foundingDate: '2010'` (solo JSON-LD) | `lib/site.ts:369` | Comentario deja claro que refleja «más de 15 años». **Pendiente (P11)**: el despacho debe confirmar el año real o solicitar su eliminación del JSON-LD. |
| «Más de 15 años de ejercicio profesional» / «+15 años» | ~15 archivos (home, /despacho, /derecho-penal, landings, `lib/site.ts:445`) | Internamente consistente. **Pendiente (P12)**: verificar año real de colegiación de Danilo. Si hoy (2026) «más de 15 años», implica ejercicio desde antes de 2011. |

---

## 6. Revisores jurídicos canónicos (infraestructura)

La infraestructura de revisión (`lib/legal-review.ts`) define `CANONICAL_REVIEWERS` como los tres socios con nombre completo canónico:

```ts
CANONICAL_REVIEWERS = [
  'Danilo Pineda Maradiaga',
  'Thania Marlene Paz',
  'Emil Barahona',
]
```

Cualquier atribución «Revisado por» debe coincidir con uno de estos nombres. Los tests (`tests/legal-review.test.ts`) impiden:

- `verified` con revisor no canónico;
- `verified` con variantes incorrectas («Thania Pineda», «Emil Hernández»);
- `verified` con un modelo de IA como revisor (p. ej. «GLM-5.2»).

---

## 7. Conclusión

Las variantes incorrectas del equipo estaban **confinadas a `data/faqs-hubs.ts`** y ya están corregidas. La identidad fluye desde `lib/site.ts` hacia todos los componentes, JSON-LD y la nueva infraestructura de revisión. No se han creado páginas individuales del equipo (no existe información profesional suficiente verificada para justificarlas, según la restricción §6 de la instrucción FASE 1).

**Pendiente de validación humana:** colegiación CAH efectiva de los tres, condición notarial, formación académica de Danilo, año de fundación real.
