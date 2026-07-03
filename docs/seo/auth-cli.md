# Autenticación SEO por CLI

Accede a datos de la web mediante login oficial en navegador. Sin contraseñas ni tokens en el chat.

## Comando rápido

```bash
npm run seo:doctor        # ver estado de todas las auth
npm run auth:all          # igual que seo:doctor
```

## Google (GSC / GA4 / GBP)

```bash
npm run auth:google        # abre navegador → inicia sesión con Gmail
npm run auth:google:status # verificar estado
```

**Requisito:** `gcloud` CLI instalada.
- Windows: `winget install Google.CloudSDK` o https://cloud.google.com/sdk/docs/install
- macOS: `brew install google-cloud-sdk`
- Linux: https://cloud.google.com/sdk/docs/install

**Qué hace:** abre el navegador, inicias sesión con tu cuenta Google/Gmail que tenga acceso a Search Console, GA4 y Google Business Profile, aceptas los permisos, y las credenciales se guardan en `~/.config/gcloud/` (fuera del repo, nunca en Git).

## Bing (Webmaster Tools / IndexNow)

```bash
npm run auth:bing          # genera enlace oficial Microsoft + código
npm run auth:bing:status   # verificar estado del token
```

**Requisito previo (una sola vez):**
1. Registrar app en Azure AD: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Name: "Bing WMT Agent", Supported accounts: todos, Public client flows: Yes
3. API Permissions → Bing Webmaster Tools → user_impersonation → Grant admin consent
4. Copiar Application (client) ID
5. Guardar en `.env.local`: `BING_CLIENT_ID=<id>`

**Qué hace:** muestra un enlace de Microsoft y un código. Lo abres en tu navegador normal, introduces el código, inicias sesión (con Gmail funciona vía "Sign in with Google"), aceptas permisos. El token se guarda en `.secrets/bing-oauth.json` (gitignored).

## Vercel

```bash
npm run auth:vercel         # abre navegador
npm run auth:vercel:status  # verificar estado
```

**Requisito:** `npm i -g vercel`

## Recolectar datos

```bash
npm run seo:collect          # todas las fuentes disponibles
npm run seo:collect -- --bing-only   # solo Bing
npm run seo:collect -- --local-only  # solo auditorías locales
```

## Bing Dashboard (Site Scan / Site Explorer)

La API de Bing WMT no expone Site Scan ni Site Explorer completos. Para los 69 warnings y 71 URLs excluidas:

1. Entra a https://www.bing.com/webmasters/siteexplorer?siteUrl=https://www.pinedayasociadoshn.com/
2. Exporta los datos del dashboard (Site Explorer y Site Scan)
3. Guarda en `data/bing/exports/`
4. Ejecuta: `npm run bing:import-dashboard`

## Seguridad

- `.secrets/` en `.gitignore` — tokens nunca se commitean
- `.env.local` en `.gitignore` — credenciales nunca en Git
- Los scripts NUNCA imprimen tokens completos (solo primeros caracteres)
- No compartas contraseñas ni tokens en ningún chat
- No pegues secretos en la terminal mientras grabas
