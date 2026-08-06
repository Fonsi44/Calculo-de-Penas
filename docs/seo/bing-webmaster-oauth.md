---
status: current
owner: seo
created: 2026-07-03
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Bing Webmaster Tools — Acceso OAuth seguro

## Flujo para el propietario (2 pasos)

### Paso 1 — Configuración inicial (una sola vez)

Registrar una app en Azure AD para habilitar OAuth:

1. Ve a https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. "New registration":
   - **Name:** `Bing WMT Agent`
   - **Supported account types:** "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI:** no necesaria (usamos Device Code Flow)
3. Click "Register"
4. Copia el **Application (client) ID**
5. Ve a **Authentication** → marca **"Allow public client flows"** → **Yes** → Save
6. Ve a **API Permissions** → **Add a permission** → **APIs my organization uses**
7. Busca **"Bing Webmaster"** → selecciona → marca **user_impersonation** → Add
8. Haz clic en **Grant admin consent**
9. Guarda en `.env.local`:
   ```
   BING_CLIENT_ID=<el client ID copiado en paso 4>
   ```

### Paso 2 — Autorizar (cada vez que se necesite)

```bash
npm run bing:auth
```

El script mostrará:
- Un enlace oficial de Microsoft (https://microsoft.com/devicelogin)
- Un código de 9 caracteres

**Qué hacer:**
1. Abre el enlace en tu navegador normal
2. Introduce el código que muestra la terminal
3. Inicia sesión con la cuenta que administra Bing WMT
   - Si usas **Gmail**, elige "Sign in with Google" en la pantalla de login de Microsoft
4. Acepta los permisos
5. Vuelve a la terminal — verás "✅ AUTORIZACIÓN COMPLETADA"

### Verificar estado

```bash
npm run bing:auth:status
```

Muestra: autenticado sí/no, expiración, scopes, sitios accesibles. **Nunca muestra tokens completos.**

### Usar los datos

```bash
# Site Explorer con OAuth
npm run bing:site-explorer

# Importar export manual del dashboard
npm run bing:import-dashboard
```

---

## ¿Qué hacer si entras con Gmail?

Microsoft permite login federado con Google. En la pantalla de login de Microsoft, elige "Sign in with Google" y usa tu cuenta de Gmail. El sistema OAuth de Microsoft acepta cuentas Google como identidad federada para el tenant `common` o `consumers`.

---

## ¿Qué hacer si Microsoft exige cuenta Entra/Azure AD?

Si el login falla con "account not found in this tenant", cambia el tenant en `.env.local`:

```
BING_TENANT=consumers
```

Para cuentas personales de Microsoft (las que usan Gmail federado), el tenant correcto es `consumers`.

---

## Dónde se guardan los tokens

- **Ubicación:** `.secrets/bing-oauth.json`
- **Git:** ignorado (`.secrets/` está en `.gitignore`)
- **NUNCA** compartas este archivo ni su contenido
- **NUNCA** pegues tokens en chats, logs o consola
- El script `bing:auth:status` muestra si el token es válido sin revelarlo

---

## Limitaciones conocidas

### Site Scan y Site Explorer NO tienen API pública completa

La API de Bing WMT expone:
- ✅ GetUserSites, GetCrawlStats, GetUrlInfo, GetLinkCounts, GetQueryStats
- ❌ Site Scan (solo vía dashboard web)
- ❌ Site Explorer completo (solo vía dashboard web)

**Para obtener los 69 warnings y 71 URLs excluidas reales**, tienes dos opciones:

### Opción A — Export manual desde el dashboard

1. Entra a https://www.bing.com/webmasters/siteexplorer?siteUrl=https://www.pinedayasociadoshn.com/
2. Ve a Site Explorer → revisa las URLs con warnings y excluidas
3. Ve a Site Scan → ejecuta un nuevo scan si es necesario
4. Exporta los datos (CSV o copia la tabla)
5. Guarda en `data/bing/exports/`
6. Ejecuta `npm run bing:import-dashboard` para analizarlos

### Opción B — Compartir pantalla

Comparte tu pantalla del dashboard de Bing WMT y la IA puede guiarte en la interpretación y corrección de los issues.

---

## Comandos disponibles

| Comando | Función |
|---------|---------|
| `npm run bing:auth` | Iniciar autorización OAuth (genera enlace) |
| `npm run bing:auth:status` | Verificar estado del token |
| `npm run bing:site-explorer` | Site Explorer vía API (OAuth o API Key) |
| `npm run bing:import-dashboard` | Importar export manual del dashboard |
| `npm run seo:bing` | Auditoría básica vía API Key |

---

## Seguridad

- ❌ No compartas contraseñas
- ❌ No pegues tokens en el chat
- ❌ No commitees `.secrets/`
- ✅ Los tokens se guardan localmente en archivo gitignored
- ✅ Los scripts nunca imprimen tokens completos
- ✅ El refresh token permite renovar sin re-autenticar
