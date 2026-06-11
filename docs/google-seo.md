# Guía paso a paso — Configurar Google APIs para el panel SEO

**Fecha**: 2026-06-11  
**URL producción**: `https://www.pinedayasociadoshn.com`  
**Panel SEO**: `https://www.pinedayasociadoshn.com/intranet/admin/seo`

---

## Tu situación actual

Las variables YA están configuradas en tu archivo `.env.local` (desarrollo local). Lo que falta es **copiarlas a Vercel** (producción).

Actualmente el panel SEO muestra esto en producción:

```
NEXT_PUBLIC_NOINDEX=false ✓
NEXT_PUBLIC_GA_ID= ✓          (G-L2PGBN3SWK)
GOOGLE_SERVICE_ACCOUNT_EMAIL= (pendiente)
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY= (pendiente)
GOOGLE_ANALYTICS_PROPERTY_ID= (pendiente)
GOOGLE_SEARCH_CONSOLE_SITE_URL= (pendiente)
INDEXNOW_KEY= (pendiente)
```

**Causa**: las variables existen en `.env.local` pero NO en Vercel. Al desplegar, el panel las lee vacías.

---

## PARTE A — Copiar variables a Vercel (5 minutos)

### A.1 Abre el panel de Vercel

```
https://vercel.com/fonsi-roiget-s-projects/calculo-de-penas-nextjs/settings/environment-variables
```

### A.2 Añade estas 8 variables, una por una

Para cada variable, selecciona los 3 entornos: **Production**, **Preview**, **Development**.

| # | Nombre | Valor |
|---|--------|-------|
| 1 | `NEXT_PUBLIC_NOINDEX` | `false` |
| 2 | `NEXT_PUBLIC_GA_ID` | `G-L2PGBN3SWK` |
| 3 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com` |
| 4 | `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | *(ver instrucciones abajo — es una clave larga)* |
| 5 | `GOOGLE_ANALYTICS_PROPERTY_ID` | `541022095` |
| 6 | `GOOGLE_SEARCH_CONSOLE_SITE_URL` | `https://www.pinedayasociadoshn.com/` |
| 7 | `INDEXNOW_KEY` | `b8155b4fba87c55382e0c94f422bbbcd` |
| 8 | `NEXT_PUBLIC_GOOGLE_VERIFICATION` | `DzWyeKuME1pSzwjCuV4vkfZH80UMwULmyiQhg2qhhUE` |

### ⚠️ Cómo pegar la `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` correctamente

La clave privada está en tu `.env.local`. Para copiarla a Vercel sin romperla:

1. Abre tu `.env.local` (está en la raíz del proyecto).
2. Busca la línea que empieza con `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=`
3. Selecciona TODO el valor DESPUÉS del signo `=` (empieza con `-----BEGIN PRIVATE KEY-----` y termina con `-----END PRIVATE KEY-----\n`)
4. Cópialo exactamente como está (incluyendo los `\n`).
5. Pégalo en el campo "Value" de Vercel.

**Ejemplo de cómo se ve en .env.local**:
```
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n
```
Pega el trozo completo desde `-----BEGIN` hasta la `\n` final.

### A.3 Redeploy

Después de añadir todas las variables, Vercel te preguntará si quieres redeployear. Di que sí. O haz clic en el botón **Redeploy** en la pestaña **Deployments**.

Tiempo estimado: 3-4 minutos.

---

## PARTE B — Dar permisos a la cuenta de servicio (si falta)

Tu cuenta de servicio actual es:
```
id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com
```

Para que GA4 y Search Console funcionen, esta cuenta necesita permisos explícitos en ambas plataformas.

### B.1 Verificar que las APIs de Google Cloud están habilitadas

```
https://console.cloud.google.com/apis/dashboard?project=pineda-asociados-forms-nuevo
```

Busca en la lista y confirma que estén **HABILITADAS**:
- **Google Analytics Data API** (`analyticsdata.googleapis.com`)
- **Search Console API** (`searchconsole.googleapis.com`)

Si no aparecen, habilítalas desde:
- https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com
- https://console.cloud.google.com/apis/library/searchconsole.googleapis.com

Asegúrate de que el proyecto seleccionado (barra superior) es `pineda-asociados-forms-nuevo`.

### B.2 Añadir la cuenta de servicio a GA4

1. Ve a https://analytics.google.com
2. Selecciona la propiedad de `pinedayasociadoshn.com`
3. Abajo a la izquierda, haz clic en **⚙️ Administración**
4. En la columna "Propiedad", busca **Acceso a la propiedad** (o "Gestión de accesos a la propiedad")
5. Arriba a la derecha, haz clic en el botón **+** (Añadir usuarios)
6. Pega el email: `id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com`
7. Selecciona el rol: **Visualizador**
8. Desmarca "Notificar a los usuarios nuevos por correo electrónico"
9. Haz clic en **Añadir**

### B.3 Añadir la cuenta de servicio a Search Console

1. Ve a https://search.google.com/search-console
2. Selecciona la propiedad `https://www.pinedayasociadoshn.com/` (selector arriba izquierda)
3. Abajo a la izquierda, haz clic en **⚙️ Ajustes**
4. Haz clic en **Usuarios y permisos**
5. Haz clic en **AÑADIR USUARIO**
6. Pega el email: `id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com`
7. Selecciona el permiso: **Propietario completo** (no "Restringido")
8. Haz clic en **AÑADIR**

---

## PARTE C — Cómo regenerar credenciales si se pierden

### C.1 Si necesitas una nueva cuenta de servicio

1. Ve a https://console.cloud.google.com/iam-admin/serviceaccounts?project=pineda-asociados-forms-nuevo
2. Haz clic en **+ CREAR CUENTA DE SERVICIO**
3. Nombre: `seo-api-v3`
4. ID: se genera solo (`seo-api-v3`)
5. Clic en **CREAR Y CONTINUAR**
6. Rol: buscar "Visor" y seleccionar **Visor** (o "Viewer")
7. Clic en **CONTINUAR** → **LISTO**
8. En la lista, haz clic en el email de la nueva cuenta
9. Pestaña **CLAVES** → **AGREGAR CLAVE** → **Crear clave nueva** → **JSON**
10. Se descarga un archivo. Ábrelo con bloc de notas.
11. Copia `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
12. Copia `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
13. **Repite los pasos B.2 y B.3** para dar permisos a la nueva cuenta

### C.2 Si necesitas un nuevo GA4 Property ID

1. Ve a https://analytics.google.com
2. **Administración** → columna "Propiedad" → **Detalles de la propiedad**
3. Copia el **ID de propiedad** (número, ej: `541022095`)
4. Actualiza `GOOGLE_ANALYTICS_PROPERTY_ID` en Vercel

### C.3 Si cambias la URL de Search Console

1. Ve a https://search.google.com/search-console
2. Mira el selector de propiedad arriba a la izquierda
3. El valor para la variable depende del tipo:

| Lo que ves en GSC | Valor para `GOOGLE_SEARCH_CONSOLE_SITE_URL` |
|-------------------|---------------------------------------------|
| `sc-domain:pinedayasociadoshn.com` | `sc-domain:pinedayasociadoshn.com` |
| `https://www.pinedayasociadoshn.com/` | `https://www.pinedayasociadoshn.com/` |

Es importante que coincida **exactamente**, incluyendo la barra final `/` en el caso de URL prefix.

### C.4 Si necesitas una nueva clave IndexNow

1. Ve a https://www.bing.com/indexnow/getstarted
2. Haz clic en **Generate** para obtener una clave nueva
3. O genera 32 caracteres hexadecimales aleatorios (ej: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`)
4. Actualiza `INDEXNOW_KEY` en Vercel

---

## PARTE D — Verificar que funciona

Después de copiar las variables a Vercel y hacer redeploy:

1. Ve a https://www.pinedayasociadoshn.com/intranet/admin/seo
2. Pestaña **Resumen SEO**: las 4 integraciones deben mostrar **"Configurado"** en verde
3. Pestaña **Acciones**: todas las recomendaciones deben mostrar ✅ (check verde)
4. Pestaña **Analytics**: carga datos y muestra métricas reales
5. Pestaña **Search Console**: carga clicks, impresiones, CTR

Si GA4 funciona pero Search Console da error "User does not have permission":
- Repite el paso B.3 (añadir cuenta de servicio a Search Console)
- Asegúrate de usar el permiso **Propietario completo**, no "Restringido"
- La cuenta de servicio puede tardar hasta 30 minutos en propagarse

---

## Resumen rápido

```
Ve a → https://vercel.com/fonsi-roiget-s-projects/calculo-de-penas-nextjs/settings/environment-variables

Copia estas 7 variables (los valores están en tu .env.local):

NEXT_PUBLIC_NOINDEX=false
NEXT_PUBLIC_GA_ID=G-L2PGBN3SWK
GOOGLE_SERVICE_ACCOUNT_EMAIL=id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=(copiar de .env.local, línea completa)
GOOGLE_ANALYTICS_PROPERTY_ID=541022095
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.pinedayasociadoshn.com/
INDEXNOW_KEY=b8155b4fba87c55382e0c94f422bbbcd

Marcar los 3 entornos: Production ✓ Preview ✓ Development ✓

Redeploy.
```
