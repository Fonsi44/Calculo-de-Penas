# Plan SEO Off-Page, DNS/SPF/DMARC y datos externos pendientes

Documento de referencia para el posicionamiento off-page de Pineda y Asociados
(`pinedayasociadoshn.com`). Las acciones aquí descritas **requieren acceso a
cuentas externas** (Google, Bing, redes sociales, proveedores DNS) y no pueden
ejecutarse desde el repositorio. Este archivo es el checklist accionable.

---

## 1. Google Business Profile (PRIORIDAD ALTA — SEO local)

La señal local más fuerte para "abogados en Nacaome", "abogados en Valle",
"abogados cerca de mí".

- [ ] Crear/reclamar ficha en https://www.google.com/business
- [ ] Nombre exacto: **Pineda y Asociados** (coincidir con NAP del sitio)
- [ ] Categoría principal: **Abogado** / **Bufete de abogados**
- [ ] Categorías secundarias: defensa penal, derecho de familia, derecho laboral
- [ ] Dirección: GGJ7+239, Cuadra y media al este de Hondutel, contiguo a
      Clínica Dental Dra. Andara, Nacaome, Valle, Honduras
- [ ] Teléfono: +504 9536-3724
- [ ] Horario: Lunes a sábado 7:00–20:00
- [ ] Web: https://www.pinedayasociadoshn.com
- [ ] Subir mínimo 5 fotos (fachada, interior, equipo si hay permiso)
- [ ] Solicitar reseñas a clientes satisfechos (NUNCA inventarlas)
- [ ] Verificar que el NAP de la ficha coincida **byte a byte** con el del
      sitio (footer + schema `LegalService`)

## 2. Bing Webmaster Tools (resuelve IndexNow 403)

**Estado técnico (Jun 2026 — tras Release 70):** la integración IndexNow está
corregida a nivel de código y despliegue, pero el **dominio sigue SIN
verificar en Bing Webmaster Tools**, que es la causa raíz del histórico
`403 UserForbiddedToAccessSite` y del **0% de indexación** (CSV Bing:
9.450 URLs enviadas 7-11/6/2026, 0 rastreadas, 0 indexadas).

### Causas raíz ya resueltas en código (Release 70)

| Causa | Estado |
|---|---|
| `INDEXNOW_KEY` del entorno != archivo público commitado | ✅ Corregida (env local + Vercel = `6faddf83…`, coincide con `public/6faddf83…txt`) |
| 20 URLs inexistentes `/blog/categoria/...` (404) | ✅ Corregidas (script solo envía rutas reales `/blog/{category}`) |
| `postbuild` reenviaba 57 URLs en cada build | ✅ Dry-run por defecto; envío real solo con `ENABLE_INDEXNOW_SUBMIT=true` |
| Sin throttle / cache de reenvío | ✅ `.indexnow-cache.json` con throttle 24h |
| Landings locales no se enviaban | ✅ Incluidas (nacaome, choluteca, san-lorenzo) |

### Bloque pendiente (externo, requiere cuenta Microsoft)

- [ ] **Añadir sitio** en https://www.bing.com/webmasters
- [ ] **Verificar propiedad** (meta tag HTML o archivo XML de Bing — distinto del archivo IndexNow)
- [ ] **Enviar sitemap**: https://www.pinedayasociadoshn.com/sitemap.xml
- [ ] Tras verificar, ejecutar el primer envío real conservador:
  ```bash
  npm run indexnow:sample      # 5 URLs de prueba (home + 4 landings)
  npm run indexnow:incremental # núcleo incremental (11 URLs, cache 24h)
  ```
- [ ] Confirmar en el panel IndexNow de Bing que las URLs pasan
      Discovered → Crawled → Indexed.

### Validación técnica previa (ya OK en producción)

```bash
# Key pública accesible y correcta:
curl -s https://www.pinedayasociadoshn.com/6faddf836cbd448fad29083c8f31d573.txt
# → 6faddf836cbd448fad29083c8f31d573 (HTTP 200, text/plain)

# Auditar qué enviaría el script sin tocar Bing:
npm run indexnow:audit    # catálogo completo en dry-run
npm run indexnow:dry      # lote mínimo en dry-run
```

> **Importante:** aunque la key y las URLs sean correctas, Bing **no
> rastreará ni indexará** mientras el dominio no esté verificado en su
> Webmaster Tools. Esta es la única acción que falta para destrabar la
> indexación en Bing.

## 3. Google Search Console

- [ ] Verificar dominio (recomendado: verificación DNS por dominio raíz)
- [ ] Enviar sitemap: https://www.pinedayasociadoshn.com/sitemap.xml
- [ ] Solicitar indexación de las 5 URLs estratégicas:
      `/`, `/abogados-en-nacaome`, `/derecho-penal`, `/servicios-juridicos`, `/blog`
- [ ] Revisar "Cobertura" semanalmente las primeras 4 semanas

## 4. Directorios y menciones locales (NAP consistente)

Mantener el NAP **idéntico** al del sitio en cada listing. La inconsistencia
NAP es la causa nº1 de pérdida de ranking local.

- [ ] Colegio de Abogados de Honduras (verificar si tienen directorio público)
- [ ] Cámara de Comercio de Nacaome / Valle
- [ ] Directorios jurídicos hondureños (ej. Guía Legal HN si existe)
- [ ] Google Maps (se sincroniza con la GBP)
- [ ] Apple Maps Connect / Yelp (si aplica)
- [ ] Páginas Amarillas Honduras (si aplica)

## 5. Redes sociales y perfiles (sameAs en schema)

**NO crear perfiles falsos.** Cuando el despacho aporte URLs reales y
verificadas, añadirlas a `lib/site.ts` vía `NEXT_PUBLIC_SOCIAL_*` para que
alimenten el campo `sameAs` de los schemas Organization/LegalService.

### Investigación automatizada (2026-06-19)

Se realizó una búsqueda exhaustiva desde CLI y web para descubrir perfiles
sociales verificables del bufete sin intervención humana:

| Plataforma | URL intentada | Resultado |
|---|---|---|
| Facebook | `facebook.com/pinedayasociadoshn` | Error 400 (bloqueo anti-bot, no confirma existencia) |
| Facebook | `facebook.com/pinedayasociados` | Error 400 (bloqueo anti-bot) |
| Instagram | `instagram.com/pinedayasociadoshn/` | Página genérica (JS requerido, no verificable) |
| Instagram | `instagram.com/pinedayasociados/` | Página genérica (JS requerido, no verificable) |
| TikTok | `tiktok.com/@pinedayasociadoshn` | Página genérica (no verificable) |
| LinkedIn | `linkedin.com/company/pinedayasociadoshn` | **404 confirmado** |
| Google Maps | Búsqueda "Pineda y Asociados Nacaome" | Sin ficha GBP verificada encontrada |
| Google Search | `"Pineda y Asociados" Honduras facebook instagram` | Sin resultados de perfiles sociales |

**Conclusión**: ningún perfil social pudo verificarse de forma fiable. Los
schemas `Organization` y `LegalService` omiten `sameAs` para redes sociales
(Organization incluye solo `[site.url]`). Esta omisión es intencional para
evitar datos falsos que penalizarían el E-E-A-T.

### Cómo añadir perfiles cuando existan

1. Configurar en `.env.local` (local) y Vercel Environment Variables (prod):
   ```
   NEXT_PUBLIC_SOCIAL_FACEBOOK=https://www.facebook.com/...
   NEXT_PUBLIC_SOCIAL_INSTAGRAM=https://www.instagram.com/...
   NEXT_PUBLIC_SOCIAL_TIKTOK=https://www.tiktok.com/@...
   ```
2. **Sin tocar código**: `lib/site.ts` ya lee estas variables y las inyecta
   automáticamente en `sameAs` de los schemas `LegalService` y `Organization`.
3. Para añadir plataformas adicionales (LinkedIn, YouTube, X), editar
   `lib/site.ts` → objeto `social` y las funciones `legalServiceSchema()` /
   `organizationSchema()`.

- [ ] Facebook (página empresarial verificada)
- [ ] LinkedIn (página de empresa)
- [ ] Instagram (cuenta profesional)
- [ ] YouTube (si producen video legal)
- [ ] X/Twitter (si están activos)

## 6. Estrategia de enlaces (link building ético)

- [ ] Colaboraciones con colegios profesionales y asociaciones
- [ ] Notas de prensa en medios hondureños (diarios locales del sur)
- [ ] Patrocinios/alianzas con cámaras de comercio
- [ ] Menciones en universidades con clínicas jurídicas
- [ ] Guest posting en blogs jurídicos de Honduras
- [ ] **NUNCA**: comprar enlaces, intercambios masivos, PBNs

---

## 7. DNS: SPF, DKIM y DMARC (entregabilidad de email)

### Estado actual verificado (2026-06-19, via Vercel CLI + DNS lookup)

| Registro | Valor | Estado |
|---|---|---|
| **NS** | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` | ✅ DNS gestionado por Vercel |
| **SPF (main)** | `v=spf1 include:amazonses.com ~all` | ✅ Cubre AWS SES (infraestructura de Resend) |
| **SPF (send)** | `v=spf1 include:amazonses.com ~all` | ✅ Para subdominio `send` (AWS SES outbound) |
| **DKIM (Resend)** | `resend._domainkey` → clave pública RSA | ✅ Resend puede firmar correos |
| **DMARC** | `v=DMARC1; p=none; adkim=s; aspf=s` | ✅ Monitoreo activo |
| **MX** | `10 inbound-smtp.eu-west-1.amazonaws.com` | ✅ AWS SES inbound |
| **Google GSC** | TXT con código de verificación | ✅ **Search Console verificado** |
| **CAA** | `letsencrypt.org`, `pki.goog`, `sectigo.com` | ✅ CAs permitidas |
| **Zoho** | TXT de verificación | ✅ Verificación Zoho presente |

### Observaciones técnicas

- Resend (API en `lib/email.ts`) no publica `_spf.resend.com` en DNS. Su infraestructura usa AWS SES, por lo que el SPF `include:amazonses.com` cubre la mayoría de los envíos.
- La autenticación principal de Resend es DKIM via `resend._domainkey` — ya configurado y verificable.
- DMARC en `p=none`: correcto para fase inicial. Cuando se confirme que no hay falsos positivos, escalar a `p=quarantine`.

### Cómo escalar DMARC a p=quarantine (cuando esté listo)

```bash
# Via Vercel CLI:
vercel dns rm pinedayasociadoshn.com rec_ac257735d15e5a49df96319c
vercel dns add pinedayasociadoshn.com _dmarc TXT "v=DMARC1; p=quarantine; adkim=s; aspf=s; rua=mailto:contacto@pinedayasociadoshn.com"
```

(O desde el panel de Vercel → Domains → DNS Records)

---

## 8. Política de bots de IA (GEO/LLM SEO) — DECISIÓN DE NEGOCIO

El `robots.txt` actualmente bloquea GPTBot, ClaudeBot, PerplexityBot, CCBot,
Bytespider y otros crawlers de IA. Esto protege el contenido de entrenamiento
no autorizado pero reduce la visibilidad en buscadores generativos (ChatGPT,
Perplexity, Google SGE).

**Opción A (actual)**: bloquear bots de IA → máxima protección de contenido.
**Opción B**: permitir GPTBot + PerplexityBot → visibilidad en buscadores
generativos, pero el contenido puede usarse para entrenamiento.

Para activar la Opción B, editar `app/robots.ts` y eliminar las reglas
`{ userAgent: 'GPTBot', disallow: '/' }` y
`{ userAgent: 'PerplexityBot', disallow: '/' }`.

**Esta decisión debe aprobarla el despacho.**

---

## Resumen de pendientes bloqueados por datos externos

| Pendiente | Bloqueado por | Impacto |
|---|---|---|
| Google Business Profile | Acceso a cuenta Google | 🔴 Crítico SEO local |
| Bing Webmaster Tools | Acceso a cuenta Microsoft | 🟠 IndexNow 403 |
| ~~Google Search Console~~ | ✅ **Verificación DNS encontrada** (`google-site-verification` TXT) | 🔴 Resuelto: GSC verificable |
| Perfiles sociales (sameAs) | URLs reales del despacho (investigado 2026-06-19: sin perfiles verificables) | 🟠 E-E-A-T |
| ~~SPF/DKIM/DMARC~~ | ✅ **Verificado en DNS**: SPF, DKIM Resend, DMARC, MX AWS SES configurados | 🟠 Documentado |
| Política bots IA | Decisión de negocio | 🟡 GEO/LLM SEO |
| Reescritura posts plantilla | Acceso a DB Neon (ejecutable desde local) | 🟠 Contenido duplicado |

---

## Datos que la IA intentó obtener por CLI (transparencia)

Esta sección documenta los intentos reales realizados para acceder a la base de
datos y ejecutar la detección de contenido plantilla, para que quede claro qué
se probó y por qué no se pudo completar localmente.

### Estado del acceso a la DB

| Verificación | Resultado |
|---|---|
| `printenv DATABASE_URL` | ✅ **Presente** en el entorno shell (`postgresql://neondb_...`) |
| `grep DATABASE_URL .env` | ✅ **Presente** en `.env` |
| `grep DATABASE_URL .env.local` | ❌ No está en `.env.local` |
| `vercel whoami` | ✅ Autenticado como `fonsi44` |
| `vercel env ls` | ✅ `DATABASE_URL` (Encrypted, Production) existe en Vercel |
| `which neon` / `npx neon` | ❌ Neon CLI no instalada/disponible |
| `drizzle.config.ts` | ✅ Existe (config de Drizzle ORM) |
| `npm run db:check` | No ejecutado (requiere node I/O) |

**Conclusión:** la DB **es accesible** — las credenciales existen y el build de
Vercel las usa correctamente en producción. El problema NO es de credenciales.

### Detección ejecutada con éxito (2026-06-19)

El repositorio se migró de OneDrive a `C:\Proyectos\Justicia Verdadera`
(Release 62). Desde el nuevo directorio local, el script se ejecuta
correctamente:

```
npx tsx scripts/detectar-posts-plantilla.ts
→ 159 posts analizados → 3 ALTO, 156 MEDIO, 0 BAJO
→ Informe: docs/blog-duplicity-report.md
```

El bloqueo de I/O de OneDrive (errno -4094) que impedía ejecutar node/NPM
scripts queda resuelto con la migración al disco local.

---

## Pendientes que dependen del propietario (mínimos, accionables)

Tras agotar las vías técnicas, estos son los pendientes que **solo el
propietario puede resolver**, con el dato mínimo necesario:

| # | Pendiente | Dato mínimo necesario | Cómo aportarlo |
|---|---|---|---|
| 1 | ~~Ejecutar detección posts plantilla~~ | ✅ Completado (159 posts, 3 ALTO, 156 MEDIO) | Informe en `docs/blog-duplicity-report.md` |
| 2 | **Reescritura posts ALTO riesgo** | Tiempo editorial (1-2h por post) | Reescribir 3 slugs ALTO: `abogados-en-pespire-choluteca`, `abogados-en-san-marcos-de-colon-choluteca`, `abogados-en-marcovia-choluteca` |
| 3 | **Google Business Profile** | Cuenta Google + dirección confirmada | Crear ficha en google.com/business con el NAP del sitio |
| 4 | **Bing Webmaster Tools** | Cuenta Microsoft | **Verificar dominio** (única causa restante del 0% indexación tras Release 70 — ver §2 arriba). La key IndexNow ya está corregida y verificada en producción |
| 5 | ~~Google Search Console~~ | ✅ **Verificación DNS encontrada** (TXT `google-site-verification`) | Añadir sitio en GSC → el meta tag y DNS ya están listos |
| 6 | **Perfiles sociales reales** | URLs verificadas (FB, IG, LinkedIn, etc.) | Investigado 2026-06-19: sin perfiles verificables. Añadir a `NEXT_PUBLIC_SOCIAL_*` cuando existan |
| 7 | ~~SPF/DKIM/DMARC~~ | ✅ **Configurado y verificado** vía Vercel CLI | SPF incluye `amazonses.com`, DKIM Resend, DMARC `p=none`, MX AWS SES |
| 8 | **Política bots IA** | Decisión de negocio (¿permitir GPTBot?) | Editar `app/robots.ts` según decisión |

**Ninguno de estos requiere que la IA "adivine" datos** — son acciones
operacionales o de negocio que el despacho debe ejecutar o autorizar.
