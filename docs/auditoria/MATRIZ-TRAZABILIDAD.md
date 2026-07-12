# Matriz de trazabilidad

| Req./flujo | Ruta | Componente/módulo | API/datos | Permiso/control | Prueba/evidencia | Hallazgo | Recomendación |
|---|---|---|---|---|---|---|---|
| Login Admin | `/intranet/login` → `/intranet/admin` | login + admin layout | `/api/auth/login` | bcrypt, JWT, proxy admin | Login live autorizado | SEC-003, SEC-007 | Rotar credenciales; error neutro |
| Login abogado | `/intranet/login` → `/intranet/sgie` | login + SGIE layout | `/api/auth/login` | rol abogado/admin | Login live autorizado | SEC-003 | Contraseña única + MFA corregido |
| Segundo factor | login | UI 2FA | `/api/auth/2fa/verify` | challenge TOTP | Código inspeccionado; sin cuenta 2FA | SEC-001, SEC-006 | Token propósito/TTL/one-time |
| Separación página Admin | `/intranet/admin` | proxy | — | rol admin | abogado redirigido live a SGIE | — | Mantener y ampliar tests |
| Separación API Admin | `/api/admin/*` | proxy + handlers | varias | proxy + `requireAdmin` | código/tests; live bloqueado por navegador | QA-001 | matriz E2E por rol en staging |
| Cockpit SGIE | `/intranet/sgie` | cockpit | `/api/sgie/cockpit*` | `requireAbogado`, scope DB | live desktop/móvil | UX-002 | cola priorizada y etiquetas humanas |
| Clientes listado | `/intranet/sgie/clientes` | clientes | GET `/api/sgie/clientes` | scope EXISTS | código | — | conservar scope en query |
| Cliente detalle | `/intranet/sgie/clientes/[id]` | ficha cliente | GET/PATCH `/api/sgie/clientes/[id]` | scope defectuoso | código exacto | SEC-002 | 404 cruzado y UPDATE con scope |
| Crear/reutilizar cliente | clientes | formulario | POST `/api/sgie/clientes` | auth/CSRF/rate | código | SEC-002 relacionado | no revelar/reutilizar ID fuera de scope |
| Expediente detalle | `/intranet/sgie/expedientes/[id]` | expediente | GET/PATCH `/api/sgie/expedientes/[id]` | asignación/permiso | código | QA-001 | tests DB cruzados |
| Documentos carga pública | `/cargar/[token]` | portal carga | `/api/public/cargar/[token]` | token hash, MIME, magic, rate | código; no se subió archivo | ARC-001 | proxy privado + AV opcional |
| Documento preview | expediente | modal preview | `/api/sgie/documentos/[id]/preview` | scope expediente | código; no probado live | ARC-001 | stream/signed URL temporal |
| Preview editorial | `/preview/[token]` | preview post | `/api/admin/preview` | admin+CSRF al crear, token al ver | código | SEC-004 | ID opaco, auth y sanitize |
| Recuperar contraseña | ruta inexistente | pendiente | `/api/auth/reset-password*` | token reset/rate | inventario/build | FUN-001 | página canónica E2E |
| Cambio de contraseña | perfil | perfil Admin | `/api/auth/change-password` | auth/CSRF | código/tests generales | — | añadir invalidación de sesiones |
| Descarga lead magnet | público | CTA/lead magnet | `/api/descargar` | validación mínima | código; no llamada live | SEC-005 | POST+captcha+rate+cache |
| Contacto | público | formulario | `/api/contacto` | Zod, Turnstile, rate fail-closed | tests unitarios | — | conservar y monitorizar |
| Consulta | `/solicitar-consulta` | formulario | `/api/consulta` | Zod, Turnstile, rate | E2E solo carga; unit tests | PRI-001 | eliminar logs PII |
| OAuth Google | callback | script/endpoint | `/api/oauth/callback` | público por proxy | código | SEC-008 | eliminar o state+PKCE+admin |
| SEO live | Admin/CLI | scripts SEO | GSC/GA4/Bing | OAuth/API keys | doctor + collect | SEO-001 | reautorizar y alertar frescura |
| Web pública | `/` y hubs | public layout | DB/TS canónicos | CSP/robots/canonical | 22 E2E read-only | PERF-001 | self-host fonts/presupuesto |
| Admin dashboard | `/intranet/admin` | admin page/sidebar | analytics/blog/users | admin | live desktop/móvil | UX-001 | dashboard por excepciones |
| CI | GitHub Actions | `.github/workflows/ci.yml` | npm scripts | placeholders | lectura + comandos locales | DEP-001, QA-002 | audit/SBOM/E2E aislado |
| Backup/restore | operaciones | docs/ops | Neon+Blob | proveedor | no ejecutado | OPS-001 | runbook RPO/RTO y restore |

## Cobertura de requisitos de la solicitud

| Fase solicitada | Evidencia principal | Estado |
|---|---|---|
| Inventario y comprensión | informe + conteos + mapa | `VALIDADO` |
| Calidad y arquitectura | hallazgos + lint/tsc/tests/coverage/build | `VALIDADO` |
| Seguridad | código, roles live, npm audit | `VALIDADO` con no explotación |
| Funcionamiento y QA | 861 unit + 22 E2E lectura | `PARCIAL`; mutaciones excluidas |
| Rendimiento/SEO/resiliencia | build, chunks, SEO 4/6, DR documental | `PARCIAL` |
| Rediseño SGIE/Admin | propuesta y wireframes | `PROPUESTA` |

