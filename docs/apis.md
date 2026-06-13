# Guía de configuración — Google APIs para SEO

Este documento explica paso a paso cómo obtener cada variable de entorno necesaria para que el panel SEO (`/intranet/admin/seo`) funcione con datos reales de Google Analytics 4 y Google Search Console.

---

## Resumen de variables necesarias

| Variable | Dónde obtenerla | Formato |
|----------|----------------|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud Console → Cuentas de servicio | `nombre@proyecto.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google Cloud Console → Clave JSON de la cuenta de servicio | `-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n` |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | GA4 → Administración → Configuración de la propiedad | Número (ej. `123456789`) |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Search Console → Ajustes → Propiedad | `sc-domain:pinedayasociadoshn.com` o `https://www.pinedayasociadoshn.com/` |
| `NEXT_PUBLIC_GA_ID` | GA4 → Administración → Flujos de datos → ID de medición | `G-XXXXXXXXXX` |

---

## Paso 1 — Crear cuenta de servicio en Google Cloud Console

La cuenta de servicio es necesaria para que el backend (servidor) pueda consultar las APIs de Google Analytics Data y Search Console. **No se expone al frontend**.

### 1.1 Ir a Google Cloud Console

```
https://console.cloud.google.com
```

### 1.2 Crear proyecto (o usar uno existente)

1. En la barra superior, haz clic en el selector de proyecto (junto al logo de Google Cloud).
2. Clic en **NUEVO PROYECTO**.
3. Nombre: `pineda-y-asociados` (o el que prefieras).
4. Clic en **CREAR**.
5. Espera a que se cree y selecciónalo en el selector de proyectos.

### 1.3 Activar las APIs necesarias

Ve a **APIs y servicios** → **Biblioteca**:

```
https://console.cloud.google.com/apis/library
```

Busca y **ACTIVA** estas dos APIs (una por una):

1. **Google Analytics Data API**
   - URL directa: https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com
   - Busca "Google Analytics Data API" → clic → **HABILITAR**

2. **Search Console API**
   - URL directa: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   - Busca "Google Search Console API" → clic → **HABILITAR**

Verifica que ambas aparezcan como "Habilitada" en:
```
https://console.cloud.google.com/apis/dashboard
```

### 1.4 Crear la cuenta de servicio

1. Ve a **IAM y administración** → **Cuentas de servicio**:
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts
   ```

2. Clic en **CREAR CUENTA DE SERVICIO**.

3. Rellena:
   - **Nombre de la cuenta de servicio**: `seo-api` (o el que prefieras)
   - **ID de la cuenta de servicio**: se genera automáticamente (ej. `seo-api@pineda-y-asociados.iam.gserviceaccount.com`)
   - **Descripción**: `Acceso a GA4 y Search Console desde el panel SEO`

4. Clic en **CREAR Y CONTINUAR**.

5. En "Seleccionar un rol", busca y añade:
   - **Visor de Analytics** (`roles/analytics.viewer`) — o simplemente omite los roles aquí, los asignaremos directamente en GA4 y Search Console.

6. Clic en **CONTINUAR** → **LISTO**.

### 1.5 Generar la clave JSON

1. En la lista de cuentas de servicio, haz clic en el email de la que acabas de crear.

2. Ve a la pestaña **CLAVES**.

3. Clic en **AGREGAR CLAVE** → **Crear clave nueva**.

4. Selecciona **JSON** y clic en **CREAR**.

5. Se descargará un archivo `.json`. Ábrelo con un editor de texto. Contendrá algo como:

```json
{
  "type": "service_account",
  "project_id": "pineda-y-asociados",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n",
  "client_email": "seo-api@pineda-y-asociados.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

6. Extrae los dos valores que necesitas:

| Campo del JSON | Variable de entorno |
|---------------|-------------------|
| `client_email` | `GOOGLE_SERVICE_ACCOUNT_EMAIL` |
| `private_key` | `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` |

7. En tu `.env.local`, añade:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=seo-api@pineda-y-asociados.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
```

> **CRÍTICO**: La `private_key` debe conservar los `\n` literales (no los reemplaces por saltos de línea reales). La app los convierte automáticamente en `lib/google.ts:15` con `key.replace(/\\n/g, '\n')`.
>
> Si usas Vercel, pega el valor tal cual viene en el JSON (con `\n`). Vercel los preserva correctamente.

---

## Paso 2 — Dar acceso a la cuenta de servicio en Google Analytics 4

### 2.1 Obtener GOOGLE_ANALYTICS_PROPERTY_ID

1. Ve a Google Analytics:
   ```
   https://analytics.google.com
   ```

2. Selecciona la propiedad de `pinedayasociadoshn.com`.

3. Ve a **Administración** (icono de engranaje abajo a la izquierda).

4. En la columna "Propiedad", busca **Configuración de la propiedad** → **Detalles de la propiedad**.

5. Copia el **ID de propiedad** (es un número, ej. `123456789`).

   URL directa:
   ```
   https://analytics.google.com/analytics/web/#/pXXXXXXXXXX/admin/property/settings
   ```
   (reemplaza `XXXXXXXXXX` por el ID de tu propiedad si lo conoces)

6. En tu `.env.local`:

```env
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
```

### 2.2 Dar acceso a la cuenta de servicio en GA4

1. En la misma pantalla de **Administración**, columna "Propiedad", busca **Usuarios de la propiedad**:
   ```
   https://analytics.google.com/analytics/web/#/pXXXXXXXXXX/admin/property/access-management
   ```

2. Clic en el botón **+** (arriba a la derecha) → **Añadir usuarios**.

3. En "Direcciones de correo electrónico", pega el `client_email` de la cuenta de servicio:
   ```
   seo-api@pineda-y-asociados.iam.gserviceaccount.com
   ```

4. En "Roles de la propiedad", marca **Visualizador** (es suficiente para leer métricas).

5. **Desmarca** "Notificar a los usuarios nuevos por correo electrónico" (las cuentas de servicio no reciben email).

6. Clic en **Añadir**.

7. Verifica que aparece en la lista de usuarios con rol "Visualizador".

### 2.3 Obtener NEXT_PUBLIC_GA_ID (GA4 Frontend)

Este es el ID de medición para el tracking frontend (script gtag). Es diferente del Property ID.

1. En GA4 → **Administración** → columna "Propiedad" → **Flujos de datos**:
   ```
   https://analytics.google.com/analytics/web/#/pXXXXXXXXXX/admin/data-streams
   ```

2. Haz clic en el flujo de datos de tu web (`pinedayasociadoshn.com`).

3. Copia el **ID de medición** (formato `G-XXXXXXXXXX`).

4. En tu `.env.local`:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Paso 3 — Dar acceso a la cuenta de servicio en Google Search Console

### 3.1 Verificar que la propiedad existe

1. Ve a Google Search Console:
   ```
   https://search.google.com/search-console
   ```

2. En el selector de propiedades (arriba a la izquierda), verifica que `pinedayasociadoshn.com` aparece. Si no, añádela como propiedad nueva.

### 3.2 Identificar el formato de GOOGLE_SEARCH_CONSOLE_SITE_URL

En Search Console, la propiedad puede estar registrada de dos formas. Identifica cuál usas:

**Opción A — Domain property (recomendada)**:
- Cubre todos los subdominios (`www.`, sin `www.`, etc.) y protocolos (HTTP/HTTPS).
- Formato: `sc-domain:pinedayasociadoshn.com`
- URL en Search Console: https://search.google.com/search-console?resource_id=sc-domain:pinedayasociadoshn.com

**Opción B — URL prefix property**:
- Solo cubre la URL exacta y protocolo especificados.
- Formato: `https://www.pinedayasociadoshn.com/`

Para saber cuál tienes:
1. Ve a Search Console → selector de propiedades arriba a la izquierda.
2. Si ves `sc-domain:pinedayasociadoshn.com` → usa la Opción A.
3. Si ves `https://www.pinedayasociadoshn.com/` → usa la Opción B.

En tu `.env.local`:

```env
# Opción A (domain property):
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:pinedayasociadoshn.com

# Opción B (URL prefix property):
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.pinedayasociadoshn.com/
```

### 3.3 Dar acceso a la cuenta de servicio en Search Console

1. Ve a Search Console:
   ```
   https://search.google.com/search-console
   ```

2. Selecciona la propiedad `pinedayasociadoshn.com`.

3. Ve a **Ajustes** (icono de engranaje abajo a la izquierda):
   ```
   https://search.google.com/search-console/settings
   ```

4. Clic en **Usuarios y permisos**.

5. Clic en **AÑADIR USUARIO**.

6. En "Dirección de correo electrónico", pega el `client_email`:
   ```
   seo-api@pineda-y-asociados.iam.gserviceaccount.com
   ```

7. En "Permiso", selecciona **Propietario completo** (la URL Inspection API requiere este nivel).

8. Clic en **AÑADIR**.

9. Verifica que aparece en la lista con permiso "Propietario completo".

---

## Paso 4 — IndexNow (Bing, Yandex, Seznam)

### 4.1 Generar clave IndexNow

1. Ve a Bing Webmaster Tools:
   ```
   https://www.bing.com/indexnow/getstarted
   ```

2. Haz clic en **Generate** para obtener una clave nueva (formato: 32 caracteres hexadecimales sin guiones).

3. O genera una manualmente (ejemplo: `bbbbda6cdb1e4e2cbe8f6f81c1886f58`).

### 4.2 Configurar en .env.local

```env
INDEXNOW_KEY=bbbbda6cdb1e4e2cbe8f6f81c1886f58
```

Esta clave se sirve automáticamente en `https://www.pinedayasociadoshn.com/api/indexnow-key` y se usa en el script postbuild para notificar URLs nuevas.

---

## Paso 5 — Resumen final de .env.local

Después de completar todos los pasos, tu `.env.local` debe contener:

```env
# =============================================================================
# NOINDEX — Control de indexación
# =============================================================================
# false en producción para permitir indexación
NEXT_PUBLIC_NOINDEX=false

# =============================================================================
# GA4 Frontend — Tracking público (script gtag)
# =============================================================================
# Obtenlo en: GA4 → Administración → Flujos de datos → ID de medición
# Formato: G-XXXXXXXXXX
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# =============================================================================
# Google Cloud — Cuenta de servicio (compartida por GA4 y Search Console)
# =============================================================================
# Obtenlo en: Google Cloud Console → IAM → Cuentas de servicio → claves JSON
# Formato: nombre@proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=seo-api@pineda-y-asociados.iam.gserviceaccount.com
# Formato: -----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
# IMPORTANTE: Conservar los \n literales, no reemplazarlos por saltos de línea
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"

# =============================================================================
# GA4 Data API — Métricas backend
# =============================================================================
# Obtenlo en: GA4 → Administración → Configuración de la propiedad → ID de propiedad
# Formato: número (ej. 123456789)
GOOGLE_ANALYTICS_PROPERTY_ID=123456789

# =============================================================================
# Search Console API — Datos SEO backend
# =============================================================================
# Obtenlo en: Search Console → selector de propiedades (arriba izquierda)
# Formato A (domain property): sc-domain:pinedayasociadoshn.com
# Formato B (URL prefix):       https://www.pinedayasociadoshn.com/
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:pinedayasociadoshn.com

# =============================================================================
# IndexNow — Notificación a buscadores
# =============================================================================
# Obtenlo en: https://www.bing.com/indexnow/getstarted
# Formato: 32 caracteres hexadecimales sin guiones
INDEXNOW_KEY=bbbbda6cdb1e4e2cbe8f6f81c1886f58
```

---

## Paso 6 — Verificar que todo funciona

### 6.1 En local

```bash
npm run build
npm run dev
```

Ve a `http://localhost:3000/intranet/admin/seo` (necesitas estar autenticado como admin).

- Pestaña **Resumen**: las 4 integraciones deberían mostrar "Configurado" en verde.
- Pestaña **Analytics**: carga los datos y muestra métricas reales.
- Pestaña **Search Console**: carga datos de clicks, impresiones, CTR, posición.
- Pestaña **Indexación**: puedes inspeccionar URLs.
- Pestaña **Acciones**: todas las recomendaciones resueltas muestran check verde.

### 6.2 En Vercel (producción)

1. Ve a tu proyecto en Vercel:
   ```
   https://vercel.com/tu-equipo/calculo-de-penas-nextjs
   ```

2. Ve a **Settings** → **Environment Variables**.

3. Añade todas las variables listadas arriba. Asegúrate de que:
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` conserva los `\n` (Vercel los maneja correctamente).
   - `NEXT_PUBLIC_*` están marcadas para todos los entornos (Production, Preview, Development).
   - Las variables sin `NEXT_PUBLIC_` solo para Production.

4. Redeploy.

---

## Solución de problemas

### Error: "invalid_grant" o "invalid private key"

La clave privada no se está interpretando correctamente. Verifica:
- Que los `\n` son literales (barra invertida + n), no saltos de línea reales.
- Que la clave está entre comillas en `.env.local` (para preservar los `\n`).
- En Vercel, pega el valor tal cual (con `\n`), sin comillas adicionales.

### Error: "User does not have access to property"

La cuenta de servicio no tiene permisos en GA4 o Search Console:
- Revisa el paso 2.2 (GA4 → Usuarios de la propiedad → Visualizador).
- Revisa el paso 3.3 (Search Console → Usuarios y permisos → Propietario completo).

### Error: "property not found" en Search Console

- Verifica que `GOOGLE_SEARCH_CONSOLE_SITE_URL` coincide EXACTAMENTE con el valor en Search Console.
- Si es `sc-domain:pinedayasociadoshn.com`, debe ser exactamente ese string (sin `/` final, sin `https://`).
- Si es URL prefix, debe incluir el protocolo y la barra final: `https://www.pinedayasociadoshn.com/`.

### Error: "quota exceeded" o "rate limit"

Las APIs de Google tienen límites:
- GA4 Data API: 200,000 peticiones/día (límite generoso, no deberías alcanzarlo).
- Search Console API: 2,000 consultas/día por propiedad.
- URL Inspection API: 2,000 peticiones/día por propiedad.

Si alcanzas el límite, espera hasta el día siguiente o solicita un aumento en Google Cloud Console.

### El panel SEO carga pero muestra "Sin configurar"

Revisa que las variables están definidas en el entorno correcto:
- En local: `.env.local` (NO las pongas en `.env` a secas).
- En Vercel: Settings → Environment Variables → Production.
- Reinicia el servidor de desarrollo después de cambiar `.env.local` (`Ctrl+C` y `npm run dev` otra vez).

---

## URLs de referencia rápida

| Recurso | URL |
|---------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| APIs Library (activar APIs) | https://console.cloud.google.com/apis/library |
| API Dashboard (ver APIs activas) | https://console.cloud.google.com/apis/dashboard |
| Cuentas de servicio | https://console.cloud.google.com/iam-admin/serviceaccounts |
| Google Analytics 4 | https://analytics.google.com |
| GA4 → Administración | https://analytics.google.com/analytics/web/#/admin |
| GA4 → Flujos de datos | https://analytics.google.com/analytics/web/#/admin/data-streams |
| Google Search Console | https://search.google.com/search-console |
| GSC → Ajustes → Usuarios | https://search.google.com/search-console/settings |
| Bing IndexNow | https://www.bing.com/indexnow/getstarted |
| Bing Webmaster Tools | https://www.bing.com/webmasters |
| Vercel Dashboard | https://vercel.com/dashboard |
