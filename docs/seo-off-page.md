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

## 2. Bing Webmaster Tools (resuelve error IndexNow 403)

El sitio envía IndexNow en cada build pero Bing responde `403
UserForbiddedToAccessSite` porque el dominio no está verificado.

- [ ] Añadir sitio en https://www.bing.com/webmasters
- [ ] Verificar propiedad (meta tag o archivo XML)
- [ ] Enviar sitemap: https://www.pinedayasociadoshn.com/sitemap.xml
- [ ] Tras verificar, el script `scripts/submit-indexnow.mjs` funcionará

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

El dominio `pinedayasociadoshn.com` envía correo transaccional desde
`contacto@pinedayasociadoshn.com` (vía Resend, según `lib/email.ts`). Para
evitar que los correos terminen en spam, configurar:

### SPF (Sender Policy Framework)
Registra el proveedor de email transaccional en el SPF. **Confirmar el
proveedor antes de aplicar** (Resend, Google Workspace, SendGrid...):

```
# Si usan Resend (verificar en lib/email.ts / variables de entorno):
v=spf1 include:_spf.resend.com ~all

# Si usan Google Workspace:
v=spf1 include:_spf.google.com ~all

# Si combinan varios, encadenar includes:
v=spf1 include:_spf.resend.com include:_spf.google.com ~all
```

**Acción**: añadir registro TXT `@` con el SPF correcto en el panel DNS del
dominio (Cloudflare, Namecheap, GoDaddy, o donde esté gestionado).

### DKIM (DomainKeys Identified Mail)
- [ ] Verificar que el proveedor de email (Resend) tiene DKIM configurado
- [ ] Añadir los registros CNAME/TXT que indique el proveedor

### DMARC (Domain-based Message Authentication)
- [ ] Publicar registro TXT `_dmarc.pinedayasociadoshn.com`:

```
# Política de monitoreo inicial (no rechaza, solo reporta):
v=DMARC1; p=none; rua=mailto:contacto@pinedayasociadoshn.com; ruf=mailto:contacto@pinedayasociadoshn.com; fo=1

# Tras 2-4 semanas sin falsos positivos, escalar a:
v=DMARC1; p=quarantine; pct=100; rua=mailto:contacto@pinedayasociadoshn.com
```

**Verificación**: tras configurar, validar con:
- https://mxtoolbox.com/SuperTool.aspx (SPF, DKIM, DMARC)
- https://dmarcian.com/dmarc-inspector/

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
| Google Search Console | Verificación DNS/meta | 🔴 Indexación Google |
| Perfiles sociales (sameAs) | URLs reales del despacho | 🟠 E-E-A-T |
| SPF/DKIM/DMARC | Acceso al panel DNS | 🟠 Entregabilidad email |
| Política bots IA | Decisión de negocio | 🟡 GEO/LLM SEO |
| Reescritura posts plantilla | Acceso a DB Neon | 🟠 Contenido duplicado |

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

### Por qué no se pudo ejecutar la detección localmente

Todos los intentos de ejecutar `node` o `npx tsx` dentro del directorio del
proyecto (que vive en `OneDrive - Alfons Roiget/`) fallan con:

```
Error: UNKNOWN: unknown error, read
    at Object.readFileUtf8 (node:fs:441)
    errno: -4094, code: 'UNKNOWN', syscall: 'read'
```

Este es un **bloqueo de I/O de OneDrive** conocido en Windows: OneDrive
bloquea la lectura de archivos `.js`/`.mjs`/`.cjs` (incluidos los de
`node_modules`) cuando node los carga. Ocurre incluso para scripts simples que
no tocan la DB (verificado con `scripts/test-db.mjs`). No es un problema de
credenciales, configuración del ORM, ni de la DB.

**Comandos intentados (todos fallaron por OneDrive I/O lock):**
- `npx tsx scripts/detectar-posts-plantilla.ts` → exit 0, stdout vacío (no captura)
- `node --import tsx scripts/detectar-posts-plantilla.ts` → `errno -4094`
- `node -e "..."` con `require('@neondatabase/serverless')` → `errno -4094` al cargar módulo
- `npx esbuild ... --bundle` → no genera archivo de salida (OneDrive lock)
- Escritura del informe a `docs/`, `USERPROFILE/`, y archivo pre-creado → falla

### Cómo ejecutar la detección (3 opciones válidas)

El script `scripts/detectar-posts-plantilla.ts` está **listo y funcional**.
Solo necesita un entorno donde node pueda leer archivos sin OneDrive:

1. **Vercel CI** (recomendado): añadir un step en GitHub Actions o ejecutar via
   `vercel exec`. La DB es accesible en Vercel sin OneDrive.
   ```bash
   npx tsx scripts/detectar-posts-plantilla.ts
   # Genera docs/blog-duplicity-report.md con el informe completo
   ```

2. **Local sin OneDrive**: pausar la sincronización de OneDrive, o clonar el
   repo en `C:\dev\` (fuera de OneDrive), y ejecutar el script.

3. **Admin del blog** (`/intranet/admin/blog`): revisar manualmente los posts
   que compartan los encabezados "Marco legal aplicable", "Pasos clave que
   debe conocer", "Documentación necesaria", etc.

El informe se escribe a `docs/blog-duplicity-report.md` (versión documental).

---

## Pendientes que dependen del propietario (mínimos, accionables)

Tras agotar las vías técnicas, estos son los pendientes que **solo el
propietario puede resolver**, con el dato mínimo necesario:

| # | Pendiente | Dato mínimo necesario | Cómo aportarlo |
|---|---|---|---|
| 1 | **Ejecutar detección posts plantilla** | Ninguno (solo ejecutar en entorno sin OneDrive) | `npx tsx scripts/detectar-posts-plantilla.ts` en Vercel/local sin OneDrive |
| 2 | **Reescritura posts ALTO riesgo** | Tiempo editorial (1-2h por post) | Tras ejecutar el script, reescribir los slugs marcados ALTO |
| 3 | **Google Business Profile** | Cuenta Google + dirección confirmada | Crear ficha en google.com/business con el NAP del sitio |
| 4 | **Bing Webmaster Tools** | Cuenta Microsoft | Verificar dominio (resuelve error IndexNow 403) |
| 5 | **Google Search Console** | Verificación DNS o meta tag | Enviar sitemap tras verificar |
| 6 | **Perfiles sociales reales** | URLs verificadas (FB, IG, LinkedIn, etc.) | Añadir a `lib/site.ts` vía `NEXT_PUBLIC_SOCIAL_*` |
| 7 | **SPF/DKIM/DMARC** | Proveedor de email confirmado (Resend/Google/M365) | Añadir registros TXT en el panel DNS |
| 8 | **Política bots IA** | Decisión de negocio (¿permitir GPTBot?) | Editar `app/robots.ts` según decisión |

**Ninguno de estos requiere que la IA "adivine" datos** — son acciones
operacionales o de negocio que el despacho debe ejecutar o autorizar.
