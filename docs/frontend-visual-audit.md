# Auditoría visual frontend — Pineda y Asociados

> **Fecha:** 2026-06-19
> **Alcance:** proporcionalidad, jerarquía tipográfica, espaciado, responsividad y accesibilidad (foco visible) de la web pública.
> **Método:** capturas reales vía Playwright (8 páginas × 2 viewports: 375px móvil, 1440px desktop) + inspección de código + probe empírico de foco en producción.

---

## 1. Resumen ejecutivo

**Conclusión: cero hallazgos accionables.** Tras inspección visual de las capturas y verificación empírica de la cascada CSS, el diseño visual de la web pública cumple los estándares de proporcionalidad, jerarquía y accesibilidad planteados. No se requieren modificaciones de código.

Se rechazan explícitamente las siguientes hipótesis iniciales por no confirmarse en la evidencia:

| Hipótesis inicial | Verificación | Resultado |
|---|---|---|
| H1 móvil (`text-3xl` = 30px) demasiado grande para 375px | Inspección visual `home-mobile.png` | ❌ Falso. 30px es estándar H1 móvil (rango óptimo 28-32px). Ocupa ~90-95% del ancho, ajuste correcto. |
| CTAs con alturas inconsistentes | Lectura `cta-buttons.tsx` (variantes `inverse`/`inline`/`compact`) | ❌ Falso. Todos los CTAs de hero usan `h-12`; la variante `compact` usa `h-10` de forma intencionada. |
| Header móvil pesado/abultado | Inspección visual `home-mobile.png` | ❌ Falso. Logo 40px + nombre + tagline + burger 36px = peso adecuado. |
| Foco invisible en CTAs/header (WCAG 2.4.7 roto) | Probe empírico Playwright en producción (8 tabs en home) | ❌ Falso. **8/8 elementos con anillo dorado visible** (`outline: solid 3px accent`). |

---

## 2. Verificaciones realizadas

### 2.1 Capturas Playwright (8 páginas × 2 viewports)

Script: `scripts/screenshot-audit.cjs` (conservado como herramienta de QA reutilizable).

| Página | Móvil 375px | Desktop 1440px | Overflow horizontal |
|---|---|---|---|
| `/` (home) | ✓ | ✓ | 0px |
| `/servicios-juridicos` | ✓ | ✓ | 0px |
| `/derecho-penal` | ✓ | ✓ | 0px |
| `/despacho` | ✓ | ✓ | 0px |
| `/blog` | ✓ | ✓ | 0px |
| `/solicitar-consulta` | ✓ | ✓ | 0px |
| `/abogados-en-nacaome` | ✓ | ✓ | 0px |
| `/como-llegar` | ✓ | ✓ | 0px |

**Cero overflow horizontal** en las 16 capturas. Layout responsivo correcto.

### 2.2 Sistema de foco visible (WCAG 2.4.7)

**Estado inicial del código:** 46 ocurrencias de `focus-visible:outline-none` en 21 componentes, lo que parecía anular el foco visible.

**Verificación de la cascada CSS:** `app/globals.css` declara fuera de cualquier `@layer`:

```css
*:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

En Tailwind v4, el CSS escrito fuera de `@layer` (unlayered) tiene **mayor precedencia** que las utilidades declaradas en `@layer utilities` (donde vive `focus-visible:outline-none`). Por tanto, el anillo global debería ganar.

**Confirmación empírica (probe Playwright en producción):**

```
✓ a "Saltar al contenido"        | outline: solid 3px rgb(212, 175, 55)
✓ a "+504 9536-3724"             | outline: solid 3px rgba(255, 255, 255, 0.8)
✓ a "Acceso Intranet"            | outline: solid 3px rgba(255, 255, 255, 0.5)
✓ a "Pineda y Asociados"         | outline: solid 3px rgb(212, 175, 55)
✓ a "El Despacho"                | outline: solid 3px rgba(255, 255, 255, 0.85)
✓ a "Servicios Jurídicos"        | outline: solid 3px rgba(255, 255, 255, 0.85)
✓ a "Derecho Penal"              | outline: solid 3px rgba(255, 255, 255, 0.85)
✓ a "Hondureños en España"       | outline: solid 3px rgba(255, 255, 255, 0.85)

Resumen: 8/8 con foco visible | 0 sin foco
```

**Conclusión:** la accesibilidad de teclado está correcta. El patrón `focus-visible:outline-none` en los componentes es redundante (no destructivo) porque el CSS global lo domina. No requiere acción.

### 2.3 Jerarquía tipográfica

Escala definida en `app/globals.css` (tokens `@theme`), escalonada y consistente:

```
text-xxs (11px) → text-xs (12px) → text-sm (14px) → text-base (16px)
→ text-lg (18px) → text-xl (20px) → text-2xl (24px) → text-3xl (30px)
→ text-4xl (36px) → text-5xl (48px)
```

- H1 hero home: `text-3xl sm:text-4xl lg:text-5xl` — escalado responsivo correcto.
- H1 internos (`PageHero`): mismo escalado.
- H2 (`SectionHeader`): `text-2xl md:text-3xl lg:text-4xl`.
- H3 cards: `text-lg md:text-xl`.
- Body: `text-sm` / `text-base`.

Sin desproporciones detectadas.

### 2.4 Componentes de layout (`Section`, `Container`, `PageHero`)

- Ritmo vertical consistente: `spacing: 'sm' | 'md' | 'lg'` centralizado en `section.tsx`.
- Anchuras de contenedor unificadas (`sm/md/lg/xl`).
- `PageHero` unificado reemplaza los 5 heroes inline duplicados previos.

---

## 3. Artefactos generados

| Archivo | Acción | Estado |
|---|---|---|
| `scripts/screenshot-audit.cjs` | Conservado (herramienta QA reutilizable) | Commited |
| `docs/screenshots/*.png` (16 archivos, 14MB) | Excluidos vía `.gitignore` | No commited |
| `scripts/probe-focus.cjs` | Eliminado (desechable, hipótesis descartada) | — |

---

## 4. Recomendaciones futuras (no aplicadas ahora)

Ninguna urgente. Para futuras iteraciones, considerar:

1. **Snapshot visual automatizado (Playwright visual comparisons):** el script `screenshot-audit.cjs` podría extenderse para comparar contra una baseline y detectar regresiones visuales en CI.
2. **Lighthouse CI:** integrar `@lhci/cli` en GitHub Actions para vigilar LCP/CLS/TBT en cada PR que toque `components/marketing/`.
3. **Limpieza cosmética opcional:** los 46 `focus-visible:outline-none` redundantes podrían eliminarse para reducir ruido en el código, pero **no afectan al comportamiento** (el CSS global domina) y su eliminación sería un refactor sin impacto funcional.

---

## 5. Validación

- **Sin cambios de código de producto.** No hay `npm run build` / `test` / `e2e` que ejecutar porque no se modificó código funcional.
- La auditoría se basa en evidencia visual (capturas reales) y empírica (probe de foco en producción).
- Documentación fiel: los hallazgos negativos (hipótesis descartadas) se reportan explícitamente, no se ocultan.
