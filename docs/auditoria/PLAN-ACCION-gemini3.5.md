# PLAN DE ACCIÓN DE CORRECCIÓN
**Repositorio:** Justicia Verdadera (Pineda y Asociados)  
**Fecha:** 12 de Julio de 2026  
**Auditor Principal:** Especialista DevSecOps y Arquitecto de Software (Gemini 3.5)  

---

## 1. Fase 1: Correcciones de Seguridad Críticas (Inmediatas - Prioridad Alta)

### Tarea 1.1: Habilitación del Middleware de Seguridad en Next.js
*   **Problema a resolver:** GEMINI35-SEC-01 (Ausencia del archivo `middleware.ts`).
*   **Acción:**
    1. Crear el archivo `middleware.ts` en la raíz del proyecto.
    2. Importar la lógica de redirección y seguridad definida en `proxy.ts`.
    3. Exportar el matcher de rutas para evitar procesar recursos estáticos y assets de Next.js.
*   **Impacto de la corrección:** Protege todas las páginas de la intranet (`/intranet/*`) y las llamadas API desde el lado del servidor, previniendo la fuga de layouts o interfaces antes de la ejecución de JavaScript en el navegador del cliente.

### Tarea 1.2: Rotación de Secretos y Remoción de `.env`
*   **Problema a resolver:** GEMINI35-SEC-02 (Exposición de secretos en `.env`).
*   **Acción:**
    1. Revocar y regenerar las contraseñas de Neon PostgreSQL.
    2. Revocar y regenerar los tokens de API de Vercel (`VERCEL_TOKEN`).
    3. Revocar y regenerar el Token de Acceso Personal de GitHub (PAT).
    4. Revocar y regenerar la API key de Clouding.io y la clave SSH pública expuesta.
    5. Eliminar físicamente el archivo `.env` de la raíz del proyecto local para evitar su sincronización accidental en la nube (OneDrive).
    6. Asegurar que las variables de desarrollo locales se definan estrictamente en `.env.local` (el cual está correctamente configurado en `.gitignore`).

### Tarea 1.3: Endurecimiento de Seguridad en Vista Previa (Bypass de Firma y XSS)
*   **Problema a resolver:** GEMINI35-SEC-03 (Fallback inseguro JWT) y GEMINI35-SEC-04 (XSS en preview).
*   **Acción:**
    1. Modificar `app/(public)/preview/[token]/page.tsx` y `app/api/admin/preview/route.ts` para eliminar el fallback de firma JWT de desarrollo (`dev-only-secret-...`). La aplicación debe arrojar una excepción y abortar si `process.env.JWT_SECRET` no está definido.
    2. Importar `sanitize-html` en `app/(public)/preview/[token]/page.tsx`.
    3. Pasar el HTML del cuerpo del post (`payload.body`) por la función de sanitización antes de inyectarlo en el DOM usando `dangerouslySetInnerHTML`.

---

## 2. Fase 2: Correcciones de Calidad y Consistencia de Datos (Prioridad Media)

### Tarea 2.1: Saneamiento del Catálogo de Delitos
*   **Problema a resolver:** GEMINI35-DATA-05 (Delitos con penas nulas y sin clasificar).
*   **Acción:**
    1. Analizar los 25 delitos críticos con error `PRISION_SIN_VALOR` listados en `data/auditoria-delitos-report.json`.
    2. Introducir los rangos correctos de pena de prisión mínima y máxima (en meses) basados en el Código Penal de Honduras en `data/delitos.json`.
    3. Rellenar las propiedades vacías de `rama_id` y `clasificacion` de los delitos en el JSON.
    4. Ejecutar `npm run audit:delitos` para certificar que el número de problemas críticos sea 0.

### Tarea 2.2: Sincronización del Proveedor de Embeddings RAG
*   **Problema a resolver:** GEMINI35-ARCH-06 (Inconsistencia de embeddings).
*   **Acción:**
    1. Ajustar el archivo `lib/rag/config.ts` para que el proveedor por defecto y el modelo por defecto sean `deepseek` y `deepseek-embedding`, respectivamente.
    2. Sincronizar el archivo `.env.local` configurando `EMBEDDINGS_PROVEEDOR=deepseek` y `EMBEDDINGS_MODELO=deepseek-embedding` para asegurar consistencia en la generación e indexación vectorial de los Códigos y el blog.

---

## 3. Fase 3: Mejoras de Rendimiento y Deuda Técnica (Mediano Plazo - Prioridad Baja)

### Tarea 3.1: Optimización del Rate Limiting
*   **Problema a resolver:** GEMINI35-PERF-08 (Escritura masiva en Postgres por rate limits).
*   **Acción:**
    1. Configurar la integración con Upstash Redis para el almacenamiento efímero y en memoria de los límites de peticiones.
    2. Alternativamente, definir reglas de limitación de tasa (rate limiting) a nivel de infraestructura en el proxy de Cloudflare o en las reglas de Firewall del CDN de Vercel.

### Tarea 3.2: Limpieza de Dependencias y Archivos Duplicados
*   **Problema a resolver:** GEMINI35-QUAL-09 (Duplicados en .gitignore) y MCP dependencies expuestas.
*   **Acción:**
    1. Eliminar la sección duplicada de reglas de exclusión en `.gitignore` (de la línea 158 a la 348).
    2. Mover las dependencias de MCP (`@modelcontextprotocol/server-filesystem`, `@modelcontextprotocol/server-github`, `@modelcontextprotocol/server-postgres`) a la sección `devDependencies` del `package.json` si no son requeridas activamente por la API pública en el runtime de producción.
