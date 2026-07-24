# Topología de Staging y Producción

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                                │
│  Vercel: Production (justicia-verdadera)                     │
│  Rama: main                                                  │
│  URL: https://www.pinedayasociadoshn.com                     │
│  Neon: base productiva (ep-super-leaf-appekgbu)              │
│  Blob: store productivo (store_4G5f3opIItdr...)              │
│  Resend: API key productiva                                  │
│  DeepSeek: API key productiva                                │
│  Firma: modo real (Dropbox Sign)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    STAGING                                    │
│  Vercel: Preview (justicia-verdadera)                        │
│  Rama: staging/fase6-preproduction                           │
│  URL: https://justicia-verdadera-*.vercel.app                │
│  Neon: rama staging (br-staging-*)                           │
│  Blob: mismo store, prefijo staging/                         │
│  Resend: API key staging, allowlist                          │
│  DeepSeek: API key staging                                   │
│  Firma: sandbox                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DESARROLLO LOCAL                           │
│  MacBook Pro Apple Silicon M5 Pro                            │
│  Node 22.23.1 via fnm                                        │
│  Base local o Neon rama dev                                  │
└─────────────────────────────────────────────────────────────┘
```

## Recursos

| Recurso | Producción | Staging |
|---------|-----------|---------|
| Vercel proyecto | justicia-verdadera | justicia-verdadera |
| Vercel entorno | Production | Preview |
| Rama Git | main | staging/fase6-preproduction |
| Neon proyecto | Vercel-integrated | Vercel-integrated |
| Neon rama | main (productiva) | br-staging-{nombre} |
| Blob store | store_4G5f3opIItdr... | Misma store, prefijo staging/ |
| Resend | API key productiva | API key limitada |
| DeepSeek | API key productiva | API key staging |
| Firma | Dropbox Sign real | Dropbox Sign sandbox |
| OCR | TBD | TBD |

## Separación

- Staging nunca accede a la base productiva.
- Staging nunca envía correos a clientes reales.
- Staging usa su propio conjunto de variables de entorno.
- Staging tiene `NEXT_PUBLIC_NOINDEX=true` y `APP_ENV=staging`.
- Staging está protegido por Vercel Deployment Protection (SSO).
