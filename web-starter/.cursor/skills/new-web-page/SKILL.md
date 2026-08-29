---
name: new-web-page
description: Crear una página web nueva componiendo bloques del starter sin Figma. Usar cuando el usuario pida una landing, página de servicios, about, contacto, etc.
---

# Nueva página web (code-first)

## Cuándo usar

- Usuario pide crear una página/landing/sección nueva
- Usuario quiere variante visual sin pagar Figma

## Pasos

1. Leer `lib/site.ts` para tema y nav activos
2. Crear `app/<ruta>/page.tsx`
3. Componer en este orden:
   - `PageHero` (único h1)
   - 1–3 bloques `Section` con contenido
   - `CtaBlock` al cierre
   - `FaqBlock` si aplica
4. Reutilizar `Card`, `ButtonLink` — no inventar componentes duplicados
5. Si el look no encaja: cambiar preset en `lib/site.ts`, no hardcodear colores

## Prompt template para el usuario

```
Crea app/[ruta]/page.tsx para [marca/servicio].
Tema: [preset]. Secciones: hero, [lista], CTA, FAQ opcional.
Tono: [profesional/cálido/moderno].
Usa bloques de components/marketing/. Un solo h1.
```

## No hacer

- No activar Figma MCP
- No rediseñar componentes base sin pedirlo
- No añadir librerías UI nuevas

## Validar

```bash
npm run validate:all
```
