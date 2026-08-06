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
| Preview editorial | `/preview/[token]` | preview post | `/api/admin/preview` | admin+CSRF + auth en página | ✅ Implementado (Fase 2) | SEC-004 | Token opaco DB, single-use, sanitize |
| Recuperar contraseña | `/reset` | email | `/api/auth/reset-password*` | token hasheado + rate 5/15min | ✅ Implementado (Fase 1) | FUN-001 | tokenVersion incrementado, neutro |
| Cambio de contraseña | perfil | perfil Admin | `/api/auth/change-password` | auth/CSRF, tokenVersion++ | ✅ invalidateFreshness (Fase 1) | — | 7 rutas mutación cubiertas |
| Descarga lead magnet | público | CTA/lead magnet | `/api/descargar` | POST + rate + consent + Turnstile | ✅ Implementado (Fase 3) | SEC-005 | Cache private no-store, PDF cache 1h |
| Contacto | público | formulario | `/api/contacto` | Zod, Turnstile, rate fail-closed | tests unitarios | — | conservar y monitorizar |
| Consulta | `/solicitar-consulta` | formulario | `/api/consulta` | Zod, Turnstile, rate | E2E solo carga; unit tests | PRI-001 | eliminar logs PII |
| OAuth Google | callback | script/endpoint | `/api/oauth/callback` | auth requerida por proxy | ✅ Removido de públicas (Fase 2) | SEC-008 | state+PKCE pendiente |
| SEO live | Admin/CLI | scripts SEO | GSC/GA4/Bing | OAuth/API keys | doctor + collect | SEO-001 | reautorizar y alertar frescura |
| Web pública | `/` y hubs | public layout | DB/TS canónicos | CSP/robots/canonical | 22 E2E read-only | PERF-001 | self-host fonts/presupuesto |
| Admin dashboard | `/intranet/admin` | admin page/sidebar | analytics/blog/users | admin | live desktop/móvil | UX-001 | dashboard por excepciones |
| Upload archivos | admin | upload | `/api/admin/upload` | magic bytes + extensión | ✅ Implementado (Fase 3) | — | DOCX/ZIP/ZipSlip validados |
| MCP demo | — | demo | `app/api/[transport]/` | — | ✅ Eliminado (Fase 4) | DEP-001 | 3 HIGH CVEs resueltos |
| ESLint | global | — | — | — | ✅ 0/0 warnings (Fase 4) | — | 6 warnings corregidos |
| SBOM | CI | package.json | `npm run sbom:generate` | CycloneDX 1.6 | ✅ Script (Fase 4) | — | Bloqueado por peer deps |
| E2E staging | staging | `scripts/e2e/` | Playwright + DB efímera | guard fail-closed | ✅ Infra (Subfases 2-3) | — | 7 specs, pendiente DB test |
| Migraciones | DB | drizzle/ | 0030 + 0031 | idempotentes | ✅ Auditadas (Subfase 1) | — | 32 entradas, 0 errores |
| Backup/restore | ops | docs/security/ | Neon+Blob+secretos | runbook | ✅ Documentado (Fase 5) | OPS-001 | PITR, SLO 99.9%, DRP |
| CI | GitHub Actions | `.github/workflows/ci.yml` | npm scripts | placeholders | lectura + comandos locales | DEP-001, QA-002 | audit/SBOM/E2E aislado |
| Backup/restore | operaciones | docs/ops | Neon+Blob | proveedor | no ejecutado | OPS-001 | runbook RPO/RTO y restore |

## Cobertura de requisitos de la solicitud

| Fase solicitada | Evidencia principal | Estado |
|---|---|---|
| Inventario y comprensión | informe + conteos + mapa | `VALIDADO` |
| Calidad y arquitectura | hallazgos + lint/tsc/tests/coverage/build | `VALIDADO` |
| Seguridad (Fases 1-3) | invalidateFreshness, 2FA, preview opaco, magic bytes, descargar POST | `IMPLEMENTADO` |
| Dependencias (Fase 4) | MCP eliminado, ESLint 0/0, SBOM script | `IMPLEMENTADO` |
| Operaciones (Fase 5) | runbook backup/restore, auditoría delitos, consistencia embeddings | `IMPLEMENTADO` |
| Staging/E2E (Subfases 1-5) | migraciones auditadas, E2E preparado, 304 call sites verificados | `PREPARADO` (bloqueado sin DB test) |
| Rediseño SGIE/Admin | propuesta y wireframes | `PROPUESTA` |

