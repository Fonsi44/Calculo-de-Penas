---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Production Readiness Checklist

## Infraestructura

- [ ] Neon staging branch creada y verificada
- [ ] Variables de staging completas (ver docs/operations/staging-environment.md)
- [ ] Despliegue Vercel preview exitoso
- [ ] Protección de staging activa (SSO + noindex)
- [ ] CI pipeline configurado para ramas staging

## Base de datos

- [ ] 55/55 migraciones aplicadas
- [ ] Drizzle check OK
- [ ] Backup operacional probado
- [ ] Restauración verificada
- [ ] RPO/RTO documentados

## Email

- [ ] Resend API key configurada
- [ ] Allowlist de destinatarios activa
- [ ] Modo staging visual activo
- [ ] Webhook verificado

## IA

- [ ] DeepSeek API key real (modelo deepseek-v4-flash)
- [ ] Modo degradado operativo
- [ ] Timeout configurado (60s)
- [ ] Max retries (2)

## Firma electrónica

- [ ] Sandbox operativo
- [ ] Webhooks verificados
- [ ] Cleanup probado

## Feature flags

- [ ] Deny-by-default activo
- [ ] Kill switches operativos
- [ ] Flags de IA, riesgo, carga, brief, métricas, dashboard, copiloto probados

## Tests

- [ ] Vitest: 1274+ tests PASS
- [ ] Lint: 0 errors
- [ ] TypeScript: 0 errors
- [ ] Build: exit code 0
- [ ] Playwright E2E: 51 tests PASS

## Seguridad

- [ ] Noindex activo en staging
- [ ] Robots.txt bloquea todo
- [ ] Cache privada
- [ ] Autenticación verificada
- [ ] RBAC verificado
- [ ] Rate limiting activo
- [ ] CSRF protegido

## Observabilidad

- [ ] Health endpoint OK
- [ ] Readiness endpoint OK
- [ ] Logs estructurados
- [ ] Métricas registradas
- [ ] Alertas configuradas

## Documentación

- [ ] Staging environment docs
- [ ] Staging deployment docs
- [ ] Staging observability docs
- [ ] Backup/restore docs
- [ ] Rollback docs
- [ ] Security validation docs
- [ ] Production go/no-go docs
