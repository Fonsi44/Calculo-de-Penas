# LEX HONDURAS — Protocolo obligatorio para agentes IA

Este repositorio requiere precisión, trazabilidad, verificación real y honestidad operativa. Ningún agente puede afirmar que algo está implementado, corregido, validado o completado si no lo ha comprobado mediante lectura de archivos, cambios reales y comandos de validación cuando correspondan. Las reglas son permanentes, no una tarea puntual.

## Principios obligatorios

1. No afirmar "hecho", "completado", "validado", "listo" o "todo correcto" sin pruebas reales.
2. No inventar resultados de comandos, URLs, fuentes legales, APIs, rutas, dependencias ni comportamiento del sistema.
3. Si una validación no puede ejecutarse, reportar `NO VALIDADO` con la causa exacta.
4. No ocultar errores. Si algo está mal, decirlo claramente.
5. No reescribir archivos completos si basta una corrección mínima.
6. No dejar funciones truncadas, código muerto, comentarios falsos o promesas no implementadas.
7. No cambiar arquitectura sin justificación técnica.
8. No modificar configuración de modelos, proveedores o APIs salvo instrucción explícita.
9. No asumir que una validación equivale a otra. `dry-run` ≠ validación de producción.
10. No confundir compilación correcta con funcionamiento real del sistema.

## Honestidad operativa

Distinguir entre:
- `IMPLEMENTADO`: archivo modificado realmente.
- `VALIDADO`: comandos reales ejecutados y pasaron.
- `NO VALIDADO`: no se pudo comprobar (falta Internet, dependencias, env vars, permisos, servicios externos, credenciales o comando inexistente).
- `PENDIENTE`: falta trabajo real.
- `RIESGO`: condición que puede fallar en ejecución real.

Está prohibido usar "hecho", "listo", "completado" o "validado" si no corresponde exactamente. Si una tarea está parcialmente completada, reportar porcentaje completado y restante.

## Forma de trabajo

Antes de modificar:
- Leer archivos afectados y entender el cambio mínimo necesario.
- Revisar `README.md`, `CHANGELOG.md`, `opencode.json` (proyecto Y global `~/.config/opencode/`), y archivos de reglas existentes.
- Confirmar si el cambio afecta API routes, motor de cálculo, DB schema, seed, metadata, UI de la calculadora o validación de penas.
- **Siempre revisar la configuración GLOBAL** (`~/.config/opencode/opencode.jsonc`) además de la del proyecto.

Durante la modificación:
- Cambios mínimos y controlados. No eliminar lógica funcional sin justificación.
- No crear rutas nuevas si ya existen rutas oficiales del proyecto.
- No mezclar refactors grandes con correcciones puntuales salvo instrucción explícita.
- No cambiar nombres de API routes, parámetros, schema DB o metadata sin justificación.

Después de modificar:
- Ejecutar validaciones reales. Revisar regresiones.
- Si algo falla, corregirlo o reportarlo como riesgo pendiente.
- Si se modifica comportamiento del proyecto, actualizar `README.md` o `CHANGELOG.md` si existe.

## Flujo obligatorio por cambio

Ejecutar en orden. No saltar pasos.

### 1. Lint + Build
```bash
npm run lint
npm run build
```
- `lint`: 0 errores. (Puede haber warnings; no bloqueante pero revisar.)
- `build`: `Compiled successfully` + `Finished TypeScript` sin errores.
- Si `build` falla por `EPERM` en `.next` (OneDrive lock en Windows): `Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue` y reintentar.

### 2. Tests unit + E2E
```bash
npm run test
npm run test:e2e
```
- `test` (Vitest): debe pasar todos los tests en 13 archivos.
- `test:e2e` (Playwright): debe pasar todas las pruebas E2E (suite pública sin auth).
- Si `test:e2e` falla por `EPERM` en `test-results` o `.next`: limpiar y reintentar.
- Si el webServer de Playwright no arranca por build sucia: `Remove-Item -LiteralPath .next -Recurse -Force` antes de reintentar.

### 3. Commit + Push (solo si pasos 1 y 2 pasan)
```bash
git add <archivos específicos>
git commit -m "<mensaje descriptivo en español>"
git push origin main
```
- Commits atómicos (un cambio lógico por commit). Mensaje en español, con prefijo (`feat:`, `fix:`, `docs:`, `chore:`).
- NO usar `git add .` a ciegas; revisar `git status` y `git diff --stat` antes.
- `push` solo a `main` (no hay branches de feature).

### 4. Verificar deploy de Vercel (después de push)
```bash
Start-Sleep -Seconds 30
vercel ls calculo-de-penas-nextjs
vercel inspect <url-del-nuevo-deploy>
```
- Vercel CLI autenticado. El deploy debe pasar de `Building` a `Ready` en ~30-60s.
- Verificar alias de producción: `calculo-de-penas-nextjs.vercel.app`.

## Comandos por área modificada

| Área | Comando |
|------|---------|
| Motor de cálculo (`lib/calculo.ts`, `lib/rules/v1/`, `lib/utils.ts`, `lib/catalogos.ts`) | `npm run build` + verificar API `/api/calcular` con `Invoke-RestMethod` |
| Schema DB (`lib/schema.ts`) | `npx drizzle-kit generate` |
| Dependencias, build, Vercel o estructura del proyecto | `npm run build` |
| Datos semilla (`data/*.json`) | `node -e "const d=require('./data/delitos.json'); console.log(d.length)"` + verificar sin duplicados por `(nombre, articulo)` y UTF-8 |

## Reglas específicas del proyecto

### Motor de cálculo de penas
- `lib/calculo.ts` re-exporta desde `lib/rules/v1/` (analisis, circunstancias, concurso, eximentes, grado-autoria, pena-base, tentativa, types, index). Preservar compatibilidad con API `/api/calcular`.
- `lib/utils.ts` (aumentar/reducir grado, mitad superior/inferior): cambiar una fórmula afecta TODOS los cálculos.
- `lib/catalogos.ts`: catálogos legales (agravantes Art. 32 CP, atenuantes Art. 31 CP, eximentes Art. 30 CP). Referencia: CP Honduras Decreto 130-2017.
- No cambiar reglas de compensación agravantes/atenuantes sin verificación legal expresa.
- `meses_a_texto()` debe mantener formato "X años y Y meses".

### Base de datos
- `lib/schema.ts`: 11 tablas (`ramas_juridicas`, `articulos_constitucion`, `articulos_cp`, `delitos`, `bufetes`, `usuarios`, `casos`, `calculos`, `auditoria_eventos`, `rate_limits`, `aceptaciones_legales`).
- `delitos` tiene unique constraint en `(nombre, articulo)`.
- Migraciones: `npx drizzle-kit generate` + `npx drizzle-kit push`. No modificar Neon directamente.
- Seed (`drizzle/seed.ts`) tiene guarda: si ya hay datos, no ejecuta nada.

### Datos
- `data/delitos.json`: 483 delitos validados contra CP Decreto 130-2017 y reformas (119-2019, 46-2020, 93-2021, 59-2024).
- `data/ramas_juridicas.json`: 119 registros.
- `data/articulos_constitucion.json`: 378 artículos.
- También existen: `areas-juridicas.ts`, `articulos_cp.json`, `auditoria-cruzada.json`, `correcciones-pendientes.json`, `cp-indice.json`, `delitos-estados.json`, `delitos-validacion.json/csv`, `faq.ts`, `images.ts`, `blog/`.
- Mantener UTF-8 en todos los JSON.

### UI de la calculadora
- `app/calculadora/page.tsx`: flujo de 8 pasos. No romper navegación.
- Estado vía `configs` (array de `DelitoConfig`). Preservar inmutabilidad.
- Paso 4: `eximente_completa` es `string | null`, no booleano.
- Paso 8: resultado envuelto en `ErrorBoundary`.
- La calculadora NO usa `AppShell` (UX de wizard de foco).

### API routes
- Todas en `app/api/`. Rutas: `/api/calcular`, `/api/delitos`, `/api/calculos/[id]`, `/api/casos`, `/api/seed`, `/api/health`, `/api/auth/*`, `/api/contacto`, `/api/consulta`, `/api/clasificaciones`, `/api/cp`.
- `/api/calcular` es POST y espera `CalculoRequest`. No cambiar el contrato.
- `/api/seed` verifica si hay datos antes de insertar.

### Layout y shell
- `app/layout.tsx` usa `RootShell` (sidebar desktop, drawer móvil, oculto en rutas públicas).
- `root-shell.tsx` define `PUBLIC_ROUTES` (`/login`, `/terminos`, `/privacidad`, `/_not-found`). Agregar nuevas rutas públicas ahí.
- `e2e/smoke.spec.ts` cubre solo rutas públicas (sin auth).

### Sistema de imágenes
- `next.config.ts` debe mantener `images: { unoptimized: true }`.
- `proxy.ts` debe mantener `images/` en el negative lookahead del `matcher`.
- NO reintroducir CSP `upgrade-insecure-requests`.
- Catálogo en `data/images.ts`: `SERVICES` (13), `PENAL` (7), `CORPORATE` (6). Slugs coinciden con `data/areas-juridicas.ts`.
- 31 JPG + 1 WebP en `/public/images/{services,penal,corporate,blog}/`. NO convertir a WebP/AVIF ni optimizar en build.
- `ServiceCard` usa `next/image` con `fill` + `sizes` + `object-cover`. NO migrar a `<img>` plano.
- Si un slug no existe en el mapa, usar `PlaceholderPhoto`.

### Zona horaria de Honduras (obligatoria)
- Toda fecha mostrada al usuario debe ser CST (UTC-6, `America/Tegucigalpa`).
- Usar helpers de `lib/datetime.ts` (`formatHondurasDateTime`, `formatHondurasDate`, `formatHondurasTime`, `getHondurasClock`).
- NO usar `toLocaleString`/`getHours()`/`getDay()` sin `timeZone: 'America/Tegucigalpa'`.
- Fechas técnicas internas (DB, health, rate-limit, sitemap) van en UTC/ISO.

### Acceso a intranet
- URL: `https://pinedayasociadoshn.com/intranet/dashboard`. El redirect `www` → apex lo gestiona Vercel.
- Solo se accede desde botón "Acceso Intranet" en `components/marketing/public-header.tsx`.
- Ningún otro enlace público puede apuntar a `/intranet/`.

## Comunicación con el usuario
- Responder siempre en español, claro y breve.
- No usar respuestas complacientes. Si algo está mal, decirlo.
- Distinguir entre plantilla, borrador, versión parcial, versión completa y validación real.
- No llenar con teoría innecesaria.

## Formato de respuesta final
```
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Cambios aplicados:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```

## Investigación inicial en este repositorio
Cuando se inicia una sesión, leer en orden:
1. `README*`, `package.json`, `opencode.jsonc` (proyecto)
2. Config global: `~/.config/opencode/opencode.jsonc` — puede contener MCP servers, plugins y config que afectan el comportamiento
3. `AGENTS.md` (este archivo)
4. Archivos de entrypoint y config de build/test

No asumir que la configuración del proyecto es la única que existe. Verificar también la global.

## Prohibiciones absolutas
- Inventar resultados, URLs, fuentes legales o validaciones.
- Ocultar errores. Decir "todo correcto" sin comandos reales.
- Reescribir archivos completos sin necesidad.
- Cambiar arquitectura sin justificación.
- Borrar datos de BD o semillas sin autorización explícita.
- Dejar código roto reportado como completado.
- Ignorar errores de validación.
- Mezclar tareas no solicitadas.
- Modificar configuración de modelos/proveedores sin instrucción explícita.

## Criterio de cierre
Una tarea se cierra solo si: archivos revisados → cambios aplicados → comandos ejecutados → resultados reportados → riesgos declarados → no verificable marcado como `NO VALIDADO` → sin funciones truncadas, rutas rotas ni validaciones inventadas.

## Instrucción final
La prioridad del agente es preservar integridad, trazabilidad, seguridad y verificabilidad del repositorio. La respuesta correcta no es la más complaciente, sino la más precisa y comprobable.
