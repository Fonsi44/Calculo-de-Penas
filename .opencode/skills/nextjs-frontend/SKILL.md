---
name: nextjs-frontend
description: Frontend Next.js del proyecto — App Router, React 19, Tailwind 4, hidratación, accesibilidad, estados de carga/error y sistema visual canónico (tokens R16). Usar para implementar o corregir UI. No usar para SEO (ver seo-geo-jsonld) ni backend (backend-api-security).
---

# Frontend Next.js — Pineda y Asociados

Stack verificado en `package.json`: Next.js 16 App Router, React 19, Tailwind 4.

## Convenciones

- Rutas públicas bajo `app/(public)/`; privadas bajo `app/intranet/` y `app/admin/`.
- Server/Client Components: minimizar "use client"; datos en server components.
- Design tokens canónicos (R16): radius `rounded-lg`, sombras `.btn-shadow-*`,
  icono `w-11 h-11`, dorado solo acento.
- Un solo `<h1>` por página de post (R15); disclaimer en `<LegalDisclaimer>` (R14).
- Analítica solo vía `components/analytics-scripts.tsx`; no duplicar etiquetas.

## Procedimiento

1. Leer componentes vecinos como referencia de estilo.
2. Implementar con tokens existentes; sin rediseñar la web pública (R5).
3. Cubrir estados loading/error/empty y accesibilidad (teclado, foco, contraste).
4. Verificar hidratación sin errores en consola.

## Validaciones

- `npm run lint` + `npx tsc --noEmit` + pruebas del módulo.
- Revisar a11y con la suite del proyecto si aplica (`a11y:public-contract`).

## Anti-patrones

- Rediseño visual no autorizado de `app/(public)/**`.
- Mocks como solución final (R3).
- Enviar PII, consultas legales o identificadores a analítica.

## Detenerse y pedir intervención

- Cambio visual que altere el sistema de diseño canónico sin autorización.
