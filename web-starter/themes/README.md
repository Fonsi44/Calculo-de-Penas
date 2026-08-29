# Presets de tema

Cada preset sobrescribe variables CSS bajo `[data-theme='nombre']`.

| Preset | Personalidad | Primary | Accent |
|--------|--------------|---------|--------|
| `corporate-navy` | Corporativo premium | Navy #0F1D3A | Gold #D4AF37 |
| `modern-minimal` | Minimal frío | Gray #111827 | Blue #2563EB |
| `warm-legal` | Cálido profesional | Brown #2C2417 | Copper #B87333 |
| `vibrant-startup` | Startup moderna | Purple #1E1033 | Orange #F97316 |

## Activar un preset

En `lib/site.ts`:

```ts
theme: 'warm-legal',
```

El atributo `data-theme` se aplica en `app/layout.tsx`.

## Personalizar una marca

1. Duplica el preset más cercano como `themes/mi-marca.css`
2. Ajusta 5–8 variables (`--color-primary`, `--color-accent`, etc.)
3. Importa en `app/globals.css`
4. Añade el id a `THEME_PRESETS` en `lib/site.ts`

No hardcodees colores en componentes; usa tokens semánticos (`text-primary`, `bg-accent`, etc.).
