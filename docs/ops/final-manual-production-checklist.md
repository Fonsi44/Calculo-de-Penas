---
status: current
owner: engineering
created: 2026-07-30
last_reviewed: 2026-07-30
review_due: 2026-10-30
supersedes: null
superseded_by: null
---

# Checklist manual de producción — PR #25 (SEO/GEO master)

Esta checklist documenta los controles que **requieren validación humana
controlada** antes de autorizar merge y despliegue a Production. No incluye
secretos ni rutas locales.

> **Automatizado (PASS):** Logs y privacidad automatizados.
> `security:public-form-logs` (79 tests), `safe-public-form-logger`, rate
> limiting y sanitización verificados en CI.

---

## 1. Probar Turnstile (Cloudflare)

- [ ] En un entorno Production (o Preview con variables reales), abrir
      `/solicitar-consulta`.
- [ ] Verificar que el widget de Turnstile se renderiza y exige interacción.
- [ ] Enviar el formulario **sin** resolver el reto → debe rechazarse (4xx).
- [ ] Resolver el reto y enviar → debe aceptarse.
- [ ] Confirmar que `NEXT_PUBLIC_TURNSTITE_SITE_KEY` y `TURNSTILE_SECRET_KEY`
      están configuradas en el entorno objetivo (no revelar valores).

**Evidencia a guardar:** captura del widget renderizado y respuesta HTTP del
envío rechazado y aceptado.

## 2. Comprobar persistencia real

- [ ] Tras un envío válido, verificar que el registro aparece en la tabla
      correspondiente de la DB **de producción** (o staging idéntico).
- [ ] Confirmar que los campos persistidos coinciden con lo enviado (sin PII
      en logs: sin nombre, correo, teléfono, ni detalles del caso).
- [ ] Verificar que los datos sensibles NO aparecen en logs de Vercel ni en
      herramientas de observabilidad.

**Evidencia a guardar:** recuento de filas antes/después y confirmación de
ausencia de PII en logs.

## 3. Verificar entrega en Gmail

- [ ] Con `RESEND_API_KEY` válida en el entorno, enviar un formulario de
      contacto real desde un navegador.
- [ ] Comprobar que el correo llega a la bandeja de entrada del despacho
      (revisar spam/promociones).
- [ ] Verificar que el `From`, `Reply-To` y asunto son correctos.
- [ ] Confirmar que el cuerpo del correo **no contiene** datos del caso legal
      (solo metadata de contacto).

**Evidencia a guardar:** copia del correo recibido (cabeceras, sin contenido
sensible).

## 4. Revisar logs sin PII

- [ ] Abrir los logs de Vercel del deployment de Production tras varios envíos.
- [ ] Confirmar que los eventos de analítica y logs de servidor **no**
      contienen: nombre, correo, teléfono, mensaje del formulario ni
      identificadores de expediente.
- [ ] Verificar que `ANALYTICS_EXCLUDED_PREFIXES` excluye rutas privadas.

## 5. Cómo revertir si falla

- [ ] Si Turnstile/persistencia/email fallan en Production:
  1. No revertir la PR entera si el resto de gates están verdes.
  2. Usar Vercel **Rollback** al deployment anterior confirmado.
  3. Si el problema es de código, crear un fix en una rama corta, validar y
     desplegar; no hacer force push ni reescribir historial.
  4. Documentar el incidente en `docs/audits/`.

## 6. Evidencias a guardar

- Capturas de Turnstile, respuesta HTTP, entrega de correo.
- Recuento de filas de DB antes/después.
- Fragmento de logs (sin PII) que confirme la ausencia de datos sensibles.

## 7. Qué NO publicar

- No commitear capturas que contengan datos personales de usuarios reales.
- No incluir valores de `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` ni otras
  variables secretas en informes, commits ni comentarios de PR.
- No registrar mensajes de formularios reales en el repositorio.

---

## Validación visual del Preview autenticado

El deployment de Preview está protegido por **Vercel SSO/Deployment Protection**
(responde 302 → `vercel.com/sso-api`); un `fetch` sin credenciales recibe la
página de Login. La validación automatizada del render del deployment la debe
realizar el propietario autenticado. Abrir el Preview del HEAD final y verificar:

```text
[ ] Ruta de despidos (/blog/derecho-laboral/despido-laboral-honduras-guia-completa) muestra 4 fichas
[ ] No aparece ninguna tabla original en ningún artículo con tablas
[ ] Desktop 1440 correcto
[ ] Tablet 768 correcto
[ ] Móvil 390 correcto
[ ] Móvil 320 correcto
[ ] No hay texto letra por letra (vertical)
[ ] No hay scroll horizontal
[ ] Modo oscuro correcto
[ ] Impresión/PDF conserva el contenido (fichas visibles)
[ ] Consola sin errores
```

Registrar al confirmar:
```text
validated_by = <propietario>
validated_at = <timestamp>
deployment_sha = <SHA del deployment>
preview_url = <URL del deployment>
viewports = 1440, 768, 390, 320
result = PASS | FAIL
```

Hasta recibir confirmación expresa: `PREVIEW_VISUAL = PENDING_MANUAL`.

---

## Incidente GitGuardian histórico (falso positivo, separado)

- **ID:** `35247669`.
- **Naturaleza:** **falso positivo**. Es una huella SHA-256 editorial (firma
  institucional) en `docs/seo/current/blog-recovery-diff.csv` (commit
  `1470f3c9`), **no una credencial real**.
- **Rotación:** **NO se requiere rotación** salvo que el propietario descubra
  independientemente una credencial real. No confundir la firma editorial con
  una clave.
- **Acción del propietario:** en el dashboard de GitGuardian, marcarlo como
  *ignored/resolved* (falso positivo) con la justificación "firma editorial,
  no credencial".
- **No** reescribir historial ni modificar hashes editoriales para silenciar
  el scanner.
- **No** fue introducido por los commits del Paso 12, Bloque B ni Paso 13.
