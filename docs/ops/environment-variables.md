# Variables de entorno operativas

Auditoria basada en referencias de codigo. No contiene valores reales ni debe usarse para almacenar secretos.

## Tabla principal

| Variable | Obligatoria en produccion | Entorno | Secreto | Archivos donde se usa | Si falta | Riesgo operativo |
|---|---:|---|---:|---|---|---|
| `DATABASE_URL` | Si | development, preview, production | Si | `lib/db.ts`, `drizzle.config.ts`, `lib/*-db.ts`, `scripts/*`, `lib/rag/embeddings.ts` | DB no disponible; partes del sitio devuelven fallback o fallan; migraciones no corren | Alto: caida de blog, FAQ, intranet, RAG y migraciones |
| `JWT_SECRET` | Si | preview, production | Si | `lib/auth.ts`, `lib/auth-2fa.ts`, `app/api/admin/preview/route.ts`, `app/(public)/preview/[token]/page.tsx` | En produccion puede fallar validacion o usar fallback solo en contextos concretos | Critico: sesiones invalidas o secreto debil |
| `JWT_SECRET_PREVIOUS` | No | preview, production | Si | `lib/auth.ts` | No hay compatibilidad durante rotacion de secreto | Medio: logout masivo durante rotacion |
| `ENCRYPTION_KEY` | Condicional | preview, production | Si | `lib/auth-2fa.ts` | 2FA puede depender de `JWT_SECRET` como respaldo | Medio: cifrado/2FA menos aislado |
| `TURNSTILE_SECRET_KEY` | Si para formularios publicos | preview, production | Si | `lib/captcha.ts` | En produccion la validacion falla cerrada | Alto: formularios protegidos quedan bloqueados hasta configurar |
| `TURNSTILE_SITE_KEY` | Si para formularios publicos | preview, production | No | `lib/captcha.ts` | En produccion backend falla cerrado si falta | Alto: formularios publicos bloqueados |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Si para widget publico | preview, production | No | `components/marketing/turnstile-widget.tsx` | Widget puede no renderizar desafio | Alto: formularios pueden no enviarse |
| `CONTACT_NOTIFICATION_EMAIL` | Si | preview, production | No | `lib/email.ts`, `app/api/email/inbound/route.ts` | En produccion no se envia notificacion interna | Alto: perdida operativa de leads/consultas |
| `RESEND_API_KEY` | Si si se envia email | preview, production | Si | `lib/email.ts` | Envio de correos deshabilitado | Alto: contacto, consultas, reset o inbound afectados |
| `RESEND_FROM_EMAIL` | Recomendado | preview, production | No | `lib/email.ts` | Usa remitente por dominio verificado | Bajo/Medio: entregabilidad o branding incorrecto |
| `RESEND_WEBHOOK_SECRET` | Si si inbound/webhooks activos | preview, production | Si | `app/api/email/inbound/route.ts` | En produccion el webhook responde error de configuracion | Alto: inbound email no confiable |
| `OAUTH_CLIENT_ID` | Condicional SEO/OAuth | preview, production | No | `lib/google.ts`, `app/api/oauth/callback/route.ts`, scripts SEO | OAuth/Google no disponible | Medio: SEO live/OAuth inoperante |
| `OAUTH_CLIENT_SECRET` | Condicional SEO/OAuth | preview, production | Si | `lib/google.ts`, `app/api/oauth/callback/route.ts`, scripts SEO | OAuth/Google no disponible | Alto si SEO live depende de OAuth |
| `GOOGLE_REFRESH_TOKEN` | Condicional SEO | preview, production | Si | `lib/google.ts`, scripts SEO/GSC/GA4 | OAuth no puede consultar APIs | Medio: reportes live incompletos |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Condicional SEO | preview, production | No | `lib/google.ts`, scripts SEO | Service Account no disponible | Medio: reportes live incompletos |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Condicional SEO | preview, production | Si | `lib/google.ts`, scripts SEO | Service Account no disponible | Alto: secreto sensible; SEO live falla |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | Condicional Analytics | preview, production | No | `lib/google.ts`, `app/api/admin/analytics/timeline/route.ts`, scripts GA4 | GA4 no disponible | Bajo/Medio: falta telemetria |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Condicional SEO | preview, production | No | `lib/google.ts`, `app/api/admin/search-console/timeline/route.ts`, scripts GSC | GSC no disponible | Bajo/Medio: auditorias SEO incompletas |
| `GOOGLE_APPLICATION_CREDENTIALS` | Condicional SEO local | development, CI | Si/ruta sensible | `scripts/auth-google-cli.mjs`, `scripts/seo-live-doctor.mjs` | No se detecta ADC local | Bajo: afecta diagnostico local |
| `GOOGLE_PLACES_API_KEY` | Condicional reviews/places | preview, production | Si | `lib/google-reviews.ts`, `lib/places.ts` | Reviews/places usan fallback o fallan | Medio: contenido/reviews incompletos |
| `NEXT_PUBLIC_GOOGLE_PLACE_ID` | No | preview, production | No | `lib/google-reviews.ts`, `lib/places.ts` | Usa fallback hardcodeado | Bajo: puede apuntar a ficha incorrecta si cambia |
| `INDEXNOW_KEY` | Condicional SEO | preview, production | Si | `lib/site.ts`, `app/api/indexnow-key/route.ts`, scripts IndexNow/Bing | IndexNow/Bing no envia o valida | Medio: indexacion menos agil |
| `ENABLE_INDEXNOW_SUBMIT` | No | preview, production | No | `scripts/submit-indexnow.mjs` | Dry-run por defecto | Bajo: evita envios accidentales |
| `INDEXNOW_SAFETY_CAP` | No | preview, production | No | `scripts/submit-indexnow.mjs` | Usa limite canonico | Bajo: control de volumen |
| `BING_CLIENT_ID` | Condicional SEO | development, preview | No | `scripts/auth-generate-links.mjs`, `scripts/bing-auth-link.mjs` | OAuth Bing no disponible | Bajo/Medio |
| `BING_TENANT` / `BING_WMT_TENANT` | No | development, preview | No | scripts Bing | Usa valor por defecto | Bajo |
| `BING_WMT_CLIENT_ID` | Condicional Bing WMT | development, preview | No | `scripts/bing-oauth-device.mjs` | OAuth device Bing limitado | Bajo/Medio |
| `BLOB_READ_WRITE_TOKEN` | Condicional uploads/documentos | preview, production | Si | `lib/storage.ts`, `lib/sgie/util.ts`, `lib/sgie/motor-documental.ts` | Storage de documentos/blob falla | Alto si SGIE usa documentos |
| `DEEPSEEK_API_KEY` | Condicional IA/RAG/chat | preview, production | Si | `tests/api-chat.test.ts`, `lib/rag/config.ts`, scripts blog IA | IA/RAG puede fallar o usar otro proveedor | Alto si chat/RAG esta activo |
| `DEEPSEEK_API_BASE` | No | preview, production | No | scripts blog IA | Usa base por defecto | Bajo |
| `DEEPSEEK_MODEL` | No | preview, production | No | scripts blog IA | Usa modelo por defecto | Bajo/Medio |
| `OPENAI_API_KEY` | Condicional embeddings | preview, production | Si | `lib/rag/config.ts` | Embeddings pueden no generarse si no hay alternativa | Medio/Alto |
| `EMBEDDINGS_PROVEEDOR` | No | preview, production | No | `lib/rag/config.ts` | Usa proveedor por defecto del codigo | Medio: puede no coincidir con documentacion operativa |
| `EMBEDDINGS_API_KEY` | Condicional RAG | preview, production | Si | `lib/rag/config.ts` | Usa alternativa o falla configuracion RAG | Medio/Alto |
| `EMBEDDINGS_MODELO` | No | preview, production | No | `lib/rag/config.ts` | Usa modelo por defecto | Medio si dimensiones no coinciden |
| `EMBEDDINGS_DIMENSIONES` | No | preview, production | No | `lib/rag/config.ts` | Usa 1536 | Medio si pgvector espera otra dimension |
| `EMBEDDINGS_BASE_URL` | No | preview, production | No | `lib/rag/config.ts` | Usa base por proveedor | Bajo |
| `RAG_TOP_K` | No | preview, production | No | `lib/rag/config.ts` | Usa 5 | Bajo |
| `RAG_MIN_SCORE` | No | preview, production | No | `lib/rag/config.ts` | Usa 0.7 | Bajo/Medio: calidad de respuestas |
| `RAG_MAX_CHUNK_TOKENS` | No | preview, production | No | `lib/rag/config.ts` | Usa 500 | Bajo/Medio: costo/calidad |
| `RAG_CHUNK_OVERLAP` | No | preview, production | No | `lib/rag/config.ts` | Usa 50 | Bajo |
| `IA_DOCUMENTAL_API_KEY` | Condicional SGIE IA | preview, production | Si | `lib/sgie/ia-documental.ts` | Modo IA documental puede no operar | Medio/Alto |
| `IA_DOCUMENTAL_PROVIDER` | No | preview, production | No | `lib/sgie/ia-documental.ts` | Usa proveedor por defecto | Bajo |
| `IA_DOCUMENTAL_MODEL` | No | preview, production | No | `lib/sgie/ia-documental.ts` | Usa modelo por defecto | Bajo/Medio |
| `IA_DOCUMENTAL_BASE_URL` | No | preview, production | No | `lib/sgie/ia-documental.ts` | Usa base por defecto | Bajo |
| `IA_DOCUMENTAL_MODE` | No | preview, production | No | `lib/sgie/ia-documental.ts` | Usa modo heuristico | Medio: IA puede no estar activa |
| `IA_DOCUMENTAL_TIMEOUT_MS` | No | preview, production | No | `lib/sgie/ia-documental.ts` | Usa 60000 | Bajo |
| `IA_DOCUMENTAL_MAX_RETRIES` | No | preview, production | No | `lib/sgie/ia-documental.ts` | Usa 2 | Bajo |
| `CRON_SECRET` | Si si cron activo | preview, production | Si | `app/api/cron/sgie/procesar/route.ts` | Cron no autorizado o mal protegido | Alto |
| `WHATSAPP_VERIFY_TOKEN` | Condicional WhatsApp | preview, production | Si | `app/api/whatsapp/route.ts` | Verificación GET del webhook no disponible | Medio |
| `WHATSAPP_APP_SECRET` | Condicional WhatsApp | preview, production | Si | `app/api/whatsapp/route.ts` | POST del webhook rechazado por firma inválida | Alto |
| `REDIS_URL` | Condicional MCP/transporte | preview, production | Si | `app/api/[transport]/route.ts` | Transporte Redis no disponible | Medio |
| `DISABLE_RATE_LIMIT` | No en produccion | development, test | No | `lib/rate-limit.ts` | Si se activa en produccion, deshabilita limites | Critico si se configura mal |
| `ALLOW_TEST_EMAILS` | No en produccion | development, test | No | `lib/auth.ts` | Permite emails de prueba | Alto si se activa en produccion |
| `NEXT_PUBLIC_SITE_URL` | Si recomendado | preview, production | No | `lib/site.ts`, reset password, scripts SEO | Usa dominio por defecto | Medio: enlaces/reset/SEO pueden apuntar mal |
| `NEXT_PUBLIC_NOINDEX` | Si en preview, no en production | preview, production | No | `next.config.ts`, `lib/site.ts`, `scripts/submit-indexnow.mjs` | Preview podria indexarse o production noindex accidental | Alto SEO |
| `NEXT_PUBLIC_GA_ID` | Condicional Analytics | preview, production | No | `lib/site.ts`, scripts GA4 | GA no carga | Bajo/Medio |
| `NEXT_PUBLIC_GTM_ID` | Condicional Analytics | preview, production | No | `lib/site.ts` | GTM no carga | Bajo |
| `NEXT_PUBLIC_CLARITY_ID` | Condicional Analytics | preview, production | No | `lib/site.ts` | Clarity no carga | Bajo |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | Condicional SEO | preview, production | No | `app/layout.tsx`, `lib/site.ts` | Verificacion Google ausente | Medio SEO |
| `NEXT_PUBLIC_BING_VERIFICATION` | Condicional SEO | preview, production | No | `app/layout.tsx` | Usa fallback actual | Bajo/Medio |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Recomendado | preview, production | No | `lib/site.ts` | Usa email por defecto | Bajo |
| `NEXT_PUBLIC_CONTACT_PHONE` | Recomendado | preview, production | No | `lib/site.ts` | Usa telefono por defecto | Bajo |
| `NEXT_PUBLIC_CONTACT_WHATSAPP` | Recomendado | preview, production | No | `lib/site.ts` | Usa WhatsApp por defecto | Bajo |
| `VERCEL` | Gestionada por Vercel | preview, production | No | `app/api/admin/visual-editor/proxy/route.ts` | Proxy local usa http | Bajo |
| `VERCEL_URL` | Gestionada por Vercel | preview, production | No | `app/api/admin/visual-editor/proxy/route.ts` | Proxy no puede inferir host Vercel | Bajo/Medio |
| `NODE_ENV` | Gestionada por runtime | all | No | multiples archivos | Cambia comportamiento build/prod/test | Alto si incorrecta |
| `NEXT_PHASE` | Gestionada por Next | build | No | `lib/auth.ts` | Cambia validacion durante build | Medio |
| `ANALYZE` | No | development, CI | No | `next.config.ts` | No genera analisis bundle | Bajo |
| `PORT` | No | development, CI | No | `playwright.config.ts`, `scripts/e2e-start.mjs` | Usa puerto por defecto | Bajo |
| `PLAYWRIGHT_BASE_URL` | No | development, CI | No | `playwright.config.ts` | Levanta servidor local | Bajo |
| `CI` | Gestionada por CI | CI | No | `playwright.config.ts` | Cambia retries/workers | Bajo |
| `SITE_BASE_URL` | No | development, CI, SEO | No | scripts SEO/performance | Usa dominio por defecto | Medio si audita destino incorrecto |

## Variables criticas para Vercel Preview antes de probar Fase 0

- `DATABASE_URL`: debe apuntar a Neon staging/preview.
- `JWT_SECRET`: fuerte y distinto de produccion si el entorno preview no debe compartir sesiones.
- `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: requeridas para formularios protegidos.
- `CONTACT_NOTIFICATION_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: requeridas para email operativo.
- `RESEND_WEBHOOK_SECRET`: requerido si inbound email esta activo.
- `NEXT_PUBLIC_NOINDEX=true`: recomendado en preview.

## Reglas operativas

- Nunca imprimir valores de variables secretas.
- Nunca copiar variables de Production a Preview sin revisar alcance.
- Nunca ejecutar migraciones con `DATABASE_URL` no clasificada como staging/preview.
- Rotar cualquier secreto que haya sido pegado en chat, logs o commits.
