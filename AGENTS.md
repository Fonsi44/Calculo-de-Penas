# LEX HONDURAS — Protocolo obligatorio para agentes IA

Este repositorio requiere precisión, trazabilidad, verificación real y honestidad operativa. Ningún agente puede afirmar que algo está implementado, corregido, validado o completado si no lo ha comprobado mediante lectura de archivos, cambios reales y comandos de validación cuando correspondan.

Este protocolo aplica a cualquier agente IA, proveedor, modelo, herramienta o modo de trabajo usado dentro del repositorio. Las reglas de este archivo son permanentes y no deben tratarse como una tarea puntual.

## Principios obligatorios

1. No afirmar "hecho", "completado", "validado", "listo" o "todo correcto" sin pruebas reales.
2. No inventar resultados de comandos.
3. No inventar URLs, fuentes legales, APIs, rutas, dependencias ni comportamiento del sistema.
4. Si no hay Internet, decirlo claramente.
5. Si una validación no puede ejecutarse, reportar `NO VALIDADO` con la causa exacta.
6. Si una fuente externa no puede verificarse, marcarla como pendiente.
7. No ocultar errores.
8. No borrar datos existentes salvo instrucción explícita.
9. No reescribir archivos completos si basta una corrección mínima.
10. No dejar funciones truncadas, código muerto, comentarios falsos o promesas no implementadas.
11. No cambiar arquitectura sin justificación técnica.
12. No modificar configuración de modelos, proveedores o APIs salvo instrucción explícita del usuario.
13. No responder de forma complaciente si el estado real del código no lo permite.
14. No asumir que una validación equivale a otra. Un `dry-run` no equivale a una validación completa de producción.
15. No confundir compilación correcta con funcionamiento real del sistema.

## Honestidad operativa obligatoria

El agente debe distinguir claramente entre:

- `IMPLEMENTADO`: el archivo fue modificado realmente.
- `VALIDADO`: se ejecutaron comandos reales y pasaron.
- `NO VALIDADO`: no se pudo comprobar por falta de Internet, dependencias, variables de entorno, permisos, servicios externos, credenciales o comando inexistente.
- `PENDIENTE`: falta trabajo real por hacer.
- `RIESGO`: existe una condición que puede fallar en ejecución real.
- `NO APLICABLE`: la validación o regla no corresponde a la tarea realizada.

Está prohibido usar "hecho", "listo", "completado", "validado" o "todo correcto" si no corresponde exactamente a uno de esos estados.

Si una tarea está parcialmente completada, el agente debe decirlo claramente y reportar porcentaje completado y porcentaje restante.

## Forma de trabajo obligatoria

Antes de modificar:

- Leer los archivos afectados.
- Localizar funciones, rutas y bloques exactos.
- Entender el cambio mínimo necesario.
- Identificar riesgos antes de tocar código.
- Revisar si existen instrucciones previas en `README.md`, `CHANGELOG.md`, documentación interna, configuración del proyecto o archivos de reglas.
- Confirmar si el cambio requiere actualizar documentación.
- Confirmar si el cambio afecta API routes, motor de cálculo, DB schema, seed, metadata, UI de la calculadora o validación de penas.

Durante la modificación:

- Aplicar cambios mínimos y controlados.
- Mantener compatibilidad con la arquitectura existente.
- No eliminar lógica funcional sin justificación.
- No introducir dependencias innecesarias.
- No crear rutas nuevas si ya existen rutas oficiales del proyecto.
- No sustituir funciones completas por código incompleto.
- No dejar código parcialmente implementado.
- No dejar comentarios que prometan comportamientos no implementados.
- No mezclar refactors grandes con correcciones puntuales salvo instrucción explícita.
- No cambiar nombres de API routes, parámetros, schema DB o metadata sin justificación.

Después de modificar:

- Ejecutar validaciones reales.
- Revisar que el cambio quedó aplicado.
- Revisar que no se introdujeron regresiones.
- Reportar resultados reales, no supuestos.
- Si algo no puede validarse, reportarlo como `NO VALIDADO`.
- Si algo falla, corregirlo o reportarlo como riesgo pendiente.
- Si se modifica comportamiento del proyecto, actualizar documentación si existe y aplica.

## Flujo obligatorio por cambio (forma actual de trabajar)

Cada vez que se modifiquen archivos del repositorio, el agente DEBE ejecutar la siguiente secuencia en orden. No saltar pasos. No reportar éxito si alguno falla.

### 1. Lint + Build (siempre)

```bash
npm run lint
npm run build
```

- `lint` debe retornar 0 errores y 0 warnings.
- `build` debe completar `Compiled successfully` y `Finished TypeScript` sin errores.
- Si `build` falla por `EPERM` en `.next` (OneDrive lock en Windows): `Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue` y reintentar.

### 2. Tests unit + E2E (siempre)

```bash
npm run test
npm run test:e2e
```

- `test` (Vitest) debe pasar 185/185 unit tests en 13 archivos.
- `test:e2e` (Playwright) debe pasar todas las pruebas E2E (suite pública sin auth).
- Si `test:e2e` falla por `EPERM` en `test-results` o `.next`: limpiar y reintentar.
- Si el webServer de Playwright no arranca por build sucia: `Remove-Item -LiteralPath .next -Recurse -Force` antes de reintentar.

### 3. Commit + Push (solo si los pasos 1 y 2 pasan)

```bash
git add <archivos específicos>
git commit -m "<mensaje descriptivo en español>"
git push origin main
```

- Hacer commits atómicos (un cambio lógico por commit).
- Mensaje en español, sin emojis, con prefijo (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- NO usar `git add .` a ciegas; revisar `git status` y `git diff --stat` antes.
- `push` solo a `main` (este proyecto no usa branches de feature).

### 4. Verificar deploy de Vercel (después de push)

```bash
Start-Sleep -Seconds 30
vercel ls calculo-de-penas-nextjs
vercel inspect <url-del-nuevo-deploy>
```

- Vercel CLI debe estar autenticado en el entorno.
- El nuevo deploy debe pasar de `Building` a `Ready` en ~30-60s.
- Verificar alias de producción: `calculo-de-penas-nextjs.vercel.app`.
- Opcionalmente, verificar el bundle de producción con `x-vercel-protection-bypass` (token guardado en `.env.example` o en notas internas).

### Resumen del flujo

```
Modificar archivos
   ↓
npm run lint && npm run build
   ↓
npm run test && npm run test:e2e
   ↓
git add + commit + push
   ↓
vercel ls + vercel inspect
   ↓
Reporte final con % completado, % restante, archivos modificados,
comandos ejecutados, resultado de cada comando, cambios aplicados,
errores corregidos, riesgos pendientes, NO VALIDADO, próximo paso.
```

## Comandos específicos por tipo de cambio

Adicionalmente al flujo obligatorio anterior, aplicar las siguientes validaciones según el área modificada:

Cuando se modifique el motor de cálculo (`lib/calculo.ts` — que re-exporta desde `lib/rules/v1/`, `lib/utils.ts`, `lib/catalogos.ts`):

```bash
npm run build
```

Verificar además que la API `/api/calcular` responde correctamente con datos de prueba vía `curl` o `Invoke-RestMethod`.

Cuando se modifique el schema de la base de datos (`lib/schema.ts`):

```bash
npx drizzle-kit generate
```

Verificar que la migración se genera sin errores. Si aplica cambios directos a Neon, ejecutar script de validación.

Cuando se modifiquen dependencias, configuración global, build, Vercel o estructura del proyecto:

```bash
npm run build
```

Cuando se modifiquen datos semilla (`data/delitos.json`, `data/ramas_juridicas.json`, `data/articulos_constitucion.json`):

```bash
node -e "const d=require('./data/delitos.json'); console.log('Total:', d.length)"
```

Verificar que no hay duplicados por `(nombre, articulo)` y que el encoding UTF-8 es correcto.

Cuando se modifiquen dependencias Node, revisar si existen:

```text
package.json
package-lock.json
```

Si un comando no existe, falla por dependencias, falla por variables de entorno, requiere Internet o no puede ejecutarse por el entorno, reportar:

```text
NO VALIDADO: causa exacta
```

No sustituir validación real por suposiciones.

## Reglas específicas del proyecto

### Motor de cálculo de penas

1. `lib/calculo.ts` re-exporta la API pública desde `lib/rules/v1/`. La lógica está modularizada en `lib/rules/v1/` (analisis, circunstancias, concurso, eximentes, grado-autoria, pena-base, tentativa, types, index). Cualquier cambio debe preservar la compatibilidad con la API (`/api/calcular`).
2. `lib/utils.ts` contiene helpers matemáticos (aumentar/reducir grado, mitad superior/inferior). Cambiar una fórmula afecta TODOS los cálculos.
3. `lib/catalogos.ts` contiene los catálogos legales (agravantes Art. 32 CP, atenuantes Art. 31 CP, eximentes Art. 30 CP, grados de autoría y ejecución, tipos de concurso). Referencia normativa: CP Honduras Decreto 130-2017.
4. No cambiar las reglas de compensación agravantes/atenuantes sin verificación legal expresa del CP hondureño.
5. `meses_a_texto()` debe mantener el formato legible actual ("X años y Y meses").

### Base de datos y esquema

1. `lib/schema.ts` define 11 tablas: `ramas_juridicas`, `articulos_constitucion`, `articulos_cp`, `delitos`, `bufetes`, `usuarios`, `casos`, `calculos`, `auditoria_eventos`, `rate_limits`, `aceptaciones_legales`.
2. `delitos` tiene unique constraint en `(nombre, articulo)`. No insertar duplicados.
3. Las migraciones se generan con `drizzle-kit generate` y se aplican con `drizzle-kit push`.
4. No modificar la BD directamente en Neon sin pasar por Drizzle migrations.
5. No borrar datos de la BD sin respaldo explícito.

### Datos semilla (data/)

1. `data/delitos.json` contiene 466 delitos del CP hondureño, validados 466/466 contra el CP Decreto 130-2017 y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024). No introducir duplicados.
2. `data/ramas_juridicas.json` contiene la taxonomía de ramas legales (119 registros).
3. `data/articulos_constitucion.json` contiene los artículos constitucionales referenciados (128 registros).
4. Mantener encoding UTF-8 correcto en todos los JSON.
5. El seed (`drizzle/seed.ts`) tiene guarda: si ya hay datos, no ejecuta nada.

### UI de la calculadora

1. `app/calculadora/page.tsx` implementa el flujo de 8 pasos. No romper la navegación entre pasos.
2. Cada paso tiene estado manejado vía `configs` (array de `DelitoConfig`). Preservar la inmutabilidad.
3. El paso 4 (circunstancias) maneja eximentes, agravantes y atenuantes. `eximente_completa` es `string | null`, no booleano.
4. El paso 8 muestra el resultado del cálculo envuelto en un `ErrorBoundary`. No renderizar fuera de él.
5. La calculadora usa layout propio (header azul distintivo + sidebar stepper desktop) y NO usa `AppShell` por UX de wizard de foco. Migrar a `AppShell` está explícitamente descartado.

### API routes

1. Todas las rutas están en `app/api/`. Vanidad de URL: `/api/calcular`, `/api/delitos`, `/api/calculos/[id]`, etc.
2. No cambiar la forma de las respuestas JSON sin actualizar el frontend.
3. La ruta `/api/calcular` es POST y espera `CalculoRequest`. No cambiar el contrato.
4. La ruta `/api/seed` verifica si hay datos antes de insertar. No forzar reseed.
5. La ruta `/api/calculos/[id]` (GET/DELETE) sirve para modificar y eliminar cálculos individuales preservando historial.

### Layout y shell

1. `app/layout.tsx` envuelve todo en `RootShell` (sidebar persistente en desktop, drawer en móvil, oculto en rutas públicas).
2. `components/layout/root-shell.tsx` define `PUBLIC_ROUTES` (`/login`, `/terminos`, `/privacidad`, `/_not-found`). Agregar nuevas rutas públicas ahí si corresponde.
3. `components/layout/app-shell.tsx` provee el header sticky + main. Usar en páginas autenticadas que no tengan layout propio.
4. `components/layout/app-sidebar.tsx` contiene el `NAV` array de rutas; mantenerlo sincronizado con el sitemap real.
5. `e2e/smoke.spec.ts` cubre solo rutas públicas (sin auth). Tests autenticados requieren suite separada (no implementada).

### Sistema de imágenes (público, sin optimizer, sin auth)

Estado fijado en commits `2ed1168` (unoptimized) y `52a9b72` (middleware). Cambios futuros deben preservar este contrato:

1. `next.config.ts` DEBE mantener `images: { unoptimized: true }`. NO re-habilitar el optimizer `/_next/image`:
   - Devuelve 400 Bad Request para imágenes corporativas (provocado `ERR_*` en consola).
   - Añade latencia significativa sin beneficio.
   - Si en el futuro se quiere optimizar: configurar `images.remotePatterns` para hosts externos y validar antes contra todas las páginas públicas.

2. `middleware.ts` DEBE mantener `images/` en el negative lookahead del `matcher` (`'/(?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.svg|images/).*)'`). Las imágenes son públicas y NO requieren auth. Si se quita, el middleware redirige `/images/*` a `/intranet/login` y las tarjetas muestran `PlaceholderPhoto` gris en producción.

3. NO reintroducir la directiva CSP `upgrade-insecure-requests`. Fue eliminada por:
   - Ser redundante con HSTS en producción (Vercel sirve HTTPS).
   - Romper `e2e/smoke.spec.ts` con `ERR_SSL_PROTOCOL_ERROR` cuando el servidor de test es HTTP.
   - Provocar 6 errores 400 en imágenes durante la suite e2e.
   Solo reintroducir si se demuestra que aporta seguridad real y se valida contra toda la suite e2e.

4. Catálogo de imágenes en `data/images.ts`:
   - `SERVICES` (13 entradas): mapa slug → `/images/services/<area>.jpg` para las 13 áreas generales.
   - `PENAL` (7 entradas): mapa slug → `/images/penal/<grupo>.jpg` para los 7 grupos de derecho penal.
   - `CORPORATE` (6 entradas): claves (`hero_home`, `hero_despacho`, `services_general`, `services_penal`, `courthouse`, `corporate_meeting`) → `/images/corporate/<clave>.jpg`.
   - Las claves coinciden con los `slug` canónicos de `data/areas-juridicas.ts` (`areasGenerales`, `hubPenal.grupos`).
   - Si un slug no existe en el mapa, `ServiceCard` debe caer a `PlaceholderPhoto` (gris con gradient) — NO renderizar `<img>` roto.

5. 26 imágenes JPG en `/public/images/{services,penal,corporate}/` (177 KB promedio, ~6.5 MB total). El usuario aceptó explícitamente NO convertirlas a WebP/AVIF ni optimizar en build. No introducir pipeline de conversión de imágenes sin instrucción explícita.

6. `ServiceCard` (`components/marketing/service-card.tsx`) usa `next/image` con `fill`, `sizes` y `className="object-cover"`. NO migrar a `<img>` plano (pierde lazy loading, aspect ratio responsive y group-hover scale). NO migrar a `AppShell` (la calculadora tampoco lo usa, UX de wizard de foco).

7. Hero de la home NO usa `<img>` propio: la card premium con CTA vive en `app/(public)/page.tsx` sin foto corporativa. Si se quiere re-introducir, usar `next/image` con `images.unoptimized=true` y validar contra `e2e/smoke.spec.ts` (test de consola limpia).

## Zona horaria de Honduras (obligatoria)

Toda fecha/hora que se muestre a la persona usuaria debe estar en zona horaria de Honduras (CST, UTC-6, sin horario de verano). El servidor (Vercel) corre en UTC y los navegadores visitantes pueden estar en cualquier zona, por lo que **confiar en `new Date().toLocaleString()` produce horas incorrectas**.

Reglas:

1. **Helper central en `lib/datetime.ts`**:
   - `HONDURAS_TZ = 'America/Tegucigalpa'` (constante IANA, no string libre).
   - `formatHondurasDateTime(d, opts)`, `formatHondurasDate(d, opts)`, `formatHondurasTime(d, opts)`: locale `es-HN` + `timeZone: HONDURAS_TZ` por defecto.
   - `getHondurasClock(d)`: devuelve `{ hour, minute, dayOfWeek, minutesOfDay }` calculado con `Intl.DateTimeFormat.formatToParts` para evitar derivas por DST del navegador.
2. **NO usar `toLocaleDateString` / `toLocaleTimeString` / `toLocaleString` sin `timeZone: 'America/Tegucigalpa'`** en código de UI, calculadora, dashboard, blog, PDF o email. Si se necesita formatear, importar de `lib/datetime.ts`.
3. **NO usar `new Date().getHours()` / `getDay()` / `getMinutes()`** para lógica de horario (abierto/cerrado, saludo según hora). Usar `getHondurasClock(new Date())` en su lugar.
4. **Fechas internas y técnicas** (sitemap `lastmod`, RSS `lastBuildDate`, `api/health` `timestamp`, `Date.now()` en rate-limit/cache, timestamps de DB) se mantienen en UTC/ISO. Solo se traducen a Honduras al presentarlas.
5. **Email de contacto**: incluir dos versiones de la fecha — `Fecha (Honduras)` formateada con `formatHondurasDateTime` y `ISO: ...toISOString()` para auditoría técnica.
6. **Tests**: si un test verifica una fecha formateada, no assertar el texto literal (depende de la TZ del runner). Assertar solo el contenido legal estable (ej. `toContain('Código Penal de Honduras')`).
7. Si en el futuro se quiere soportar otra zona horaria (sede en Madrid, por ejemplo), no añadir un parámetro `tz` en cada llamada: refactorizar a un contexto de usuario y leer de ahí.

## Reglas para documentación

Si el cambio afecta comportamiento, comandos, configuración, API, semillas o flujo de ejecución, actualizar documentación si existe:

- `README.md`
- `CHANGELOG.md`
- documentación interna relevante

No crear documentación innecesaria si el proyecto no la usa, salvo instrucción explícita.

Cuando se actualice documentación, indicar claramente qué se actualizó.

## Reglas específicas de acceso a la intranet

1. La URL de la intranet es `https://pinedayasociadoshn.com/intranet/dashboard` (apex). El redirect `www` → apex lo gestiona Vercel a nivel de dominio; no añadirlo al middleware (causa bucles).
2. Solo se accede a la intranet desde el botón "Acceso Intranet" situado en la barra superior del encabezado de la web pública (`components/marketing/public-header.tsx`).
3. Ninguna página, subpágina, componente, sección, enlace del footer, enlace del drawer móvil, breadcrumb, CTA, tarjeta de servicio, artículo de blog o cualquier otro elemento de la web pública puede contener un enlace (`href`) que apunte directa o indirectamente a cualquier ruta bajo `/intranet/`.
4. Las únicas excepciones permitidas son:
   - El botón "Acceso Intranet" en el header (`components/marketing/public-header.tsx`, apunta a `/intranet/dashboard`).
   - Los componentes internos de la intranet (`components/layout/user-actions.tsx`, `components/layout/app-sidebar.tsx`) que se renderizan solo dentro de rutas `/intranet/*` y no son accesibles desde páginas públicas.
5. Cualquier modificación que introduzca nuevos enlaces a `/intranet/` en componentes o páginas públicas será rechazada automáticamente.

## Reglas de comunicación con el usuario

- Responder siempre en español.
- Ser claro, breve y directo.
- No usar respuestas complacientes.
- No decir "sí" automáticamente.
- Si algo está mal, decirlo claramente.
- Si algo no se pudo validar, decirlo claramente.
- No usar emojis salvo que el usuario los use primero.
- Si una tarea tiene múltiples pasos, enumerarlos y marcar completado, pendiente o no validado.
- Si algo no puede hacerse, explicar por qué y ofrecer alternativa si existe.
- No llenar la respuesta con teoría innecesaria.
- No prometer entregables que no se puedan cumplir.
- Distinguir entre plantilla, borrador, versión parcial, versión completa y validación real.

## Formato final obligatorio

Toda respuesta final del agente debe incluir exactamente:

```text
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

Si no se modificaron archivos, indicar:

```text
Archivos modificados: ninguno
```

Si no se ejecutaron comandos, indicar:

```text
Comandos ejecutados: ninguno
NO VALIDADO: no se ejecutaron comandos; causa exacta
```

## Prohibiciones absolutas

- Inventar resultados.
- Inventar URLs.
- Inventar fuentes legales.
- Inventar validaciones.
- Ocultar errores.
- Decir "todo correcto" sin comandos reales.
- Decir "implementado" sin haber modificado o revisado archivos.
- Decir "validado" sin ejecutar comandos.
- Reescribir archivos completos sin necesidad.
- Cambiar arquitectura sin justificación.
- Borrar datos de la BD o semillas sin autorización explícita.
- Repetir instrucciones sin aplicar cambios.
- Sustituir funciones funcionales por código incompleto.
- Dejar código roto pero reportarlo como completado.
- Ignorar errores de validación.
- Confundir `npm run build` exitoso con funcionamiento real del sistema.
- Mezclar tareas no solicitadas.
- Añadir funcionalidades no pedidas.
- Modificar configuración de modelos o proveedores sin instrucción explícita.

## Criterio de cierre

Una tarea solo puede considerarse cerrada si:

1. Los archivos afectados fueron revisados.
2. Los cambios fueron aplicados.
3. Los comandos mínimos relevantes fueron ejecutados.
4. Los resultados fueron reportados.
5. Los riesgos pendientes fueron declarados.
6. Lo no verificable fue marcado como `NO VALIDADO`.
7. No quedan funciones truncadas, rutas rotas, datos duplicados ni validaciones inventadas.

## Criterio de respuesta ante incertidumbre

Si el agente no está seguro:

1. No debe inventar.
2. Debe inspeccionar archivos si tiene acceso.
3. Debe ejecutar comandos si corresponde.
4. Si no puede comprobarlo, debe marcar `NO VALIDADO`.
5. Debe proponer el siguiente paso mínimo verificable.

## Instrucción final permanente

La prioridad del agente es preservar integridad, trazabilidad, seguridad y verificabilidad del repositorio. La respuesta correcta no es la más complaciente, sino la más precisa y comprobable.
