# Plan profesional de reorganización y gobierno del repositorio

**Proyecto:** Justicia Verdadera / Pineda y Asociados  
**Fecha:** 2026-07-27  
**Objetivo:** estabilizar, depurar y reorganizar el repositorio sin afectar la web pública ni perder trazabilidad.

## Principio rector
No hacer una mudanza masiva primero. El orden obligatorio es: **estabilizar → inventariar decisiones → limpiar → modularizar → automatizar la gobernanza**. Cada fase se ejecuta en PRs pequeños, con rollback y validación.

## Fase 0 — Correcciones bloqueantes
- Corregir el modelo de rutas en `proxy.ts`.
- Completar login 2FA.
- Corregir scope de métricas/cockpit.
- Ocultar o terminar calendario externo.
- Corregir enlaces de delitos.
- Estandarizar CSRF en mutaciones admin.
- Congelar nuevas migraciones hasta elegir fuente única.

**Gate:** contract/E2E verdes para auth y SGIE; ninguna regresión pública.

## Fase 1 — Higiene y raíz
- Crear allowlist de raíz.
- Reescribir `.gitignore` y `.vercelignore`.
- Sacar `.zcode`, `.backups`, `output`, exports y auditorías puntuales.
- Mover documentos históricos a `docs/audits/archive/YYYY/MM`.
- Crear `docs/audits/current/README.md` con estado vigente.
- Normalizar `README`, `AGENTS`, `CONTRIBUTING`, `CHANGELOG`.

**Gate:** `npm run repo:hygiene` verde.

## Fase 2 — Depuración controlada
Usar la matriz adjunta. Resolver en lotes separados: componentes públicos, librerías genéricas, SGIE, scripts, assets, dependencias y duplicados. Cada elemento termina en uno de cinco estados: `keep`, `integrate`, `archive`, `delete`, `externalize`.

**Gate:** no aumenta el baseline de archivos sin uso; cada borrado pasa verify.

## Fase 3 — Reorganización arquitectónica
- Dividir `lib/schema.ts` por dominio con barrel compatible.
- Separar lógica de rutas Next de servicios de dominio.
- Consolidar métricas/dashboards SGIE.
- Reorganizar scripts bajo `tools/` y crear manifest.
- Separar fuentes legales de derivados RAG.
- Modularizar archivos >500 líneas por prioridad de cambio/riesgo.

**Gate:** reglas de importación y ciclos automatizadas.

## Fase 4 — CI y flujo profesional
- Ramas cortas + PR obligatorio.
- CODEOWNERS y plantillas.
- `npm run verify` fijo, sin omisiones condicionales.
- Gates: hygiene, knip, links, gitleaks, migrations, contracts, scope, unit, build.
- Feature flags con owner/expiry.
- ADR solo para decisiones arquitectónicas.

**Gate:** main protegida y solo mergeable con controles verdes.

## Estructura objetivo
```text
app/
components/{ui,public,intranet,sgie}/
lib/{core,auth,db,public,blog,sgie,integrations}/
data/canonical/
sources/legal/
drizzle/migrations/
tests/{unit,integration,contract,e2e,fixtures}/
tools/{cli,lib,one-off/archive}/
docs/{product,architecture,engineering,operations,security,runbooks,adr,audits}/
generated/        # ignored
.local/            # ignored
```

## Contrato para cada nueva función
1. ID y objetivo.
2. Owner y aceptación.
3. Riesgos, datos, migración y rollback.
4. Dominio y rutas afectadas.
5. Auth/scope/CSRF/rate limit.
6. Implementación vertical.
7. Tests mínimos.
8. Observabilidad.
9. Docs/ADR si corresponde.
10. Eliminación de temporales y outputs.
11. Verify verde y PR.

## Manifest de scripts
Cada herramienta activa debe tener:
```json
{
  "id": "seo.collect",
  "path": "tools/cli/seo/collect.mjs",
  "owner": "engineering",
  "status": "active",
  "mutates": false,
  "dryRun": true,
  "requiredEnv": [],
  "rollback": null,
  "lastValidated": "2026-07-27",
  "expiresAt": null
}
```
Los scripts one-off deben incluir fecha de expiración y moverse al archivo tras su uso.

## Checklist de PR
- [ ] Alcance y aceptación enlazados.
- [ ] Sin cambio no relacionado.
- [ ] Auth/scope/CSRF revisados.
- [ ] Migración reproducible y rollback.
- [ ] Tests nuevos/actualizados.
- [ ] Sin mocks productivos.
- [ ] Sin archivos huérfanos/generados/backups.
- [ ] Docs vivas actualizadas.
- [ ] Feature flags con owner/expiry.
- [ ] `npm run verify` verde.

## Métricas mensuales
- archivos totales y por área;
- archivos/exports/dependencias sin uso;
- scripts activos/one-off/vencidos;
- migraciones fuera de manifest;
- enlaces rotos;
- duplicación de código/assets;
- archivos >300/>500 líneas;
- feature flags vencidas;
- docs con revisión caducada.

La regla no es llegar inmediatamente a cero, sino impedir que los baselines aumenten y reducirlos por fases.
