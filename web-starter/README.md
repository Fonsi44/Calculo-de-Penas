# web-starter — Alternativa gratuita a Figma

Plantilla global **code-first** para crear muchas webs con diseños distintos sin suscripción Figma.

## Inicio rápido

```bash
cp -r web-starter/ ../mi-nueva-web/
cd ../mi-nueva-web/
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Cambiar tema visual

Edita [`lib/site.ts`](lib/site.ts):

```ts
theme: 'modern-minimal', // corporate-navy | modern-minimal | warm-legal | vibrant-startup
```

Los presets viven en [`themes/`](themes/).

## Bloques disponibles

| Componente | Uso |
|------------|-----|
| `PageHero` | Hero con h1 único por página |
| `Section` + `SectionHeader` | Secciones con variantes de fondo |
| `FeatureGrid` | Grid de 3 features |
| `CtaBlock` | Llamada a la acción |
| `FaqBlock` | Acordeón FAQ |
| `SiteHeader` / `SiteFooter` | Layout global |

## Flujo con Cursor (sin Figma)

1. Describe la página: marca, tono, secciones
2. El agente compone con bloques existentes
3. Ajusta tokens en `themes/` si hace falta
4. `npm run dev` para preview

Mockups opcionales: [Penpot](https://penpot.app) (gratis). Ver [`STACK.md`](STACK.md).

## Validación

```bash
npm run validate:all   # typecheck + tests + flow check
npm run test:e2e       # smoke Playwright (home + about)
```

## Estructura

```
web-starter/
├── app/              # Páginas (home + about de ejemplo)
├── components/
│   ├── marketing/    # Bloques composables
│   └── ui/           # Button, Card
├── themes/           # 4 presets CSS
├── lib/              # site config, cn()
├── .cursor/          # Reglas y skill para Cursor
└── tests/            # Design system tests
```

## Nuevo proyecto en ~30 min

1. Copiar starter → `npm install`
2. `lib/site.ts`: nombre, nav, theme
3. Crear `app/servicios/page.tsx` componiendo bloques
4. Ajustar 5 variables en preset CSS si la marca lo pide
5. `npm run validate:all`

No se requiere Figma.
