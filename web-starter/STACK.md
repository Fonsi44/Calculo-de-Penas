# Stack de diseño — alternativa gratuita a Figma

## Decisión confirmada

| Capa | Herramienta | Coste | Rol |
|------|-------------|-------|-----|
| **Fuente de verdad** | Código (Tailwind v4 + tokens CSS) | $0 | Diseño final = código |
| **Componentes** | shadcn-style en `components/ui/` | $0 | Botones, cards, inputs |
| **Bloques** | `components/marketing/` | $0 | Hero, Section, CTA, FAQ, Footer |
| **Variantes visuales** | Presets en `themes/` | $0 | Cambiar look por proyecto |
| **Mockups opcionales** | [Penpot](https://penpot.app) | $0 | Solo exploración, no fuente de verdad |
| **Wireframes rápidos** | [Excalidraw](https://excalidraw.com) | $0 | Bocetos de 5 minutos |
| **Preview + validación** | Next.js dev + Playwright | $0 | Feedback visual real |
| **IA design-to-code** | Cursor Agent + reglas en `.cursor/` | Incluido en Cursor | Sin plugin Figma |

## Explícitamente NO usamos

- **Figma de pago** — innecesario para webs code-first
- **Figma MCP de Cursor** — no activar; el código es la especificación
- **Clon self-hosted de Figma** — coste >> suscripción

## Flujo de trabajo

1. Copiar `web-starter/` a un nuevo proyecto
2. Elegir preset en `lib/site.ts` → `theme: 'corporate-navy' | 'modern-minimal' | ...`
3. Componer páginas con bloques existentes
4. Ajustar 5–8 variables CSS si hace falta personalizar la marca
5. `npm run dev` → preview inmediato
6. (Opcional) Boceto en Penpot antes del paso 3 — descartar al implementar

## Cuándo usar Penpot

- Cliente pide ver mockups antes de codear
- Explorar 2–3 direcciones visuales rápidas
- Compartir con alguien que no lee código

Penpot **no** sustituye este starter; es complemento opcional de exploración.
